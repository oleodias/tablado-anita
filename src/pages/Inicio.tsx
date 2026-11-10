import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Aviso, Etiqueta, Icone, type NomeIcone } from '../components/ui'
import { blocoForaDoSorteio, dancasDoAno } from '../domain/enart'
import { MinhaIndumentaria } from '../components/MinhaIndumentaria'
import { nomeCurto } from '../domain/indices'
import { podeEditar, useAuth } from '../lib/auth'
import { ANO_ATUAL } from '../lib/ano'
import { useDancas, useDuplasDoAno, useEscalacoesDoAno, useIntegrantes, usePares } from '../lib/dados'

export function Inicio() {
  const { perfil } = useAuth()
  const editor = podeEditar(perfil)
  const dancas = useDancas()
  const integrantes = useIntegrantes()
  const pares = usePares()
  const escalacoes = useEscalacoesDoAno(ANO_ATUAL)

  const fora = blocoForaDoSorteio(ANO_ATUAL)
  const dancasAno = dancasDoAno(dancas.data ?? [], ANO_ATUAL)
  const dancasPorId = useMemo(() => new Map((dancas.data ?? []).map((d) => [d.id, d])), [dancas.data])
  const ativos = (integrantes.data ?? []).filter((i) => i.ativo)

  const duplas = useDuplasDoAno(ANO_ATUAL)
  const eu = integrantes.data?.find((i) => i.id === perfil?.integrante_id)

  // Em cada dança a dupla pode ser diferente: dança → nome de quem dança comigo.
  const parceiroPorDanca = useMemo(() => {
    const mapa = new Map<number, { nome: string; cor: string }>()
    const meuId = perfil?.integrante_id
    for (const d of duplas.data ?? []) {
      if (d.coreografias.danca_id === null || (d.peao_id !== meuId && d.prenda_id !== meuId)) continue
      const parceiro = integrantes.data?.find((i) => i.id === (d.peao_id === meuId ? d.prenda_id : d.peao_id))
      if (parceiro) mapa.set(d.coreografias.danca_id, { nome: nomeCurto(parceiro), cor: d.cor })
    }
    return mapa
  }, [duplas.data, integrantes.data, perfil?.integrante_id])

  const minhasDancas = useMemo(
    () =>
      (escalacoes.data ?? [])
        .filter((e) => e.integrante_id === perfil?.integrante_id && e.coreografias.danca_id !== null)
        .map((e) => ({ danca: dancasPorId.get(e.coreografias.danca_id!), funcao: e.funcao }))
        .filter((x) => x.danca)
        .sort((a, b) => a.danca!.id - b.danca!.id),
    [escalacoes.data, perfil?.integrante_id, dancasPorId],
  )

  const dancasEscaladas = new Set((escalacoes.data ?? []).map((e) => e.coreografias.danca_id)).size

  return (
    <div className="flex flex-col gap-6">
      <section>
        <h1 className="text-2xl font-semibold">Olá{perfil ? `, ${perfil.nome.split(' ')[0]}` : ''}!</h1>
        <p className="mt-1 text-texto-suave">
          ENART {ANO_ATUAL} · 21 danças em sorteio · Bloco {fora} fora neste ano.
        </p>
      </section>

      {perfil && !perfil.integrante_id && perfil.papel === 'dancarino' && (
        <Aviso tipo="info">Sua conta ainda não foi vinculada ao seu nome no grupo. Peça a um professor.</Aviso>
      )}

      {perfil?.integrante_id && (
        <section className="rounded-2xl border border-borda bg-superficie p-4">
          <h2 className="font-semibold">Suas danças em {ANO_ATUAL}</h2>
          {minhasDancas.length === 0 ? (
            <p className="mt-3 text-sm text-texto-suave">Você ainda não foi escalado em nenhuma dança.</p>
          ) : (
            <ul className="mt-3 flex flex-wrap gap-2">
              {minhasDancas.map(({ danca, funcao }) => (
                <li key={danca!.id}>
                  <Link
                    to={`/dancas/${danca!.slug}`}
                    className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-borda px-3 text-sm hover:bg-superficie-2"
                  >
                    {parceiroPorDanca.has(danca!.id) && (
                      <span className="inline-block size-3 rounded-full" style={{ background: parceiroPorDanca.get(danca!.id)!.cor }} />
                    )}
                    {danca!.nome}
                    {parceiroPorDanca.has(danca!.id) && (
                      <span className="text-texto-suave">com {parceiroPorDanca.get(danca!.id)!.nome}</span>
                    )}
                    {funcao === 'reserva' && <Etiqueta cor="destaque">reserva</Etiqueta>}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {eu && <MinhaIndumentaria key={`${eu.indumentaria}${eu.indumentaria_danca}${eu.indumentaria_coreografia}`} integrante={eu} />}

      <section className="grid gap-3 sm:grid-cols-3">
        <Atalho
          para="/dancas"
          icone="dancas"
          titulo="Danças"
          valor={`${dancasEscaladas} de ${dancasAno.length || 21}`}
          detalhe="com escalação definida"
        />
        <Atalho
          para="/integrantes"
          icone="integrantes"
          titulo="Integrantes"
          valor={String(ativos.length)}
          detalhe="ativos no grupo"
        />
        <Atalho
          para="/pares"
          icone="pares"
          titulo="Pares padrão"
          valor={String(pares.data?.length ?? 0)}
          detalhe="formados"
        />
      </section>

      {editor && (ativos.length === 0 || (pares.data?.length ?? 0) === 0) && (
        <section className="rounded-2xl border border-dashed border-borda p-4 text-sm">
          <p className="font-medium">Primeiros passos</p>
          <ol className="mt-2 list-decimal pl-5 text-texto-suave">
            <li>
              Cadastre os{' '}
              <Link to="/integrantes" className="text-link underline">
                integrantes
              </Link>
              .
            </li>
            <li>
              Forme os{' '}
              <Link to="/pares" className="text-link underline">
                pares
              </Link>{' '}
              e escolha a cor de cada um.
            </li>
            <li>
              Em cada{' '}
              <Link to="/dancas" className="text-link underline">
                dança
              </Link>
              , defina quem é titular e quem é reserva.
            </li>
          </ol>
        </section>
      )}

      <Link
        to="/tablado"
        className="flex items-center gap-4 rounded-2xl border border-borda bg-superficie p-4 transition hover:bg-superficie-2"
      >
        <span className="flex size-11 items-center justify-center rounded-xl bg-marca/15 text-link">
          <Icone nome="tablado" className="size-6" />
        </span>
        <div>
          <p className="font-semibold">Tablado em 3D</p>
          <p className="text-sm text-texto-suave">Veja o tablado do ENART com as placas, mesas e conjunto musical.</p>
        </div>
      </Link>

      <p className="text-sm text-texto-suave">Em breve: formações de cada dança no tablado.</p>
    </div>
  )
}

function Atalho({
  para,
  icone,
  titulo,
  valor,
  detalhe,
}: {
  para: string
  icone: NomeIcone
  titulo: string
  valor: string
  detalhe: string
}) {
  return (
    <Link
      to={para}
      className="flex items-center gap-4 rounded-2xl border border-borda bg-superficie p-4 transition hover:bg-superficie-2"
    >
      <span className="flex size-11 items-center justify-center rounded-xl bg-marca/15 text-link">
        <Icone nome={icone} className="size-6" />
      </span>
      <div>
        <p className="text-sm text-texto-suave">{titulo}</p>
        <p className="text-xl font-semibold leading-tight">{valor}</p>
        <p className="text-xs text-texto-suave">{detalhe}</p>
      </div>
    </Link>
  )
}
