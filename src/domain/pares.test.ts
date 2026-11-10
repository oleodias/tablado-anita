import { describe, expect, it } from 'vitest'
import type { FuncaoEscalacao, GeneroDanca } from '../types/db'
import { PALETA_PARES, corDoTextoSobre, resumirEscalacao, sugerirCor, sugerirDuplasDosPares, sugerirNumero } from './pares'

function escalacao(peoes: number, prendas: number, reservas = 0) {
  const itens: { genero: GeneroDanca; funcao: FuncaoEscalacao }[] = []
  for (let i = 0; i < peoes; i++) itens.push({ genero: 'peao', funcao: 'titular' })
  for (let i = 0; i < prendas; i++) itens.push({ genero: 'prenda', funcao: 'titular' })
  for (let i = 0; i < reservas; i++) itens.push({ genero: 'peao', funcao: 'reserva' })
  return itens
}

describe('sugestões para novos pares', () => {
  it('usa a primeira cor livre', () => {
    expect(sugerirCor([])).toBe(PALETA_PARES[0])
    expect(sugerirCor([PALETA_PARES[0].toUpperCase()])).toBe(PALETA_PARES[1])
  })

  it('preenche buracos na numeração', () => {
    expect(sugerirNumero([])).toBe(1)
    expect(sugerirNumero([1, 2, 4, null])).toBe(3)
  })
})

describe('escalação da Força A', () => {
  it('aceita de 8 a 12 pares completos', () => {
    expect(resumirEscalacao(escalacao(8, 8)).problemas).toEqual([])
    expect(resumirEscalacao(escalacao(12, 12, 3)).problemas).toEqual([])
  })

  it('aponta falta de pares', () => {
    const r = resumirEscalacao(escalacao(6, 6))
    expect(r.pares).toBe(6)
    expect(r.problemas[0]).toContain('faltam 2')
  })

  it('aponta excesso e desequilíbrio', () => {
    const r = resumirEscalacao(escalacao(13, 12))
    expect(r.problemas).toHaveLength(2)
  })

  it('não conta reservas como titulares', () => {
    const r = resumirEscalacao(escalacao(8, 8, 4))
    expect(r.reservas).toBe(4)
    expect(r.pares).toBe(8)
  })
})

describe('cor do número do par', () => {
  it('usa preto em cores claras e branco em escuras', () => {
    expect(corDoTextoSobre('#ffe119')).toBe('#000000')
    expect(corDoTextoSobre('#bfef45')).toBe('#000000')
    expect(corDoTextoSobre('#000075')).toBe('#ffffff')
    expect(corDoTextoSobre('#800000')).toBe('#ffffff')
  })
})

describe('duplas da dança a partir dos pares padrão', () => {
  const padrao = [
    { numero: 1, peao_id: 'a', prenda_id: 'b', cor: '#e6194b' },
    { numero: 2, peao_id: 'c', prenda_id: 'd', cor: '#3cb44b' },
    { numero: 3, peao_id: 'e', prenda_id: 'f', cor: '#4363d8' },
  ]

  it('copia número e cor quando a dança está vazia', () => {
    expect(sugerirDuplasDosPares(padrao, [])).toEqual(padrao)
  })

  it('pula quem já tem dupla nesta dança (troca de par) e evita números repetidos', () => {
    // nesta dança, o peão "a" dança com a prenda "d", como dupla 1
    const existentes = [{ numero: 1, peao_id: 'a', prenda_id: 'd', cor: '#e6194b' }]
    const novas = sugerirDuplasDosPares(padrao, existentes)
    expect(novas.map((n) => n.peao_id)).toEqual(['e'])
    expect(novas[0].numero).toBe(3)
  })

  it('ignora inativos', () => {
    expect(sugerirDuplasDosPares(padrao, [], (id) => id !== 'c')).toHaveLength(2)
  })
})
