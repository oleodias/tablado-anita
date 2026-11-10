import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Aviso, Avatar, Botao, Carregando, Etiqueta, Icone, NumeroPar, Segmentado, Vazio } from '../components/ui'
import { blocoForaDoSorteio, tempoDeApresentacaoMin } from '../domain/enart'
import { mapearPares } from '../domain/indices'
import { resumirEscalacao } from '../domain/pares'
import { podeEditar, useAuth } from '../lib/auth'
import { ANO_ATUAL, useAno } from '../lib/ano'
import {
  useAlterarEscalacao,
  useAtualizarDanca,
  useCoreografia,
  useDancas,
  useEscalacao,
  useIntegrantes,
  usePares,
} from '../lib/dados'
import { mensagemDeErro } from '../lib/erros'
import { NOME_TIPO_DANCA, type Danca as TDanca, type FuncaoEscalacao, type Integrante, type Par, type TipoDanca } from '../types/db'

/** "fora" = não escalado. */
type Situacao = FuncaoEscalacao | 'fora'

const OPCOES_SITUACAO: { valor: Situacao; texto: string }[] = [
  { valor: 'fora', texto: 'Fora' },
  { valor: 'titular', texto: 'Titular' },
  { valor: 'reserva', texto: 'Reserva' },
]

export function Danca() {
  const { slug } = useParams()
  const [ano] = useAno()
  const dancas = useDancas()
  const danca = dancas.data?.find((d) => d.slug === slug)

  if (dancas.isLoading) return <Carregando />
  if (!danca) {
    return (
      <Vazio titulo="Dança não encontrada">
        <Link to="/dancas" className="text-link underline">
          Voltar para as danças
        </Link>
      </Vazio>
    )
  }
  return <DetalheDanca danca={danca} ano={ano} />
}

function DetalheDanca({ danca, ano }: { danca: TDanca; ano: number }) {
  const foraDoSorteio = blocoForaDoSorteio(ano) === danca.bloco
  return (
    <div className="flex flex-col gap-5">
      <Link
        to={`/dancas${ano === ANO_ATUAL ? '' : `?ano=${ano}`}`}
        className="-ml-1 inline-flex min-h-11 items-center gap-1 self-start text-sm text-link"
      >
        <Icone nome="voltar" className="size-4" /> Danças
      </Link>

      <header>
        <h1 className="text-2xl font-semibold">{danca.nome}</h1>
        <div className="mt-2 flex flex-wrap gap-2">
          <Etiqueta>Bloco {danca.bloco}</Etiqueta>
          <Etiqueta>Urna {danca.urna}</Etiqueta>
          <Etiqueta>{tempoDeApresentacaoMin(danca)} min de apresentação</Etiqueta>
          {foraDoSorteio && <Etiqueta cor="destaque">fora do sorteio em {ano}</Etiqueta>}
        </div>
      </header>

      <InformacoesDanca danca={danca} />
      <Escalacao danca={danca} ano={ano} />
    </div>
  )
}

// -----------------------------------------------------------------------------
// Tipo e observações da dança
// -----------------------------------------------------------------------------
function InformacoesDanca({ danca }: { danca: TDanca }) {
  const { perfil } = useAuth()
  const editor = podeEditar(perfil)
  const atualizar = useAtualizarDanca()
  const [observacoes, setObservacoes] = useState(danca.observacoes ?? '')
  const alterou = observacoes !== (danca.observacoes ?? '')

  return (
    <section className="rounded-2xl border border-borda bg-superficie p-4">
      <h2 className="mb-3 font-semibold">Informações</h2>
      {editor ? (
        <div className="flex flex-col gap-4">
          <Segmentado<TipoDanca | 'indefinido'>
            rotulo="Tipo (para o sorteio da Força A)"
            valor={danca.tipo ?? 'indefinido'}
            desabilitado={atualizar.isPending}
            aoMudar={(v) => atualizar.mutate({ id: danca.id, tipo: v === 'indefinido' ? null : v })}
            compacto
            opcoes={[
              { valor: 'fila', texto: 'Fila' },
              { valor: 'roda', texto: 'Roda' },
              { valor: 'pares_independentes', texto: 'Pares indep.' },
              { valor: 'indefinido', texto: 'A definir' },
            ]}
          />
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-texto-suave">Observações dos professores</span>
            <textarea
              rows={3}
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              placeholder="Ex.: atenção ao alinhamento das filas na 2ª figura"
              className="w-full rounded-xl border border-borda bg-superficie px-3 py-2 text-base outline-none focus:border-marca focus:ring-2 focus:ring-marca/30"
            />
          </label>
          {alterou && (
            <Botao
              className="self-end"
              disabled={atualizar.isPending}
              onClick={() => atualizar.mutate({ id: danca.id, observacoes: observacoes.trim() || null })}
            >
              Salvar observações
            </Botao>
          )}
          {atualizar.error && <Aviso tipo="erro">{mensagemDeErro(atualizar.error)}</Aviso>}
        </div>
      ) : (
        <dl className="grid gap-3 text-sm">
          <div>
            <dt className="text-texto-suave">Tipo</dt>
            <dd className="font-medium">{danca.tipo ? NOME_TIPO_DANCA[danca.tipo] : 'A definir'}</dd>
          </div>
          {danca.observacoes && (
            <div>
              <dt className="text-texto-suave">Observações dos professores</dt>
              <dd className="whitespace-pre-line">{danca.observacoes}</dd>
            </div>
          )}
        </dl>
      )}
    </section>
  )
}

