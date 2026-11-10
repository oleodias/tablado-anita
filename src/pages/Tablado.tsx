import { Suspense, useEffect, useMemo, useState, type FormEvent } from 'react'
import { Aviso, Botao, CabecalhoPagina, Campo, Carregando, Etiqueta, Folha, Segmentado } from '../components/ui'
import { contarPlacas, letraDaColuna, type MedidasTablado } from '../domain/tablado'
import { podeEditar, useAuth } from '../lib/auth'
import { useSalvarTablado, useTabladoPadrao } from '../lib/dados'
import { mensagemDeErro } from '../lib/erros'
import { CenaTablado } from '../three/CenaTablado'
import { NOMES_VISTAS, type VistaCamera } from '../three/vistas'
import type { Tablado as TTablado } from '../types/db'

const formatar = (n: number | null) => (n === null ? '–' : n.toLocaleString('pt-BR', { maximumFractionDigits: 2 }))

export default function Tablado() {
  const { perfil } = useAuth()
  const editor = podeEditar(perfil)
  const tablado = useTabladoPadrao()
  const [vista, setVista] = useState<VistaCamera>('geral')
  const [versaoVista, setVersaoVista] = useState(0)
  const [rotulos, setRotulos] = useState(true)
  const [referencia, setReferencia] = useState(false)
  const [editando, setEditando] = useState(false)
  const [rascunho, setRascunho] = useState<MedidasTablado | null>(null)

  const t = tablado.data
  // Enquanto o professor ajusta as medidas, a cena mostra o rascunho ao vivo.
  const medidas = useMemo<MedidasTablado | null>(
    () =>
      rascunho ??
      (t
        ? {
            largura_m: t.largura_m,
            profundidade_m: t.profundidade_m,
            placa_largura_m: t.placa_largura_m,
            placa_profundidade_m: t.placa_profundidade_m,
          }
        : null),
    [rascunho, t],
  )

  if (tablado.isLoading) return <Carregando />
  if (tablado.error || !t || !medidas) return <Aviso tipo="erro">Não foi possível carregar o tablado.</Aviso>

  const contagem = contarPlacas(medidas)
  const escolherVista = (v: VistaCamera) => {
    setVista(v)
    setVersaoVista((n) => n + 1)
  }

  return (
    <>
      <CabecalhoPagina
        titulo="Tablado"
        subtitulo={
          <>
            {t.nome} · {formatar(medidas.largura_m)} × {formatar(medidas.profundidade_m)} m
          </>
        }
        acoes={
          editor && (
            <Botao variante="secundario" onClick={() => setEditando(true)}>
              Ajustar medidas
            </Botao>
          )
        }
      />

      <div className="relative h-[calc(100dvh-17rem)] min-h-[380px] overflow-hidden rounded-2xl border border-borda bg-[#20242b] md:h-[calc(100dvh-14rem)]">
        <Suspense fallback={<Carregando texto="Montando o tablado…" />}>
          <CenaTablado
            medidas={medidas}
            vista={vista}
            versaoVista={versaoVista}
            rotulos={rotulos}
            referencia={referencia}
          />
        </Suspense>

        {/* Opções sobre a cena */}
        <div className="pointer-events-none absolute inset-x-0 top-0 flex flex-wrap justify-end gap-2 p-2">
          <AlternarSobreCena ativo={rotulos} aoMudar={setRotulos} texto="Nomes" />
          <AlternarSobreCena ativo={referencia} aoMudar={setReferencia} texto="Pessoa 1,75 m" />
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

      <section className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
        <div className="rounded-2xl border border-borda bg-superficie p-4">
          <p className="font-semibold">Placas do piso</p>
          <p className="mt-1 text-texto-suave">
            {formatar(medidas.placa_largura_m)} × {formatar(medidas.placa_profundidade_m)} m ·{' '}
            {contagem.colunas} colunas (A–{letraDaColuna(contagem.colunas - 1)}) × {contagem.fileiras} fileiras (1–
            {contagem.fileiras})
          </p>
          <p className="mt-2 text-texto-suave">
            <b className="text-texto">A1</b> é a placa da frente no canto esquerdo de quem está na mesa dos jurados. As
            letras vão para a direita; os números, para o fundo.
          </p>
        </div>
        <div className="rounded-2xl border border-borda bg-superficie p-4">
          <p className="font-semibold">Como navegar</p>
          <ul className="mt-1 list-disc pl-5 text-texto-suave">
            <li>Um dedo (ou o mouse): girar</li>
            <li>Dois dedos (ou a rodinha): aproximar e afastar</li>
            <li>Dois dedos arrastando (ou botão direito): mover</li>
          </ul>
        </div>
        {t.config.estimado && (
          <div className="sm:col-span-2">
            <Aviso tipo="info">
              <Etiqueta cor="destaque">medidas estimadas</Etiqueta>{' '}
              Calculadas a partir de imagens das transmissões. Assim que medirmos uma placa com trena, um professor
              ajusta em “Ajustar medidas”.
            </Aviso>
          </div>
        )}
      </section>

      {editando && (
        <FormularioMedidas
          tablado={t}
          aoMudar={setRascunho}
          aoFechar={() => {
            setEditando(false)
            setRascunho(null)
          }}
        />
      )}
    </>
  )
}

