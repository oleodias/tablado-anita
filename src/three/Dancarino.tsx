// Um dançarino no tablado: boneco estilizado com a pilcha da dança (peão ou
// prenda), disco no chão com a cor da dupla, seta da direção e nome.
// Professores arrastam com o dedo/mouse.
//
// O boneco é montado olhando para +z (rotação 0 = de frente para os jurados).
// Atenção: olhando para +z, a ESQUERDA do boneco é o lado +x.
import { HtmlNaCena } from './HtmlNaCena'
import { useThree, type ThreeEvent } from '@react-three/fiber'
import { memo, useRef } from 'react'
import { DoubleSide, Plane, Vector3 } from 'three'
import type { Posicao } from '../domain/formacoes'
import { corDoTextoSobre } from '../domain/pares'
import type { PilchaPeao, PilchaPrenda } from '../domain/indumentarias'
import type { GeneroDanca, TipoIndumentaria } from '../types/db'
import { ALTURA_TABLADO } from './Ambiente'

export type EstadoDancarino = 'normal' | 'selecionado' | 'par' | 'apagado'

interface Props {
  id: string
  nome: string
  genero: GeneroDanca
  /** cor da dupla nesta dança (cinza se não tiver dupla) */
  cor: string
  numeroDupla: number | null
  /** Kamé = pala no ombro esquerdo, cores vivas; Kairú = poncho, cores sóbrias */
  tipo: TipoIndumentaria | null
  pilchaPeao: PilchaPeao
  pilchaPrenda: PilchaPrenda
  posicao: Posicao
  estado: EstadoDancarino
  mostrarNome: boolean
  editavel: boolean
  aoSelecionar: (id: string) => void
  aoArrastar?: (id: string, x: number, z: number) => void
  aoSoltar?: (id: string, moveu: boolean) => void
}

const PELE = '#e2b48c'

// plano do piso do tablado, usado para saber onde o dedo está ao arrastar
const PISO = new Plane(new Vector3(0, 1, 0), -ALTURA_TABLADO)

/** Material padrão das roupas; "apagado" deixa o boneco translúcido. */
function M({ c, apagado, duplo }: { c: string; apagado: boolean; duplo?: boolean }) {
  return (
    <meshStandardMaterial
      color={c}
      roughness={0.75}
      side={duplo ? DoubleSide : undefined}
      transparent={apagado}
      opacity={apagado ? 0.25 : 1}
    />
  )
}

/** Braço pendurado (manga + mão). lado: +1 = esquerda do boneco (x+), -1 = direita. */
function Braco({ lado, altura, manga, apagado, bufante }: { lado: 1 | -1; altura: number; manga: string; apagado: boolean; bufante?: boolean }) {
  return (
    <group position={[lado * 0.22, altura, 0]} rotation-z={lado * 0.14}>
      {bufante && (
        <mesh position-y={-0.02} scale={[1, 0.8, 1]}>
          <sphereGeometry args={[0.085, 12, 10]} />
          <M c={manga} apagado={apagado} />
        </mesh>
      )}
      <mesh position-y={-0.25} castShadow>
        <cylinderGeometry args={[0.055, 0.045, 0.5, 10]} />
        <M c={manga} apagado={apagado} />
      </mesh>
      <mesh position-y={-0.53}>
        <sphereGeometry args={[0.045, 10, 8]} />
        <M c={PELE} apagado={apagado} />
      </mesh>
    </group>
  )
}

