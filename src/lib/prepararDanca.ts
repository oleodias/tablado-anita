// Deixa uma dança pronta para uso sem nenhum passo manual:
// na PRIMEIRA vez que um professor abre a dança (ainda sem coreografia no ano),
// os pares padrão entram sozinhos como duplas titulares.
// Depois disso nada é refeito — se o professor limpar as duplas, elas não voltam.
import { useEffect } from 'react'
import { sugerirDuplasDosPares } from '../domain/pares'
import { useCoreografia, useIntegrantes, usePares, useSalvarDuplas } from './dados'

/** Danças já preparadas nesta sessão (evita gravar duas vezes). */
const jaPreparadas = new Set<string>()

/** Devolve true enquanto os pares padrão estão sendo aplicados. */
export function usePrepararDanca(dancaId: number, ano: number, editor: boolean): boolean {
  const coreografia = useCoreografia(dancaId, ano)
  const pares = usePares()
  const integrantes = useIntegrantes()
  const salvar = useSalvarDuplas(dancaId, ano)
  const chave = `${dancaId}-${ano}`

  useEffect(() => {
    if (!editor || jaPreparadas.has(chave)) return
    // espera carregar; só age se a dança ainda não existe neste ano
    if (coreografia.isLoading || coreografia.data !== null || !pares.data || !integrantes.data) return
    const ativos = new Set(integrantes.data.filter((i) => i.ativo).map((i) => i.id))
    const duplas = sugerirDuplasDosPares(pares.data, [], (id) => ativos.has(id))
    if (!duplas.length) return
    jaPreparadas.add(chave)
    salvar.mutate(duplas)
    // "salvar" muda a cada renderização; a trava acima garante uma única gravação
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editor, chave, coreografia.isLoading, coreografia.data, pares.data, integrantes.data])

  return salvar.isPending
}
