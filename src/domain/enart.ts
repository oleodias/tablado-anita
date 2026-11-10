// Regras do Regulamento ENART que a aplicação precisa conhecer.
// Fonte: Regulamento ENART 2026 (MTG-RS), arts. 24 e 25.

import type { Danca } from '../types/db'

/**
 * Art. 24, §8º: a cada ano um bloco NÃO vai a sorteio, em rodízio.
 * 2025 → bloco 3, 2026 → bloco 2, 2027 → bloco 1, 2028 → bloco 4, e repete.
 */
const RODIZIO_BLOCO_FORA = [3, 2, 1, 4] as const
const ANO_BASE_RODIZIO = 2025

export function blocoForaDoSorteio(ano: number): 1 | 2 | 3 | 4 {
  const indice = (((ano - ANO_BASE_RODIZIO) % 4) + 4) % 4
  return RODIZIO_BLOCO_FORA[indice]
}

/** As 21 danças que vão a sorteio no ano informado. */
export function dancasDoAno<T extends Pick<Danca, 'bloco'>>(dancas: T[], ano: number): T[] {
  const fora = blocoForaDoSorteio(ano)
  return dancas.filter((d) => d.bloco !== fora)
}

/** Art. 25: 20 minutos; 25 para Pau de Fitas, Meia Canha, Roseira, Anu e Valsa da Mão Trocada. */
export function tempoDeApresentacaoMin(danca: Pick<Danca, 'tempo_ampliado'>): number {
  return danca.tempo_ampliado ? 25 : 20
}

/**
 * Limites de pares do Grupo de Danças Força A (regulamento, item "b" da
 * composição dos concorrentes). Para entrada e saída o regulamento só fixa o
 * máximo; o mínimo abaixo repete o das danças tradicionais.
 */
export const LIMITES_FORCA_A = {
  dancasTradicionais: { minPares: 8, maxPares: 12 },
  entradaESaida: { minPares: 8, maxPares: 16 },
} as const