// -----------------------------------------------------------------------------
// Escalação: quem dança como titular ou reserva
// -----------------------------------------------------------------------------
function Escalacao({ danca, ano }: { danca: TDanca; ano: number }) {
  const { perfil } = useAuth()
  const editor = podeEditar(perfil)
  const integrantes = useIntegrantes()
  const pares = usePares()
  const coreografia = useCoreografia(danca.id, ano)
  const escalacao = useEscalacao(coreografia.data?.id)
  const alterar = useAlterarEscalacao(danca.id, ano)

  const situacao = useMemo(() => {
    const mapa = new Map<string, Situacao>()
    for (const e of escalacao.data ?? []) mapa.set(e.integrante_id, e.funcao)
    return mapa
  }, [escalacao.data])
  const sit = (id: string): Situacao => situacao.get(id) ?? 'fora'

  const todos = integrantes.data ?? []
  const comPar = mapearPares(pares.data ?? [])
  // Inativos só aparecem se já estiverem escalados.
  const visivel = (i: Integrante) => i.ativo || situacao.has(i.id)
  const porId = new Map(todos.map((i) => [i.id, i]))
  const listaPares = (pares.data ?? []).filter((p) => {
    const a = porId.get(p.peao_id)
    const b = porId.get(p.prenda_id)
    return a && b && (visivel(a) || visivel(b))
  })
  const avulsos = todos.filter((i) => !comPar.has(i.id) && visivel(i))

  const resumo = resumirEscalacao(
    (escalacao.data ?? []).flatMap((e) => {
      const i = porId.get(e.integrante_id)
      return i ? [{ genero: i.genero, funcao: e.funcao }] : []
    }),
  )

  const definir = (ids: string[], nova: Situacao) =>
    alterar.mutate(ids.map((integranteId) => ({ integranteId, funcao: nova === 'fora' ? null : nova })))

  const carregando = integrantes.isLoading || pares.isLoading || coreografia.isLoading || escalacao.isLoading

  return (
    <section className="rounded-2xl border border-borda bg-superficie">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-borda p-4">
        <div>
          <h2 className="font-semibold">Escalação {ano}</h2>
          <p className="text-sm text-texto-suave">
            {resumo.pares} pares titulares · {resumo.reservas} reservas
          </p>
        </div>
        {editor && listaPares.length > 0 && (
          <div className="flex gap-2">
            <Botao
              variante="secundario"
              className="text-sm"
              disabled={alterar.isPending}
              onClick={() =>
                definir(
                  listaPares.flatMap((p) => [p.peao_id, p.prenda_id]).filter((id) => porId.get(id)?.ativo),
                  'titular',
                )
              }
            >
              Todos titulares
            </Botao>
            <Botao
              variante="secundario"
              className="text-sm"
              disabled={alterar.isPending || situacao.size === 0}
              onClick={() => definir([...situacao.keys()], 'fora')}
            >
              Limpar
            </Botao>
          </div>
        )}
      </header>

      <div className="flex flex-col gap-4 p-4">
        {carregando && <Carregando />}

        {!carregando && situacao.size > 0 && resumo.problemas.length > 0 && (
          <Aviso tipo="info">
            <p className="flex items-center gap-2 font-medium text-texto">
              <Icone nome="alerta" className="size-4 text-destaque" /> Atenção ao regulamento (Força A)
            </p>
            <ul className="mt-1 list-disc pl-5">
              {resumo.problemas.map((p) => (
                <li key={p}>{p}</li>
              ))}
            </ul>
          </Aviso>
        )}
        {!carregando && situacao.size > 0 && resumo.problemas.length === 0 && (
          <Aviso tipo="sucesso">Escalação dentro dos limites da Força A (8 a 12 pares).</Aviso>
        )}
        {alterar.error && <Aviso tipo="erro">{mensagemDeErro(alterar.error)}</Aviso>}

        {!carregando && todos.length === 0 && (
          <Vazio titulo="Nenhum integrante cadastrado">
            Cadastre em{' '}
            <Link to="/integrantes" className="text-link underline">
              Integrantes
            </Link>{' '}
            e forme os{' '}
            <Link to="/pares" className="text-link underline">
              Pares
            </Link>
            .
          </Vazio>
        )}

        {!carregando && !editor && todos.length > 0 && situacao.size === 0 && (
          <Vazio titulo="Escalação ainda não definida" />
        )}

        {!carregando && listaPares.length > 0 && (editor || situacao.size > 0) && (
          <ul className="flex flex-col gap-2">
            {listaPares
              .filter((p) => editor || sit(p.peao_id) !== 'fora' || sit(p.prenda_id) !== 'fora')
              .map((p) => (
                <LinhaParEscalacao
                  key={p.id}
                  par={p}
                  peao={porId.get(p.peao_id)!}
                  prenda={porId.get(p.prenda_id)!}
                  sit={sit}
                  editor={editor}
                  ocupado={alterar.isPending}
                  idDoUsuario={perfil?.integrante_id ?? null}
                  aoDefinir={definir}
                />
              ))}
          </ul>
        )}

        {!carregando && avulsos.length > 0 && (editor || avulsos.some((i) => sit(i.id) !== 'fora')) && (
          <div>
            <h3 className="mb-2 text-sm font-medium text-texto-suave">Sem par fixo</h3>
            <ul className="flex flex-col gap-2">
              {avulsos
                .filter((i) => editor || sit(i.id) !== 'fora')
                .map((i) => (
                  <li key={i.id} className="flex flex-wrap items-center gap-3 rounded-xl border border-borda p-2.5">
                    <Avatar nome={i.nome} tamanho="sm" />
                    <span className="min-w-0 flex-1 truncate text-sm font-medium">{i.nome}</span>
                    <ControleSituacao
                      valor={sit(i.id)}
                      editor={editor}
                      ocupado={alterar.isPending}
                      aoMudar={(v) => definir([i.id], v)}
                    />
                  </li>
                ))}
            </ul>
          </div>
        )}
      </div>
    </section>
  )
}

