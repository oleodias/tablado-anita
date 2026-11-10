import { useMemo, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import {
  Aviso,
  Avatar,
  Botao,
  CabecalhoPagina,
  Campo,
  Carregando,
  Etiqueta,
  Folha,
  Icone,
  NumeroPar,
  Selecao,
  Vazio,
} from '../components/ui'
import { mapearPares, mapearPorId } from '../domain/indices'
import { PALETA_PARES, corDoTextoSobre, sugerirCor, sugerirNumero } from '../domain/pares'
import { podeEditar, useAuth } from '../lib/auth'
import { useIntegrantes, usePares, useRemoverPar, useSalvarPar, type DadosPar } from '../lib/dados'
import { mensagemDeErro } from '../lib/erros'
import type { Integrante, Par } from '../types/db'

export function Pares() {
  const { perfil } = useAuth()
  const editor = podeEditar(perfil)
  const pares = usePares()
  const integrantes = useIntegrantes()
  const [editando, setEditando] = useState<Par | 'novo' | null>(null)

  const porId = useMemo(() => mapearPorId(integrantes.data ?? []), [integrantes.data])
  const comPar = useMemo(() => mapearPares(pares.data ?? []), [pares.data])
  const semPar = (integrantes.data ?? []).filter((i) => i.ativo && !comPar.has(i.id))
  const peoesSemPar = semPar.filter((i) => i.genero === 'peao')
  const prendasSemPar = semPar.filter((i) => i.genero === 'prenda')

  const carregando = pares.isLoading || integrantes.isLoading

  return (
    <>
      <CabecalhoPagina
        titulo="Pares padrão"
        subtitulo={
          pares.data
            ? `${pares.data.length} pares · servem de ponto de partida; em cada dança as duplas podem ser trocadas`
            : undefined
        }
        acoes={
          editor && (
            <Botao onClick={() => setEditando('novo')} disabled={!peoesSemPar.length || !prendasSemPar.length}>
              <Icone nome="mais" /> Novo par
            </Botao>
          )
        }
      />

      {carregando && <Carregando />}
      {(pares.error || integrantes.error) && <Aviso tipo="erro">Não foi possível carregar os pares.</Aviso>}

      {pares.data && integrantes.data && (
        <div className="flex flex-col gap-6">
          {pares.data.length === 0 ? (
            <Vazio titulo="Nenhum par formado">
              {integrantes.data.length === 0 ? (
                <>
                  Cadastre os integrantes primeiro em{' '}
                  <Link to="/integrantes" className="text-link underline">
                    Integrantes
                  </Link>
                  .
                </>
              ) : (
                editor && 'Toque em "Novo par" para juntar um peão e uma prenda.'
              )}
            </Vazio>
          ) : (
            <ul className="grid gap-3 sm:grid-cols-2">
              {pares.data.map((par) => {
                const peao = porId.get(par.peao_id)
                const prenda = porId.get(par.prenda_id)
                const conteudo = (
                  <>
                    <NumeroPar numero={par.numero} cor={par.cor} tamanho="lg" />
                    <div className="min-w-0 flex-1 text-sm">
                      <p className="truncate font-medium">{peao?.nome ?? '?'}</p>
                      <p className="truncate font-medium">{prenda?.nome ?? '?'}</p>
                    </div>
                    {(perfil?.integrante_id === par.peao_id || perfil?.integrante_id === par.prenda_id) && (
                      <Etiqueta cor="marca">Seu par</Etiqueta>
                    )}
                    {(!peao?.ativo || !prenda?.ativo) && <Etiqueta cor="perigo">inativo</Etiqueta>}
                  </>
                )
                return (
                  <li key={par.id}>
                    {editor ? (
                      <button
                        type="button"
                        onClick={() => setEditando(par)}
                        className="flex w-full items-center gap-3 rounded-2xl border border-borda bg-superficie p-3 text-left hover:bg-superficie-2"
                      >
                        {conteudo}
                      </button>
                    ) : (
                      <div className="flex items-center gap-3 rounded-2xl border border-borda bg-superficie p-3">
                        {conteudo}
                      </div>
                    )}
                  </li>
                )
              })}
            </ul>
          )}

          {semPar.length > 0 && (
            <section>
              <h2 className="mb-2 font-semibold">Sem par ({semPar.length})</h2>
              <div className="grid gap-3 sm:grid-cols-2">
                <ListaSemPar titulo="Peões" pessoas={peoesSemPar} />
                <ListaSemPar titulo="Prendas" pessoas={prendasSemPar} />
              </div>
            </section>
          )}
        </div>
      )}

      {editando && pares.data && (
        <FormularioPar
          par={editando === 'novo' ? null : editando}
          pares={pares.data}
          peoes={(integrantes.data ?? []).filter((i) => i.genero === 'peao')}
          prendas={(integrantes.data ?? []).filter((i) => i.genero === 'prenda')}
          ocupados={comPar}
          aoFechar={() => setEditando(null)}
        />
      )}
    </>
  )
}

function ListaSemPar({ titulo, pessoas }: { titulo: string; pessoas: Integrante[] }) {
  return (
    <div className="rounded-2xl border border-borda bg-superficie p-3">
      <p className="mb-2 text-sm font-medium text-texto-suave">
        {titulo} ({pessoas.length})
      </p>
      {pessoas.length === 0 ? (
        <p className="text-sm text-texto-suave">Todos com par.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {pessoas.map((p) => (
            <li key={p.id} className="flex items-center gap-2 text-sm">
              <Avatar nome={p.nome} tamanho="sm" />
              {p.nome}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function FormularioPar({
  par,
  pares,
  peoes,
  prendas,
  ocupados,
  aoFechar,
}: {
  par: Par | null
  pares: Par[]
  peoes: Integrante[]
  prendas: Integrante[]
  ocupados: Map<string, unknown>
  aoFechar: () => void
}) {
  const salvar = useSalvarPar()
  const remover = useRemoverPar()
  const outros = pares.filter((p) => p.id !== par?.id)
  const [dados, setDados] = useState<DadosPar>(
    par ?? {
      numero: sugerirNumero(outros.map((p) => p.numero)),
      peao_id: '',
      prenda_id: '',
      cor: sugerirCor(outros.map((p) => p.cor)),
    },
  )
  const coresEmUso = new Set(outros.map((p) => p.cor.toLowerCase()))
  // Disponíveis: quem não tem par, mais os próprios integrantes deste par.
  const livre = (i: Integrante) => i.ativo && (!ocupados.has(i.id) || i.id === par?.peao_id || i.id === par?.prenda_id)
  const erro = salvar.error ?? remover.error

  function aoEnviar(e: FormEvent) {
    e.preventDefault()
    salvar.mutate(dados, { onSuccess: aoFechar })
  }

  return (
    <Folha
      aberta
      aoFechar={aoFechar}
      titulo={par ? `Editar par ${par.numero ?? ''}` : 'Novo par'}
      rodape={
        <>
          {par && (
            <Botao
              variante="perigo"
              className="mr-auto"
              disabled={remover.isPending}
              onClick={() => remover.mutate(par.id, { onSuccess: aoFechar })}
            >
              Desfazer par
            </Botao>
          )}
          <Botao variante="secundario" onClick={aoFechar}>
            Cancelar
          </Botao>
          <Botao
            type="submit"
            form="form-par"
            disabled={salvar.isPending || !dados.peao_id || !dados.prenda_id}
          >
            {salvar.isPending ? 'Salvando…' : 'Salvar'}
          </Botao>
        </>
      }
    >
      <form id="form-par" onSubmit={aoEnviar} className="flex flex-col gap-4">
        <Campo
          id="numero"
          rotulo="Número do par"
          type="number"
          inputMode="numeric"
          min={1}
          max={99}
          value={dados.numero ?? ''}
          onChange={(e) => setDados({ ...dados, numero: e.target.value ? Number(e.target.value) : null })}
        />
        <Selecao
          id="peao"
          rotulo="Peão"
          required
          value={dados.peao_id}
          onChange={(e) => setDados({ ...dados, peao_id: e.target.value })}
        >
          <option value="">Escolha…</option>
          {peoes.filter(livre).map((i) => (
            <option key={i.id} value={i.id}>
              {i.nome}
            </option>
          ))}
        </Selecao>
        <Selecao
          id="prenda"
          rotulo="Prenda"
          required
          value={dados.prenda_id}
          onChange={(e) => setDados({ ...dados, prenda_id: e.target.value })}
        >
          <option value="">Escolha…</option>
          {prendas.filter(livre).map((i) => (
            <option key={i.id} value={i.id}>
              {i.nome}
            </option>
          ))}
        </Selecao>

        <fieldset>
          <legend className="mb-1.5 text-sm font-medium text-texto-suave">Cor no tablado</legend>
          <div className="grid grid-cols-8 gap-2">
            {PALETA_PARES.map((cor) => {
              const selecionada = dados.cor.toLowerCase() === cor
              const usada = coresEmUso.has(cor)
              return (
                <button
                  key={cor}
                  type="button"
                  aria-label={`Cor ${cor}${usada ? ' (já usada por outro par)' : ''}`}
                  aria-pressed={selecionada}
                  onClick={() => setDados({ ...dados, cor })}
                  className={`relative aspect-square min-h-9 rounded-lg border-2 transition ${
                    selecionada ? 'scale-110 border-texto' : 'border-transparent'
                  } ${usada && !selecionada ? 'opacity-35' : ''}`}
                  style={{ background: cor }}
                >
                  {selecionada && (
                    <span className="absolute inset-0 m-auto size-4" style={{ color: corDoTextoSobre(cor) }}>
                      <Icone nome="ok" className="size-4" />
                    </span>
                  )}
                </button>
              )
            })}
          </div>
          <p className="mt-1.5 text-xs text-texto-suave">Cores apagadas já são usadas por outros pares.</p>
        </fieldset>

        {erro && <Aviso tipo="erro">{mensagemDeErro(erro)}</Aviso>}
      </form>
    </Folha>
  )
}
