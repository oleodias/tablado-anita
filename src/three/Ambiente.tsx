// Tudo o que fica em volta do tablado: chão do ginásio, mesas, conjunto musical.
import { Html } from '@react-three/drei'
import type { ReactNode } from 'react'

/** Altura do piso do tablado em relação ao chão do ginásio (metros). */
export const ALTURA_TABLADO = 0.2

const AZUL_MESA = '#1f4fa8'
const BRANCO_TOALHA = '#f2f2f2'

export function ChaoGinasio() {
  return (
    <mesh rotation-x={-Math.PI / 2} position-y={-0.001} receiveShadow>
      <planeGeometry args={[120, 100]} />
      <meshStandardMaterial color="#6f747b" roughness={0.95} />
    </mesh>
  )
}

/** Mesa com toalha azul e tampo branco, como as dos avaliadores do ENART. */
function Mesa({ largura, profundidade = 0.8 }: { largura: number; profundidade?: number }) {
  return (
    <group>
      {/* saia azul */}
      <mesh position-y={0.375} castShadow>
        <boxGeometry args={[largura, 0.75, profundidade]} />
        <meshStandardMaterial color={AZUL_MESA} roughness={0.8} />
      </mesh>
      {/* tampo branco */}
      <mesh position-y={0.76}>
        <boxGeometry args={[largura + 0.06, 0.02, profundidade + 0.06]} />
        <meshStandardMaterial color={BRANCO_TOALHA} roughness={0.7} />
      </mesh>
    </group>
  )
}

/** Cadeira simplificada (assento + encosto). */
function Cadeira() {
  return (
    <group>
      <mesh position-y={0.45}>
        <boxGeometry args={[0.45, 0.05, 0.45]} />
        <meshStandardMaterial color="#2b2b2b" />
      </mesh>
      <mesh position={[0, 0.7, 0.2]}>
        <boxGeometry args={[0.45, 0.5, 0.05]} />
        <meshStandardMaterial color="#2b2b2b" />
      </mesh>
    </group>
  )
}

/** Mesa com cadeiras do lado de fora (de frente para o tablado). */
function MesaComCadeiras({ largura, cadeiras }: { largura: number; cadeiras: number }) {
  const passo = largura / cadeiras
  return (
    <group>
      <Mesa largura={largura} />
      {Array.from({ length: cadeiras }, (_, i) => (
        <group key={i} position={[-largura / 2 + passo * (i + 0.5), 0, 0.75]}>
          <Cadeira />
        </group>
      ))}
    </group>
  )
}

/** Seta pintada no piso. angulo 0 = apontando para a frente (jurados). */
function Seta({ posicao, angulo, cor }: { posicao: [number, number, number]; angulo: number; cor: string }) {
  return (
    <group position={posicao} rotation-y={angulo}>
      <mesh rotation-x={-Math.PI / 2} rotation-z={Math.PI / 2} position-z={0.25}>
        <circleGeometry args={[0.35, 3]} />
        <meshBasicMaterial color={cor} transparent opacity={0.75} depthWrite={false} />
      </mesh>
      <mesh rotation-x={-Math.PI / 2} position-z={-0.15}>
        <planeGeometry args={[0.18, 0.5]} />
        <meshBasicMaterial color={cor} transparent opacity={0.75} depthWrite={false} />
      </mesh>
    </group>
  )
}

export function Rotulo({
  children,
  posicao,
  destaque,
}: {
  children: ReactNode
  posicao: [number, number, number]
  destaque?: boolean
}) {
  return (
    <Html position={posicao} center zIndexRange={[10, 0]} style={{ pointerEvents: 'none' }}>
      <span
        className={`whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-semibold shadow ${
          destaque ? 'bg-marca text-marca-texto' : 'bg-black/65 text-white'
        }`}
      >
        {children}
      </span>
    </Html>
  )
}

/**
 * Posições conforme o ENART (informado pelo grupo):
 * - mesa principal dos jurados na FRENTE (z positivo), centralizada;
 * - 2 mesas de avaliadores em cada lateral;
 * - conjunto musical no FUNDO, canto ESQUERDO (visto da mesa dos jurados);
 * - ENTRADA pelo corredor no centro do fundo;
 * - SAÍDA pela lateral direita dos jurados, entre as duas mesas de avaliadores.
 */
export function Entorno({ largura, profundidade, rotulos }: { largura: number; profundidade: number; rotulos: boolean }) {
  const meiaL = largura / 2
  const meiaP = profundidade / 2
  const afastamento = 2.2

  return (
    <group>
      {/* Mesa principal dos jurados (frente) */}
      <group position={[0, 0, meiaP + afastamento]}>
        <MesaComCadeiras largura={Math.min(7, largura * 0.45)} cadeiras={5} />
        {rotulos && (
          <Rotulo posicao={[0, 1.6, 0]} destaque>
            Mesa dos jurados · FRENTE
          </Rotulo>
        )}
      </group>

      {/* Avaliadores: 2 de cada lado, olhando para o tablado */}
      {([-1, 1] as const).flatMap((lado) =>
        [-0.25, 0.25].map((fracao) => (
          <group
            key={`${lado}${fracao}`}
            position={[lado * (meiaL + afastamento), 0, fracao * profundidade]}
            rotation-y={lado * (Math.PI / 2)}
          >
            <MesaComCadeiras largura={2.4} cadeiras={2} />
            {rotulos && fracao < 0 && <Rotulo posicao={[0, 1.4, 0]}>Avaliadores</Rotulo>}
          </group>
        )),
      )}

      {/* Conjunto musical: fundo, canto esquerdo dos jurados (x negativo) */}
      <group position={[-meiaL + 1.8, 0, -meiaP - 2]}>
        <mesh position-y={0.1} receiveShadow>
          <boxGeometry args={[3.6, 0.2, 2.2]} />
          <meshStandardMaterial color="#3a3f47" />
        </mesh>
        {[-1.1, 0, 1.1].map((x) => (
          <group key={x} position={[x, 0.2, 0]} rotation-y={Math.PI}>
            <Cadeira />
          </group>
        ))}
        {rotulos && <Rotulo posicao={[0, 1.6, 0]}>Conjunto musical</Rotulo>}
      </group>

      {/* Caixas de som e corredor de acesso no centro do fundo */}
      {[-1.6, 1.6].map((x) => (
        <mesh key={x} position={[x, 0.6, -meiaP - 2.5]} castShadow>
          <boxGeometry args={[0.9, 1.2, 0.8]} />
          <meshStandardMaterial color="#1b1b1b" roughness={0.6} />
        </mesh>
      ))}
      {/* Entrada: corredor no centro do fundo */}
      <Seta posicao={[0, ALTURA_TABLADO + 0.01, -meiaP + 0.5]} angulo={0} cor="#3cb44b" />
      {rotulos && <Rotulo posicao={[0, 1.3, -meiaP - 2.5]}>Entrada</Rotulo>}

      {/* Saída: lateral direita dos jurados, entre as duas mesas de avaliadores */}
      <Seta posicao={[meiaL - 0.5, ALTURA_TABLADO + 0.01, 0]} angulo={Math.PI / 2} cor="#e6194b" />
      {rotulos && <Rotulo posicao={[meiaL + afastamento, 1.3, 0]}>Saída</Rotulo>}
    </group>
  )
}
