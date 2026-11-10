// Traduz as mensagens de erro do Supabase (em inglês) para o usuário.
export function traduzirErro(mensagem: string): string {
  const m = mensagem.toLowerCase()
  if (m.includes('invalid login credentials')) return 'E-mail ou senha incorretos.'
  if (m.includes('email not confirmed')) return 'Este e-mail ainda não foi confirmado. Verifique sua caixa de entrada.'
  if (m.includes('rate limit') || m.includes('too many')) return 'Muitas tentativas. Aguarde alguns minutos e tente de novo.'
  if (m.includes('password should be') || m.includes('weak')) return 'A senha é muito fraca. Use pelo menos 8 caracteres.'
  if (m.includes('same') && m.includes('password')) return 'A nova senha precisa ser diferente da anterior.'
  if (m.includes('fetch') || m.includes('network')) return 'Sem conexão com o servidor. Verifique sua internet.'
  return 'Não foi possível concluir. Tente novamente.'
}
