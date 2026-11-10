// Formações de uma dança no tablado 3D.
// Professores arrastam os dançarinos, giram, criam momentos e organizam
// automaticamente; dançarinos visualizam e acompanham a própria posição.
import { Suspense, useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Aviso, Botao, Campo, CampoTexto, Carregando, Etiqueta, Folha, Icone, Selecao, Vazio } from '../components/ui'
import {
  descreverDirecao,
  encaixar,
  gerarFormacao,
  interpolarPosicao,
  limitar,
  normalizarAngulo,
  NOMES_MODELOS,
  rotacaoOlhandoPara,
  suavizar,
  type ModeloFormacao,
  type Posicao,
} from '../domain/formacoes'
import { nomeCurto } from '../domain/indices'
import { buscarIndumentaria, INDUMENTARIAS, tipoNaDanca } from '../domain/indumentarias'
import { nomeDaPlaca, placaNoPonto, type MedidasTablado } from '../domain/tablado'
import { podeEditar, useAuth } from '../lib/auth'
import { ANO_ATUAL, useAno } from '../lib/ano'
import {
  useAtualizarFormacao,
  useCoreografia,
  useCriarFormacao,
  useDancas,
  useDefinirIndumentaria,
  useDuplas,
  useEscalacao,
  useFormacoes,
  useIntegrantes,
  usePosicoes,
  useRemoverFormacao,
  useReordenarFormacoes,
  useSalvarPosicoes,
  useTabladoPadrao,
} from '../lib/dados'
import { mensagemDeErro } from '../lib/erros'
import { CenaTablado } from '../three/CenaTablado'
import { Dancarino, type EstadoDancarino } from '../three/Dancarino'
import { NOMES_VISTAS, type VistaCamera } from '../three/vistas'
import { NOME_INDUMENTARIA, type Danca, type Dupla, type Formacao, type Integrante, type PosicaoSalva } from '../types/db'

const COR_SEM_DUPLA = '#9aa0a7'
const DURACAO_TRANSICAO = 1800 // ms
const PAUSA_ENTRE_FORMACOES = 600 // ms

interface Participante {
  integrante: Integrante
  dupla: Dupla | null
  parceiroId: string | null
  cor: string
}

export default function Formacoes() {
  const { slug } = useParams()
  const [ano] = useAno()
  const dancas = useDancas()
  const danca = dancas.data?.find((d) => d.slug === slug)
  if (dancas.isLoading) return <Carregando />
  if (!danca) return <Vazio titulo="Dança não encontrada" />
  return <EditorFormacoes danca={danca} ano={ano} />
}

