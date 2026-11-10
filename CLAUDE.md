# Tablado Anita — guia para assistentes de código

Aplicação para organizar as coreografias do Grupo de Artes Nativas Anita Garibaldi (Força A) no ENART.
O dono do projeto está aprendendo e vai manter o código: prefira soluções simples, legíveis e comentadas em português.

## Convenções
- Código, nomes de variáveis, comentários e textos da interface em **português do Brasil**.
- React + TypeScript + Vite; Tailwind v4 com tokens em `src/index.css` (nunca cores fixas nos componentes).
- Dados via `@supabase/supabase-js` + `@tanstack/react-query`. Tipos do banco em `src/types/db.ts`.
- Regras do regulamento ENART ficam em `src/domain/` e têm testes (Vitest).
- Interface pensada primeiro para celular (alvos de toque ≥ 44px).

## Banco
- Toda mudança de banco é um novo arquivo em `supabase/migrations/` (nunca editar migrações já aplicadas).
- Toda tabela nova precisa de RLS: membros leem (`e_membro()`), editores escrevem (`pode_editar()`).
- Coordenadas do tablado em metros, origem no centro; z negativo = lado dos jurados; rotação 0 = de frente para os jurados.
- Teste migrações num Postgres local com stub de `auth.users`/`auth.uid()` antes de pedir para aplicar.

## Verificação antes de entregar
`npm run lint && npm test && npm run build`
