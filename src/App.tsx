import { Navigate, Route, Routes } from 'react-router-dom'
import { Layout } from './components/Layout'
import { Aviso, Carregando } from './components/ui'
import { useAuth } from './lib/auth'
import { Acessos } from './pages/Acessos'
import { Danca } from './pages/Danca'
import { Dancas } from './pages/Dancas'
import { DefinirSenha } from './pages/DefinirSenha'
import { Entrar } from './pages/Entrar'
import { Inicio } from './pages/Inicio'
import { Integrantes } from './pages/Integrantes'
import { Pares } from './pages/Pares'

export function App() {
  const { carregando, sessao, perfil, precisaDefinirSenha, sair } = useAuth()

  if (carregando) return <Carregando />

  // Sem login: só a tela de entrada.
  if (!sessao) {
    return (
      <Routes>
        <Route path="/entrar" element={<Entrar />} />
        <Route path="*" element={<Navigate to="/entrar" replace />} />
      </Routes>
    )
  }

  // Chegou por convite ou "esqueci a senha": cria a senha antes de tudo.
  if (precisaDefinirSenha) return <DefinirSenha />

  // Conta existe no Supabase mas sem perfil (não deveria acontecer).
  if (!perfil) {
    return (
      <main className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center gap-4 px-4">
        <Aviso tipo="erro">Sua conta não está vinculada ao grupo. Fale com um professor.</Aviso>
        <button className="text-link underline" onClick={sair}>
          Sair
        </button>
      </main>
    )
  }

  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Inicio />} />
        <Route path="dancas" element={<Dancas />} />
        <Route path="dancas/:slug" element={<Danca />} />
        <Route path="integrantes" element={<Integrantes />} />
        <Route path="pares" element={<Pares />} />
        {perfil.papel === 'admin' && <Route path="acessos" element={<Acessos />} />}
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
