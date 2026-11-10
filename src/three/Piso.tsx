// O tablado: estrutura, placas do piso (com emendas) e acabamento branco nas bordas.
import { Instance, Instances } from '@react-three/drei'
import { useMemo } from 'react'
import { calcularPlacas, letraDaColuna, type MedidasTablado } from '../domain/tablado'
import { ALTURA_TABLADO, Rotulo } from './Ambiente'

/** Espaço entre placas (emenda), em metros. */
const EMENDA = 0.012
const ESPESSURA_PLACA = 0.02

/** Tons de madeira clara parecidos com as placas do ENART. */
const TONS = ['#d8c6a3', '#cfb994', '#e0d0b0', '#c9b28c', '#d3c09c', '#dccaa8']

/** Número pseudoaleatório estável (mesma placa = mesma cor sempre). */
function aleatorio(semente: number) {
  const x = Math.sin(semente * 12.9898) * 43758.5453
  return x - Math.floor(x)
}

export function Piso({ medidas, rotulos }: { medidas: MedidasTablado; rotulos: boolean }) {
  const { largura_m: L, profundidade_m: P } = medidas
  const placas = useMemo(() => calcularPlacas(medidas), [medidas])
  const colunas = useMemo(() => [...new Map(placas.map((p) => [p.coluna, p.x])).entries()], [placas])
  const fileiras = useMemo(() => [...new Map(placas.map((p) => [p.fileira, p.z])).entries()], [placas])
  const topo = ALTURA_TABLADO

  return (
    <group>
      {/* Estrutura escura por baixo: aparece nas emendas */}
      <mesh position-y={(topo - ESPESSURA_PLACA) / 2} receiveShadow>
        <boxGeometry args={[L, topo - ESPESSURA_PLACA, P]} />
        <meshStandardMaterial color="#5b4a36" roughness={0.9} />
      </mesh>

      {/* Placas */}
      <Instances limit={Math.max(placas.length, 1)} receiveShadow>
        <boxGeometry args={[1, ESPESSURA_PLACA, 1]} />
        <meshStandardMaterial roughness={0.55} metalness={0.02} />
        {placas.map((p, i) => (
          <Instance
            key={`${p.coluna}-${p.fileira}`}
            position={[p.x, topo - ESPESSURA_PLACA / 2, p.z]}
            scale={[Math.max(p.largura - EMENDA, 0.01), 1, Math.max(p.profundidade - EMENDA, 0.01)]}
            color={TONS[Math.floor(aleatorio(i + 1) * TONS.length)]}
          />
        ))}
      </Instances>

      {/* Acabamento branco nas bordas (como no ENART) */}
      {[
        { pos: [0, topo / 2, P / 2 + 0.03], tam: [L + 0.12, topo + 0.01, 0.06] },
        { pos: [0, topo / 2, -P / 2 - 0.03], tam: [L + 0.12, topo + 0.01, 0.06] },
        { pos: [L / 2 + 0.03, topo / 2, 0], tam: [0.06, topo + 0.01, P] },
        { pos: [-L / 2 - 0.03, topo / 2, 0], tam: [0.06, topo + 0.01, P] },
      ].map(({ pos, tam }, i) => (
        <mesh key={i} position={pos as [number, number, number]}>
          <boxGeometry args={tam as [number, number, number]} />
          <meshStandardMaterial color="#f4f4f4" roughness={0.5} />
        </mesh>
      ))}

      {/* Nomes das colunas (frente) e fileiras (lateral esquerda dos jurados) */}
      {rotulos && (
        <>
          {colunas.map(([c, x]) => (
            <Rotulo key={`c${c}`} posicao={[x, topo + 0.05, P / 2 + 0.75]}>
              {letraDaColuna(c)}
            </Rotulo>
          ))}
          {fileiras.map(([f, z]) => (
            <Rotulo key={`f${f}`} posicao={[-L / 2 - 1.1, topo + 0.05, z]}>
              {f + 1}
            </Rotulo>
          ))}
        </>
      )}
    </group>
  )
}

/** Pessoa de referência (1,75 m) para conferir a escala com os vídeos. */
export function PessoaReferencia({ x = 0, z = 0 }: { x?: number; z?: number }) {
  return (
    <group position={[x, ALTURA_TABLADO, z]}>
      <mesh position-y={0.85} castShadow>
        <capsuleGeometry args={[0.2, 1.1, 6, 12]} />
        <meshStandardMaterial color="#2f6fd1" />
      </mesh>
      <mesh position-y={1.6} castShadow>
        <sphereGeometry args={[0.13, 16, 16]} />
        <meshStandardMaterial color="#e2b48c" />
      </mesh>
      <Rotulo posicao={[0, 2.0, 0]}>1,75 m</Rotulo>
    </group>
  )
}
