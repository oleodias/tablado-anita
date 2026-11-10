import { describe, expect, it } from 'vitest'
import { calcularPlacas, contarPlacas, faixas, letraDaColuna, nomeDaPlaca, placaNoPonto } from './tablado'

const ENART = { largura_m: 15.86, profundidade_m: 13.42, placa_largura_m: 2.44, placa_profundidade_m: 1.22 }

describe('faixas de placas', () => {
  it('divide exato quando cabe um número inteiro de placas', () => {
    const f = faixas(12.2, 1.22)
    expect(f).toHaveLength(10)
    expect(f[0][0]).toBeCloseTo(-6.1)
    expect(f[9][1]).toBeCloseTo(6.1)
  })

  it('corta as pontas por igual quando sobra espaço', () => {
    const f = faixas(15.86, 2.44) // 6 placas inteiras + 1,22 m de sobra → uma tira de 0,61 m em cada ponta
    const larguras = f.map(([a, b]) => b - a)
    expect(larguras[0]).toBeCloseTo(larguras[larguras.length - 1])
    expect(larguras.reduce((s, l) => s + l, 0)).toBeCloseTo(15.86)
    expect(larguras.slice(1, -1).every((l) => Math.abs(l - 2.44) < 1e-6)).toBe(true)
  })

  it('sem tamanho de placa vira uma faixa só', () => {
    expect(faixas(14, 0)).toEqual([[-7, 7]])
  })
})

describe('placas do tablado', () => {
  it('cobre a área toda', () => {
    const placas = calcularPlacas(ENART)
    const area = placas.reduce((s, p) => s + p.largura * p.profundidade, 0)
    expect(area).toBeCloseTo(15.86 * 13.42)
  })

  it('a fileira 1 fica na frente (z positivo, lado dos jurados)', () => {
    const placas = calcularPlacas(ENART)
    const primeira = placas.filter((p) => p.fileira === 0)
    expect(primeira.every((p) => p.z > 6)).toBe(true)
  })

  it('conta colunas e fileiras', () => {
    expect(contarPlacas(ENART)).toEqual({ colunas: 8, fileiras: 11, total: 88 })
  })
})

describe('nomes das placas', () => {
  it('usa letras para colunas e números para fileiras', () => {
    expect(letraDaColuna(0)).toBe('A')
    expect(letraDaColuna(25)).toBe('Z')
    expect(letraDaColuna(26)).toBe('AA')
    expect(nomeDaPlaca(3, 3)).toBe('D4')
  })

  it('encontra a placa de um ponto', () => {
    // canto da frente à esquerda dos jurados = A1
    expect(placaNoPonto(ENART, -7.8, 6.6)).toEqual({ coluna: 0, fileira: 0 })
    expect(placaNoPonto(ENART, 20, 0)).toBeNull()
  })
})
