// Leitura e gravação de dados no Supabase, com cache do React Query.
// Cada "use..." busca uma lista; cada "useSalvar..." / "useRemover..." grava
// e avisa o cache para recarregar o que mudou.

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type {
  Coreografia,
  Danca,
  Dupla,
  Formacao,
  FuncaoEscalacao,
  Integrante,
  ItemEscalacao,
  PapelUsuario,
  Par,
  Perfil,
  PosicaoSalva,
  Tablado,
  TipoDanca,
  TipoIndumentaria,
} from '../types/db'
import { supabase } from './supabase'

/**
 * Lança o erro do Supabase para o React Query tratar e devolve os dados já com
 * o tipo informado (o projeto não gera tipos automáticos do banco).
 */
function verificar<T>({ data, error }: { data: unknown; error: unknown }): T {
  if (error) throw error
  return data as T
}

export const chaves = {
  integrantes: ['integrantes'] as const,
  pares: ['pares'] as const,
  dancas: ['dancas'] as const,
  perfis: ['perfis'] as const,
  tabladoPadrao: ['tablado-padrao'] as const,
  duplas: (coreografiaId: string) => ['duplas', coreografiaId] as const,
  duplasDoAno: (ano: number) => ['duplas-do-ano', ano] as const,
  formacoes: (coreografiaId: string) => ['formacoes', coreografiaId] as const,
  posicoes: (coreografiaId: string) => ['posicoes', coreografiaId] as const,
  coreografia: (dancaId: number, ano: number) => ['coreografia', dancaId, ano] as const,
  escalacao: (coreografiaId: string) => ['escalacao', coreografiaId] as const,
  escalacoesDoAno: (ano: number) => ['escalacoes-do-ano', ano] as const,
}

// -----------------------------------------------------------------------------
// Integrantes
// -----------------------------------------------------------------------------
export function useIntegrantes() {
  return useQuery({
    queryKey: chaves.integrantes,
    queryFn: async () =>
      verificar<Integrante[]>(
        await supabase.from('integrantes').select('id, nome, apelido, genero, ativo, observacoes, indumentaria, indumentaria_danca, indumentaria_coreografia').order('nome'),
      ),
  })
}

export type DadosIntegrante = Omit<Integrante, 'id'> & { id?: string }

export function useSalvarIntegrante() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...dados }: DadosIntegrante) => {
      const consulta = id
        ? supabase.from('integrantes').update(dados).eq('id', id)
        : supabase.from('integrantes').insert(dados)
      const { error } = await consulta
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: chaves.integrantes }),
  })
}

export function useRemoverIntegrante() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('integrantes').delete().eq('id', id)
      if (error) throw error
    },
    // remover um integrante também remove seu par e suas escalações (cascade)
    onSuccess: () => qc.invalidateQueries(),
  })
}

// -----------------------------------------------------------------------------
// Pares
// -----------------------------------------------------------------------------
export function usePares() {
  return useQuery({
    queryKey: chaves.pares,
    queryFn: async () =>
      verificar<Par[]>(
        await supabase
          .from('pares')
          .select('id, numero, peao_id, prenda_id, cor')
          .order('numero', { ascending: true, nullsFirst: false }),
      ),
  })
}

export type DadosPar = Omit<Par, 'id'> & { id?: string }

export function useSalvarPar() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...dados }: DadosPar) => {
      const consulta = id ? supabase.from('pares').update(dados).eq('id', id) : supabase.from('pares').insert(dados)
      const { error } = await consulta
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: chaves.pares }),
  })
}

export function useRemoverPar() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('pares').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: chaves.pares }),
  })
}

// -----------------------------------------------------------------------------
// Danças
// -----------------------------------------------------------------------------
export function useDancas() {
  return useQuery({
    queryKey: chaves.dancas,
    queryFn: async () => verificar<Danca[]>(await supabase.from('dancas').select('*').order('id')),
    staleTime: 5 * 60_000,
  })
}

export function useAtualizarDanca() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...dados }: { id: number; tipo?: TipoDanca | null; observacoes?: string | null }) => {
      const { error } = await supabase.from('dancas').update(dados).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: chaves.dancas }),
  })
}

// -----------------------------------------------------------------------------
// Coreografias e escalação
// -----------------------------------------------------------------------------

/** Coreografia de uma dança num ano (pode ainda não existir: retorna null). */
export function useCoreografia(dancaId: number | undefined, ano: number) {
  return useQuery({
    queryKey: chaves.coreografia(dancaId ?? 0, ano),
    enabled: dancaId !== undefined,
    queryFn: async () =>
      verificar<Coreografia | null>(
        await supabase.from('coreografias').select('*').eq('danca_id', dancaId!).eq('ano', ano).maybeSingle(),
      ),
  })
}