function EditorFormacoes({ danca, ano }: { danca: Danca; ano: number }) {
  const { perfil } = useAuth()
  const editor = podeEditar(perfil)
  const tablado = useTabladoPadrao()
  const integrantes = useIntegrantes()
  const coreografia = useCoreografia(danca.id, ano)
  const coreografiaId = coreografia.data?.id
  const escalacao = useEscalacao(coreografiaId)
  const duplas = useDuplas(coreografiaId)
  const formacoes = useFormacoes(coreografiaId)
  const posicoes = usePosicoes(coreografiaId)
  const linkDanca = `/dancas/${danca.slug}${ano === ANO_ATUAL ? '' : `?ano=${ano}`}`

  const carregando =
    tablado.isLoading || integrantes.isLoading || coreografia.isLoading || escalacao.isLoading || duplas.isLoading || formacoes.isLoading || posicoes.isLoading

  // Quem aparece no tablado: os TITULARES desta dança, na ordem das duplas.
  const participantes = useMemo<Participante[]>(() => {
    const porId = new Map((integrantes.data ?? []).map((i) => [i.id, i]))
    const titulares = new Set((escalacao.data ?? []).filter((e) => e.funcao === 'titular').map((e) => e.integrante_id))
    const lista: Participante[] = []
    const ja = new Set<string>()
    for (const d of duplas.data ?? []) {
      for (const [id, parceiro] of [
        [d.peao_id, d.prenda_id],
        [d.prenda_id, d.peao_id],
      ] as const) {
        const i = porId.get(id)
        if (i && titulares.has(id)) {
          lista.push({ integrante: i, dupla: d, parceiroId: parceiro, cor: d.cor })
          ja.add(id)
        }
      }
    }
    for (const id of titulares) {
      const i = porId.get(id)
      if (i && !ja.has(id)) lista.push({ integrante: i, dupla: null, parceiroId: null, cor: COR_SEM_DUPLA })
    }
    return lista
  }, [integrantes.data, escalacao.data, duplas.data])

  if (carregando) return <Carregando texto="Carregando formações…" />
  if (!tablado.data) return <Aviso tipo="erro">Não foi possível carregar o tablado.</Aviso>

  return (
    <div className="flex flex-col gap-4">
      <Link to={linkDanca} className="-ml-1 inline-flex min-h-11 items-center gap-1 self-start text-sm text-link">
        <Icone nome="voltar" className="size-4" /> {danca.nome}
      </Link>
      <header>
        <h1 className="text-2xl font-semibold">Formações · {danca.nome}</h1>
        <p className="mt-1 text-sm text-texto-suave">
          ENART {ano} · {participantes.length} titulares no tablado
        </p>
      </header>

      {participantes.length === 0 ? (
        <Vazio titulo="Ninguém escalado como titular">
          Defina as duplas e a escalação em{' '}
          <Link to={linkDanca} className="text-link underline">
            {danca.nome}
          </Link>{' '}
          primeiro.
        </Vazio>
      ) : (
        <Palco
          danca={danca}
          ano={ano}
          coreografiaId={coreografiaId!}
          indumentariaId={coreografia.data?.indumentaria}
          medidas={tablado.data}
          participantes={participantes}
          formacoes={formacoes.data ?? []}
          posicoes={posicoes.data ?? []}
          editor={editor}
          meuId={perfil?.integrante_id ?? null}
        />
      )}
    </div>
  )
}