function LinhaParEscalacao({
  par,
  peao,
  prenda,
  sit,
  editor,
  ocupado,
  idDoUsuario,
  aoDefinir,
}: {
  par: Par
  peao: Integrante
  prenda: Integrante
  sit: (id: string) => Situacao
  editor: boolean
  ocupado: boolean
  idDoUsuario: string | null
  aoDefinir: (ids: string[], nova: Situacao) => void
}) {
  const sitPeao = sit(peao.id)
  const sitPrenda = sit(prenda.id)
  const misto = sitPeao !== sitPrenda
  const [individual, setIndividual] = useState(misto)
  const meu = idDoUsuario === peao.id || idDoUsuario === prenda.id

  return (
    <li className={`rounded-xl border p-2.5 ${meu ? 'border-marca' : 'border-borda'}`}>
      <div className="flex flex-wrap items-center gap-3">
        <NumeroPar numero={par.numero} cor={par.cor} />
        <div className="min-w-0 flex-1 text-sm leading-snug">
          <p className="truncate">{peao.nome}</p>
          <p className="truncate">{prenda.nome}</p>
        </div>
        {!individual && (
          <ControleSituacao
            valor={sitPeao}
            editor={editor}
            ocupado={ocupado}
            aoMudar={(v) => aoDefinir([peao.id, prenda.id], v)}
          />
        )}
      </div>

      {individual && (
        <ul className="mt-2 flex flex-col gap-2 border-t border-borda pt-2">
          {[peao, prenda].map((i) => (
            <li key={i.id} className="flex flex-wrap items-center gap-2">
              <span className="min-w-0 flex-1 truncate text-sm">{i.nome}</span>
              <ControleSituacao
                valor={sit(i.id)}
                editor={editor}
                ocupado={ocupado}
                aoMudar={(v) => aoDefinir([i.id], v)}
              />
            </li>
          ))}
        </ul>
      )}

      {editor && (
        <button
          type="button"
          onClick={() => setIndividual(!individual)}
          className="mt-1 min-h-9 text-xs text-link hover:underline"
        >
          {individual ? 'Ajustar o par junto' : 'Ajustar separadamente'}
        </button>
      )}
    </li>
  )
}

function ControleSituacao({
  valor,
  editor,
  ocupado,
  aoMudar,
}: {
  valor: Situacao
  editor: boolean
  ocupado: boolean
  aoMudar: (v: Situacao) => void
}) {
  if (!editor) {
    return valor === 'titular' ? <Etiqueta cor="sucesso">Titular</Etiqueta> : valor === 'reserva' ? <Etiqueta cor="destaque">Reserva</Etiqueta> : null
  }
  return (
    <div className="w-full sm:w-64">
      <Segmentado<Situacao> valor={valor} aoMudar={aoMudar} opcoes={OPCOES_SITUACAO} desabilitado={ocupado} compacto />
    </div>
  )
}
