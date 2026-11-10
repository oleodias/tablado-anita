// Tipos que espelham as tabelas do banco (supabase/migrations).
// Ao alterar o banco, atualize aqui também.

export type PapelUsuario = 'admin' | 'professor' | 'dancarino'
export type GeneroDanca = 'peao' | 'prenda'
export type TipoDanca = 'fila' | 'roda' | 'pares_independentes'
export type TipoCoreografia = 'danca_tradicional' | 'entrada' | 'saida'

export interface Perfil {
  id: string
  nome: string
  email: string | null
  papel: PapelUsuario
  integrante_id: string | null
}

export interface Danca {
  id: number
  slug: string
  nome: string
  bloco: 1 | 2 | 3 | 4
  urna: 1 | 2 | 3
  tipo: TipoDanca | null
  tempo_ampliado: boolean
  observacoes: string | null
}
