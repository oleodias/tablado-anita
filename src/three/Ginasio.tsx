// Ginásio em volta do tablado, inspirado no pavilhão do ENART (Parque da
// Oktoberfest, Santa Cruz do Sul): arquibancadas com público, grades, treliças
// de aço no teto, faixas de tecido azul e branco, cordões de luz, painéis e
// bandeiras. Peças repetidas usam "instâncias" (uma única chamada de desenho
// para centenas de objetos), o que mantém o celular rápido.
import { useLayoutEffect, useMemo, useRef } from 'react'
import { CanvasTexture, Color, DoubleSide, InstancedMesh, Object3D, SRGBColorSpace } from 'three'

// Medidas do ginásio (metros, a partir do centro do tablado)
const MEIA_LARGURA = 24 // até o início das arquibancadas laterais
const MEIA_PROFUNDIDADE = 19 // até o início das arquibancadas da frente e do fundo
const DEGRAUS = 11
const PROFUNDIDADE_DEGRAU = 0.85
const ALTURA_DEGRAU = 0.45
const ALTURA_TETO = 17

/** Número pseudoaleatório estável, para o público não "mudar" a cada abertura. */
function aleatorio(semente: number) {
  const x = Math.sin(semente * 9301.17 + 49297.3) * 233280.7
  return x - Math.floor(x)
}

/** Os 4 lados das arquibancadas: posição inicial, direção "para trás" e comprimento. */
const LADOS = [
  { nome: 'fundo', cx: 0, cz: -MEIA_PROFUNDIDADE, dx: 0, dz: -1, comprimento: MEIA_LARGURA * 2 },
  { nome: 'frente', cx: 0, cz: MEIA_PROFUNDIDADE, dx: 0, dz: 1, comprimento: MEIA_LARGURA * 2 },
  { nome: 'esquerda', cx: -MEIA_LARGURA, cz: 0, dx: -1, dz: 0, comprimento: MEIA_PROFUNDIDADE * 2 },
  { nome: 'direita', cx: MEIA_LARGURA, cz: 0, dx: 1, dz: 0, comprimento: MEIA_PROFUNDIDADE * 2 },
] as const

function Arquibancadas() {
  return (
    <group>
      {LADOS.map((lado) => {
        const rotY = Math.atan2(lado.dx, lado.dz) // gira para que "para trás" seja +z local
        return (
          <group key={lado.nome} position={[lado.cx, 0, lado.cz]} rotation-y={rotY}>
            {Array.from({ length: DEGRAUS }, (_, i) => {
              const altura = (i + 1) * ALTURA_DEGRAU
              return (
                <mesh key={i} position={[0, altura / 2, (i + 0.5) * PROFUNDIDADE_DEGRAU]} receiveShadow>
                  <boxGeometry args={[lado.comprimento + i * 2 * PROFUNDIDADE_DEGRAU, altura, PROFUNDIDADE_DEGRAU]} />
                  <meshStandardMaterial color={i % 2 ? '#8f949b' : '#9aa0a7'} roughness={0.95} />
                </mesh>
              )
            })}
            {/* grade na frente da arquibancada */}
            <mesh position={[0, 0.55, -0.15]}>
              <boxGeometry args={[lado.comprimento, 0.05, 0.05]} />
              <meshStandardMaterial color="#c7ccd2" metalness={0.6} roughness={0.4} />
            </mesh>
            <mesh position={[0, 0.3, -0.15]}>
              <boxGeometry args={[lado.comprimento, 0.6, 0.01]} />
              <meshStandardMaterial color="#c7ccd2" transparent opacity={0.25} side={DoubleSide} />
            </mesh>
            {/* parede ao fundo, atrás da última fileira */}
            <mesh position={[0, 5, DEGRAUS * PROFUNDIDADE_DEGRAU + 0.2]}>
              <boxGeometry args={[lado.comprimento + DEGRAUS * 2 * PROFUNDIDADE_DEGRAU + 2, 10, 0.4]} />
              <meshStandardMaterial color="#2e3238" roughness={1} />
            </mesh>
          </group>
        )
      })}
    </group>
  )
}