function Palco({
  danca,
  ano,
  coreografiaId,
  indumentariaId,
  medidas,
  participantes,
  formacoes,
  posicoes,
  editor,
  meuId,
}: {
  danca: Danca
  ano: number
  coreografiaId: string
  indumentariaId: string | undefined
  medidas: MedidasTablado
  participantes: Participante[]
  formacoes: Formacao[]
  posicoes: PosicaoSalva[]
  editor: boolean
  meuId: string | null
}) {
  const salvar = useSalvarPosicoes(coreografiaId)
  const criar = useCriarFormacao(coreografiaId)
  const remover = useRemoverFormacao(coreografiaId)
  const reordenar = useReordenarFormacoes(coreografiaId)
  const definirIndumentaria = useDefinirIndumentaria(danca.id, ano)

  const [indice, setIndice] = useState(0)
  const [selecionado, setSelecionado] = useState<string | null>(
    meuId && participantes.some((p) => p.integrante.id === meuId) ? meuId : null,
  )
  const [vista, setVista] = useState<VistaCamera>('geral')
  const [versaoVista, setVersaoVista] = useState(0)
  const [mostrarNomes, setMostrarNomes] = useState(true)
  const [mostrarPlacas, setMostrarPlacas] = useState(false)
  const [ginasio, setGinasio] = useState(true)
  const [foco, setFoco] = useState(false)
  const [encaixe, setEncaixe] = useState(true)
  const [modelo, setModelo] = useState<ModeloFormacao>('pares')
  const [arrasto, setArrasto] = useState<{ id: string; x: number; z: number } | null>(null)
  const [animadas, setAnimadas] = useState<Map<string, Posicao> | null>(null)
  const [tocando, setTocando] = useState(false)
  const [editandoFormacao, setEditandoFormacao] = useState(false)
  const historico = useRef<PosicaoSalva[][]>([])
  const [, forcarAtualizacao] = useState(0)

  const indumentaria = buscarIndumentaria(indumentariaId)
  const formacaoAtual = formacoes[Math.min(indice, formacoes.length - 1)] as Formacao | undefined
  const porId = useMemo(() => new Map(participantes.map((p) => [p.integrante.id, p])), [participantes])

  // Passo do encaixe: um quarto do lado maior da placa / metade do lado menor (0,61 m nas placas de 2,44 × 1,22)
  const passoX = (medidas.placa_largura_m ?? 2.44) / 4
  const passoZ = (medidas.placa_profundidade_m ?? 1.22) / 2

  /** Posições de uma formação, completando quem ainda não tem posição salva. */
  const posicoesDaFormacao = useCallback(
    (formacaoId: string | undefined): Map<string, Posicao> => {
      const salvas = new Map<string, Posicao>()
      for (const p of posicoes) if (p.formacao_id === formacaoId) salvas.set(p.integrante_id, p)
      const faltando = participantes.filter((p) => !salvas.has(p.integrante.id))
      if (faltando.length) {
        const sugestao = sugerirPosicoes('pares', participantes, medidas)
        for (const p of faltando) salvas.set(p.integrante.id, sugestao.get(p.integrante.id)!)
      }
      return salvas
    },
    [posicoes, participantes, medidas],
  )

  const atuais = useMemo(() => posicoesDaFormacao(formacaoAtual?.id), [posicoesDaFormacao, formacaoAtual?.id])
  const semPosicaoSalva = participantes.filter(
    (p) => !posicoes.some((s) => s.formacao_id === formacaoAtual?.id && s.integrante_id === p.integrante.id),
  ).length

  /** Posição exibida agora (animação > arrasto > salva). */
  const exibida = (id: string): Posicao => {
    if (animadas?.has(id)) return animadas.get(id)!
    const base = atuais.get(id)!
    if (arrasto?.id === id) return { ...base, x: arrasto.x, z: arrasto.z }
    return base
  }

  // ---------------------------------------------------------------- gravação
  function gravar(alteracoes: { id: string; posicao: Posicao }[]) {
    if (!formacaoAtual || !alteracoes.length) return
    // guarda o "antes" para poder desfazer
    historico.current.push(
      alteracoes.map(({ id }) => ({ formacao_id: formacaoAtual.id, integrante_id: id, ...atuais.get(id)! })),
    )
    if (historico.current.length > 30) historico.current.shift()
    forcarAtualizacao((n) => n + 1)
    salvar.mutate(alteracoes.map(({ id, posicao }) => ({ formacao_id: formacaoAtual.id, integrante_id: id, ...posicao })))
  }

  function desfazer() {
    const ultimo = historico.current.pop()
    forcarAtualizacao((n) => n + 1)
    if (ultimo) salvar.mutate(ultimo)
  }

  const aoArrastar = useCallback(
    (id: string, x: number, z: number) => {
      let nx = limitar(x, medidas.largura_m / 2)
      let nz = limitar(z, medidas.profundidade_m / 2)
      if (encaixe) {
        nx = encaixar(nx, passoX)
        nz = encaixar(nz, passoZ)
      }
      setArrasto({ id, x: nx, z: nz })
    },
    [encaixe, medidas.largura_m, medidas.profundidade_m, passoX, passoZ],
  )

  // aoSoltar depende do estado do arrasto; usamos uma ref para manter o callback estável (memo dos dançarinos)
  const refSoltar = useRef<(id: string, moveu: boolean) => void>(() => undefined)
  refSoltar.current = (id, moveu) => {
    if (moveu && arrasto?.id === id) gravar([{ id, posicao: { ...atuais.get(id)!, x: arrasto.x, z: arrasto.z } }])
    setArrasto(null)
  }
  const aoSoltar = useCallback((id: string, moveu: boolean) => refSoltar.current(id, moveu), [])
  const aoSelecionar = useCallback((id: string) => setSelecionado(id), [])

  // ---------------------------------------------------------------- formações
  function criarFormacao(primeira: boolean) {
    const ordem = (formacoes.at(-1)?.ordem ?? 0) + 1
    const base = primeira ? sugerirPosicoes(modelo, participantes, medidas) : atuais
    criar.mutate(
      {
        ordem,
        nome: primeira ? 'Início' : `Momento ${formacoes.length + 1}`,
        copiarDe: participantes.map((p) => ({ formacao_id: '', integrante_id: p.integrante.id, ...base.get(p.integrante.id)! })),
      },
      { onSuccess: () => setIndice(formacoes.length) },
    )
  }

  function mover(direcao: -1 | 1) {
    if (!formacaoAtual) return
    const ids = formacoes.map((f) => f.id)
    const de = ids.indexOf(formacaoAtual.id)
    const para = de + direcao
    if (para < 0 || para >= ids.length) return
    ;[ids[de], ids[para]] = [ids[para], ids[de]]
    reordenar.mutate(ids, { onSuccess: () => setIndice(para) })
  }

  // ---------------------------------------------------------------- animação
  useEffect(() => {
    if (!tocando) return
    const sequencia = formacoes.slice(indice).map((f) => posicoesDaFormacao(f.id))
    if (sequencia.length < 2) {
      setTocando(false)
      return
    }
    const inicio = performance.now()
    let quadro = 0
    const passo = (agora: number) => {
      const t = agora - inicio
      const ciclo = DURACAO_TRANSICAO + PAUSA_ENTRE_FORMACOES
      const k = Math.floor(t / ciclo)
      if (k >= sequencia.length - 1) {
        setAnimadas(null)
        setIndice(indice + sequencia.length - 1)
        setTocando(false)
        return
      }
      const local = suavizar(Math.min(1, (t - k * ciclo) / DURACAO_TRANSICAO))
      const mapa = new Map<string, Posicao>()
      for (const [id, a] of sequencia[k]) {
        const b = sequencia[k + 1].get(id) ?? a
        mapa.set(id, interpolarPosicao(a, b, local))
      }
      setAnimadas(mapa)
      quadro = requestAnimationFrame(passo)
    }
    quadro = requestAnimationFrame(passo)
    return () => cancelAnimationFrame(quadro)
    // a sequência é montada só no início da reprodução
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tocando])

  // ---------------------------------------------------------------- seleção
  const sel = selecionado ? porId.get(selecionado) : undefined
  const posSel = sel ? exibida(sel.integrante.id) : undefined
  const placaSel = posSel ? placaNoPonto(medidas, posSel.x, posSel.z) : null
  const parceiro = sel?.parceiroId ? porId.get(sel.parceiroId) : undefined

  function estadoDe(id: string): EstadoDancarino {
    if (!selecionado) return 'normal'
    if (id === selecionado) return 'selecionado'
    if (id === sel?.parceiroId) return 'par'
    return foco ? 'apagado' : 'normal'
  }

  function girar(novaRotacao: number) {
    if (!sel || !posSel) return
    gravar([{ id: sel.integrante.id, posicao: { ...atuais.get(sel.integrante.id)!, rotacao: normalizarAngulo(novaRotacao) } }])
  }

  const escolherVista = (v: VistaCamera) => {
    setVista(v)
    setVersaoVista((n) => n + 1)
  }

  const erro = salvar.error ?? criar.error ?? remover.error ?? reordenar.error ?? definirIndumentaria.error

  return (
    <>
      {/* ------------------------------------------------ cena 3D */}
      <div className="relative h-[calc(100dvh-20rem)] min-h-[360px] overflow-hidden rounded-2xl border border-borda bg-[#16191f] md:h-[calc(100dvh-16rem)]">
        <Suspense fallback={<Carregando texto="Montando o tablado…" />}>
          <CenaTablado
            medidas={medidas}
            vista={vista}
            versaoVista={versaoVista}
            rotulos={mostrarPlacas}
            referencia={false}
            ginasio={ginasio}
            aoTocarFora={() => setSelecionado(null)}
          >
            {participantes.map((p) => (
              <Dancarino
                key={p.integrante.id}
                id={p.integrante.id}
                nome={nomeCurto(p.integrante)}
                genero={p.integrante.genero}
                cor={p.cor}
                numeroDupla={p.dupla?.numero ?? null}
                tipo={tipoNaDanca(p.integrante)}
                pilchaPeao={indumentaria.peao}
                pilchaPrenda={indumentaria.prenda}
                posicao={exibida(p.integrante.id)}
                estado={estadoDe(p.integrante.id)}
                mostrarNome={mostrarNomes}
                editavel={editor && !tocando && !!formacaoAtual}
                aoSelecionar={aoSelecionar}
                aoArrastar={aoArrastar}
                aoSoltar={aoSoltar}
              />
            ))}
          </CenaTablado>
        </Suspense>

        <div className="pointer-events-none absolute inset-x-0 top-0 flex flex-wrap items-start justify-between gap-2 p-2">
          {formacaoAtual && (
            <span className="rounded-full bg-black/60 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur">
              {indice + 1}/{formacoes.length} · {formacaoAtual.nome ?? `Momento ${indice + 1}`}
            </span>
          )}
          <div className="ml-auto flex flex-wrap justify-end gap-1.5">
            <Alternar ativo={mostrarNomes} aoMudar={setMostrarNomes} texto="Nomes" />
            <Alternar ativo={mostrarPlacas} aoMudar={setMostrarPlacas} texto="Placas" />
            <Alternar ativo={foco} aoMudar={setFoco} texto="Foco" />
            <Alternar ativo={ginasio} aoMudar={setGinasio} texto="Ginásio" />
          </div>
        </div>

        <div className="absolute inset-x-0 bottom-0 p-2">
          <div className="mx-auto max-w-md rounded-2xl bg-black/55 p-1 backdrop-blur">
            <div role="radiogroup" aria-label="Vista da câmera" className="flex">
              {(Object.keys(NOMES_VISTAS) as VistaCamera[]).map((v) => (
                <button
                  key={v}
                  type="button"
                  role="radio"
                  aria-checked={vista === v}
                  onClick={() => escolherVista(v)}
                  className={`min-h-10 flex-1 rounded-xl px-2 text-sm font-medium transition ${
                    vista === v ? 'bg-white text-black' : 'text-white/85 hover:text-white'
                  }`}
                >
                  {NOMES_VISTAS[v]}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {erro && <Aviso tipo="erro">{mensagemDeErro(erro)}</Aviso>}

      {/* ------------------------------------------------ momentos da dança */}
      {formacoes.length === 0 ? (
        <section className="rounded-2xl border border-dashed border-borda p-4 text-center">
          <p className="font-medium">Nenhuma formação criada ainda</p>
          <p className="mt-1 text-sm text-texto-suave">
            {editor
              ? 'Escolha um ponto de partida. Depois é só arrastar cada dançarino para o lugar certo.'
              : 'Os professores ainda não montaram as formações desta dança. Por enquanto, veja a escalação.'}
          </p>
          {editor && (
            <div className="mx-auto mt-3 flex max-w-sm flex-col gap-2 sm:flex-row">
              <Selecao id="modelo-inicial" value={modelo} onChange={(e) => setModelo(e.target.value as ModeloFormacao)}>
                {(Object.keys(NOMES_MODELOS) as ModeloFormacao[]).map((m) => (
                  <option key={m} value={m}>
                    {NOMES_MODELOS[m]}
                  </option>
                ))}
              </Selecao>
              <Botao className="shrink-0" disabled={criar.isPending} onClick={() => criarFormacao(true)}>
                Criar primeira formação
              </Botao>
            </div>
          )}
        </section>
      ) : (
        <section className="rounded-2xl border border-borda bg-superficie p-3">
          <div className="flex items-center gap-2">
            <Botao
              variante="secundario"
              aria-label="Formação anterior"
              className="shrink-0 px-3"
              disabled={indice === 0 || tocando}
              onClick={() => setIndice(indice - 1)}
            >
              <Icone nome="voltar" className="size-5" />
            </Botao>
            <ol className="flex flex-1 gap-2 overflow-x-auto py-1" aria-label="Momentos da dança">
              {formacoes.map((f, i) => (
                <li key={f.id}>
                  <button
                    type="button"
                    disabled={tocando}
                    onClick={() => setIndice(i)}
                    aria-current={i === indice}
                    className={`min-h-11 whitespace-nowrap rounded-xl border px-3 text-sm font-medium transition ${
                      i === indice ? 'border-marca bg-marca text-marca-texto' : 'border-borda bg-superficie-2 hover:bg-borda/40'
                    }`}
                  >
                    {i + 1}. {f.nome ?? `Momento ${i + 1}`}
                  </button>
                </li>
              ))}
              {editor && (
                <li>
                  <button
                    type="button"
                    disabled={criar.isPending || tocando}
                    onClick={() => criarFormacao(false)}
                    className="min-h-11 whitespace-nowrap rounded-xl border border-dashed border-borda px-3 text-sm font-medium text-link"
                  >
                    + Novo momento
                  </button>
                </li>
              )}
            </ol>
            <Botao
              variante="secundario"
              aria-label="Próxima formação"
              className="shrink-0 px-3"
              disabled={indice >= formacoes.length - 1 || tocando}
              onClick={() => setIndice(indice + 1)}
            >
              <Icone nome="voltar" className="size-5 rotate-180" />
            </Botao>
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            <Botao
              className="text-sm"
              disabled={formacoes.length < 2 || indice >= formacoes.length - 1}
              onClick={() => (tocando ? (setTocando(false), setAnimadas(null)) : setTocando(true))}
            >
              {tocando ? '■ Parar' : '▶ Ver a transição até o fim'}
            </Botao>
            {editor && formacaoAtual && (
              <Botao variante="secundario" className="text-sm" disabled={tocando} onClick={() => setEditandoFormacao(true)}>
                Editar momento
              </Botao>
            )}
          </div>
          {formacaoAtual?.observacoes && (
            <p className="mt-3 whitespace-pre-line rounded-xl bg-superficie-2 p-3 text-sm">{formacaoAtual.observacoes}</p>
          )}
          {editor && semPosicaoSalva > 0 && formacaoAtual && (
            <p className="mt-2 text-xs text-texto-suave">
              {semPosicaoSalva} dançarino(s) ainda sem posição salva neste momento — estão numa posição sugerida.
            </p>
          )}
        </section>
      )}

      {/* ------------------------------------------------ dançarino selecionado */}
      {sel && posSel && (
        <section className="rounded-2xl border border-borda bg-superficie p-4" aria-live="polite">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-block size-4 rounded-full" style={{ background: sel.cor }} />
            <h2 className="font-semibold">{sel.integrante.nome}</h2>
            {sel.integrante.id === meuId && <Etiqueta cor="marca">Você</Etiqueta>}
            {tipoNaDanca(sel.integrante) && <Etiqueta>{NOME_INDUMENTARIA[tipoNaDanca(sel.integrante)!]}</Etiqueta>}
          </div>
          <dl className="mt-2 grid gap-2 text-sm sm:grid-cols-3">
            <div>
              <dt className="text-texto-suave">Placa</dt>
              <dd className="text-lg font-semibold">{placaSel ? nomeDaPlaca(placaSel.coluna, placaSel.fileira) : 'fora do tablado'}</dd>
            </div>
            <div>
              <dt className="text-texto-suave">Direção</dt>
              <dd className="font-medium">{descreverDirecao(posSel.rotacao)}</dd>
            </div>
            <div>
              <dt className="text-texto-suave">Dupla nesta dança</dt>
              <dd className="font-medium">
                {sel.dupla ? `Dupla ${sel.dupla.numero} com ${parceiro ? nomeCurto(parceiro.integrante) : '—'}` : 'sem dupla'}
              </dd>
            </div>
          </dl>

          {editor && formacaoAtual && !tocando && (
            <div className="mt-3 flex flex-wrap gap-2">
              <Botao variante="secundario" className="text-sm" onClick={() => girar(posSel.rotacao - 45)} aria-label="Girar 45° anti-horário">
                ⟲ 45°
              </Botao>
              <Botao variante="secundario" className="text-sm" onClick={() => girar(posSel.rotacao + 45)} aria-label="Girar 45° horário">
                ⟳ 45°
              </Botao>
              <Botao variante="secundario" className="text-sm" onClick={() => girar(0)}>
                De frente
              </Botao>
              {parceiro && (
                <Botao
                  variante="secundario"
                  className="text-sm"
                  onClick={() => girar(rotacaoOlhandoPara(posSel, exibida(parceiro.integrante.id)))}
                >
                  Para o par
                </Botao>
              )}
              <Botao variante="secundario" className="text-sm" onClick={() => girar(rotacaoOlhandoPara(posSel, { x: 0, z: 0 }))}>
                Para o centro
              </Botao>
            </div>
          )}
        </section>
      )}

      {!sel && (
        <p className="text-sm text-texto-suave">
          {editor ? 'Toque num dançarino para selecionar e arraste para mover.' : 'Toque num dançarino para ver a placa e a direção.'}
        </p>
      )}

      {/* ------------------------------------------------ ferramentas dos professores */}
      {editor && formacaoAtual && (
        <section className="grid gap-3 rounded-2xl border border-borda bg-superficie p-4 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <p className="text-sm font-semibold">Organizar este momento automaticamente</p>
            <div className="flex gap-2">
              <Selecao id="modelo" value={modelo} onChange={(e) => setModelo(e.target.value as ModeloFormacao)}>
                {(Object.keys(NOMES_MODELOS) as ModeloFormacao[]).map((m) => (
                  <option key={m} value={m}>
                    {NOMES_MODELOS[m]}
                  </option>
                ))}
              </Selecao>
              <Botao
                variante="secundario"
                className="shrink-0"
                disabled={tocando}
                onClick={() => {
                  const sugestao = sugerirPosicoes(modelo, participantes, medidas)
                  gravar(participantes.map((p) => ({ id: p.integrante.id, posicao: sugestao.get(p.integrante.id)! })))
                }}
              >
                Aplicar
              </Botao>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <p className="text-sm font-semibold">Indumentária desta dança</p>
            <Selecao
              id="indumentaria"
              value={indumentaria.id}
              disabled={definirIndumentaria.isPending}
              onChange={(e) => definirIndumentaria.mutate(e.target.value)}
            >
              {INDUMENTARIAS.map((i) => (
                <option key={i.id} value={i.id}>
                  {i.nome}
                </option>
              ))}
            </Selecao>
          </div>
          <div className="flex flex-wrap items-center gap-2 sm:col-span-2">
            <label className="flex min-h-11 cursor-pointer items-center gap-2 rounded-xl border border-borda px-3 text-sm">
              <input type="checkbox" checked={encaixe} onChange={(e) => setEncaixe(e.target.checked)} className="size-4 accent-[var(--marca)]" />
              Encaixar na grade das placas
            </label>
            <Botao variante="secundario" className="text-sm" disabled={!historico.current.length || salvar.isPending} onClick={desfazer}>
              Desfazer ({historico.current.length})
            </Botao>
          </div>
        </section>
      )}

      {!editor && (
        <p className="text-sm text-texto-suave">Indumentária: {indumentaria.nome}</p>
      )}

      {editandoFormacao && formacaoAtual && (
        <FormularioFormacao
          formacao={formacaoAtual}
          coreografiaId={coreografiaId}
          podeMoverAntes={indice > 0}
          podeMoverDepois={indice < formacoes.length - 1}
          aoMover={(d) => {
            mover(d)
            setEditandoFormacao(false)
          }}
          aoRemover={() =>
            remover.mutate(formacaoAtual.id, {
              onSuccess: () => {
                setIndice(Math.max(0, indice - 1))
                setEditandoFormacao(false)
              },
            })
          }
          aoFechar={() => setEditandoFormacao(false)}
        />
      )}
    </>
  )
}

/** Gera posições a partir de um modelo, usando as duplas desta dança. */
function sugerirPosicoes(modelo: ModeloFormacao, participantes: Participante[], medidas: MedidasTablado) {
  const vistos = new Set<string>()
  const pares: { peaoId: string; prendaId: string }[] = []
  const avulsos: { id: string; genero: 'peao' | 'prenda' }[] = []
  const ids = new Set(participantes.map((p) => p.integrante.id))
  for (const p of participantes) {
    if (vistos.has(p.integrante.id)) continue
    if (p.dupla && ids.has(p.dupla.peao_id) && ids.has(p.dupla.prenda_id)) {
      pares.push({ peaoId: p.dupla.peao_id, prendaId: p.dupla.prenda_id })
      vistos.add(p.dupla.peao_id).add(p.dupla.prenda_id)
    } else {
      avulsos.push({ id: p.integrante.id, genero: p.integrante.genero })
      vistos.add(p.integrante.id)
    }
  }
  return gerarFormacao(modelo, pares, avulsos, medidas.largura_m, medidas.profundidade_m)
}

function Alternar({ ativo, aoMudar, texto }: { ativo: boolean; aoMudar: (v: boolean) => void; texto: string }) {
  return (
    <button
      type="button"
      aria-pressed={ativo}
      onClick={() => aoMudar(!ativo)}
      className={`pointer-events-auto min-h-9 rounded-full px-3 text-xs font-semibold backdrop-blur transition ${
        ativo ? 'bg-white text-black' : 'bg-black/55 text-white/85'
      }`}
    >
      {texto}
    </button>
  )
}

function FormularioFormacao({
  formacao,
  coreografiaId,
  podeMoverAntes,
  podeMoverDepois,
  aoMover,
  aoRemover,
  aoFechar,
}: {
  formacao: Formacao
  coreografiaId: string
  podeMoverAntes: boolean
  podeMoverDepois: boolean
  aoMover: (d: -1 | 1) => void
  aoRemover: () => void
  aoFechar: () => void
}) {
  const atualizar = useAtualizarFormacao(coreografiaId)
  const [nome, setNome] = useState(formacao.nome ?? '')
  const [observacoes, setObservacoes] = useState(formacao.observacoes ?? '')
  const [confirmando, setConfirmando] = useState(false)

  function aoEnviar(e: FormEvent) {
    e.preventDefault()
    atualizar.mutate(
      { id: formacao.id, nome: nome.trim() || null, observacoes: observacoes.trim() || null },
      { onSuccess: aoFechar },
    )
  }

  return (
    <Folha
      aberta
      aoFechar={aoFechar}
      titulo="Editar momento"
      rodape={
        <>
          <Botao variante="secundario" onClick={aoFechar}>
            Cancelar
          </Botao>
          <Botao type="submit" form="form-formacao" disabled={atualizar.isPending}>
            Salvar
          </Botao>
        </>
      }
    >
      <form id="form-formacao" onSubmit={aoEnviar} className="flex flex-col gap-4">
        <Campo id="nome-formacao" rotulo="Nome do momento" placeholder="Ex.: Roda inicial, 1ª figura, Saída" value={nome} onChange={(e) => setNome(e.target.value)} />
        <CampoTexto
          id="obs-formacao"
          rotulo="Observações para o grupo"
          placeholder="Ex.: peões dão 3 passos para o centro antes de girar"
          value={observacoes}
          onChange={(e) => setObservacoes(e.target.value)}
        />
        <div className="flex flex-wrap gap-2">
          <Botao variante="secundario" disabled={!podeMoverAntes} onClick={() => aoMover(-1)}>
            ← Mover para antes
          </Botao>
          <Botao variante="secundario" disabled={!podeMoverDepois} onClick={() => aoMover(1)}>
            Mover para depois →
          </Botao>
        </div>
        {!confirmando ? (
          <Botao variante="perigo" className="self-start" onClick={() => setConfirmando(true)}>
            Excluir este momento
          </Botao>
        ) : (
          <Aviso tipo="erro">
            <p>Excluir “{formacao.nome ?? 'este momento'}” e todas as posições dele?</p>
            <div className="mt-2 flex gap-2">
              <Botao variante="secundario" onClick={() => setConfirmando(false)}>
                Não
              </Botao>
              <Botao variante="perigo" onClick={aoRemover}>
                Sim, excluir
              </Botao>
            </div>
          </Aviso>
        )}
        {atualizar.error && <Aviso tipo="erro">{mensagemDeErro(atualizar.error)}</Aviso>}
      </form>
    </Folha>
  )
}
