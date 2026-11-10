// Tipos que espelham as tabelas do banco (supabase/migrations).
// Ao alterar o banco, atualize aqui também.

export type PapelUsuario = 'admin' | 'professor' | 'dancarino'
export type GeneroDanca = 'peao' | 'prenda'
export type TipoDanca = 'fila' | 'roda' | 'pares_independentes'
export type TipoCoreografia = 'danca_tradicional' | 'entrada' | 'saida'
export type FuncaoEscalacao = 'titular' | 'reserva'
/** Tipos de indumentária da invernada, inspirados na cultura Kaingang. */
export type TipoIndumentaria = 'kame' | 'kairu'

export interface Perfil {
  id: string
  nome: string
  email: string | null
  papel: PapelUsuario
  integrante_id: string | null
}

export interface Integrante {
  id: string
  nome: string
  apelido: string | null
  genero: GeneroDanca
  ativo: boolean
  observacoes: string | null
  /** tipo principal */
  indumentaria: TipoIndumentaria | null
  /** só quando for diferente do principal nas danças tradicionais */
  indumentaria_danca: TipoIndumentaria | null
  /** só quando for diferente do principal na coreografia (entrada/saída) */
  indumentaria_coreografia: TipoIndumentaria | null
}

export interface Par {
  id: string
  numero: number | null
  peao_id: string
  prenda_id: string
  cor: string
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

export interface Coreografia {
  id: string
  tipo: TipoCoreografia
  danca_id: number | null
  nome: string | null
  ano: number
  tablado_id: string | null
  observacoes: string | null
  /** id do conjunto em src/domain/indumentarias.ts */
  indumentaria: string
}

export interface Tablado {
  id: string
  nome: string
  largura_m: number
  profundidade_m: number
  placa_largura_m: number | null
  placa_profundidade_m: number | null
  padrao: boolean
  config: { estimado?: boolean; provisorio?: boolean }
}

/** Dupla de uma dança (coreografia): pode ser diferente em cada dança. */
export interface Dupla {
  id: string
  coreografia_id: string
  numero: number
  peao_id: string
  prenda_id: string
  cor: string
}

export interface Formacao {
  id: string
  coreografia_id: string
  ordem: number
  nome: string | null
  tempo_s: number | null
  observacoes: string | null
}

export interface PosicaoSalva {
  formacao_id: string
  integrante_id: string
  x: number
  z: number
  rotacao: number
}

export interface ItemEscalacao {
  coreografia_id: string
  integrante_id: string
  funcao: FuncaoEscalacao
}

// Textos para exibir na interface
export const NOME_INDUMENTARIA: Record<TipoIndumentaria, string> = { kame: 'Kamé', kairu: 'Kairú' }
export const NOME_GENERO: Record<GeneroDanca, string> = { peao: 'Peão', prenda: 'Prenda' }
export const NOME_PAPEL: Record<PapelUsuario, string> = {
  admin: 'Administrador',
  professor: 'Professor',
  dancarino: 'Dançarino',
}
export const NOME_TIPO_DANCA: Record<TipoDanca, string> = {
  fila: 'Fila',
  roda: 'Roda',
  pares_independentes: 'Pares independentes',
}
