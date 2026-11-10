import type { Integrante, Par } from '../types/db'

export interface ParDoIntegrante {
  par: Par
  parceiroId: string
}

/** Para cada integrante, o par a que pertence e quem é o parceiro. */
export function mapearPares(pares: Par[]): Map<string, ParDoIntegrante> {
  const mapa = new Map<string, ParDoIntegrante>()
  for (const par of pares) {
    mapa.set(par.peao_id, { par, parceiroId: par.prenda_id })
    mapa.set(par.prenda_id, { par, parceiroId: par.peao_id })
  }
  return mapa
}

export function mapearPorId<T extends { id: string }>(lista: T[]): Map<string, T> {
  return new Map(lista.map((i) => [i.id, i]))
}

/** Nome para exibir: apelido, se houver, senão o primeiro e o último nome. */
export function nomeCurto(i: Pick<Integrante, 'nome' | 'apelido'>): string {
  if (i.apelido?.trim()) return i.apelido.trim()
  const partes = i.nome.trim().split(/\s+/)
  return partes.length > 1 ? `${partes[0]} ${partes[partes.length - 1]}` : partes[0]
}

/** Busca sem diferenciar maiúsculas nem acentos. */
export function normalizar(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
}
