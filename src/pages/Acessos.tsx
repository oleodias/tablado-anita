import { Aviso, CabecalhoPagina, Carregando, Etiqueta, Selecao } from '../components/ui'
import { useAuth } from '../lib/auth'
import { useAtualizarPerfil, useIntegrantes, usePerfis } from '../lib/dados'
import { mensagemDeErro } from '../lib/erros'
import { NOME_PAPEL, type PapelUsuario, type Perfil } from '../types/db'

const URL_USUARIOS_SUPABASE = 'https://supabase.com/dashboard/project/iwjrufbiwgycigxqggui/auth/users'

export function Acessos() {
  const { perfil: eu, recarregarPerfil } = useAuth()
  const perfis = usePerfis()
  const integrantes = useIntegrantes()
  const atualizar = useAtualizarPerfil()

  if (eu?.papel !== 'admin') {
    return <Aviso tipo="erro">Somente administradores acessam esta página.</Aviso>
  }

  const vinculados = new Map((perfis.data ?? []).filter((p) => p.integrante_id).map((p) => [p.integrante_id!, p]))

  function alterar(p: Perfil, dados: { papel?: PapelUsuario; integrante_id?: string | null }) {
    atualizar.mutate(
      { id: p.id, ...dados },
      { onSuccess: () => p.id === eu?.id && recarregarPerfil() },
    )
  }

  return (
    <>
      <CabecalhoPagina
        titulo="Acessos"
        subtitulo="Quem pode entrar, o que pode fazer e a qual integrante cada conta corresponde."
      />

      <Aviso tipo="info">
        <p className="font-medium text-texto">Como convidar alguém</p>
        <ol className="mt-1 list-decimal pl-5">
          <li>
            Abra{' '}
            <a href={URL_USUARIOS_SUPABASE} target="_blank" rel="noreferrer" className="text-link underline">
              Supabase → Authentication → Users
            </a>{' '}
            → <b>Add user</b> → <b>Send invitation</b> e informe o e-mail.
          </li>
          <li>A pessoa recebe o e-mail, cria a senha e aparece aqui como Dançarino.</li>
          <li>Vincule a conta ao integrante correspondente (e mude o papel, se for professor).</li>
        </ol>
      </Aviso>

      {(perfis.isLoading || integrantes.isLoading) && <Carregando />}
      {atualizar.error && (
        <div className="mt-4">
          <Aviso tipo="erro">{mensagemDeErro(atualizar.error)}</Aviso>
        </div>
      )}

      {perfis.data && integrantes.data && (
        <ul className="mt-5 flex flex-col gap-3">
          {perfis.data.map((p) => {
            const souEu = p.id === eu.id
            return (
              <li key={p.id} className="rounded-2xl border border-borda bg-superficie p-4">
                <div className="mb-3 flex flex-wrap items-center gap-2">
                  <p className="font-medium">{p.nome}</p>
                  {souEu && <Etiqueta cor="marca">Você</Etiqueta>}
                  <p className="w-full truncate text-sm text-texto-suave">{p.email}</p>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Selecao
                    id={`papel-${p.id}`}
                    rotulo="Papel"
                    value={p.papel}
                    // Evita que o admin tire o próprio acesso de administrador por engano.
                    disabled={souEu || atualizar.isPending}
                    onChange={(e) => alterar(p, { papel: e.target.value as PapelUsuario })}
                  >
                    {(Object.keys(NOME_PAPEL) as PapelUsuario[]).map((papel) => (
                      <option key={papel} value={papel}>
                        {NOME_PAPEL[papel]}
                      </option>
                    ))}
                  </Selecao>
                  <Selecao
                    id={`integrante-${p.id}`}
                    rotulo="Integrante vinculado"
                    value={p.integrante_id ?? ''}
                    disabled={atualizar.isPending}
                    onChange={(e) => alterar(p, { integrante_id: e.target.value || null })}
                  >
                    <option value="">— nenhum (ex.: professor que não dança) —</option>
                    {integrantes.data
                      .filter((i) => !vinculados.has(i.id) || vinculados.get(i.id)!.id === p.id)
                      .map((i) => (
                        <option key={i.id} value={i.id}>
                          {i.nome}
                        </option>
                      ))}
                  </Selecao>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </>
  )
}
