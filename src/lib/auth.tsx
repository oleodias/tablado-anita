import type { Session } from '@supabase/supabase-js'
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { Perfil } from '../types/db'
import { supabase, tipoLinkDeAcesso } from './supabase'

interface EstadoAuth {
  carregando: boolean
  sessao: Session | null
  perfil: Perfil | null
  /** true quando a pessoa chegou por convite/recuperação e ainda precisa criar a senha */
  precisaDefinirSenha: boolean
  senhaDefinida: () => void
  sair: () => Promise<void>
}

const AuthContext = createContext<EstadoAuth | null>(null)

async function buscarPerfil(id: string): Promise<Perfil | null> {
  const { data, error } = await supabase
    .from('perfis')
    .select('id, nome, email, papel, integrante_id')
    .eq('id', id)
    .maybeSingle()
  if (error) {
    console.error('Erro ao carregar perfil', error)
    return null
  }
  return data
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [carregando, setCarregando] = useState(true)
  const [sessao, setSessao] = useState<Session | null>(null)
  const [perfil, setPerfil] = useState<Perfil | null>(null)
  const [precisaDefinirSenha, setPrecisaDefinirSenha] = useState(tipoLinkDeAcesso !== null)

  useEffect(() => {
    let ativo = true

    const aplicar = async (nova: Session | null) => {
      if (!ativo) return
      setSessao(nova)
      setPerfil(nova ? await buscarPerfil(nova.user.id) : null)
      if (ativo) setCarregando(false)
    }

    supabase.auth.getSession().then(({ data }) => aplicar(data.session))

    const { data } = supabase.auth.onAuthStateChange((evento, nova) => {
      if (evento === 'PASSWORD_RECOVERY') setPrecisaDefinirSenha(true)
      // setTimeout evita chamar o Supabase de dentro do próprio callback (recomendação da biblioteca)
      setTimeout(() => aplicar(nova), 0)
    })

    return () => {
      ativo = false
      data.subscription.unsubscribe()
    }
  }, [])

  const valor: EstadoAuth = {
    carregando,
    sessao,
    perfil,
    precisaDefinirSenha,
    senhaDefinida: () => setPrecisaDefinirSenha(false),
    sair: async () => {
      await supabase.auth.signOut()
    },
  }

  return <AuthContext.Provider value={valor}>{children}</AuthContext.Provider>
}

// oxlint-disable-next-line react/only-export-components
export function useAuth(): EstadoAuth {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth precisa estar dentro de <AuthProvider>')
  return ctx
}

// oxlint-disable-next-line react/only-export-components
export function podeEditar(perfil: Perfil | null): boolean {
  return perfil?.papel === 'admin' || perfil?.papel === 'professor'
}
