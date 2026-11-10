import { useState, type FormEvent } from 'react'
import { Aviso, Botao, Campo, Marca } from '../components/ui'
import { traduzirErro } from '../lib/erros'
import { enderecoDoSite, supabase } from '../lib/supabase'

type Modo = 'entrar' | 'recuperar'

export function Entrar() {
  const [modo, setModo] = useState<Modo>('entrar')
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [mensagem, setMensagem] = useState<string | null>(null)

  async function aoEnviar(e: FormEvent) {
    e.preventDefault()
    setEnviando(true)
    setErro(null)
    setMensagem(null)

    if (modo === 'entrar') {
      const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password: senha })
      if (error) setErro(traduzirErro(error.message))
    } else {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo: enderecoDoSite })
      if (error) setErro(traduzirErro(error.message))
      else setMensagem('Se este e-mail estiver cadastrado, você vai receber um link para criar uma nova senha.')
    }
    setEnviando(false)
  }

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-sm flex-col justify-center gap-8 px-4 py-10">
      <Marca />

      <form onSubmit={aoEnviar} className="flex flex-col gap-4 rounded-2xl border border-borda bg-superficie p-5 shadow-sm">
        <div>
          <h1 className="text-xl font-semibold">{modo === 'entrar' ? 'Entrar' : 'Recuperar senha'}</h1>
          <p className="mt-1 text-sm text-texto-suave">
            {modo === 'entrar'
              ? 'Acesso restrito aos integrantes e professores do grupo.'
              : 'Informe seu e-mail para receber o link de redefinição.'}
          </p>
        </div>

        <Campo
          id="email"
          rotulo="E-mail"
          type="email"
          autoComplete="email"
          inputMode="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        {modo === 'entrar' && (
          <Campo
            id="senha"
            rotulo="Senha"
            type="password"
            autoComplete="current-password"
            required
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
          />
        )}

        {erro && <Aviso tipo="erro">{erro}</Aviso>}
        {mensagem && <Aviso tipo="sucesso">{mensagem}</Aviso>}

        <Botao type="submit" disabled={enviando}>
          {enviando ? 'Aguarde…' : modo === 'entrar' ? 'Entrar' : 'Enviar link'}
        </Botao>

        <Botao
          type="button"
          variante="texto"
          className="self-center text-sm"
          onClick={() => {
            setModo(modo === 'entrar' ? 'recuperar' : 'entrar')
            setErro(null)
            setMensagem(null)
          }}
        >
          {modo === 'entrar' ? 'Esqueci minha senha' : 'Voltar para o login'}
        </Botao>
      </form>

      <p className="text-center text-xs text-texto-suave">
        Ainda não tem acesso? Peça um convite a um dos professores.
      </p>
    </main>
  )
}