const CORES_PUBLICO = ['#f2f2f2', '#1d1d1d', '#2f4f8f', '#b3261e', '#6b6b6b', '#3d6b47', '#c9a227', '#7a4a8a', '#e6e1d6', '#203050']

/** Público sentado nas arquibancadas (dois InstancedMesh: corpos e cabeças). */
function Publico() {
  const corpos = useRef<InstancedMesh>(null)
  const cabecas = useRef<InstancedMesh>(null)

  const pessoas = useMemo(() => {
    const lista: { x: number; y: number; z: number; rot: number; cor: string; pele: string }[] = []
    let semente = 1
    for (const lado of LADOS) {
      const rotY = Math.atan2(lado.dx, lado.dz)
      for (let fileira = 0; fileira < DEGRAUS; fileira++) {
        const comprimento = lado.comprimento + fileira * 2 * PROFUNDIDADE_DEGRAU - 1
        const lugares = Math.floor(comprimento / 0.6)
        for (let l = 0; l < lugares; l++) {
          semente++
          if (aleatorio(semente) > 0.62) continue // lugares vazios
          const local = -comprimento / 2 + (l + 0.5) * (comprimento / lugares)
          const profundidade = (fileira + 0.55) * PROFUNDIDADE_DEGRAU
          // converte de "coordenadas do lado" para o mundo
          const x = lado.cx + Math.cos(rotY) * local + Math.sin(rotY) * profundidade
          const z = lado.cz - Math.sin(rotY) * local + Math.cos(rotY) * profundidade
          lista.push({
            x,
            y: (fileira + 1) * ALTURA_DEGRAU,
            z,
            rot: rotY + Math.PI, // de frente para o tablado
            cor: CORES_PUBLICO[Math.floor(aleatorio(semente * 3) * CORES_PUBLICO.length)],
            pele: ['#e2b48c', '#c68e63', '#8d5a3b', '#f0c9a5'][Math.floor(aleatorio(semente * 7) * 4)],
          })
        }
      }
    }
    return lista
  }, [])

  useLayoutEffect(() => {
    const o = new Object3D()
    const c = new Color()
    pessoas.forEach((p, i) => {
      o.position.set(p.x, p.y + 0.42, p.z)
      o.rotation.set(0, p.rot, 0)
      o.updateMatrix()
      corpos.current?.setMatrixAt(i, o.matrix)
      corpos.current?.setColorAt(i, c.set(p.cor))
      o.position.set(p.x, p.y + 0.82, p.z)
      o.updateMatrix()
      cabecas.current?.setMatrixAt(i, o.matrix)
      cabecas.current?.setColorAt(i, c.set(p.pele))
    })
    for (const m of [corpos.current, cabecas.current]) {
      if (!m) continue
      m.instanceMatrix.needsUpdate = true
      if (m.instanceColor) m.instanceColor.needsUpdate = true
    }
  }, [pessoas])

  return (
    <group>
      <instancedMesh ref={corpos} args={[undefined, undefined, pessoas.length]}>
        <boxGeometry args={[0.42, 0.55, 0.3]} />
        <meshStandardMaterial roughness={0.9} />
      </instancedMesh>
      <instancedMesh ref={cabecas} args={[undefined, undefined, pessoas.length]}>
        <sphereGeometry args={[0.12, 8, 6]} />
        <meshStandardMaterial roughness={0.8} />
      </instancedMesh>
    </group>
  )
}