function Peao({ p, tipo, apagado }: { p: PilchaPeao; tipo: TipoIndumentaria | null; apagado: boolean }) {
  const corPala = p.pala ?? p.faixa
  return (
    <group>
      {p.pernas === 'chiripa' ? (
        <>
          {/* botas de garrão: couro cru, cano curto e franzido */}
          {[-0.09, 0.09].map((x) => (
            <group key={x} position={[x, 0, 0.02]}>
              <mesh position-y={0.13} castShadow>
                <cylinderGeometry args={[0.075, 0.065, 0.26, 10]} />
                <M c={p.botas} apagado={apagado} />
              </mesh>
              <mesh position={[0, 0.04, 0.07]}>
                <boxGeometry args={[0.11, 0.08, 0.2]} />
                <M c={p.botas} apagado={apagado} />
              </mesh>
            </group>
          ))}
          {/* ceroulas: calças brancas largas, franzidas no tornozelo */}
          {[-0.09, 0.09].map((x) => (
            <mesh key={x} position={[x, 0.45, 0]} castShadow>
              <cylinderGeometry args={[0.1, 0.085, 0.42, 12]} />
              <M c={p.ceroulas ?? "#f1ede4"} apagado={apagado} />
            </mesh>
          ))}
          {/* chiripá: pano enrolado na cintura, até o joelho */}
          <mesh position-y={0.65} castShadow>
            <cylinderGeometry args={[0.19, 0.28, 0.46, 16]} />
            <M c={p.bombacha} apagado={apagado} />
          </mesh>
        </>
      ) : (
        <>
          {/* botas */}
          {[-0.08, 0.08].map((x) => (
            <mesh key={x} position={[x, 0.11, 0.02]} castShadow>
              <cylinderGeometry args={[0.055, 0.062, 0.22, 10]} />
              <M c={p.botas} apagado={apagado} />
            </mesh>
          ))}
          {/* bombacha (larga, presa na bota) */}
          <mesh position-y={0.55} castShadow>
            <cylinderGeometry args={[0.19, 0.12, 0.66, 16]} />
            <M c={p.bombacha} apagado={apagado} />
          </mesh>
        </>
      )}
      {/* faixa e guaiaca na cintura */}
      <mesh position-y={0.9}>
        <cylinderGeometry args={[0.185, 0.19, 0.12, 16]} />
        <M c={p.faixa} apagado={apagado} />
      </mesh>
      <mesh position-y={0.86}>
        <cylinderGeometry args={[0.195, 0.195, 0.06, 16]} />
        <M c={p.guaiaca} apagado={apagado} />
      </mesh>
      {/* camisa */}
      <mesh position-y={1.2} castShadow>
        <cylinderGeometry args={[0.17, 0.155, 0.56, 16]} />
        <M c={p.camisa} apagado={apagado} />
      </mesh>
      {p.coleteFechado ? (
        <>
          {/* colete fechado, com carreira de botões */}
          <mesh position-y={1.15}>
            <cylinderGeometry args={[0.185, 0.172, 0.46, 18]} />
            <M c={p.colete} apagado={apagado} />
          </mesh>
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <mesh key={i} position={[0, 0.97 + i * 0.07, 0.178 + i * 0.002]}>
              <sphereGeometry args={[0.012, 6, 6]} />
              <M c="#3a2a20" apagado={apagado} />
            </mesh>
          ))}
        </>
      ) : (
        /* colete aberto na frente, mostrando a camisa */
        <mesh position-y={1.17}>
          <cylinderGeometry args={[0.185, 0.17, 0.5, 18, 1, true, 0.42, Math.PI * 2 - 0.84]} />
          <M c={p.colete} apagado={apagado} duplo />
        </mesh>
      )}
      <Braco lado={1} altura={1.42} manga={p.camisa} apagado={apagado} />
      <Braco lado={-1} altura={1.42} manga={p.camisa} apagado={apagado} />
      {/* Kamé: pala comprido dobrado sobre o ombro esquerdo, com franja */}
      {tipo === 'kame' && (
        <group position={[0.12, 0, 0]}>
          {[0.19, -0.19].map((z) => (
            <group key={z}>
              <mesh position={[0, 0.95, z]} castShadow>
                <boxGeometry args={[0.19, 0.98, 0.03]} />
                <M c={corPala} apagado={apagado} />
              </mesh>
              <mesh position={[0, 0.43, z]}>
                <boxGeometry args={[0.19, 0.07, 0.02]} />
                <M c={p.franjaPala} apagado={apagado} />
              </mesh>
            </group>
          ))}
          <mesh position-y={1.45} rotation-x={Math.PI / 2}>
            <cylinderGeometry args={[0.19, 0.19, 0.19, 12, 1, true, -Math.PI / 2, Math.PI]} />
            <M c={corPala} apagado={apagado} duplo />
          </mesh>
        </group>
      )}
      {/* Kairú: poncho curto (até o quadril), com franja */}
      {tipo === 'kairu' && (
        <group rotation-y={Math.PI / 4}>
          <mesh position-y={1.14} castShadow>
            <cylinderGeometry args={[0.08, 0.5, 0.72, 4, 1, true]} />
            <M c={corPala} apagado={apagado} duplo />
          </mesh>
          <mesh position-y={0.76}>
            <cylinderGeometry args={[0.5, 0.52, 0.05, 4, 1, true]} />
            <M c={p.franjaPala} apagado={apagado} duplo />
          </mesh>
        </group>
      )}
      {/* pescoço e cabeça */}
      <mesh position-y={1.5}>
        <cylinderGeometry args={[0.05, 0.055, 0.08, 10]} />
        <M c={PELE} apagado={apagado} />
      </mesh>
      <mesh position-y={1.6} castShadow>
        <sphereGeometry args={[0.11, 18, 14]} />
        <M c={PELE} apagado={apagado} />
      </mesh>
      {/* lenço cobrindo a cabeça, amarrado atrás, com a ponta caindo sobre o ombro */}
      {p.lencoCabeca && (
        <>
          <mesh position={[0, 1.615, -0.01]} rotation-x={-0.25}>
            <sphereGeometry args={[0.118, 18, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
            <M c={p.lencoCabeca} apagado={apagado} />
          </mesh>
          <mesh position={[-0.05, 1.5, -0.12]} rotation-x={0.35} rotation-z={0.2}>
            <coneGeometry args={[0.05, 0.24, 6]} />
            <M c={p.lencoCabeca} apagado={apagado} />
          </mesh>
        </>
      )}
      {/* chapéu */}
      {p.chapeu === 'nenhum' ? null : p.chapeu === 'palha' ? (
        <>
          <mesh position-y={1.71}>
            <cylinderGeometry args={[0.21, 0.22, 0.025, 20]} />
            <M c={p.corChapeu} apagado={apagado} />
          </mesh>
          <mesh position-y={1.84}>
            <cylinderGeometry args={[0.065, 0.11, 0.25, 14]} />
            <M c={p.corChapeu} apagado={apagado} />
          </mesh>
        </>
      ) : (
        <>
          <mesh position-y={1.7}>
            <cylinderGeometry args={[0.26, 0.26, 0.02, 22]} />
            <M c={p.corChapeu} apagado={apagado} />
          </mesh>
          <mesh position-y={1.76}>
            <cylinderGeometry args={[0.1, 0.115, 0.11, 16]} />
            <M c={p.corChapeu} apagado={apagado} />
          </mesh>
        </>
      )}
    </group>
  )
}

