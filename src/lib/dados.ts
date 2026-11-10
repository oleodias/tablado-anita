// Leitura e gravação de dados no Supabase, com cache do React Query.
// Cada "use..." busca uma lista; cada "useSalvar..." / "useRemover..." grava
// e avisa o cache para recarregar o que mudou.

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type {
  Coreografia,
  Danca,
  FuncaoEscalacao,
  Integrante,
  ItemEscalacao,
  PapelUsuario,
  Par,
  Perfil,
  TipoDanca,
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
        await supabase.from('integrantes').select('id, nome, apelido, genero, ativo, observacoes').order('nome'),
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
async function garantirCoreografia(dancaId: number, ano: number): Promise<string> {
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
