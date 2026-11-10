import { describe, expect, it } from 'vitest'
import { blocoForaDoSorteio, dancasDoAno } from './enart'

describe('rodízio de blocos (art. 24, §8º)', () => {
  it('segue o regulamento nos anos citados', () => {
    expect(blocoForaDoSorteio(2025)).toBe(3)
    expect(blocoForaDoSorteio(2026)).toBe(2)
    expect(blocoForaDoSorteio(2027)).toBe(1)
    expect(blocoForaDoSorteio(2028)).toBe(4)
  })

  it('repete o ciclo a cada 4 anos', () => {
    expect(blocoForaDoSorteio(2029)).toBe(3)
    expect(blocoForaDoSorteio(2030)).toBe(2)
  })

  it('separa as 21 danças do ano', () => {
    const dancas = ([1, 2, 3, 4] as const).flatMap((bloco) => Array.from({ length: 7 }, () => ({ bloco })))
    const doAno = dancasDoAno(dancas, 2026)
    expect(doAno).toHaveLength(21)
    expect(doAno.some((d) => d.bloco === 2)).toBe(false)
  })
})
