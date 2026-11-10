// Posições dos dançarinos no tablado: direção, modelos automáticos, encaixe e animação.
// Coordenadas e rotação seguem a convenção de src/domain/tablado.ts:
//   z positivo = frente (jurados); x positivo = direita dos jurados;
//   rotação 0° = de frente para os jurados, aumentando no sentido horário visto de cima.

import type { GeneroDanca } from '../types/db'

export interface Posicao {
  x: number
  z: number
  rotacao: number
}

export interface PessoaParaPosicionar {
  id: string
  genero: GeneroDanca
}

export interface ParParaPosicionar {
  peaoId: string
  prendaId: string
}

// -----------------------------------------------------------------------------
// Direção
// -----------------------------------------------------------------------------

/** Vetor (x, z) para onde a pessoa está olhando. */
export function direcaoDaRotacao(rotacao: number): { x: number; z: number } {
  const r = (rotacao * Math.PI) / 180
  return { x: -Math.sin(r), z: Math.cos(r) }
}

/** Rotação (0–359°) para olhar na direção (dx, dz). */
export function rotacaoParaDirecao(dx: number, dz: number): number {
  if (dx === 0 && dz === 0) return 0
  return normalizarAngulo((Math.atan2(-dx, dz) * 180) / Math.PI)
}

/** Rotação para olhar de (de) para (para). */
export function rotacaoOlhandoPara(de: { x: number; z: number }, para: { x: number; z: number }): number {
  return rotacaoParaDirecao(para.x - de.x, para.z - de.z)
}

export function normalizarAngulo(graus: number): number {
  const r = Math.round(((graus % 360) + 360) % 360)
  return r === 360 ? 0 : r
}

/** Descrição em português da direção (para o "meu roteiro"). */
export function descreverDirecao(rotacao: number): string {
  const r = normalizarAngulo(rotacao)
  const nomes = [
    'de frente para os jurados',
    'olhando para a frente-esquerda',
    'olhando para a esquerda',
    'olhando para o fundo-esquerda',
    'de costas para os jurados',
    'olhando para o fundo-direita',
    'olhando para a direita',
    'olhando para a frente-direita',
  ]
  // esquerda/direita do ponto de vista dos jurados
  return nomes[Math.round(r / 45) % 8]
}

// -----------------------------------------------------------------------------
// Encaixe na grade
// -----------------------------------------------------------------------------

/** Arredonda para o múltiplo de "passo" mais próximo. */
export function encaixar(valor: number, passo: number): number {
  if (!(passo > 0)) return valor
  return Math.round(valor / passo) * passo
}

/** Mantém o ponto dentro da área permitida (tablado + margem para entradas). */
export function limitar(valor: number, metade: number, margem = 3): number {
  return Math.max(-metade - margem, Math.min(metade + margem, valor))
}

// -----------------------------------------------------------------------------
// Modelos automáticos de formação
// -----------------------------------------------------------------------------

export type ModeloFormacao = 'pares' | 'roda' | 'filas'

export const NOMES_MODELOS: Record<ModeloFormacao, string> = {
  pares: 'Pares espalhados',
  roda: 'Roda',
  filas: 'Duas filas',
}

const ESPACO_PAR = 0.7 // distância entre peão e prenda do mesmo par (m)

/**
 * Gera posições para os pares e para quem está sem par, num tablado de
 * largura × profundidade. Devolve um mapa id → posição.
 */
