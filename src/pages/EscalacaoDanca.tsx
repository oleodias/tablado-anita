// Duplas e escalação de UMA dança num ano.
// Cada dança tem as suas duplas (o peão pode dançar com prendas diferentes em
// danças diferentes). Os "pares padrão" servem só para preencher rápido.
import { useMemo, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import {
  Aviso,
  Avatar,
  Botao,
  Campo,
  Carregando,
  Etiqueta,
  Folha,
  Icone,
  NumeroPar,
  Segmentado,
  Selecao,
  Vazio,
} from '../components/ui'
import { PALETA_PARES, corDoTextoSobre, resumirEscalacao, sugerirCor, sugerirDuplasDosPares, sugerirNumero } from '../domain/pares'
import { podeEditar, useAuth } from '../lib/auth'
import {
  useAlterarEscalacao,
  useCoreografia,
  useDuplas,
  useEscalacao,
  useIntegrantes,
  usePares,
  useRemoverDupla,
  useSalvarDuplas,
  type DadosDupla,
} from '../lib/dados'
import { mensagemDeErro } from '../lib/erros'
import { usePrepararDanca } from '../lib/prepararDanca'
import type { Danca, Dupla, FuncaoEscalacao, Integrante } from '../types/db'

type Situacao = FuncaoEscalacao | 'fora'

export function EscalacaoDanca({ danca, ano }: { danca: Danca; ano: number }) {
  const { perfil } = useAuth()
  const editor = podeEditar(perfil)
  const integrantes = useIntegrantes()
  const paresPadrao = usePares()
  const coreografia = useCoreografia(danca.id, ano)
  const coreografiaId = coreografia.data?.id
  const escalacao = useEscalacao(coreografiaId)
  const duplas = useDuplas(coreografiaId)
  const alterar = useAlterarEscalacao(danca.id, ano)
  const salvarDuplas = useSalvarDuplas(danca.id, ano)
  const removerDupla = useRemoverDupla(danca.id, ano)
  const preparando = usePrepararDanca(danca.id, ano, editor)
  const [editando, setEditando] = useState<Dupla | 'nova' | null>(null)
  const [adicionandoAvulso, setAdicionandoAvulso] = useState(false)
  const [confirmandoLimpeza, setConfirmandoLimpeza] = useState(false)

  const porId = useMemo(() => new Map((integrantes.data ?? []).map((i) => [i.id, i])), [integrantes.data])
  const funcao = useMemo(() => {
    const mapa = new Map<string, FuncaoEscalacao>()
    for (const e of escalacao.data ?? []) mapa.set(e.integrante_id, e.funcao)
    return mapa
  }, [escalacao.data])

  const listaDuplas = duplas.data ?? []
  const emDupla = new Set(listaDuplas.flatMap((d) => [d.peao_id, d.prenda_id]))
  const escaladosSemDupla = [...funcao.keys()].filter((id) => !emDupla.has(id) && porId.has(id))

  const resumo = resumirEscalacao(
    [...funcao.entries()].flatMap(([id, f]) => {
      const i = porId.get(id)
      return i ? [{ genero: i.genero, funcao: f }] : []
    }),
  )

  const ocupado = alterar.isPending || salvarDuplas.isPending || removerDupla.isPending
  const erro = alterar.error ?? salvarDuplas.error ?? removerDupla.error
  const carregando = preparando || integrantes.isLoading || coreografia.isLoading || escalacao.isLoading || duplas.isLoading

  const definir = (ids: string[], nova: Situacao) =>
    alterar.mutate(ids.map((integranteId) => ({ integranteId, funcao: nova === 'fora' ? null : nova })))

  const sugestoes = sugerirDuplasDosPares(paresPadrao.data ?? [], listaDuplas, (id) => porId.get(id)?.ativo ?? false)

  return (
    <section className="rounded-2xl border border-borda bg-superficie">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-borda p-4">
        <div>
          <h2 className="font-semibold">Duplas e escalação {ano}</h2>
          <p className="text-sm text-texto-suave">
            {listaDuplas.length} duplas · {resumo.pares} pares titulares · {resumo.reservas} reservas
          </p>
        </div>
        {editor && (
          <div className="flex flex-wrap gap-2">
            <Botao className="text-sm" disabled={ocupado} onClick={() => setEditando('nova')}>
              <Icone nome="mais" className="size-4" /> Dupla
            </Botao>
            {sugestoes.length > 0 && (
              <Botao variante="secundario" className="text-sm" disabled={ocupado} onClick={() => salvarDuplas.mutate(sugestoes)}>
                Usar pares padrão ({sugestoes.length})
              </Botao>
            )}
          </div>
        )}
      </header>

      <div className="flex flex-col gap-4 p-4">
        {carregando && <Carregando />}

        {!carregando && funcao.size > 0 && resumo.problemas.length > 0 && (
          <Aviso tipo="info">
            <p className="flex items-center gap-2 font-medium text-texto">
              <Icone nome="alerta" className="size-4 text-destaque" /> Atenção ao regulamento (Força A)
            </p>
            <ul className="mt-1 list-disc pl-5">
              {resumo.problemas.map((p) => (
                <li key={p}>{p}</li>
              ))}
            </ul>
          </Aviso>
        )}
        {!carregando && funcao.size > 0 && resumo.problemas.length === 0 && (
          <Aviso tipo="sucesso">Escalação dentro dos limites da Força A (8 a 12 pares).</Aviso>
        )}
        {erro && <Aviso tipo="erro">{mensagemDeErro(erro)}</Aviso>}

        {!carregando && (integrantes.data ?? []).length === 0 && (
          <Vazio titulo="Nenhum integrante cadastrado">
            Cadastre em{' '}
            <Link to="/integrantes" className="text-link underline">
              Integrantes
            </Link>
            .
          </Vazio>
        )}

        {!carregando && listaDuplas.length === 0 && (integrantes.data ?? []).length > 0 && (
          <Vazio titulo="Nenhuma dupla nesta dança">
            {editor
              ? 'Cadastre os pares padrão em “Pares” para eles entrarem sozinhos, ou toque em “+ Dupla” para montar uma a uma.'
              : 'Os professores ainda não definiram as duplas.'}
          </Vazio>
        )}

        {listaDuplas.length > 0 && (
          <ul className="flex flex-col gap-2">
            {listaDuplas.map((d) => {
              const peao = porId.get(d.peao_id)
              const prenda = porId.get(d.prenda_id)
              const sit = funcao.get(d.peao_id) ?? 'titular'
              const minha = perfil?.integrante_id === d.peao_id || perfil?.integrante_id === d.prenda_id
              return (
                <li
                  key={d.id}
                  className={`flex flex-wrap items-center gap-3 rounded-xl border p-2.5 ${minha ? 'border-marca' : 'border-borda'}`}
                >
                  <NumeroPar numero={d.numero} cor={d.cor} />
                  <button
                    type="button"
                    disabled={!editor}
                    onClick={() => setEditando(d)}
                    className="min-w-0 flex-1 text-left text-sm leading-snug enabled:hover:underline"
                  >
                    <p className="truncate">{peao?.nome ?? '?'}</p>
                    <p className="truncate">{prenda?.nome ?? '?'}</p>
                  </button>
                  {minha && <Etiqueta cor="marca">Você</Etiqueta>}
                  {editor ? (
                    <div className="w-full sm:w-52">
                      <Segmentado<FuncaoEscalacao>
                        compacto
                        valor={sit}
                        desabilitado={ocupado}
                        aoMudar={(v) => definir([d.peao_id, d.prenda_id], v)}
                        opcoes={[
                          { valor: 'titular', texto: 'Titular' },
                          { valor: 'reserva', texto: 'Reserva' },
                        ]}
                      />
                    </div>
                  ) : (
                    <Etiqueta cor={sit === 'titular' ? 'sucesso' : 'destaque'}>{sit === 'titular' ? 'Titular' : 'Reserva'}</Etiqueta>
                  )}
                </li>
              )
            })}
          </ul>
        )}

        {(escaladosSemDupla.length > 0 || editor) && !carregando && (
          <div>
            <div className="mb-2 flex items-center justify-between gap-2">
              <h3 className="text-sm font-medium text-texto-suave">Escalados sem dupla ({escaladosSemDupla.length})</h3>
              {editor && (
                <Botao variante="texto" className="text-sm" onClick={() => setAdicionandoAvulso(true)}>
                  + Adicionar pessoa
                </Botao>
              )}
            </div>
            {escaladosSemDupla.length > 0 && (
              <ul className="flex flex-col gap-2">
                {escaladosSemDupla.map((id) => {
                  const i = porId.get(id)!
                  return (
                    <li key={id} className="flex flex-wrap items-center gap-3 rounded-xl border border-borda p-2.5">
                      <Avatar nome={i.nome} tamanho="sm" />
                      <span className="min-w-0 flex-1 truncate text-sm font-medium">{i.nome}</span>
                      {editor ? (
                        <div className="w-full sm:w-64">
                          <Segmentado<Situacao>
                            compacto
                            valor={funcao.get(id) ?? 'fora'}
                            desabilitado={ocupado}
                            aoMudar={(v) => definir([id], v)}
                            opcoes={[
                              { valor: 'fora', texto: 'Tirar' },
                              { valor: 'titular', texto: 'Titular' },
                              { valor: 'reserva', texto: 'Reserva' },
                            ]}
                          />
                        </div>
                      ) : (
                        <Etiqueta cor={funcao.get(id) === 'titular' ? 'sucesso' : 'destaque'}>
                          {funcao.get(id) === 'titular' ? 'Titular' : 'Reserva'}
                        </Etiqueta>
                      )}
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        )}

        {editor && (listaDuplas.length > 0 || funcao.size > 0) && (
          <div className="border-t border-borda pt-3">
            {!confirmandoLimpeza ? (
              <Botao variante="texto" className="text-sm text-perigo" onClick={() => setConfirmandoLimpeza(true)}>
                Limpar duplas e escalação desta dança
              </Botao>
            ) : (
              <Aviso tipo="erro">
                <p>Apagar todas as duplas e a escalação desta dança? As formações continuam salvas.</p>
                <div className="mt-2 flex gap-2">
                  <Botao variante="secundario" onClick={() => setConfirmandoLimpeza(false)}>
                    Não
                  </Botao>
                  <Botao
                    variante="perigo"
                    disabled={ocupado}
                    onClick={async () => {
                      for (const d of listaDuplas) await removerDupla.mutateAsync(d).catch(() => undefined)
                      definir([...funcao.keys()], 'fora')
                      setConfirmandoLimpeza(false)
                    }}
                  >
                    Sim, limpar
                  </Botao>
                </div>
              </Aviso>
            )}
          </div>
        )}
      </div>

      {editando && (
        <FormularioDupla
          dupla={editando === 'nova' ? null : editando}
          duplas={listaDuplas}
          integrantes={integrantes.data ?? []}
          aoSalvar={(d) => salvarDuplas.mutate([d], { onSuccess: () => setEditando(null) })}
          aoRemover={(d) =>
            removerDupla.mutate(d, {
              onSuccess: () => {
                definir([d.peao_id, d.prenda_id], 'fora')
                setEditando(null)
              },
            })
          }
          salvando={ocupado}
          erro={salvarDuplas.error ?? removerDupla.error}
          aoFechar={() => setEditando(null)}
        />
      )}

      {adicionandoAvulso && (
        <FormularioAvulso
          disponiveis={(integrantes.data ?? []).filter((i) => i.ativo && !funcao.has(i.id))}
          aoAdicionar={(id, f) => alterar.mutate([{ integranteId: id, funcao: f }], { onSuccess: () => setAdicionandoAvulso(false) })}
          aoFechar={() => setAdicionandoAvulso(false)}
        />
      )}
    </section>
  )
}

function FormularioDupla({
  dupla,
  duplas,
  integrantes,
  aoSalvar,
  aoRemover,
  salvando,
  erro,
  aoFechar,
}: {
  dupla: Dupla | null
  duplas: Dupla[]
  integrantes: Integrante[]
  aoSalvar: (d: DadosDupla) => void
  aoRemover: (d: Dupla) => void
  salvando: boolean
  erro: unknown
  aoFechar: () => void
}) {
  const outras = duplas.filter((d) => d.id !== dupla?.id)
  const [dados, setDados] = useState<DadosDupla>(
    dupla ?? {
      numero: sugerirNumero(outras.map((d) => d.numero)),
      peao_id: '',
      prenda_id: '',
      cor: sugerirCor(outras.map((d) => d.cor)),
    },
  )
  const ocupados = new Set(outras.flatMap((d) => [d.peao_id, d.prenda_id]))
  const livre = (i: Integrante) => i.ativo && !ocupados.has(i.id)
  const coresEmUso = new Set(outras.map((d) => d.cor.toLowerCase()))

  function aoEnviar(e: FormEvent) {
    e.preventDefault()
    aoSalvar(dupla ? { ...dados, id: dupla.id } : dados)
  }

  return (
    <Folha
      aberta
      aoFechar={aoFechar}
      titulo={dupla ? `Dupla ${dupla.numero}` : 'Nova dupla nesta dança'}
      rodape={
        <>
          {dupla && (
            <Botao variante="perigo" className="mr-auto" disabled={salvando} onClick={() => aoRemover(dupla)}>
              Desfazer dupla
            </Botao>
          )}
          <Botao variante="secundario" onClick={aoFechar}>
            Cancelar
          </Botao>
          <Botao type="submit" form="form-dupla" disabled={salvando || !dados.peao_id || !dados.prenda_id || !dados.numero}>
            {salvando ? 'Salvando…' : 'Salvar'}
          </Botao>
        </>
      }
    >
      <form id="form-dupla" onSubmit={aoEnviar} className="flex flex-col gap-4">
        <p className="text-sm text-texto-suave">Vale só para esta dança. Nas outras danças cada um pode ter outra dupla.</p>
        <Campo
          id="numero-dupla"
          rotulo="Número da dupla"
          type="number"
          inputMode="numeric"
          min={1}
          max={99}
          value={dados.numero || ''}
          onChange={(e) => setDados({ ...dados, numero: Number(e.target.value) })}
        />
        <Selecao id="dupla-peao" rotulo="Peão" required value={dados.peao_id} onChange={(e) => setDados({ ...dados, peao_id: e.target.value })}>
          <option value="">Escolha…</option>
          {integrantes
            .filter((i) => i.genero === 'peao' && (livre(i) || i.id === dupla?.peao_id))
            .map((i) => (
              <option key={i.id} value={i.id}>
                {i.nome}
              </option>
            ))}
        </Selecao>
        <Selecao id="dupla-prenda" rotulo="Prenda" required value={dados.prenda_id} onChange={(e) => setDados({ ...dados, prenda_id: e.target.value })}>
          <option value="">Escolha…</option>
          {integrantes
            .filter((i) => i.genero === 'prenda' && (livre(i) || i.id === dupla?.prenda_id))
            .map((i) => (
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
              return (
                <button
                  key={cor}
                  type="button"
                  aria-label={`Cor ${cor}`}
                  aria-pressed={selecionada}
                  onClick={() => setDados({ ...dados, cor })}
                  className={`relative aspect-square min-h-9 rounded-lg border-2 ${selecionada ? 'scale-110 border-texto' : 'border-transparent'} ${
                    coresEmUso.has(cor) && !selecionada ? 'opacity-35' : ''
                  }`}
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
        </fieldset>
        {erro ? <Aviso tipo="erro">{mensagemDeErro(erro)}</Aviso> : null}
      </form>
    </Folha>
  )
}

function FormularioAvulso({
  disponiveis,
  aoAdicionar,
  aoFechar,
}: {
  disponiveis: Integrante[]
  aoAdicionar: (id: string, funcao: FuncaoEscalacao) => void
  aoFechar: () => void
}) {
  const [id, setId] = useState('')
  const [f, setF] = useState<FuncaoEscalacao>('reserva')
  return (
    <Folha
      aberta
      aoFechar={aoFechar}
      titulo="Adicionar pessoa à escalação"
      rodape={
        <>
          <Botao variante="secundario" onClick={aoFechar}>
            Cancelar
          </Botao>
          <Botao disabled={!id} onClick={() => aoAdicionar(id, f)}>
            Adicionar
          </Botao>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <Selecao id="avulso" rotulo="Integrante" value={id} onChange={(e) => setId(e.target.value)}>
          <option value="">Escolha…</option>
          {disponiveis.map((i) => (
            <option key={i.id} value={i.id}>
              {i.nome}
            </option>
          ))}
        </Selecao>
        <Segmentado<FuncaoEscalacao>
          rotulo="Como"
          valor={f}
          aoMudar={setF}
          opcoes={[
            { valor: 'reserva', texto: 'Reserva' },
            { valor: 'titular', texto: 'Titular' },
          ]}
        />
      </div>
    </Folha>
  )
}
