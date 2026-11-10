import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Aviso, CabecalhoPagina, Carregando, Etiqueta, Segmentado, Selecao } from '../components/ui'
import { blocoForaDoSorteio } from '../domain/enart'
import { resumirEscalacao } from '../domain/pares'
import { useAuth } from '../lib/auth'
import { ANO_ATUAL, ANOS_DISPONIVEIS, useAno } from '../lib/ano'
import { useDancas, useEscalacoesDoAno, useIntegrantes } from '../lib/dados'
import { NOME_TIPO_DANCA, type Danca } from '../types/db'

type Visao = 'ano' | 'todas'

export function Dancas() {
  const { perfil } = useAuth()
  const [ano, setAno] = useAno()
  const [visao, setVisao] = useState<Visao>('ano')
  const dancas = useDancas()
  const escalacoes = useEscalacoesDoAno(ano)
  const integrantes = useIntegrantes()
  const fora = blocoForaDoSorteio(ano)

  // Escalação agrupada por dança
  const porDanca = useMemo(() => {
    const generos = new Map((integrantes.data ?? []).map((i) => [i.id, i.genero]))
    const grupos = new Map<number, { genero: 'peao' | 'prenda'; funcao: 'titular' | 'reserva'; integrante_id: string }[]>()
    for (const e of escalacoes.data ?? []) {
      const dancaId = e.coreografias.danca_id
      const genero = generos.get(e.integrante_id)
      if (dancaId === null || !genero) continue
      if (!grupos.has(dancaId)) grupos.set(dancaId, [])
      grupos.get(dancaId)!.push({ genero, funcao: e.funcao, integrante_id: e.integrante_id })
    }
    return grupos
  }, [escalacoes.data, integrantes.data])

  const blocos = ([1, 2, 3, 4] as const).filter((b) => visao === 'todas' || b !== fora)

  return (
    <>
      <CabecalhoPagina
        titulo="Danças"
        subtitulo={`ENART ${ano}: Bloco ${fora} fora do sorteio — 21 danças em disputa.`}
      />

      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="sm:w-40">
          <Selecao id="ano" rotulo="Ano" value={ano} onChange={(e) => setAno(Number(e.target.value))}>
            {ANOS_DISPONIVEIS.map((a) => (
              <option key={a} value={a}>
                {a}
                {a === ANO_ATUAL ? ' (atual)' : ''}
              </option>
            ))}
          </Selecao>
        </div>
        <div className="flex-1">
          <Segmentado<Visao>
            valor={visao}
            aoMudar={setVisao}
            opcoes={[
              { valor: 'ano', texto: `Do ano (21)` },
              { valor: 'todas', texto: 'Todas (28)' },
            ]}
          />
        </div>
      </div>

      {dancas.isLoading && <Carregando texto="Carregando danças…" />}
      {dancas.error && <Aviso tipo="erro">Não foi possível carregar as danças.</Aviso>}

      {dancas.data && (
        <div className="grid gap-4 lg:grid-cols-2">
          {blocos.map((bloco) => (
            <section
              key={bloco}
              className={`overflow-hidden rounded-2xl border border-borda bg-superficie ${bloco === fora ? 'opacity-60' : ''}`}
            >
              <header className="flex items-baseline justify-between border-b border-borda px-4 py-3">
                <h2 className="font-semibold">Bloco {bloco}</h2>
                {bloco === fora && <Etiqueta>fora do sorteio em {ano}</Etiqueta>}
              </header>
              <ul className="divide-y divide-borda">
                {dancas.data
                  .filter((d) => d.bloco === bloco)
                  .map((d) => (
                    <LinhaDanca
                      key={d.id}
                      danca={d}
                      ano={ano}
                      escalados={porDanca.get(d.id) ?? []}
                      euDanco={(porDanca.get(d.id) ?? []).some((e) => e.integrante_id === perfil?.integrante_id)}
                    />
                  ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </>
  )
}

function LinhaDanca({
  danca,
  ano,
  escalados,
  euDanco,
}: {
  danca: Danca
  ano: number
  escalados: { genero: 'peao' | 'prenda'; funcao: 'titular' | 'reserva' }[]
  euDanco: boolean
}) {
  const resumo = resumirEscalacao(escalados)
  const link = `/dancas/${danca.slug}${ano === ANO_ATUAL ? '' : `?ano=${ano}`}`
  return (
    <li>
      <Link to={link} className="flex min-h-14 items-center gap-3 px-4 py-2.5 hover:bg-superficie-2">
        <div className="min-w-0 flex-1">
          <p className="flex flex-wrap items-center gap-2 font-medium">
            {danca.nome}
            {euDanco && <Etiqueta cor="marca">Você dança</Etiqueta>}
          </p>
          <p className="text-xs text-texto-suave">
            {danca.tipo ? NOME_TIPO_DANCA[danca.tipo] : 'Tipo a definir'} · urna {danca.urna}
            {danca.tempo_ampliado && ' · 25 min'}
          </p>
        </div>
        {escalados.length === 0 ? (
          <Etiqueta>sem escalação</Etiqueta>
        ) : (
          <Etiqueta cor={resumo.problemas.length ? 'destaque' : 'sucesso'}>{resumo.pares} pares</Etiqueta>
        )}
      </Link>
    </li>
  )
}
