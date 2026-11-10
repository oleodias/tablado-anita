import { useMemo, useState, type FormEvent } from 'react'
import {
  Aviso,
  Avatar,
  Botao,
  CabecalhoPagina,
  Campo,
  CampoTexto,
  Carregando,
  Etiqueta,
  Folha,
  Icone,
  Segmentado,
  Vazio,
} from '../components/ui'
import { CamposIndumentaria } from '../components/MinhaIndumentaria'
import { mapearPares, normalizar, type ParDoIntegrante } from '../domain/indices'
import { podeEditar, useAuth } from '../lib/auth'
import {
  useIntegrantes,
  usePares,
  useRemoverIntegrante,
  useSalvarIntegrante,
  type DadosIntegrante,
} from '../lib/dados'
import { mensagemDeErro } from '../lib/erros'
import { NOME_GENERO, NOME_INDUMENTARIA, type GeneroDanca, type Integrante } from '../types/db'

type Filtro = 'todos' | GeneroDanca | 'inativos'

export function Integrantes() {
  const { perfil } = useAuth()
  const editor = podeEditar(perfil)
  const integrantes = useIntegrantes()
  const pares = usePares()
  const [busca, setBusca] = useState('')
  const [filtro, setFiltro] = useState<Filtro>('todos')
  const [editando, setEditando] = useState<Integrante | 'novo' | null>(null)

  const paresPorIntegrante = useMemo(() => mapearPares(pares.data ?? []), [pares.data])
  const nomes = useMemo(() => new Map((integrantes.data ?? []).map((i) => [i.id, i.nome])), [integrantes.data])

  const lista = useMemo(() => {
    const termo = normalizar(busca.trim())
    return (integrantes.data ?? []).filter((i) => {
      if (filtro === 'inativos' ? i.ativo : !i.ativo) return false
      if ((filtro === 'peao' || filtro === 'prenda') && i.genero !== filtro) return false
      return !termo || normalizar(`${i.nome} ${i.apelido ?? ''}`).includes(termo)
    })
  }, [integrantes.data, busca, filtro])

  const ativos = (integrantes.data ?? []).filter((i) => i.ativo)
  const qtdPeoes = ativos.filter((i) => i.genero === 'peao').length
  const qtdPrendas = ativos.length - qtdPeoes

  return (
    <>
      <CabecalhoPagina
        titulo="Integrantes"
        subtitulo={
          integrantes.data ? `${ativos.length} ativos · ${qtdPeoes} peões · ${qtdPrendas} prendas` : undefined
        }
        acoes={
          editor && (
            <Botao onClick={() => setEditando('novo')}>
              <Icone nome="mais" /> Novo
            </Botao>
          )
        }
      />

      <div className="mb-4 flex flex-col gap-3">
        <label className="relative block">
          <span className="sr-only">Buscar integrante</span>
          <Icone nome="busca" className="pointer-events-none absolute left-3 top-1/2 size-5 -translate-y-1/2 text-texto-suave" />
          <input
            type="search"
            placeholder="Buscar por nome ou apelido"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="min-h-11 w-full rounded-xl border border-borda bg-superficie pl-10 pr-3 text-base outline-none focus:border-marca focus:ring-2 focus:ring-marca/30"
          />
        </label>
        <Segmentado<Filtro>
          valor={filtro}
          aoMudar={setFiltro}
          compacto
          opcoes={[
            { valor: 'todos', texto: 'Todos' },
            { valor: 'peao', texto: 'Peões' },
            { valor: 'prenda', texto: 'Prendas' },
            { valor: 'inativos', texto: 'Inativos' },
          ]}
        />
      </div>

      {integrantes.isLoading && <Carregando />}
      {integrantes.error && <Aviso tipo="erro">Não foi possível carregar os integrantes.</Aviso>}

      {integrantes.data && lista.length === 0 && (
        <Vazio titulo={integrantes.data.length === 0 ? 'Nenhum integrante cadastrado' : 'Ninguém encontrado'}>
          {integrantes.data.length === 0 && editor && 'Toque em "Novo" para cadastrar o primeiro.'}
        </Vazio>
      )}

      {lista.length > 0 && (
        <ul className="divide-y divide-borda overflow-hidden rounded-2xl border border-borda bg-superficie">
          {lista.map((i) => (
            <LinhaIntegrante
              key={i.id}
              integrante={i}
              par={paresPorIntegrante.get(i.id)}
              nomeParceiro={nomes.get(paresPorIntegrante.get(i.id)?.parceiroId ?? '')}
              souEu={perfil?.integrante_id === i.id}
              aoTocar={editor ? () => setEditando(i) : undefined}
            />
          ))}
        </ul>
      )}

      {editando && (
        <FormularioIntegrante
          integrante={editando === 'novo' ? null : editando}
          temPar={editando !== 'novo' && paresPorIntegrante.has(editando.id)}
          aoFechar={() => setEditando(null)}
        />
      )}
    </>
  )
}

