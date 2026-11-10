// Kamé / Kairú: campos de escolha e o cartão "Sua indumentária" do Início.
import { useState } from 'react'
import { useDefinirMinhaIndumentaria } from '../lib/dados'
import { mensagemDeErro } from '../lib/erros'
import { NOME_INDUMENTARIA, type Integrante, type TipoIndumentaria } from '../types/db'
import { Aviso, Botao, Selecao } from './ui'

interface Valores {
  principal: TipoIndumentaria | null
  danca: TipoIndumentaria | null
  coreografia: TipoIndumentaria | null
}

/** Três seleções: tipo principal e as duas exceções opcionais. */
export function CamposIndumentaria({ principal, danca, coreografia, aoMudar }: Valores & { aoMudar: (v: Valores) => void }) {
  const tipo = (v: string) => (v === 'kame' || v === 'kairu' ? v : null)
  const igual = principal ? `Igual ao principal (${NOME_INDUMENTARIA[principal]})` : 'Igual ao principal'
  return (
    <fieldset className="flex flex-col gap-3">
      <legend className="mb-1.5 text-sm font-semibold">Indumentária (Kamé / Kairú)</legend>
      <Selecao id="ind-principal" rotulo="Tipo principal" value={principal ?? ''} onChange={(e) => aoMudar({ principal: tipo(e.target.value), danca, coreografia })}>
        <option value="">Não definido</option>
        <option value="kame">Kamé</option>
        <option value="kairu">Kairú</option>
      </Selecao>
      <div className="grid gap-3 sm:grid-cols-2">
        <Selecao id="ind-danca" rotulo="Nas danças tradicionais" value={danca ?? ''} onChange={(e) => aoMudar({ principal, danca: tipo(e.target.value), coreografia })}>
          <option value="">{igual}</option>
          <option value="kame">Kamé</option>
          <option value="kairu">Kairú</option>
        </Selecao>
        <Selecao id="ind-coreografia" rotulo="Na coreografia (entrada e saída)" value={coreografia ?? ''} onChange={(e) => aoMudar({ principal, danca, coreografia: tipo(e.target.value) })}>
          <option value="">{igual}</option>
          <option value="kame">Kamé</option>
          <option value="kairu">Kairú</option>
        </Selecao>
      </div>
    </fieldset>
  )
}

/** Cartão do Início: a própria pessoa define sua indumentária. */
export function MinhaIndumentaria({ integrante }: { integrante: Integrante }) {
  const salvar = useDefinirMinhaIndumentaria()
  const [v, setV] = useState<Valores>({
    principal: integrante.indumentaria,
    danca: integrante.indumentaria_danca,
    coreografia: integrante.indumentaria_coreografia,
  })
  const mudou =
    v.principal !== integrante.indumentaria || v.danca !== integrante.indumentaria_danca || v.coreografia !== integrante.indumentaria_coreografia

  return (
    <section className="rounded-2xl border border-borda bg-superficie p-4">
      {!integrante.indumentaria && (
        <p className="mb-3 text-sm text-texto-suave">Você ainda não informou se é Kamé ou Kairú.</p>
      )}
      <CamposIndumentaria {...v} aoMudar={setV} />
      {mudou && (
        <Botao className="mt-3" disabled={salvar.isPending} onClick={() => salvar.mutate(v)}>
          {salvar.isPending ? 'Salvando…' : 'Salvar indumentária'}
        </Botao>
      )}
      {salvar.error && (
        <div className="mt-3">
          <Aviso tipo="erro">{mensagemDeErro(salvar.error)}</Aviso>
        </div>
      )}
    </section>
  )
}
