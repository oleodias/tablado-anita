// Regras de pares e escalação.

import type { FuncaoEscalacao, GeneroDanca } from '../types/db'
import { LIMITES_FORCA_A } from './enart'

/**
 * Cores dos pares: 16 tons bem distintos entre si, legíveis no tablado claro
 * e no escuro. Ordem pensada para que pares vizinhos (1, 2, 3...) tenham cores
 * bem diferentes.
 */
export const PALETA_PARES = [
  '#e6194b', // vermelho
  '#3cb44b', // verde
  '#4363d8', // azul
  '#f58231', // laranja
  '#911eb4', // roxo
  '#42d4f4', // ciano
  '#f032e6', // magenta
  '#bfef45', // lima
  '#9a6324', // marrom
  '#469990', // verde-azulado
  '#ffe119', // amarelo
  '#800000', // bordô
  '#000075', // azul-marinho
  '#fabed4', // rosa
  '#808000', // oliva
  '#dcbeff', // lavanda
] as const

/** Primeira cor da paleta que ainda não está em uso. */
export function sugerirCor(emUso: string[]): string {
  const usadas = new Set(emUso.map((c) => c.toLowerCase()))
  return PALETA_PARES.find((c) => !usadas.has(c)) ?? PALETA_PARES[emUso.length % PALETA_PARES.length]
}

/** Menor número de par (1, 2, 3...) ainda livre. */
export function sugerirNumero(emUso: (number | null)[]): number {
  const usados = new Set(emUso.filter((n): n is number => n !== null))
  let n = 1
  while (usados.has(n)) n++
  return n
}

export interface ResumoEscalacao {
  peoes: number
  prendas: number
  pares: number
  reservas: number
  problemas: string[]
}

/**
 * Confere a escalação de uma dança tradicional contra os limites da Força A
 * (mínimo de 8 e máximo de 12 pares).
 */
export function resumirEscalacao(
  itens: { genero: GeneroDanca; funcao: FuncaoEscalacao }[],
  limites: { minPares: number; maxPares: number } = LIMITES_FORCA_A.dancasTradicionais,
): ResumoEscalacao {
  const titulares = itens.filter((i) => i.funcao === 'titular')
  const peoes = titulares.filter((i) => i.genero === 'peao').length
  const prendas = titulares.filter((i) => i.genero === 'prenda').length
  const pares = Math.min(peoes, prendas)
  const problemas: string[] = []

  if (peoes !== prendas) {
    problemas.push(`Número diferente de peões (${peoes}) e prendas (${prendas}).`)
  }
  if (pares < limites.minPares) {
    problemas.push(`Mínimo de ${limites.minPares} pares — faltam ${limites.minPares - pares}.`)
  }
  if (Math.max(peoes, prendas) > limites.maxPares) {
    problemas.push(`Máximo de ${limites.maxPares} pares — excedeu em ${Math.max(peoes, prendas) - limites.maxPares}.`)
  }

  return {
    peoes,
    prendas,
    pares,
    reservas: itens.length - titulares.length,
    problemas,
  }
}

/** Preto ou branco, o que tiver mais contraste sobre a cor do par. */
export function corDoTextoSobre(cor: string): '#000000' | '#ffffff' {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const c = parseInt(cor.slice(i, i + 2), 16) / 255
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  })
  const luminancia = 0.2126 * r + 0.7152 * g + 0.0722 * b
  // contraste com preto = (L + 0.05) / 0.05 ; com branco = 1.05 / (L + 0.05)
  return (luminancia + 0.05) / 0.05 > 1.05 / (luminancia + 0.05) ? '#000000' : '#ffffff'
}

/**
 * Sugere duplas para uma dança a partir dos pares padrão: só entram os pares
 * cujas duas pessoas ainda não estão em nenhuma dupla desta dança e estão ativas.
 * Mantém o número e a cor do par padrão quando estiverem livres.
 */
export function sugerirDuplasDosPares(
  paresPadrao: { numero: number | null; peao_id: string; prenda_id: string; cor: string }[],
  duplasExistentes: { numero: number; peao_id: string; prenda_id: string; cor: string }[],
  ativo: (integranteId: string) => boolean = () => true,
): { numero: number; peao_id: string; prenda_id: string; cor: string }[] {
  const ocupados = new Set(duplasExistentes.flatMap((d) => [d.peao_id, d.prenda_id]))
  const numeros = duplasExistentes.map((d) => d.numero)
  const cores = duplasExistentes.map((d) => d.cor)
  const novas: { numero: number; peao_id: string; prenda_id: string; cor: string }[] = []
  const ordenados = [...paresPadrao].sort((a, b) => (a.numero ?? 999) - (b.numero ?? 999))
  for (const p of ordenados) {
    if (ocupados.has(p.peao_id) || ocupados.has(p.prenda_id)) continue
    if (!ativo(p.peao_id) || !ativo(p.prenda_id)) continue
    const numero = p.numero !== null && !numeros.includes(p.numero) ? p.numero : sugerirNumero(numeros)
    const cor = cores.some((c) => c.toLowerCase() === p.cor.toLowerCase()) ? sugerirCor(cores) : p.cor
    novas.push({ numero, peao_id: p.peao_id, prenda_id: p.prenda_id, cor })
    numeros.push(numero)
    cores.push(cor)
    ocupados.add(p.peao_id).add(p.prenda_id)
  }
  return novas
}
