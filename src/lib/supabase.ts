import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const chavePublica = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined

if (!url || !chavePublica) {
  throw new Error('Configure VITE_SUPABASE_URL e VITE_SUPABASE_PUBLISHABLE_KEY no arquivo .env')
}

/**
 * Links de convite e de "esqueci a senha" chegam com `#...&type=invite` (ou
 * `type=recovery`) no endereço. O cliente do Supabase consome e apaga esse
 * trecho ao iniciar, então guardamos o tipo ANTES de criar o cliente para
 * saber que a pessoa precisa definir uma senha.
 */
export const tipoLinkDeAcesso: 'invite' | 'recovery' | null = (() => {
  const tipo = new URLSearchParams(window.location.hash.slice(1)).get('type')
  return tipo === 'invite' || tipo === 'recovery' ? tipo : null
})()

export const supabase = createClient(url, chavePublica, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
})

/** Endereço para onde os e-mails de acesso devem levar a pessoa. */
export const enderecoDoSite = new URL(import.meta.env.BASE_URL, window.location.origin).toString()