/** Treliças de aço do teto + cordões de luz (instâncias). */
function Teto() {
  const barras = useRef<InstancedMesh>(null)
  const luzes = useRef<InstancedMesh>(null)

  const { listaBarras, listaLuzes } = useMemo(() => {
    const b: { pos: [number, number, number]; tam: [number, number, number] }[] = []
    const l: [number, number, number][] = []
    const comprimentoX = (MEIA_LARGURA + DEGRAUS * PROFUNDIDADE_DEGRAU) * 2
    // treliças atravessando o ginásio (de uma lateral à outra), a cada 6 m
    for (let z = -24; z <= 24; z += 6) {
      b.push({ pos: [0, ALTURA_TETO, z], tam: [comprimentoX, 0.12, 0.12] }) // banzo de cima
      b.push({ pos: [0, ALTURA_TETO - 1.6, z], tam: [comprimentoX, 0.12, 0.12] }) // banzo de baixo
      for (let x = -comprimentoX / 2; x <= comprimentoX / 2; x += 1.6) {
        b.push({ pos: [x, ALTURA_TETO - 0.8, z], tam: [0.06, 1.6, 0.06] }) // montantes
      }
      // cordão de luzes pendurado sob a treliça
      for (let x = -comprimentoX / 2 + 1; x <= comprimentoX / 2 - 1; x += 1.4) {
        const caida = Math.cos((x / comprimentoX) * Math.PI) * 1.2
        l.push([x, ALTURA_TETO - 2 - caida, z])
      }
    }
    // vigas longitudinais
    for (const x of [-18, -6, 6, 18]) b.push({ pos: [x, ALTURA_TETO + 0.1, 0], tam: [0.14, 0.14, 50] })
    return { listaBarras: b, listaLuzes: l }
  }, [])

  useLayoutEffect(() => {
    const o = new Object3D()
    listaBarras.forEach((barra, i) => {
      o.position.set(...barra.pos)
      o.scale.set(...barra.tam)
      o.updateMatrix()
      barras.current?.setMatrixAt(i, o.matrix)
    })
    o.scale.set(1, 1, 1)
    listaLuzes.forEach((p, i) => {
      o.position.set(...p)
      o.updateMatrix()
      luzes.current?.setMatrixAt(i, o.matrix)
    })
    if (barras.current) barras.current.instanceMatrix.needsUpdate = true
    if (luzes.current) luzes.current.instanceMatrix.needsUpdate = true
  }, [listaBarras, listaLuzes])

  return (
    <group>
      <instancedMesh ref={barras} args={[undefined, undefined, listaBarras.length]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="#5d636b" metalness={0.7} roughness={0.45} />
      </instancedMesh>
      <instancedMesh ref={luzes} args={[undefined, undefined, listaLuzes.length]}>
        <sphereGeometry args={[0.12, 8, 6]} />
        <meshBasicMaterial color="#fff6d8" toneMapped={false} />
      </instancedMesh>
    </group>
  )
}

/** Faixas de tecido azul e branco penduradas no teto, formando "ondas". */
function Tecidos() {
  const faixas = useMemo(() => Array.from({ length: 8 }, (_, i) => ({ z: -21 + i * 6, azul: i % 2 === 0 })), [])
  return (
    <group>
      {faixas.map(({ z, azul }) => (
        // um arco de cilindro bem largo, virado para baixo, parece tecido caído
        <mesh key={z} position={[0, ALTURA_TETO + 26.5, z]} rotation-z={Math.PI / 2}>
          <cylinderGeometry args={[30, 30, 3.2, 40, 1, true, Math.PI / 2 - 0.85, 1.7]} />
          <meshStandardMaterial color={azul ? '#2c5fb3' : '#e8eef7'} side={DoubleSide} roughness={0.9} />
        </mesh>
      ))}
    </group>
  )
}

/** Cria uma textura desenhada em canvas (para painéis e bandeiras). */
function useTextura(desenhar: (ctx: CanvasRenderingContext2D, w: number, h: number) => void, w = 512, h = 128) {
  return useMemo(() => {
    const canvas = document.createElement('canvas')
    canvas.width = w
    canvas.height = h
    const ctx = canvas.getContext('2d')!
    desenhar(ctx, w, h)
    const t = new CanvasTexture(canvas)
    t.colorSpace = SRGBColorSpace
    return t
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [w, h])
}

function PaineisEBandeiras() {
  const painel = useTextura((ctx, w, h) => {
    ctx.fillStyle = '#1f5fbf'
    ctx.fillRect(0, 0, w, h)
    ctx.fillStyle = '#ffffff'
    ctx.font = 'bold 64px system-ui, sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('ENART · MTG', w / 2, h / 2)
  })
  const bandeiraRS = useTextura(
    (ctx, w, h) => {
      // faixas diagonais verde, vermelha e amarela
      ctx.fillStyle = '#009b3a'
      ctx.fillRect(0, 0, w, h)
      ctx.fillStyle = '#ffdf00'
      ctx.beginPath()
      ctx.moveTo(w * 0.15, h)
      ctx.lineTo(w, 0)
      ctx.lineTo(w, h)
      ctx.fill()
      ctx.strokeStyle = '#d9241c'
      ctx.lineWidth = h * 0.28
      ctx.beginPath()
      ctx.moveTo(0, h * 1.1)
      ctx.lineTo(w, -h * 0.1)
      ctx.stroke()
      ctx.fillStyle = '#ffffff'
      ctx.beginPath()
      ctx.arc(w / 2, h / 2, h * 0.16, 0, Math.PI * 2)
      ctx.fill()
    },
    300,
    200,
  )
  const bandeiraBR = useTextura(
    (ctx, w, h) => {
      ctx.fillStyle = '#009c3b'
      ctx.fillRect(0, 0, w, h)
      ctx.fillStyle = '#ffdf00'
      ctx.beginPath()
      ctx.moveTo(w / 2, h * 0.1)
      ctx.lineTo(w * 0.92, h / 2)
      ctx.lineTo(w / 2, h * 0.9)
      ctx.lineTo(w * 0.08, h / 2)
      ctx.fill()
      ctx.fillStyle = '#002776'
      ctx.beginPath()
      ctx.arc(w / 2, h / 2, h * 0.22, 0, Math.PI * 2)
      ctx.fill()
    },
    300,
    200,
  )

  return (
    <group>
      {/* painéis de LED azuis na frente das arquibancadas laterais e do fundo */}
      {[
        { pos: [-MEIA_LARGURA + 0.05, 1.3, -8] as const, rot: Math.PI / 2 },
        { pos: [-MEIA_LARGURA + 0.05, 1.3, 8] as const, rot: Math.PI / 2 },
        { pos: [MEIA_LARGURA - 0.05, 1.3, -8] as const, rot: -Math.PI / 2 },
        { pos: [MEIA_LARGURA - 0.05, 1.3, 8] as const, rot: -Math.PI / 2 },
        { pos: [-12, 1.3, -MEIA_PROFUNDIDADE + 0.05] as const, rot: 0 },
        { pos: [12, 1.3, -MEIA_PROFUNDIDADE + 0.05] as const, rot: 0 },
      ].map(({ pos, rot }, i) => (
        <mesh key={i} position={[pos[0], pos[1], pos[2]]} rotation-y={rot}>
          <planeGeometry args={[6, 1.5]} />
          <meshBasicMaterial map={painel} toneMapped={false} />
        </mesh>
      ))}
      {/* bandeiras penduradas no fundo, no alto */}
      <mesh position={[-2.2, 12, -MEIA_PROFUNDIDADE - 6]}>
        <planeGeometry args={[3.6, 2.4]} />
        <meshBasicMaterial map={bandeiraRS} side={DoubleSide} toneMapped={false} />
      </mesh>
      <mesh position={[2.2, 12, -MEIA_PROFUNDIDADE - 6]}>
        <planeGeometry args={[3.6, 2.4]} />
        <meshBasicMaterial map={bandeiraBR} side={DoubleSide} toneMapped={false} />
      </mesh>
    </group>
  )
}

export function Ginasio() {
  return (
    <group>
      <Arquibancadas />
      <Publico />
      <Teto />
      <Tecidos />
      <PaineisEBandeiras />
    </group>
  )
}
