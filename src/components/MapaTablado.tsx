// Mapa do tablado visto de cima (SVG), com a mesa dos jurados embaixo.
// É por aqui que os professores marcam as posições:
//   1. toque na bolinha do dançarino;
//   2. toque na placa onde ele deve ficar (ou arraste a bolinha).
//
// As medidas do desenho são em METROS (o SVG faz a escala sozinho):
// x do desenho = x do tablado; y do desenho = z do tablado (frente para baixo).
import { useRef, useState, type PointerEvent as EventoPonteiro } from 'react'
import { direcaoDaRotacao, type Posicao } from '../domain/formacoes'
import { corDoTextoSobre } from '../domain/pares'
import { calcularPlacas, letraDaColuna, type MedidasTablado } from '../domain/tablado'
import type { GeneroDanca } from '../types/db'

export interface MarcadorMapa {
  id: string
  nome: string
  genero: GeneroDanca
  cor: string
  numero: number | null
  posicao: Posicao
}

interface Props {
  medidas: MedidasTablado
  marcadores: MarcadorMapa[]
  selecionado: string | null
  /** id do par do selecionado (ganha um contorno) */
  parceiro: string | null
  editavel: boolean
  aoSelecionar: (id: string | null) => void
  /** chamado quando o professor escolhe um novo lugar (já em metros) */
  aoMover: (id: string, x: number, z: number) => void
  /** ajusta o ponto tocado (limites do tablado e encaixe na grade) */
  ajustar: (x: number, z: number) => { x: number; z: number }
}

const MARGEM = 1.5 // espaço em volta do tablado para os rótulos (m)
const RAIO = 0.4

