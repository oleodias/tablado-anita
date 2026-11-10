import { useState, type FormEvent } from 'react'
import { Aviso, Botao, Campo, Marca } from '../components/ui'
import { useAuth } from '../lib/auth'
import { traduzirErro } from '../lib/erros'
import { supabase } from '../lib/supabase'

const MINIMO = 8

export function DefinirSenha() {
  const { perfil, senhaDefinida } = useAuth()
  const [senha, setSenha] = useState('')
  const [confirmacao, setConfirmacao] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  async function aoEnviar(e: FormEvent) {
    e.preventDefault()
    setErro(null)
    if (senha.length < MINIMO) return setErro(`A senha precisa ter pelo menos ${MINIMO} caracteres.`)
    if (senha !== confirmacao) return setErro('As senhas não conferem.')

    setEnviando(true)
    const { error } = await supabase.auth.updateUser({ password: senha })
    setEnviando(false)
    if (error) return setErro(traduzirErro(error.message))
    senhaDefinida()
  }

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-sm flex-col justify-center gap-8 px-4 py-10">
      <Marca />
      <form onSubmit={aoEnviar} className="flex flex-col gap-4 rounded-2xl border border-borda bg-superficie p-5 shadow-sm">
        <div>
          <h1 className="text-xl font-semibold">
            {perfil ? `Olá, ${perfil.nome.split(' ')[0]}!` : 'Crie sua senha'}
          </h1>
          <p className="mt-1 text-sm text-texto-suave">
            Escolha uma senha para acessar o Tablado Anita. Mínimo de {MINIMO} caracteres.
          </p>
        </div>
        <Campo
          id="nova-senha"
          rotulo="Nova senha"
          type="password"
          autoComplete="new-password"
          required
          minLength={MINIMO}
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
        />
        <Campo
          id="confirmar-senha"
          rotulo="Confirme a senha"
          type="password"
          autoComplete="new-password"
          required
          value={confirmacao}
          onChange={(e) => setConfirmacao(e.target.value)}
        />
        {erro && <Aviso tipo="erro">{erro}</Aviso>}
        <Botao type="submit" disabled={enviando}>
          {enviando ? 'Salvando…' : 'Salvar senha'}
        </Botao>
      </form>
    </main>
  )
}
