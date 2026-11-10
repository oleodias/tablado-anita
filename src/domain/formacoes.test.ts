import { describe, expect, it } from 'vitest'
import {
  descreverDirecao,
  direcaoDaRotacao,
  encaixar,
  gerarFormacao,
  interpolarAngulo,
  rotacaoOlhandoPara,
  rotacaoParaDirecao,
} from './formacoes'

describe('direção', () => {
  it('0° olha para os jurados (z positivo)', () => {
    const d = direcaoDaRotacao(0)
    expect(d.x).toBeCloseTo(0)
    expect(d.z).toBeCloseTo(1)
  })

  it('ida e volta entre rotação e direção', () => {
    for (const r of [0, 45, 90, 180, 270, 315]) {
      const d = direcaoDaRotacao(r)
      expect(rotacaoParaDirecao(d.x, d.z)).toBe(r)
    }
  })

  it('90° no sentido horário visto de cima = olhando para a esquerda dos jurados', () => {
    // visto de cima com os jurados embaixo, girar 90° no horário leva o olhar para a esquerda da tela,
    // que é a esquerda de quem está na mesa dos jurados (x negativo)
    expect(direcaoDaRotacao(90).x).toBeCloseTo(-1)
    expect(descreverDirecao(90)).toBe('olhando para a esquerda')
    expect(descreverDirecao(180)).toBe('de costas para os jurados')
  })

  it('olhar para o centro a partir da frente = de costas para os jurados', () => {
    expect(rotacaoOlhandoPara({ x: 0, z: 3 }, { x: 0, z: 0 })).toBe(180)
  })
})

describe('encaixe e animação', () => {
  it('encaixa no múltiplo mais próximo', () => {
    expect(encaixar(1.0, 0.61)).toBeCloseTo(1.22)
    expect(encaixar(-0.2, 0.61)).toBeCloseTo(0)
  })

  it('gira pelo caminho mais curto', () => {
    expect(interpolarAngulo(350, 10, 0.5)).toBe(0)
    expect(interpolarAngulo(10, 350, 0.5)).toBe(0)
    expect(interpolarAngulo(0, 90, 0.5)).toBe(45)
  })
})

describe('modelos de formação', () => {
  const pares = Array.from({ length: 10 }, (_, i) => ({ peaoId: `p${i}`, prendaId: `m${i}` }))

  it('posiciona todo mundo dentro do tablado', () => {
    for (const modelo of ['pares', 'roda', 'filas'] as const) {
      const pos = gerarFormacao(modelo, pares, [{ id: 'x', genero: 'peao' }], 15.86, 13.42)
      expect(pos.size).toBe(21)
      for (const p of pos.values()) {
        expect(Math.abs(p.x)).toBeLessThanOrEqual(15.86 / 2)
        expect(Math.abs(p.z)).toBeLessThanOrEqual(13.42 / 2)
      }
    }
  })

  it('na roda, todos olham para o centro', () => {
    const pos = gerarFormacao('roda', pares, [], 15.86, 13.42)
    for (const p of pos.values()) {
      const d = direcaoDaRotacao(p.rotacao)
      // o produto escalar com o vetor que aponta para o centro deve ser positivo
      expect(d.x * -p.x + d.z * -p.z).toBeGreaterThan(0)
    }
  })

  it('nas filas, peão e prenda ficam frente a frente', () => {
    const pos = gerarFormacao('filas', pares, [], 15.86, 13.42)
    const peao = pos.get('p0')!
    const prenda = pos.get('m0')!
    expect(peao.z).toBeCloseTo(prenda.z)
    expect(peao.x).toBeLessThan(prenda.x)
    expect(direcaoDaRotacao(peao.rotacao).x).toBeCloseTo(1)
    expect(direcaoDaRotacao(prenda.rotacao).x).toBeCloseTo(-1)
  })

  it('nos pares espalhados, ninguém fica a menos de 60 cm de outro', () => {
    const pos = [...gerarFormacao('pares', pares, [], 15.86, 13.42).values()]
    for (let i = 0; i < pos.length; i++)
      for (let j = i + 1; j < pos.length; j++)
        expect(Math.hypot(pos[i].x - pos[j].x, pos[i].z - pos[j].z)).toBeGreaterThanOrEqual(0.6)
  })
})
