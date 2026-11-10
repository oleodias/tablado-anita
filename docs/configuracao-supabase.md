# Configuração do Supabase

Projeto: `tablado-anita-garibaldi` — região São Paulo.

## 1. Aplicar a estrutura do banco (uma única vez)

1. Abra o projeto no Supabase → menu **SQL Editor** → **New query**.
2. Copie todo o conteúdo de
   [`supabase/migrations/20261110000001_estrutura_inicial.sql`](../supabase/migrations/20261110000001_estrutura_inicial.sql)
   e cole no editor.
3. Clique em **Run**. Deve aparecer "Success. No rows returned".
4. Confira em **Table Editor**: devem existir as tabelas `perfis`, `integrantes`, `dancas`
   (com 28 linhas), `tablados`, etc.

Futuras alterações do banco virão como novos arquivos em `supabase/migrations/`, sempre
aplicados na ordem do nome, **cada um uma única vez**:

| Arquivo | Fase | Aplicado? |
|---|---|---|
| `20261110000001_estrutura_inicial.sql` | 0 | sim |
| `20261111000001_fase2_pares_escalacao.sql` | 2 | sim |
| `20261112000001_fase1_tablado_estimado.sql` | 1 | sim |
| `20261113000001_fase3_formacoes.sql` | 3 | aplicar antes de publicar a fase 3 |

## 2. Configurar os endereços de login

**Authentication → URL Configuration**

- **Site URL:** `https://oleodias.github.io/tablado-anita/`
- **Redirect URLs:**
  - `https://oleodias.github.io/tablado-anita/**`
  - `http://localhost:5173/**`

## 3. Criar a sua conta de administrador

1. **Authentication → Users → Add user → Create new user**.
2. Informe seu e-mail e uma senha, e marque **Auto Confirm User**.
3. Abra o **SQL Editor**, cole o conteúdo de
   [`supabase/scripts/tornar-admin.sql`](../supabase/scripts/tornar-admin.sql),
   troque o e-mail pelo seu e clique em **Run**.

## 4. Convidar professores e dançarinos

**Authentication → Users → Add user → Send invitation**, informando o e-mail da pessoa.
Ela recebe um link, entra na aplicação e cria a própria senha.

Para tornar alguém professor, use o mesmo script do passo 3 trocando `'admin'` por `'professor'`.

> **Limite de e-mails:** o envio de e-mails embutido no plano gratuito é bem restrito
> (poucos por hora). Para convidar o grupo todo de uma vez, configure um SMTP gratuito
> em **Project Settings → Authentication → SMTP Settings** (ex.: Resend, Brevo), ou
> crie as contas com "Create new user" + senha provisória.

## 5. Plano gratuito: pausa por inatividade

Projetos gratuitos são pausados após 7 dias sem nenhum acesso. Se acontecer, entre no
painel do Supabase e clique em **Restore project**. Nenhum dado é perdido.

## Chaves

- A **Project URL** e a chave **publishable** ficam no arquivo `.env` do repositório:
  são públicas por natureza.
- A chave **secret / service_role** dá acesso total ao banco e **nunca** deve ir para o
  código, para o GitHub ou para mensagens.