export function MapaTablado({ medidas, marcadores, selecionado, parceiro, editavel, aoSelecionar, aoMover, ajustar }: Props) {
  const svg = useRef<SVGSVGElement>(null)
  const [arrasto, setArrasto] = useState<{ id: string; x: number; z: number; moveu: boolean } | null>(null)
  const L = medidas.largura_m
  const P = medidas.profundidade_m
  const placas = calcularPlacas(medidas)
  const colunas = [...new Map(placas.map((p) => [p.coluna, p.x])).entries()]
  const fileiras = [...new Map(placas.map((p) => [p.fileira, p.z])).entries()]

  /** Converte a posição do dedo/mouse na tela para metros no tablado. */
  function pontoEmMetros(e: { clientX: number; clientY: number }) {
    const matriz = svg.current?.getScreenCTM()
    if (!matriz) return null
    const p = new DOMPoint(e.clientX, e.clientY).matrixTransform(matriz.inverse())
    return ajustar(p.x, p.y)
  }

  function aoApertarMarcador(e: EventoPonteiro<SVGGElement>, m: MarcadorMapa) {
    e.stopPropagation()
    aoSelecionar(m.id)
    if (!editavel) return
    e.currentTarget.setPointerCapture(e.pointerId)
    setArrasto({ id: m.id, x: m.posicao.x, z: m.posicao.z, moveu: false })
  }

  function aoMoverPonteiro(e: EventoPonteiro<SVGGElement>) {
    if (!arrasto) return
    const p = pontoEmMetros(e)
    if (!p || (p.x === arrasto.x && p.z === arrasto.z)) return
    setArrasto({ ...arrasto, ...p, moveu: true })
  }

  function aoSoltarMarcador() {
    if (arrasto?.moveu) aoMover(arrasto.id, arrasto.x, arrasto.z)
    setArrasto(null)
  }

  /** Toque numa placa: leva o dançarino selecionado para lá. */
  function aoTocarNoTablado(e: { clientX: number; clientY: number }) {
    if (!editavel || !selecionado) return
    const p = pontoEmMetros(e)
    if (p) aoMover(selecionado, p.x, p.z)
  }

  return (
    <svg
      ref={svg}
      viewBox={`${-L / 2 - MARGEM} ${-P / 2 - MARGEM} ${L + MARGEM * 2} ${P + MARGEM * 2}`}
      className="block w-full select-none rounded-2xl border border-borda bg-superficie-2"
      role="img"
      aria-label="Mapa do tablado visto de cima, com a mesa dos jurados embaixo"
      onClick={() => aoSelecionar(null)}
    >
      {/* placas */}
      <g
        onClick={(e) => {
          e.stopPropagation()
          aoTocarNoTablado(e)
        }}
        className={editavel && selecionado ? 'cursor-crosshair' : undefined}
      >
        {placas.map((p) => (
          <rect
            key={`${p.coluna}-${p.fileira}`}
            x={p.x - p.largura / 2}
            y={p.z - p.profundidade / 2}
            width={p.largura}
            height={p.profundidade}
            fill={(p.coluna + p.fileira) % 2 ? '#d9c9a8' : '#e3d5b8'}
            stroke="#8f7f63"
            strokeWidth={0.03}
          />
        ))}
      </g>

      {/* nomes das colunas (frente) e das fileiras (esquerda) */}
      <g fontSize={0.42} fill="var(--texto-suave)" textAnchor="middle" dominantBaseline="central" pointerEvents="none">
        {colunas.map(([c, x]) => (
          <text key={c} x={x} y={P / 2 + 0.45}>
            {letraDaColuna(c)}
          </text>
        ))}
        {fileiras.map(([f, z]) => (
          <text key={f} x={-L / 2 - 0.5} y={z}>
            {f + 1}
          </text>
        ))}
        <text x={0} y={P / 2 + 1.1} fontWeight={700} fill="var(--texto)">
          JURADOS
        </text>
        <text x={0} y={-P / 2 - 0.7} fontSize={0.36}>
          fundo · entrada
        </text>
        <text x={L / 2 + 0.7} y={0} fontSize={0.36} transform={`rotate(90 ${L / 2 + 0.7} 0)`}>
          saída
        </text>
      </g>

      {/* dançarinos */}
      {marcadores.map((m) => {
        const emArrasto = arrasto?.id === m.id
        const x = emArrasto ? arrasto.x : m.posicao.x
        const z = emArrasto ? arrasto.z : m.posicao.z
        const d = direcaoDaRotacao(m.posicao.rotacao)
        const sel = m.id === selecionado
        const peao = m.genero === 'peao'
        return (
          <g
            key={m.id}
            transform={`translate(${x} ${z})`}
            onPointerDown={(e) => aoApertarMarcador(e, m)}
            onPointerMove={aoMoverPonteiro}
            onPointerUp={aoSoltarMarcador}
            onPointerCancel={aoSoltarMarcador}
            onClick={(e) => e.stopPropagation()}
            style={{ touchAction: 'none', cursor: editavel ? 'grab' : 'pointer' }}
          >
            <title>{m.nome}</title>
            {/* seta: para onde a pessoa olha */}
            <polygon
              points={`${d.x * (RAIO + 0.3)},${d.z * (RAIO + 0.3)} ${d.x * RAIO - d.z * 0.2},${d.z * RAIO + d.x * 0.2} ${d.x * RAIO + d.z * 0.2},${d.z * RAIO - d.x * 0.2}`}
              fill={m.cor}
              stroke="#00000055"
              strokeWidth={0.02}
            />
            {(sel || m.id === parceiro) && (
              <circle r={RAIO + 0.16} fill="none" stroke={sel ? 'var(--texto)' : m.cor} strokeWidth={sel ? 0.1 : 0.07} />
            )}
            {/* peão = bolinha cheia; prenda = bolinha branca com contorno na cor do par */}
            <circle r={RAIO} fill={peao ? m.cor : '#ffffff'} stroke={peao ? '#00000066' : m.cor} strokeWidth={peao ? 0.03 : 0.13} />
            <text
              fontSize={0.45}
              fontWeight={700}
              textAnchor="middle"
              dominantBaseline="central"
              fill={peao ? corDoTextoSobre(m.cor) : '#111111'}
              pointerEvents="none"
            >
              {m.numero ?? '·'}
            </text>
{/* nome: só do selecionado e do par, para não embolar */}
            {(sel || m.id === parceiro) && (
                          <text
                y={RAIO + 0.36}
                fontSize={0.38}
                textAnchor="middle"
                fill="#1b1b1b"
                stroke="#ffffffcc"
                strokeWidth={0.07}
                paintOrder="stroke"
                pointerEvents="none"
              >
                {m.nome}
              </text>
            )}
          </g>
        )
      })}
    </svg>
  )
}
