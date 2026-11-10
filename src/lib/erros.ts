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

/** Mensagem amigável para erros de gravação no banco. */
export function mensagemDeErro(erro: unknown): string {
  const e = erro as { code?: string; message?: string; details?: string } | null
  const texto = `${e?.message ?? ''} ${e?.details ?? ''}`
  switch (e?.code) {
    case '23505': // valor repetido
      if (texto.includes('pares_numero_unico')) return 'Já existe um par com esse número.'
      if (texto.includes('duplas_numero_unico')) return 'Já existe uma dupla com esse número nesta dança.'
      if (texto.includes('duplas_peao_unico')) return 'Esse peão já está em outra dupla nesta dança.'
      if (texto.includes('duplas_prenda_unica')) return 'Essa prenda já está em outra dupla nesta dança.'
      if (texto.includes('peao_id') || texto.includes('prenda_id')) return 'Essa pessoa já faz parte de outro par.'
      if (texto.includes('integrante_id')) return 'Esse integrante já está vinculado a outra conta.'
      return 'Esse registro já existe.'
    case '23514': // regra de validação
      return 'Algum dado está fora do permitido. Confira os campos.'
    case '42501': // sem permissão (RLS)
      return 'Você não tem permissão para fazer essa alteração.'
  }
  return traduzirErro(e?.message ?? '')
}
