import { useQuery } from '@tanstack/react-query'
import { Aviso, Carregando } from '../components/ui'
import { blocoForaDoSorteio, tempoDeApresentacaoMin } from '../domain/enart'
import { useAuth } from '../lib/auth'
import { supabase } from '../lib/supabase'
import type { Danca } from '../types/db'

const ANO_ATUAL = new Date().getFullYear()

export function Inicio() {
  const { perfil } = useAuth()
  const fora = blocoForaDoSorteio(ANO_ATUAL)

  const { data: dancas, isLoading, error } = useQuery({
    queryKey: ['dancas'],
    queryFn: async () => {
      const { data, error } = await supabase.from('dancas').select('*').order('id')
      if (error) throw error
      return data as Danca[]
    },
  })

  return (
    <div className="flex flex-col gap-6">
      <section>
        <h1 className="text-2xl font-semibold">Olá{perfil ? `, ${perfil.nome.split(' ')[0]}` : ''}!</h1>
        <p className="mt-1 text-texto-suave">
          ENART {ANO_ATUAL}: 21 danças em sorteio. O Bloco {fora} fica fora neste ano.
        </p>
      </section>

      {isLoading && <Carregando texto="Carregando danças…" />}
      {error && <Aviso tipo="erro">Não foi possível carregar as danças.</Aviso>}

      {dancas && (
        <div className="grid gap-4 sm:grid-cols-2">
          {([1, 2, 3, 4] as const).map((bloco) => {
            const doBloco = dancas.filter((d) => d.bloco === bloco)
            const estaFora = bloco === fora
            return (
              <section
                key={bloco}
                className={`rounded-2xl border border-borda bg-superficie p-4 ${estaFora ? 'opacity-60' : ''}`}
              >
                <header className="mb-3 flex items-baseline justify-between">
                  <h2 className="font-semibold">Bloco {bloco}</h2>
                  {estaFora && (
                    <span className="rounded-full bg-superficie-2 px-2 py-0.5 text-xs text-texto-suave">
                      fora do sorteio em {ANO_ATUAL}
                    </span>
                  )}
                </header>
                <ul className="flex flex-col divide-y divide-borda">
                  {doBloco.map((d) => (
                    <li key={d.id} className="flex items-center justify-between py-2 text-sm">
                      <span>{d.nome}</span>
                      <span className="text-xs text-texto-suave">
                        urna {d.urna} · {tempoDeApresentacaoMin(d)} min
                      </span>
                    </li>
                  ))}
                </ul>
              </section>
            )
          })}
        </div>
      )}

      <p className="text-sm text-texto-suave">
        Em breve: tablado 3D, integrantes, escalação e formações de cada dança.
      </p>
    </div>
  )
}
