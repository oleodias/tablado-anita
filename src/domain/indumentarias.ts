// Indumentárias (pilchas) do Grupo de Artes Nativas Anita Garibaldi.
// Cada dança pode usar um conjunto diferente. As cores foram tiradas das fotos
// do grupo; para criar um conjunto novo, copie um existente e ajuste as cores.

import type { Integrante, TipoIndumentaria } from '../types/db'

export interface PilchaPeao {
  camisa: string
  colete: string
  /** cor da bombacha OU do chiripá */
  bombacha: string
  /** bombacha, ou chiripá (pano enrolado até o joelho) sobre ceroulas brancas */
  pernas?: 'bombacha' | 'chiripa'
  ceroulas?: string
  /** colete fechado com botões (padrão: aberto) */
  coleteFechado?: boolean
  faixa: string
  guaiaca: string
  botas: string
  /** chapéu de palha alto (como nas fotos) ou de feltro (aba larga) */
  chapeu: 'palha' | 'feltro' | 'nenhum'
  corChapeu: string
  /** lenço amarrado na testa, por baixo do chapéu (null = sem) */
  lencoCabeca: string | null
  /** pala/poncho dobrado sobre o ombro esquerdo (null = sem) */
  pala: string | null
  franjaPala: string
}

export interface PilchaPrenda {
  saia: string
  /** babados e barras da saia */
  babado: string
  corpete: string
  /** vivos/galões do corpete (zigue-zague, losangos) */
  detalheCorpete: string
  mangas: string
  /** babado da gola e dos punhos */
  gola: string
  cabelo: string
  flor: string
}

export interface Indumentaria {
  id: string
  nome: string
  descricao: string
  /** peão Kamé (e padrão para quem não definiu o tipo) */
  peao: PilchaPeao
  prenda: PilchaPrenda
  /** variações do Kairú; sem elas, usa as cores acima (só muda pala → poncho) */
  peaoKairu?: PilchaPeao
  prendaKairu?: PilchaPrenda
}

const CHAPEU_PALHA = '#d9c48f'
const CAMISA_BRANCA = '#f3eee4'
const GUAIACA_COURO = '#c9ab7a'
const BOTA = '#2a1d16'