function Prenda({ p, apagado }: { p: PilchaPrenda; apagado: boolean }) {
  return (
    <group>
      {/* saia de armada */}
      <mesh position-y={0.48} castShadow>
        <cylinderGeometry args={[0.16, 0.55, 0.88, 24, 1, true]} />
        <M c={p.saia} apagado={apagado} duplo />
      </mesh>
      {/* babados da saia (barra e um intermediário) */}
      <mesh position-y={0.09}>
        <cylinderGeometry args={[0.535, 0.57, 0.1, 24, 1, true]} />
        <M c={p.babado} apagado={apagado} duplo />
      </mesh>
      <mesh position-y={0.32}>
        <cylinderGeometry args={[0.43, 0.45, 0.045, 24, 1, true]} />
        <M c={p.babado} apagado={apagado} duplo />
      </mesh>
      {/* corpete */}
      <mesh position-y={1.11} castShadow>
        <cylinderGeometry args={[0.15, 0.13, 0.44, 16]} />
        <M c={p.corpete} apagado={apagado} />
      </mesh>
      {/* galões do corpete (duas linhas na frente) */}
      {[-0.045, 0.045].map((x) => (
        <mesh key={x} position={[x, 1.1, 0.143]}>
          <boxGeometry args={[0.016, 0.36, 0.01]} />
          <M c={p.detalheCorpete} apagado={apagado} />
        </mesh>
      ))}
      {/* babado na cintura */}
      <mesh position-y={0.9}>
        <cylinderGeometry args={[0.17, 0.2, 0.06, 18, 1, true]} />
        <M c={p.gola} apagado={apagado} duplo />
      </mesh>
      <Braco lado={1} altura={1.31} manga={p.mangas} apagado={apagado} bufante />
      <Braco lado={-1} altura={1.31} manga={p.mangas} apagado={apagado} bufante />
      {/* gola de babado */}
      <mesh position-y={1.34} rotation-x={Math.PI / 2}>
        <torusGeometry args={[0.085, 0.03, 8, 18]} />
        <M c={p.gola} apagado={apagado} />
      </mesh>
      {/* cabeça e cabelo */}
      <mesh position-y={1.47} castShadow>
        <sphereGeometry args={[0.105, 18, 14]} />
        <M c={PELE} apagado={apagado} />
      </mesh>
      <mesh position={[0, 1.5, -0.015]} scale={[1.05, 1, 1.05]}>
        <sphereGeometry args={[0.108, 18, 14, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <M c={p.cabelo} apagado={apagado} />
      </mesh>
      <mesh position={[0, 1.5, -0.12]}>
        <sphereGeometry args={[0.065, 12, 10]} />
        <M c={p.cabelo} apagado={apagado} />
      </mesh>
      {/* flor no cabelo */}
      <mesh position={[0.075, 1.56, -0.06]}>
        <sphereGeometry args={[0.035, 10, 8]} />
        <M c={p.flor} apagado={apagado} />
      </mesh>
    </group>
  )
}

/** Liga/desliga os controles da câmera (para ela não girar enquanto se arrasta um dançarino). */
function travarCamera(controles: unknown, travar: boolean) {
  if (controles) (controles as { enabled: boolean }).enabled = !travar
}

function DancarinoBase({
  id,
  nome,
  genero,
  cor,
  numeroDupla,
  tipo,
  pilchaPeao,
  pilchaPrenda,
  posicao,
  estado,
  mostrarNome,
  editavel,
  aoSelecionar,
  aoArrastar,
  aoSoltar,
}: Props) {
  const estadoDaCena = useThree((s) => s.get)
  const arrasto = useRef<{ dx: number; dz: number; moveu: boolean } | null>(null)
  const ponto = useRef(new Vector3())
  const apagado = estado === 'apagado'

  function aoApertar(e: ThreeEvent<PointerEvent>) {
    e.stopPropagation()
    aoSelecionar(id)
    if (!editavel || !e.ray.intersectPlane(PISO, ponto.current)) return
    arrasto.current = { dx: posicao.x - ponto.current.x, dz: posicao.z - ponto.current.z, moveu: false }
    ;(e.target as unknown as Element).setPointerCapture(e.pointerId)
    // enquanto arrasta o dançarino, a câmera fica parada
    travarCamera(estadoDaCena().controls, true)
  }

  function aoMover(e: ThreeEvent<PointerEvent>) {
    if (!arrasto.current || !e.ray.intersectPlane(PISO, ponto.current)) return
    e.stopPropagation()
    const x = ponto.current.x + arrasto.current.dx
    const z = ponto.current.z + arrasto.current.dz
    if (!arrasto.current.moveu && Math.hypot(x - posicao.x, z - posicao.z) < 0.05) return
    arrasto.current.moveu = true
    aoArrastar?.(id, x, z)
  }

  function aoLargar(e: ThreeEvent<PointerEvent>) {
    if (!arrasto.current) return
    e.stopPropagation()
    ;(e.target as unknown as Element).releasePointerCapture(e.pointerId)
    travarCamera(estadoDaCena().controls, false)
    const moveu = arrasto.current.moveu
    arrasto.current = null
    aoSoltar?.(id, moveu)
  }

  const altura = genero === 'peao' ? 1.95 : 1.62

  return (
    <group position={[posicao.x, ALTURA_TABLADO, posicao.z]} rotation-y={(-posicao.rotacao * Math.PI) / 180}>
      {/* disco no chão com a cor da dupla */}
      <mesh rotation-x={-Math.PI / 2} position-y={0.006} renderOrder={1}>
        <circleGeometry args={[0.36, 32]} />
        <meshBasicMaterial color={cor} transparent opacity={apagado ? 0.2 : 0.85} depthWrite={false} />
      </mesh>
      {/* seta: para onde a pessoa está olhando */}
      <mesh rotation-x={-Math.PI / 2} rotation-z={Math.PI / 2} position={[0, 0.008, 0.5]} renderOrder={2}>
        <circleGeometry args={[0.14, 3]} />
        <meshBasicMaterial color={cor} transparent opacity={apagado ? 0.2 : 1} depthWrite={false} />
      </mesh>
      {/* anel de destaque (selecionado = branco; dupla = cor) */}
      {(estado === 'selecionado' || estado === 'par') && (
        <mesh rotation-x={-Math.PI / 2} position-y={0.01} renderOrder={3}>
          <ringGeometry args={[0.42, estado === 'selecionado' ? 0.55 : 0.48, 40]} />
          <meshBasicMaterial color={estado === 'selecionado' ? '#ffffff' : cor} depthWrite={false} />
        </mesh>
      )}

      {genero === 'peao' ? <Peao p={pilchaPeao} tipo={tipo} apagado={apagado} /> : <Prenda p={pilchaPrenda} apagado={apagado} />}

      {/* área de toque maior que o boneco, invisível */}
      <mesh
        position-y={altura / 2}
        onPointerDown={aoApertar}
        onPointerMove={aoMover}
        onPointerUp={aoLargar}
        onPointerCancel={aoLargar}
      >
        <cylinderGeometry args={[0.5, 0.5, altura, 12]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>

      {mostrarNome && !apagado && (
        <HtmlNaCena position={[0, altura + 0.22, 0]} center zIndexRange={[20, 10]} style={{ pointerEvents: 'none' }}>
          <span
            className={`flex items-center gap-1 whitespace-nowrap rounded-full py-0.5 pl-0.5 pr-1.5 text-[10px] font-semibold shadow ${
              estado === 'selecionado' ? 'bg-white text-black' : 'bg-black/70 text-white'
            }`}
          >
            <span className="inline-block size-3.5 rounded-full text-center text-[8px] leading-[14px]" style={{ background: cor, color: corDoTextoSobre(cor) }}>
              {numeroDupla ?? ''}
            </span>
            {nome}
          </span>
        </HtmlNaCena>
      )}
    </group>
  )
}

/** memo: só redesenha o dançarino quando os dados dele mudam. */
export const Dancarino = memo(DancarinoBase)