/** Cria a coreografia da dança no ano, se ainda não existir, e devolve o id. */
export async function garantirCoreografia(dancaId: number, ano: number): Promise<string> {
  const { error } = await supabase
    .from('coreografias')
    .upsert({ danca_id: dancaId, ano, tipo: 'danca_tradicional' }, { onConflict: 'danca_id,ano', ignoreDuplicates: true })
  if (error) throw error
  const { id } = verificar<{ id: string }>(
    await supabase.from('coreografias').select('id').eq('danca_id', dancaId).eq('ano', ano).single(),
  )
  return id
}

export function useEscalacao(coreografiaId: string | undefined) {
  return useQuery({
    queryKey: chaves.escalacao(coreografiaId ?? ''),
    enabled: !!coreografiaId,
    queryFn: async () =>
      verificar<ItemEscalacao[]>(
        await supabase
          .from('escalacao')
          .select('coreografia_id, integrante_id, funcao')
          .eq('coreografia_id', coreografiaId!),
      ),
  })
}

/** Todas as escalações das danças de um ano (para a lista de danças e o "minhas danças"). */
export function useEscalacoesDoAno(ano: number) {
  return useQuery({
    queryKey: chaves.escalacoesDoAno(ano),
    queryFn: async () =>
      verificar<(ItemEscalacao & { coreografias: { danca_id: number | null } })[]>(
        await supabase
          .from('escalacao')
          .select('coreografia_id, integrante_id, funcao, coreografias!inner(danca_id, ano)')
          .eq('coreografias.ano', ano),
      ),
  })
}

/**
 * Define a função de várias pessoas de uma vez numa dança.
 * funcao = null tira a pessoa da escalação.
 */
export function useAlterarEscalacao(dancaId: number, ano: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (alteracoes: { integranteId: string; funcao: FuncaoEscalacao | null }[]) => {
      const coreografiaId = await garantirCoreografia(dancaId, ano)
      const incluir = alteracoes.filter((a) => a.funcao !== null)
      const retirar = alteracoes.filter((a) => a.funcao === null).map((a) => a.integranteId)

      if (incluir.length) {
        const { error } = await supabase.from('escalacao').upsert(
          incluir.map((a) => ({ coreografia_id: coreografiaId, integrante_id: a.integranteId, funcao: a.funcao })),
        )
        if (error) throw error
      }
      if (retirar.length) {
        const { error } = await supabase
          .from('escalacao')
          .delete()
          .eq('coreografia_id', coreografiaId)
          .in('integrante_id', retirar)
        if (error) throw error
      }
      return coreografiaId
    },
    onSuccess: (coreografiaId) => {
      qc.invalidateQueries({ queryKey: chaves.coreografia(dancaId, ano) })
      qc.invalidateQueries({ queryKey: chaves.escalacao(coreografiaId) })
      qc.invalidateQueries({ queryKey: chaves.escalacoesDoAno(ano) })
    },
  })
}

// -----------------------------------------------------------------------------
// Perfis (contas de acesso) — alterações só para admin (garantido pelo banco)
// -----------------------------------------------------------------------------
export function usePerfis() {
  return useQuery({
    queryKey: chaves.perfis,
    queryFn: async () =>
      verificar<Perfil[]>(
        await supabase.from('perfis').select('id, nome, email, papel, integrante_id').order('nome'),
      ),
  })
}

export function useAtualizarPerfil() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({
      id,
      ...dados
    }: {
      id: string
      nome?: string
      papel?: PapelUsuario
      integrante_id?: string | null
    }) => {
      const { error } = await supabase.from('perfis').update(dados).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: chaves.perfis }),
  })
}

// -----------------------------------------------------------------------------
// Tablado
// -----------------------------------------------------------------------------

/** O Postgres devolve colunas numeric como texto; convertemos para número. */
function normalizarTablado(t: Record<string, unknown>): Tablado {
  const num = (v: unknown) => (v === null || v === undefined ? null : Number(v))
  return {
    ...(t as unknown as Tablado),
    largura_m: Number(t.largura_m),
    profundidade_m: Number(t.profundidade_m),
    placa_largura_m: num(t.placa_largura_m),
    placa_profundidade_m: num(t.placa_profundidade_m),
  }
}