export const INDUMENTARIAS: Indumentaria[] = [
  {
    id: 'kame-vermelho',
    nome: 'Kamé e Kairú (conforme fotos)',
    descricao:
      'Peão Kamé conforme foto do grupo: lenço vermelho na cabeça, camisa crua, colete vermelho fechado, chiripá caramelo sobre ceroulas brancas, botas de garrão e pala marrom-escuro comprido com franja preta. Peão Kairú conforme foto: lenço branco, poncho cinza curto com franja, calça azul-clara e botas claras. Prendas ainda sem referência confirmada.',
    peao: {
      camisa: '#efe7d6',
      colete: '#c21f2b',
      coleteFechado: true,
      bombacha: '#b5793f',
      pernas: 'chiripa',
      ceroulas: '#f1ede4',
      faixa: '#c21f2b',
      guaiaca: '#a98a5e',
      botas: '#8a6a3c',
      chapeu: 'palha',
      corChapeu: CHAPEU_PALHA,
      lencoCabeca: '#c21f2b',
      pala: '#3a2c25',
      franjaPala: '#141210',
    },
    peaoKairu: {
      camisa: '#f1ede4',
      // o colete não aparece sob o poncho na foto: fica na cor da camisa
      colete: '#f1ede4',
      bombacha: '#9fcbc6',
      faixa: '#9fcbc6',
      guaiaca: '#a98a5e',
      botas: '#d9cdb4',
      chapeu: 'palha',
      corChapeu: CHAPEU_PALHA,
      lencoCabeca: '#f2f1ec',
      pala: '#8d9195',
      franjaPala: '#5c6064',
    },
    // PROVISÓRIO: aguardando fotos confirmadas das prendas (cores neutras, sem inventar detalhes)
    prenda: {
      saia: '#e9e2d2',
      babado: '#d8cfba',
      corpete: '#e9e2d2',
      detalheCorpete: '#d8cfba',
      mangas: '#e9e2d2',
      gola: '#d8cfba',
      cabelo: '#4a2f1f',
      flor: '#d8cfba',
    },
  },
  {
    id: 'telha-laranja',
    nome: 'Colete telha · vestido laranja',
    descricao: 'Peão com colete telha, pala vermelha e chapéu de palha; prenda de vestido laranja com corpete vermelho.',
    peao: {
      camisa: CAMISA_BRANCA,
      colete: '#b4562e',
      bombacha: '#c7955a',
      faixa: '#b3161e',
      guaiaca: GUAIACA_COURO,
      botas: BOTA,
      chapeu: 'palha',
      corChapeu: CHAPEU_PALHA,
      lencoCabeca: '#c0161f',
      pala: '#b5121b',
      franjaPala: '#c9a873',
    },
    prenda: {
      saia: '#f2b076',
      babado: '#c8382d',
      corpete: '#c8382d',
      detalheCorpete: '#f4e6c8',
      mangas: '#f2b076',
      gola: '#c8382d',
      cabelo: '#4a2f1f',
      flor: '#e8a0a8',
    },
  },
  {
    id: 'vermelho-turquesa',
    nome: 'Colete vermelho · vestido turquesa',
    descricao: 'Peão com colete vermelho e chapéu de palha; prenda de vestido azul com mangas turquesa.',
    peao: {
      camisa: CAMISA_BRANCA,
      colete: '#c8202a',
      bombacha: '#c7955a',
      faixa: '#c8202a',
      guaiaca: GUAIACA_COURO,
      botas: BOTA,
      chapeu: 'palha',
      corChapeu: CHAPEU_PALHA,
      lencoCabeca: '#c0161f',
      pala: null,
      franjaPala: '#c9a873',
    },
    prenda: {
      saia: '#3466b0',
      babado: '#3fa7c9',
      corpete: '#3466b0',
      detalheCorpete: '#f1f4f8',
      mangas: '#3fa7c9',
      gola: '#f1f4f8',
      cabelo: '#6b4428',
      flor: '#f1e3b0',
    },
  },
  {
    id: 'mostarda-vermelho',
    nome: 'Vestido mostarda e vermelho',
    descricao: 'Prenda com corpete mostarda, babados e saia vermelho-escuros; peão de colete telha.',
    peao: {
      camisa: CAMISA_BRANCA,
      colete: '#9b1b2a',
      bombacha: '#b98a52',
      faixa: '#9b1b2a',
      guaiaca: GUAIACA_COURO,
      botas: BOTA,
      chapeu: 'palha',
      corChapeu: CHAPEU_PALHA,
      lencoCabeca: '#9b1b2a',
      pala: '#9b1b2a',
      franjaPala: '#c9a873',
    },
    prenda: {
      saia: '#8e1724',
      babado: '#9b1b2a',
      corpete: '#c49a2c',
      detalheCorpete: '#f1e6c6',
      mangas: '#8e1724',
      gola: '#9b1b2a',
      cabelo: '#3d2618',
      flor: '#f2d27a',
    },
  },
  {
    id: 'azul-2026',
    nome: 'Vestido azul (2026)',
    descricao: 'Prenda de vestido azul com corpete azul-claro e galões brancos; peão de colete azul-marinho.',
    peao: {
      camisa: CAMISA_BRANCA,
      colete: '#1f3567',
      bombacha: '#2b3a5c',
      faixa: '#1f3567',
      guaiaca: GUAIACA_COURO,
      botas: BOTA,
      chapeu: 'feltro',
      corChapeu: '#2a2420',
      lencoCabeca: null,
      pala: null,
      franjaPala: '#c9a873',
    },
    prenda: {
      saia: '#3d73cc',
      babado: '#f4f6fb',
      corpete: '#a9c1ea',
      detalheCorpete: '#ffffff',
      mangas: '#3d73cc',
      gola: '#f4f6fb',
      cabelo: '#3a2416',
      flor: '#f4f6fb',
    },
  },
  {
    id: 'ensaio',
    nome: 'Roupa de ensaio',
    descricao: 'Camiseta azul-marinho e bombacha clara para o peão; saia de armada azul para a prenda.',
    peao: {
      camisa: '#1d2a4a',
      colete: '#1d2a4a',
      bombacha: '#d8ccb4',
      faixa: '#1d2a4a',
      guaiaca: '#6d5a44',
      botas: '#8a7356',
      chapeu: 'feltro',
      corChapeu: '#1d2a4a',
      lencoCabeca: null,
      pala: null,
      franjaPala: '#c9a873',
    },
    prenda: {
      saia: '#6b9bd8',
      babado: '#2a3f6e',
      corpete: '#1d2a4a',
      detalheCorpete: '#1d2a4a',
      mangas: '#9fc0ea',
      gola: '#1d2a4a',
      cabelo: '#4a2f1f',
      flor: '#6b9bd8',
    },
  },
]

export const INDUMENTARIA_PADRAO = 'azul-2026'

export function buscarIndumentaria(id: string | null | undefined): Indumentaria {
  return INDUMENTARIAS.find((i) => i.id === id) ?? INDUMENTARIAS.find((i) => i.id === INDUMENTARIA_PADRAO)!
}

type TiposDoIntegrante = Pick<Integrante, 'indumentaria' | 'indumentaria_danca' | 'indumentaria_coreografia'>

/** Tipo (Kamé/Kairú) que a pessoa usa nas danças tradicionais. */
export function tipoNaDanca(i: TiposDoIntegrante): TipoIndumentaria | null {
  return i.indumentaria_danca ?? i.indumentaria
}

/** Tipo (Kamé/Kairú) que a pessoa usa na coreografia (entrada e saída). */
export function tipoNaCoreografia(i: TiposDoIntegrante): TipoIndumentaria | null {
  return i.indumentaria_coreografia ?? i.indumentaria
}

/** Pilchas que uma pessoa usa neste conjunto, conforme o tipo (Kamé/Kairú). */
export function pilchasDoTipo(ind: Indumentaria, tipo: TipoIndumentaria | null) {
  return tipo === 'kairu'
    ? { peao: ind.peaoKairu ?? ind.peao, prenda: ind.prendaKairu ?? ind.prenda }
    : { peao: ind.peao, prenda: ind.prenda }
}
