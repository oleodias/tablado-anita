import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Aviso, Botao, Carregando, Etiqueta, Icone, Segmentado, Vazio } from '../components/ui'
import { blocoForaDoSorteio, tempoDeApresentacaoMin } from '../domain/enart'
import { podeEditar, useAuth } from '../lib/auth'
import { ANO_ATUAL, useAno } from '../lib/ano'
import { useAtualizarDanca, useDancas } from '../lib/dados'
import { mensagemDeErro } from '../lib/erros'
import { NOME_TIPO_DANCA, type Danca as TDanca, type TipoDanca } from '../types/db'
import { EscalacaoDanca } from './EscalacaoDanca'

export function Danca() {
  const { slug } = useParams()
  const [ano] = useAno()
  const dancas = useDancas()
  const danca = dancas.data?.find((d) => d.slug === slug)

  if (dancas.isLoading) return <Carregando />
  if (!danca) {
    return (
      <Vazio titulo="Dança não encontrada">
        <Link to="/dancas" className="text-link underline">
          Voltar para as danças
        </Link>
      </Vazio>
    )
  }
  return <DetalheDanca danca={danca} ano={ano} />
}

function DetalheDanca({ danca, ano }: { danca: TDanca; ano: number }) {
  const foraDoSorteio = blocoForaDoSorteio(ano) === danca.bloco
  return (
    <div className="flex flex-col gap-5">
      <Link
        to={`/dancas${ano === ANO_ATUAL ? '' : `?ano=${ano}`}`}
        className="-ml-1 inline-flex min-h-11 items-center gap-1 self-start text-sm text-link"
      >
        <Icone nome="voltar" className="size-4" /> Danças
      </Link>

      <header>
        <h1 className="text-2xl font-semibold">{danca.nome}</h1>
        <div className="mt-2 flex flex-wrap gap-2">
          <Etiqueta>Bloco {danca.bloco}</Etiqueta>
          <Etiqueta>Urna {danca.urna}</Etiqueta>
          <Etiqueta>{tempoDeApresentacaoMin(danca)} min de apresentação</Etiqueta>
          {foraDoSorteio && <Etiqueta cor="destaque">fora do sorteio em {ano}</Etiqueta>}
        </div>
      </header>

      <Link
        to={`/dancas/${danca.slug}/formacoes${ano === ANO_ATUAL ? '' : `?ano=${ano}`}`}
        className="flex items-center gap-4 rounded-2xl border border-marca/40 bg-marca/10 p-4 transition hover:bg-marca/15"
      >
        <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-marca text-marca-texto">
          <Icone nome="tablado" className="size-6" />
        </span>
        <div className="min-w-0">
          <p className="font-semibold">Marcar posições no tablado</p>
          <p className="text-sm text-texto-suave">Mapa do tablado: toque no dançarino e depois na placa onde ele fica.</p>
        </div>
      </Link>

      <EscalacaoDanca danca={danca} ano={ano} />
      <InformacoesDanca danca={danca} />
    </div>
  )
}

// -----------------------------------------------------------------------------
// Tipo e observações da dança
// -----------------------------------------------------------------------------
function InformacoesDanca({ danca }: { danca: TDanca }) {
  const { perfil } = useAuth()
  const editor = podeEditar(perfil)
  const atualizar = useAtualizarDanca()
  const [observacoes, setObservacoes] = useState(danca.observacoes ?? '')
  const alterou = observacoes !== (danca.observacoes ?? '')

  return (
    <section className="rounded-2xl border border-borda bg-superficie p-4">
      <h2 className="mb-3 font-semibold">Informações</h2>
      {editor ? (
        <div className="flex flex-col gap-4">
          <Segmentado<TipoDanca | 'indefinido'>
            rotulo="Tipo (para o sorteio da Força A)"
            valor={danca.tipo ?? 'indefinido'}
            desabilitado={atualizar.isPending}
            aoMudar={(v) => atualizar.mutate({ id: danca.id, tipo: v === 'indefinido' ? null : v })}
            compacto
            opcoes={[
              { valor: 'fila', texto: 'Fila' },
              { valor: 'roda', texto: 'Roda' },
              { valor: 'pares_independentes', texto: 'Pares indep.' },
              { valor: 'indefinido', texto: 'A definir' },
            ]}
          />
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-texto-suave">Observações dos professores</span>
            <textarea
              rows={3}
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              placeholder="Ex.: atenção ao alinhamento das filas na 2ª figura"
              className="w-full rounded-xl border border-borda bg-superficie px-3 py-2 text-base outline-none focus:border-marca focus:ring-2 focus:ring-marca/30"
            />
          </label>
          {alterou && (
            <Botao
              className="self-end"
              disabled={atualizar.isPending}
              onClick={() => atualizar.mutate({ id: danca.id, observacoes: observacoes.trim() || null })}
            >
              Salvar observações
            </Botao>
          )}
          {atualizar.error && <Aviso tipo="erro">{mensagemDeErro(atualizar.error)}</Aviso>}
        </div>
      ) : (
        <dl className="grid gap-3 text-sm">
          <div>
            <dt className="text-texto-suave">Tipo</dt>
            <dd className="font-medium">{danca.tipo ? NOME_TIPO_DANCA[danca.tipo] : 'A definir'}</dd>
          </div>
          {danca.observacoes && (
            <div>
              <dt className="text-texto-suave">Observações dos professores</dt>
              <dd className="whitespace-pre-line">{danca.observacoes}</dd>
            </div>
          )}
        </dl>
      )}
    </section>
  )
}
