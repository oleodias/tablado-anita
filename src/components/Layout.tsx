import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../lib/auth'
import { NOME_PAPEL } from '../types/db'
import { Botao, Icone, Marca, type NomeIcone } from './ui'

interface ItemMenu {
  para: string
  texto: string
  icone: NomeIcone
  soAdmin?: boolean
}

const MENU: ItemMenu[] = [
  { para: '/', texto: 'Início', icone: 'inicio' },
  { para: '/dancas', texto: 'Danças', icone: 'dancas' },
  { para: '/tablado', texto: 'Tablado', icone: 'tablado' },
  { para: '/integrantes', texto: 'Integrantes', icone: 'integrantes' },
  { para: '/pares', texto: 'Pares', icone: 'pares' },
  { para: '/acessos', texto: 'Acessos', icone: 'acessos', soAdmin: true },
]

export function Layout() {
  const { perfil, sair } = useAuth()
  const itens = MENU.filter((i) => !i.soAdmin || perfil?.papel === 'admin')

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="sticky top-0 z-20 border-b border-borda bg-fundo/90 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-2.5">
          <NavLink to="/" aria-label="Início">
            <Marca compacta />
          </NavLink>

          {/* Menu do computador */}
          <nav aria-label="Principal" className="hidden items-center gap-1 md:flex">
            {itens.map((i) => (
              <NavLink
                key={i.para}
                to={i.para}
                end={i.para === '/'}
                className={({ isActive }) =>
                  `rounded-lg px-3 py-2 text-sm font-medium transition ${
                    isActive ? 'bg-marca/15 text-link' : 'text-texto-suave hover:text-texto'
                  }`
                }
              >
                {i.texto}
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            {perfil && (
              <div className="hidden text-right text-sm leading-tight lg:block">
                <p className="font-medium">{perfil.nome}</p>
                <p className="text-xs text-texto-suave">{NOME_PAPEL[perfil.papel]}</p>
              </div>
            )}
            <Botao variante="secundario" className="text-sm" onClick={sair}>
              Sair
            </Botao>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 pb-28 pt-6 md:pb-10">
        <Outlet />
      </main>

      {/* Abas do celular */}
      <nav
        aria-label="Principal"
        className="fixed inset-x-0 bottom-0 z-20 border-t border-borda bg-fundo/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden"
      >
        <ul className="mx-auto flex max-w-lg">
          {itens.map((i) => (
            <li key={i.para} className="flex-1">
              <NavLink
                to={i.para}
                end={i.para === '/'}
                className={({ isActive }) =>
                  `flex min-h-14 flex-col items-center justify-center gap-0.5 text-[11px] font-medium ${
                    isActive ? 'text-link' : 'text-texto-suave'
                  }`
                }
              >
                <Icone nome={i.icone} className="size-6" />
                {i.texto}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  )
}
