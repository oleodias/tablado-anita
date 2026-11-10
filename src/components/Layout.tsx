import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../lib/auth'
import { Botao, Marca } from './ui'

const NOMES_PAPEL = { admin: 'Administrador', professor: 'Professor', dancarino: 'Dançarino' } as const

export function Layout() {
  const { perfil, sair } = useAuth()

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="sticky top-0 z-10 border-b border-borda bg-fundo/90 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3">
          <NavLink to="/" aria-label="Início">
            <Marca />
          </NavLink>
          <div className="flex items-center gap-3">
            {perfil && (
              <div className="hidden text-right text-sm leading-tight sm:block">
                <p className="font-medium">{perfil.nome}</p>
                <p className="text-xs text-texto-suave">{NOMES_PAPEL[perfil.papel]}</p>
              </div>
            )}
            <Botao variante="secundario" className="text-sm" onClick={sair}>
              Sair
            </Botao>
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6">
        <Outlet />
      </main>
    </div>
  )
}
