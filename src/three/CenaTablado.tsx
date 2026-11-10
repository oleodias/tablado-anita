// Cena 3D do tablado: luzes, câmera com vistas pré-definidas e o conteúdo.
import { CameraControls } from '@react-three/drei'
import { Canvas } from '@react-three/fiber'
import { useEffect, useRef, type ReactNode } from 'react'
import { Box3, MathUtils, Sphere, Vector3 } from 'three'
import type { MedidasTablado } from '../domain/tablado'
import { ALTURA_TABLADO, ChaoGinasio, Entorno } from './Ambiente'
import { Ginasio } from './Ginasio'
import { CamadaDeRotulos } from './camadaDeRotulos'
import { HtmlNaCena } from './HtmlNaCena'
import { PessoaReferencia, Piso } from './Piso'
import type { VistaCamera } from './vistas'


interface Props {
  medidas: MedidasTablado
  vista: VistaCamera
  /** muda a cada toque no botão de vista, para reaplicar a mesma vista */
  versaoVista: number
  rotulos: boolean
  referencia: boolean
  /** mostra o ginásio (arquibancadas, público, teto) em volta do tablado */
  ginasio?: boolean
  /** tocar no vazio (fora de um dançarino) */
  aoTocarFora?: () => void
  children?: ReactNode
}

/** Leva a câmera até a vista escolhida, enquadrando o tablado inteiro. */
async function aplicarVista(cc: CameraControls, vista: VistaCamera, m: MedidasTablado, animar: boolean) {
  const L = m.largura_m
  const P = m.profundidade_m
  // Margens em metros; embaixo sobra mais espaço por causa da barra de botões de vista.
  // a caixa inclui a mesa dos jurados, na frente
  const caixa = new Box3(new Vector3(-L / 2 - 1.4, 0, -P / 2 - 1), new Vector3(L / 2 + 1, ALTURA_TABLADO, P / 2 + 3.3))
  const margem = { paddingTop: 0.6, paddingBottom: 3.4, paddingLeft: 0.4, paddingRight: 0.4 }
  // fitToBox "endireita" a câmera para o lado mais próximo da caixa; para vistas
  // inclinadas usamos uma esfera, que mantém o ângulo escolhido.
  // Tela em pé (celular) precisa de mais folga nas laterais.
  const aspecto = (cc.camera as { aspect?: number }).aspect ?? 1
  const esfera = new Sphere(new Vector3(0, 0, P * 0.05), (Math.hypot(L, P) / 2) * (aspecto < 1 ? 1.02 : 0.82))

  switch (vista) {
    case 'superior':
      // azimute 0 = mesa dos jurados embaixo na tela
      await cc.rotateTo(0, 0, animar)
      await cc.fitToBox(caixa, animar, margem)
      break
    case 'geral':
      // parecido com a câmera alta da transmissão, atrás dos jurados
      await cc.rotateTo(0, MathUtils.degToRad(55), animar)
      await cc.fitToSphere(esfera, animar)
      break
    case 'lateral':
      await cc.rotateTo(MathUtils.degToRad(90), MathUtils.degToRad(60), animar)
      await cc.fitToSphere(esfera, animar)
      break
    case 'jurados':
      // olhos de um jurado sentado na mesa principal
      await cc.setLookAt(0, 1.5, P / 2 + 2.9, 0, ALTURA_TABLADO, -P * 0.1, animar)
      break
  }
}

function Controles({ medidas, vista, versaoVista }: Pick<Props, 'medidas' | 'vista' | 'versaoVista'>) {
  const ref = useRef<CameraControls>(null)
  const primeira = useRef(true)

  useEffect(() => {
    if (!ref.current) return
    aplicarVista(ref.current, vista, medidas, !primeira.current)
    primeira.current = false
  }, [vista, versaoVista, medidas])

  return (
    <CameraControls
      ref={ref}
      makeDefault
      minDistance={1.5}
      maxDistance={70}
      // não deixa a câmera passar para baixo do chão
      maxPolarAngle={MathUtils.degToRad(86)}
      smoothTime={0.35}
    />
  )
}

export function CenaTablado({ medidas, vista, versaoVista, rotulos, referencia, ginasio = true, aoTocarFora, children }: Props) {
  const camada = useRef<HTMLDivElement>(null)
  return (
    <div className="relative h-full w-full">
    <CamadaDeRotulos.Provider value={camada}>
    <Canvas
      // "demand": só redesenha quando algo muda — economiza bateria no celular
      frameloop="demand"
      onPointerMissed={aoTocarFora}
      dpr={[1, 2]}
      shadows
      camera={{ fov: 42, near: 0.1, far: 300, position: [0, 18, 22] }}
      gl={{ antialias: true, preserveDrawingBuffer: true }}
      aria-label="Tablado em 3D. Arraste para girar, use dois dedos para aproximar."
    >
      <color attach="background" args={['#16191f']} />
      <fog attach="fog" args={['#16191f', 50, 120]} />
      <hemisphereLight args={['#ffffff', '#3a3a3a', 1.1]} />
      <directionalLight
        position={[8, 18, 10]}
        intensity={1.6}
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-camera-left={-15}
        shadow-camera-right={15}
        shadow-camera-top={15}
        shadow-camera-bottom={-15}
      />

      {/*
        Contorno de um defeito do <Html> do drei (v10 + React 19): o PRIMEIRO
        rótulo montado na cena nunca aparece. Este rótulo vazio e invisível é
        montado antes de todos e "absorve" o problema. Não remover.
      */}
      <HtmlNaCena position={[0, -50, 0]} style={{ display: 'none' }} aria-hidden>
        <span />
      </HtmlNaCena>

      <ChaoGinasio />
      <Piso medidas={medidas} rotulos={rotulos} />
      <Entorno largura={medidas.largura_m} profundidade={medidas.profundidade_m} rotulos={rotulos} />
      {referencia && <PessoaReferencia />}
      {ginasio && <Ginasio />}
      {children}

      <Controles medidas={medidas} vista={vista} versaoVista={versaoVista} />
    </Canvas>
    </CamadaDeRotulos.Provider>
    {/* camada dos rótulos: por cima do canvas, sem bloquear os toques */}
    <div ref={camada} className="pointer-events-none absolute inset-0 overflow-hidden" />
    </div>
  )
}