export function gerarFormacao(
  modelo: ModeloFormacao,
  pares: ParParaPosicionar[],
  avulsos: PessoaParaPosicionar[],
  largura: number,
  profundidade: number,
): Map<string, Posicao> {
  const resultado = new Map<string, Posicao>()
  const arred = (n: number) => Math.round(n * 1000) / 1000

  if (modelo === 'roda') {
    // Todos numa roda, peão e prenda lado a lado, olhando para o centro.
    const pessoas: string[] = [...pares.flatMap((p) => [p.peaoId, p.prendaId]), ...avulsos.map((a) => a.id)]
    const n = pessoas.length
    // 1,3 m por pessoa na roda: espaço para a saia de armada das prendas
    const raio = Math.min(Math.max((n * 1.3) / (2 * Math.PI), 2), Math.min(largura, profundidade) / 2 - 0.8)
    pessoas.forEach((id, i) => {
      // começa na frente (perto dos jurados) e gira no sentido horário visto de cima
      const angulo = (i / Math.max(n, 1)) * 2 * Math.PI
      const x = arred(-Math.sin(angulo) * raio)
      const z = arred(Math.cos(angulo) * raio)
      resultado.set(id, { x, z, rotacao: rotacaoOlhandoPara({ x, z }, { x: 0, z: 0 }) })
    })
    return resultado
  }

  if (modelo === 'filas') {
    // Peões numa fila à esquerda, prendas à direita, frente a frente;
    // os pares vão da frente para o fundo.
    const n = pares.length + Math.ceil(avulsos.length / 2)
    const passo = Math.min(1.2, (profundidade - 1.5) / Math.max(n - 1, 1))
    const inicio = ((n - 1) * passo) / 2
    const distancia = Math.min(3, largura / 3)
    pares.forEach((p, i) => {
      const z = arred(inicio - i * passo)
      resultado.set(p.peaoId, { x: arred(-distancia / 2), z, rotacao: rotacaoParaDirecao(1, 0) })
      resultado.set(p.prendaId, { x: arred(distancia / 2), z, rotacao: rotacaoParaDirecao(-1, 0) })
    })
    avulsos.forEach((a, k) => {
      const i = pares.length + Math.floor(k / 2)
      const lado = a.genero === 'peao' ? -1 : 1
      resultado.set(a.id, { x: arred((lado * distancia) / 2), z: arred(inicio - i * passo), rotacao: rotacaoParaDirecao(-lado, 0) })
    })
    return resultado
  }

  // 'pares': pares espalhados numa grade, todos de frente para os jurados,
  // peão à esquerda da prenda.
  const itens = [...pares.map((p) => [p.peaoId, p.prendaId] as const), ...avulsos.map((a) => [a.id] as const)]
  const n = itens.length
  const colunas = Math.max(1, Math.ceil(Math.sqrt(n * (largura / profundidade))))
  const linhas = Math.max(1, Math.ceil(n / colunas))
  const passoX = largura / (colunas + 0.5)
  const passoZ = profundidade / (linhas + 0.5)
  itens.forEach((pessoas, i) => {
    const c = i % colunas
    const l = Math.floor(i / colunas)
    const cx = (c - (colunas - 1) / 2) * passoX
    const cz = ((linhas - 1) / 2 - l) * passoZ
    if (pessoas.length === 2) {
      resultado.set(pessoas[0], { x: arred(cx - ESPACO_PAR / 2), z: arred(cz), rotacao: 0 })
      resultado.set(pessoas[1], { x: arred(cx + ESPACO_PAR / 2), z: arred(cz), rotacao: 0 })
    } else {
      resultado.set(pessoas[0], { x: arred(cx), z: arred(cz), rotacao: 0 })
    }
  })
  return resultado
}

// -----------------------------------------------------------------------------
// Animação entre formações
// -----------------------------------------------------------------------------

/** Suaviza o início e o fim do movimento (0 → 1). */
export function suavizar(t: number): number {
  const c = Math.min(1, Math.max(0, t))
  return c < 0.5 ? 2 * c * c : 1 - (-2 * c + 2) ** 2 / 2
}

/** Interpola ângulos pelo caminho mais curto (ex.: de 350° para 10° passa por 0°). */
export function interpolarAngulo(a: number, b: number, t: number): number {
  const diferenca = ((((b - a) % 360) + 540) % 360) - 180
  return normalizarAngulo(a + diferenca * t)
}

export function interpolarPosicao(a: Posicao, b: Posicao, t: number): Posicao {
  return {
    x: a.x + (b.x - a.x) * t,
    z: a.z + (b.z - a.z) * t,
    rotacao: interpolarAngulo(a.rotacao, b.rotacao, t),
  }
}