export function useTabladoPadrao() {
  return useQuery({
    queryKey: chaves.tabladoPadrao,
    queryFn: async () => {
      const t = verificar<Record<string, unknown> | null>(
        await supabase.from('tablados').select('*').eq('padrao', true).maybeSingle(),
      )
      return t ? normalizarTablado(t) : null
    },
    staleTime: 5 * 60_000,
  })
}

export function useSalvarTablado() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({
      id,
      ...dados
    }: Pick<Tablado, 'id' | 'largura_m' | 'profundidade_m' | 'placa_largura_m' | 'placa_profundidade_m' | 'config'>) => {
      const { error } = await supabase.from('tablados').update(dados).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: chaves.tabladoPadrao }),
  })
}

// -----------------------------------------------------------------------------
// Duplas de cada dança
// -----------------------------------------------------------------------------
export function useDuplas(coreografiaId: string | undefined) {
  return useQuery({
    queryKey: chaves.duplas(coreografiaId ?? ''),
    enabled: !!coreografiaId,
    queryFn: async () =>
      verificar<Dupla[]>(
        await supabase
          .from('duplas')
          .select('id, coreografia_id, numero, peao_id, prenda_id, cor')
          .eq('coreografia_id', coreografiaId!)
          .order('numero'),
      ),
  })
}

/** Todas as duplas de um ano (para "seu par nesta dança" no Início). */
export function useDuplasDoAno(ano: number) {
  return useQuery({
    queryKey: chaves.duplasDoAno(ano),
    queryFn: async () =>
      verificar<(Dupla & { coreografias: { danca_id: number | null } })[]>(
        await supabase
          .from('duplas')
          .select('id, coreografia_id, numero, peao_id, prenda_id, cor, coreografias!inner(danca_id, ano)')
          .eq('coreografias.ano', ano),
      ),
  })
}

export type DadosDupla = Omit<Dupla, 'id' | 'coreografia_id'> & { id?: string }

/**
 * Grava duplas de uma dança (cria a coreografia se precisar) e garante que as
 * duas pessoas de cada dupla estejam escaladas como titulares.
 */
export function useSalvarDuplas(dancaId: number, ano: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (duplas: DadosDupla[]) => {
      const coreografiaId = await garantirCoreografia(dancaId, ano)
      for (const { id, ...dados } of duplas) {
        const linha = { ...dados, coreografia_id: coreografiaId }
        const { error } = id
          ? await supabase.from('duplas').update(linha).eq('id', id)
          : await supabase.from('duplas').insert(linha)
        if (error) throw error
      }
      const pessoas = duplas.flatMap((d) => [d.peao_id, d.prenda_id])
      if (pessoas.length) {
        const { error } = await supabase
          .from('escalacao')
          .upsert(pessoas.map((integrante_id) => ({ coreografia_id: coreografiaId, integrante_id, funcao: 'titular' })))
        if (error) throw error
      }
      return coreografiaId
    },
    onSuccess: (coreografiaId) => invalidarDanca(qc, dancaId, ano, coreografiaId),
  })
}

export function useRemoverDupla(dancaId: number, ano: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (dupla: Pick<Dupla, 'id' | 'coreografia_id'>) => {
      const { error } = await supabase.from('duplas').delete().eq('id', dupla.id)
      if (error) throw error
      return dupla.coreografia_id
    },
    onSuccess: (coreografiaId) => invalidarDanca(qc, dancaId, ano, coreografiaId),
  })
}

function invalidarDanca(qc: ReturnType<typeof useQueryClient>, dancaId: number, ano: number, coreografiaId: string) {
  qc.invalidateQueries({ queryKey: chaves.coreografia(dancaId, ano) })
  qc.invalidateQueries({ queryKey: chaves.duplas(coreografiaId) })
  qc.invalidateQueries({ queryKey: chaves.duplasDoAno(ano) })
  qc.invalidateQueries({ queryKey: chaves.escalacao(coreografiaId) })
  qc.invalidateQueries({ queryKey: chaves.escalacoesDoAno(ano) })
}

// -----------------------------------------------------------------------------
// Formações e posições
// -----------------------------------------------------------------------------
export function useFormacoes(coreografiaId: string | undefined) {
  return useQuery({
    queryKey: chaves.formacoes(coreografiaId ?? ''),
    enabled: !!coreografiaId,
    queryFn: async () =>
      verificar<Formacao[]>(
        await supabase
          .from('formacoes')
          .select('id, coreografia_id, ordem, nome, tempo_s, observacoes')
          .eq('coreografia_id', coreografiaId!)
          .order('ordem'),
      ),
  })
}