function LinhaIntegrante({
  integrante: i,
  par,
  nomeParceiro,
  souEu,
  aoTocar,
}: {
  integrante: Integrante
  par?: ParDoIntegrante
  nomeParceiro?: string
  souEu: boolean
  aoTocar?: () => void
}) {
  const conteudo = (
    <>
      <Avatar nome={i.nome} cor={par?.par.cor} />
      <div className="min-w-0 flex-1">
        <p className="flex flex-wrap items-center gap-2 font-medium">
          <span className="truncate">{i.nome}</span>
          {souEu && <Etiqueta cor="marca">Você</Etiqueta>}
        </p>
        <p className="truncate text-sm text-texto-suave">
          {NOME_GENERO[i.genero]}
          {i.indumentaria && ` · ${NOME_INDUMENTARIA[i.indumentaria]}`}
          {i.apelido && ` · "${i.apelido}"`}
          {par ? ` · Par ${par.par.numero ?? '–'} com ${nomeParceiro ?? '?'}` : ' · sem par'}
        </p>
      </div>
    </>
  )
  return (
    <li>
      {aoTocar ? (
        <button type="button" onClick={aoTocar} className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-superficie-2">
          {conteudo}
        </button>
      ) : (
        <div className="flex items-center gap-3 px-4 py-3">{conteudo}</div>
      )}
    </li>
  )
}

function FormularioIntegrante({
  integrante,
  temPar,
  aoFechar,
}: {
  integrante: Integrante | null
  temPar: boolean
  aoFechar: () => void
}) {
  const salvar = useSalvarIntegrante()
  const remover = useRemoverIntegrante()
  const [dados, setDados] = useState<DadosIntegrante>(
    integrante ?? {
      nome: '',
      apelido: '',
      genero: 'peao',
      ativo: true,
      observacoes: '',
      indumentaria: null,
      indumentaria_danca: null,
      indumentaria_coreografia: null,
    },
  )
  const [confirmandoRemocao, setConfirmandoRemocao] = useState(false)
  const erro = salvar.error ?? remover.error

  function aoEnviar(e: FormEvent) {
    e.preventDefault()
    salvar.mutate(
      {
        ...dados,
        nome: dados.nome.trim(),
        apelido: dados.apelido?.trim() || null,
        observacoes: dados.observacoes?.trim() || null,
      },
      { onSuccess: aoFechar },
    )
  }

  return (
    <Folha
      aberta
      aoFechar={aoFechar}
      titulo={integrante ? 'Editar integrante' : 'Novo integrante'}
      rodape={
        <>
          {integrante && !confirmandoRemocao && (
            <Botao variante="perigo" className="mr-auto" onClick={() => setConfirmandoRemocao(true)}>
              Remover
            </Botao>
          )}
          <Botao variante="secundario" onClick={aoFechar}>
            Cancelar
          </Botao>
          <Botao type="submit" form="form-integrante" disabled={salvar.isPending || !dados.nome.trim()}>
            {salvar.isPending ? 'Salvando…' : 'Salvar'}
          </Botao>
        </>
      }
    >
      <form id="form-integrante" onSubmit={aoEnviar} className="flex flex-col gap-4">
        <Campo
          id="nome"
          rotulo="Nome completo"
          required
          autoFocus={!integrante}
          autoComplete="off"
          value={dados.nome}
          onChange={(e) => setDados({ ...dados, nome: e.target.value })}
        />
        <Campo
          id="apelido"
          rotulo="Apelido (opcional — aparece no tablado)"
          autoComplete="off"
          value={dados.apelido ?? ''}
          onChange={(e) => setDados({ ...dados, apelido: e.target.value })}
        />
        <Segmentado<GeneroDanca>
          rotulo="Dança como"
          valor={dados.genero}
          aoMudar={(genero) => setDados({ ...dados, genero })}
          desabilitado={temPar}
          opcoes={[
            { valor: 'peao', texto: 'Peão' },
            { valor: 'prenda', texto: 'Prenda' },
          ]}
        />
        {temPar && <p className="-mt-2 text-xs text-texto-suave">Para mudar, desfaça o par primeiro.</p>}
        <Segmentado<'sim' | 'nao'>
          rotulo="Situação"
          valor={dados.ativo ? 'sim' : 'nao'}
          aoMudar={(v) => setDados({ ...dados, ativo: v === 'sim' })}
          opcoes={[
            { valor: 'sim', texto: 'Ativo' },
            { valor: 'nao', texto: 'Inativo' },
          ]}
        />
        <CamposIndumentaria
          principal={dados.indumentaria}
          danca={dados.indumentaria_danca}
          coreografia={dados.indumentaria_coreografia}
          aoMudar={(v) =>
            setDados({ ...dados, indumentaria: v.principal, indumentaria_danca: v.danca, indumentaria_coreografia: v.coreografia })
          }
        />
        <CampoTexto
          id="observacoes"
          rotulo="Observações (opcional)"
          value={dados.observacoes ?? ''}
          onChange={(e) => setDados({ ...dados, observacoes: e.target.value })}
        />

        {confirmandoRemocao && integrante && (
          <Aviso tipo="erro">
            <p className="font-medium">Remover {integrante.nome}?</p>
            <p className="mt-1">
              O par, a escalação e as posições dessa pessoa em todas as danças também serão apagados. Se ela só
              saiu do grupo, prefira marcar como inativa.
            </p>
            <div className="mt-3 flex gap-2">
              <Botao variante="secundario" onClick={() => setConfirmandoRemocao(false)}>
                Não
              </Botao>
              <Botao
                variante="perigo"
                disabled={remover.isPending}
                onClick={() => remover.mutate(integrante.id, { onSuccess: aoFechar })}
              >
                Sim, remover
              </Botao>
            </div>
          </Aviso>
        )}

        {erro && <Aviso tipo="erro">{mensagemDeErro(erro)}</Aviso>}
      </form>
    </Folha>
  )
}
