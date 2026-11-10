import { useSearchParams } from 'react-router-dom'

export const ANO_ATUAL = new Date().getFullYear()

/** Anos que aparecem no seletor: o anterior, o atual e os dois próximos. */
export const ANOS_DISPONIVEIS = [ANO_ATUAL - 1, ANO_ATUAL, ANO_ATUAL + 1, ANO_ATUAL + 2]

/**
 * Ano do ENART em foco, guardado no endereço (?ano=2027) para que links
 * compartilhados abram no mesmo ano.
 */
export function useAno(): [number, (ano: number) => void] {
  const [params, setParams] = useSearchParams()
  const lido = Number(params.get('ano'))
  const ano = Number.isInteger(lido) && lido >= 2020 && lido <= 2100 ? lido : ANO_ATUAL
  const definir = (novo: number) => {
    const p = new URLSearchParams(params)
    if (novo === ANO_ATUAL) p.delete('ano')
    else p.set('ano', String(novo))
    setParams(p, { replace: true })
  }
  return [ano, definir]
}