function AlternarSobreCena({ ativo, aoMudar, texto }: { ativo: boolean; aoMudar: (v: boolean) => void; texto: string }) {
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

type ModoMedida = 'metros' | 'placas'

function FormularioMedidas({
  tablado,
  aoMudar,
  aoFechar,
}: {
  tablado: TTablado
  aoMudar: (m: MedidasTablado) => void
  aoFechar: () => void
}) {
  const salvar = useSalvarTablado()
  const [modo, setModo] = useState<ModoMedida>('placas')
  const [placaL, setPlacaL] = useState(String(tablado.placa_largura_m ?? 2.44))
  const [placaP, setPlacaP] = useState(String(tablado.placa_profundidade_m ?? 1.22))
  const [largura, setLargura] = useState(String(tablado.largura_m))
  const [profundidade, setProfundidade] = useState(String(tablado.profundidade_m))
  const [qtdL, setQtdL] = useState(String(+(tablado.largura_m / (tablado.placa_largura_m || 1)).toFixed(2)))
  const [qtdP, setQtdP] = useState(String(+(tablado.profundidade_m / (tablado.placa_profundidade_m || 1)).toFixed(2)))

  // Converte para metros conforme o modo escolhido
  const num = (s: string) => Number(s.replace(',', '.'))
  const medidas: MedidasTablado = {
    placa_largura_m: num(placaL) || null,
    placa_profundidade_m: num(placaP) || null,
    largura_m: modo === 'metros' ? num(largura) : +(num(qtdL) * num(placaL)).toFixed(2),
    profundidade_m: modo === 'metros' ? num(profundidade) : +(num(qtdP) * num(placaP)).toFixed(2),
  }
  const valido =
    medidas.largura_m > 2 && medidas.largura_m < 100 && medidas.profundidade_m > 2 && medidas.profundidade_m < 100

  // Mostra a prévia ao vivo na cena sempre que as medidas mudam.
  const chavePrevia = valido ? JSON.stringify(medidas) : ''
  useEffect(() => {
    if (chavePrevia) aoMudar(JSON.parse(chavePrevia) as MedidasTablado)
  }, [chavePrevia, aoMudar])

  function aoEnviar(e: FormEvent) {
    e.preventDefault()
    if (!valido) return
    salvar.mutate(
      { id: tablado.id, ...medidas, config: { ...tablado.config, estimado: false } },
      { onSuccess: aoFechar },
    )
  }

  return (
    <Folha
      aberta
      aoFechar={aoFechar}
      titulo="Medidas do tablado"
      rodape={
        <>
          <Botao variante="secundario" onClick={aoFechar}>
            Cancelar
          </Botao>
          <Botao type="submit" form="form-tablado" disabled={!valido || salvar.isPending}>
            {salvar.isPending ? 'Salvando…' : 'Salvar medidas'}
          </Botao>
        </>
      }
    >
      <form id="form-tablado" onSubmit={aoEnviar} className="flex flex-col gap-4">
        <p className="text-sm text-texto-suave">A cena atrás desta janela mostra a prévia enquanto você digita.</p>
        <fieldset className="grid grid-cols-2 gap-3">
          <legend className="col-span-2 mb-1.5 text-sm font-semibold">Uma placa (metros)</legend>
          <Campo id="placa-l" rotulo="Lado maior (largura)" inputMode="decimal" value={placaL} onChange={(e) => setPlacaL(e.target.value)} />
          <Campo id="placa-p" rotulo="Lado menor (profund.)" inputMode="decimal" value={placaP} onChange={(e) => setPlacaP(e.target.value)} />
        </fieldset>

        <Segmentado<ModoMedida>
          rotulo="Informar o tamanho do tablado em"
          valor={modo}
          aoMudar={setModo}
          opcoes={[
            { valor: 'placas', texto: 'Nº de placas' },
            { valor: 'metros', texto: 'Metros' },
          ]}
        />

        {modo === 'placas' ? (
          <div className="grid grid-cols-2 gap-3">
            <Campo id="qtd-l" rotulo="Placas na largura" inputMode="decimal" value={qtdL} onChange={(e) => setQtdL(e.target.value)} />
            <Campo id="qtd-p" rotulo="Fileiras na profundidade" inputMode="decimal" value={qtdP} onChange={(e) => setQtdP(e.target.value)} />
            <p className="col-span-2 -mt-1 text-xs text-texto-suave">
              Pode usar meia placa (ex.: 6,5). Resultado: {formatar(medidas.largura_m)} × {formatar(medidas.profundidade_m)} m.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            <Campo id="largura" rotulo="Largura total (m)" inputMode="decimal" value={largura} onChange={(e) => setLargura(e.target.value)} />
            <Campo id="profundidade" rotulo="Profundidade total (m)" inputMode="decimal" value={profundidade} onChange={(e) => setProfundidade(e.target.value)} />
            <p className="col-span-2 -mt-1 text-xs text-texto-suave">
              Equivale a {formatar(medidas.largura_m / (medidas.placa_largura_m || 1))} ×{' '}
              {formatar(medidas.profundidade_m / (medidas.placa_profundidade_m || 1))} placas.
            </p>
          </div>
        )}

        {!valido && <Aviso tipo="erro">Confira os números: o tablado precisa ter entre 2 e 100 metros.</Aviso>}
        {salvar.error && <Aviso tipo="erro">{mensagemDeErro(salvar.error)}</Aviso>}
      </form>
    </Folha>
  )
}