/** Todas as posições de todas as formações de uma coreografia. */
export function usePosicoes(coreografiaId: string | undefined) {
  return useQuery({
    queryKey: chaves.posicoes(coreografiaId ?? ''),
    enabled: !!coreografiaId,
    queryFn: async () => {
      const linhas = verificar<Record<string, unknown>[]>(
        await supabase
          .from('posicoes')
          .select('formacao_id, integrante_id, x, z, rotacao, formacoes!inner(coreografia_id)')
          .eq('formacoes.coreografia_id', coreografiaId!),
      )
      // numeric chega como texto: converte para número
      return linhas.map(
        (l): PosicaoSalva => ({
          formacao_id: l.formacao_id as string,
          integrante_id: l.integrante_id as string,
          x: Number(l.x),
          z: Number(l.z),
          rotacao: Number(l.rotacao),
        }),
      )
    },
  })
}

/** Cria uma formação no fim da lista, copiando as posições de outra (se informada). */
export function useCriarFormacao(coreografiaId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ ordem, nome, copiarDe }: { ordem: number; nome: string; copiarDe?: PosicaoSalva[] }) => {
      const nova = verificar<{ id: string }>(
        await supabase.from('formacoes').insert({ coreografia_id: coreografiaId, ordem, nome }).select('id').single(),
      )
      if (copiarDe?.length) {
        const { error } = await supabase
          .from('posicoes')
          .insert(copiarDe.map(({ integrante_id, x, z, rotacao }) => ({ formacao_id: nova.id, integrante_id, x, z, rotacao })))
        if (error) throw error
      }
      return nova.id
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: chaves.formacoes(coreografiaId) })
      qc.invalidateQueries({ queryKey: chaves.posicoes(coreografiaId) })
    },
  })
}

export function useAtualizarFormacao(coreografiaId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...dados }: { id: string; nome?: string | null; observacoes?: string | null }) => {
      const { error } = await supabase.from('formacoes').update(dados).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: chaves.formacoes(coreografiaId) }),
  })
}

export function useRemoverFormacao(coreografiaId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('formacoes').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: chaves.formacoes(coreografiaId) })
      qc.invalidateQueries({ queryKey: chaves.posicoes(coreografiaId) })
    },
  })
}

export function useReordenarFormacoes(coreografiaId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (ids: string[]) => {
      const { error } = await supabase.rpc('reordenar_formacoes', { p_coreografia_id: coreografiaId, p_ids: ids })
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: chaves.formacoes(coreografiaId) }),
  })
}

/**
 * Grava posições. A tela já mostra a mudança na hora (atualização otimista);
 * se o servidor recusar, o cache é recarregado e a posição volta.
 */
export function useSalvarPosicoes(coreografiaId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (posicoes: PosicaoSalva[]) => {
      if (!posicoes.length) return
      const { error } = await supabase.from('posicoes').upsert(
        posicoes.map((p) => ({
          ...p,
          x: Math.round(p.x * 1000) / 1000,
          z: Math.round(p.z * 1000) / 1000,
          rotacao: Math.round(p.rotacao * 100) / 100,
        })),
      )
      if (error) throw error
    },
    onMutate: (posicoes) => {
      qc.setQueryData<PosicaoSalva[]>(chaves.posicoes(coreografiaId), (atuais = []) => {
        const chave = (p: PosicaoSalva) => `${p.formacao_id}|${p.integrante_id}`
        const novas = new Map(posicoes.map((p) => [chave(p), p]))
        const resultado = atuais.map((p) => novas.get(chave(p)) ?? p)
        const existentes = new Set(atuais.map(chave))
        for (const p of posicoes) if (!existentes.has(chave(p))) resultado.push(p)
        return resultado
      })
    },
    onError: () => qc.invalidateQueries({ queryKey: chaves.posicoes(coreografiaId) }),
  })
}

/** Troca a indumentária (pilcha) usada numa dança. */
export function useDefinirIndumentaria(dancaId: number, ano: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (indumentaria: string) => {
      const coreografiaId = await garantirCoreografia(dancaId, ano)
      const { error } = await supabase.from('coreografias').update({ indumentaria }).eq('id', coreografiaId)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: chaves.coreografia(dancaId, ano) }),
  })
}

/** O próprio integrante define seu tipo de indumentária (Kamé/Kairú). */
export function useDefinirMinhaIndumentaria() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (d: { principal: TipoIndumentaria | null; danca: TipoIndumentaria | null; coreografia: TipoIndumentaria | null }) => {
      const { error } = await supabase.rpc('definir_minha_indumentaria', {
        p_principal: d.principal,
        p_danca: d.danca,
        p_coreografia: d.coreografia,
      })
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: chaves.integrantes }),
  })
}
