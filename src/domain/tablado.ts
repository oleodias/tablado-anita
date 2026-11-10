// Geometria do tablado: placas, coordenadas e nomes das placas (ex.: "D4").
//
// Sistema de coordenadas (metros, origem no CENTRO do tablado, visto de cima):
//   x → positivo para a DIREITA de quem está na mesa dos jurados
//   z → positivo em direção à FRENTE (mesa dos jurados); negativo = fundo
//   rotação 0° = dançarino de frente para os jurados
//
// Nomes das placas: colunas com letras (A, B, C...) da esquerda para a direita
// de quem olha da mesa dos jurados; fileiras com números (1, 2, 3...) da frente
// para o fundo. A placa "A1" é a da frente, no canto esquerdo.

export interface MedidasTablado {
  largura_m: number
  profundidade_m: number
  placa_largura_m: number | null
  placa_profundidade_m: number | null
}

export interface Placa {
  coluna: number
  fileira: number
  /** centro da placa */
  x: number
  z: number
  largura: number
  profundidade: number
  /** true quando é um recorte (meia-placa) na borda */
  parcial: boolean
}

/**
 * Divide um comprimento em faixas de placas, centralizadas: se sobrar espaço,
 * as placas das duas pontas ficam cortadas por igual (como aparece no ENART).
 * Devolve os limites [início, fim] de cada faixa, do menor para o maior.
 */
export function faixas(comprimento: number, tamanhoPlaca: number): [number, number][] {
  if (!(tamanhoPlaca > 0) || tamanhoPlaca >= comprimento) return [[-comprimento / 2, comprimento / 2]]
  const inteiras = Math.floor(comprimento / tamanhoPlaca + 1e-9)
  const sobra = comprimento - inteiras * tamanhoPlaca
  const limites: number[] = [-comprimento / 2]
  let posicao = -comprimento / 2 + (sobra > 1e-6 ? sobra / 2 : 0)
  if (sobra > 1e-6) limites.push(posicao)
  for (let i = 0; i < inteiras; i++) {
    posicao += tamanhoPlaca
    limites.push(Math.min(posicao, comprimento / 2))
  }
  if (limites[limites.length - 1] < comprimento / 2 - 1e-6) limites.push(comprimento / 2)
  const resultado: [number, number][] = []
  for (let i = 0; i < limites.length - 1; i++) resultado.push([limites[i], limites[i + 1]])
  return resultado
}

/** Todas as placas do tablado. */
export function calcularPlacas(m: MedidasTablado): Placa[] {
  const colunas = faixas(m.largura_m, m.placa_largura_m ?? 0)
  // fileiras de z: queremos a fileira 1 na FRENTE (z maior), então invertemos
  const fileiras = faixas(m.profundidade_m, m.placa_profundidade_m ?? 0).reverse()
  const placas: Placa[] = []
  fileiras.forEach(([z0, z1], f) => {
    colunas.forEach(([x0, x1], c) => {
      const largura = x1 - x0
      const profundidade = z1 - z0
      placas.push({
        coluna: c,
        fileira: f,
        x: (x0 + x1) / 2,
        z: (z0 + z1) / 2,
        largura,
        profundidade,
        parcial:
          (m.placa_largura_m != null && largura < m.placa_largura_m - 1e-6) ||
          (m.placa_profundidade_m != null && profundidade < m.placa_profundidade_m - 1e-6),
      })
    })
  })
  return placas
}

/** A, B, ..., Z, AA, AB... */
export function letraDaColuna(indice: number): string {
  let n = indice + 1
  let s = ''
  while (n > 0) {
    const r = (n - 1) % 26
    s = String.fromCharCode(65 + r) + s
    n = Math.floor((n - 1) / 26)
  }
  return s
}

export function nomeDaPlaca(coluna: number, fileira: number): string {
  return `${letraDaColuna(coluna)}${fileira + 1}`
}

/** Em qual placa cai um ponto (x, z). Devolve null se estiver fora do tablado. */
export function placaNoPonto(m: MedidasTablado, x: number, z: number): { coluna: number; fileira: number } | null {
  if (Math.abs(x) > m.largura_m / 2 + 1e-9 || Math.abs(z) > m.profundidade_m / 2 + 1e-9) return null
  const colunas = faixas(m.largura_m, m.placa_largura_m ?? 0)
  const fileiras = faixas(m.profundidade_m, m.placa_profundidade_m ?? 0).reverse()
  const coluna = colunas.findIndex(([a, b]) => x >= a - 1e-9 && x <= b + 1e-9)
  const fileira = fileiras.findIndex(([a, b]) => z >= a - 1e-9 && z <= b + 1e-9)
  return coluna < 0 || fileira < 0 ? null : { coluna, fileira }
}

/** Resumo para exibir: "6 inteiras + 2 meias" etc. */
export function contarPlacas(m: MedidasTablado) {
  const colunas = faixas(m.largura_m, m.placa_largura_m ?? 0)
  const fileiras = faixas(m.profundidade_m, m.placa_profundidade_m ?? 0)
  return { colunas: colunas.length, fileiras: fileiras.length, total: colunas.length * fileiras.length }
}
