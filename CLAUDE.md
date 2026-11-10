# Tablado Anita — guia para assistentes de código

Aplicação para organizar as coreografias do Grupo de Artes Nativas Anita Garibaldi (Força A) no ENART.
O dono do projeto está aprendendo e vai manter o código: prefira soluções simples, legíveis e comentadas em português.

## Convenções
- Código, nomes de variáveis, comentários e textos da interface em **português do Brasil**.
- React + TypeScript + Vite; Tailwind v4 com tokens em `src/index.css` (nunca cores fixas nos componentes).
- Dados via `@supabase/supabase-js` + `@tanstack/react-query`. Tipos do banco em `src/types/db.ts`.
- Regras do regulamento ENART ficam em `src/domain/` e têm testes (Vitest).
- Interface pensada primeiro para celular (alvos de toque ≥ 44px).

## Regras do grupo
- **Duplas variam por dança**: use a tabela `duplas` (por coreografia). `pares` são só "pares padrão" para preencher rápido.
- **Kamé / Kairú** (indumentárias inspiradas na cultura Kaingang): tipo principal em `integrantes.indumentaria`, com exceções opcionais para dança e coreografia. Kamé = pala no ombro esquerdo, cores vivas; Kairú = poncho, cores sóbrias. **Não inventar estampas nem ornamentos**: modelar só a partir das fotos enviadas pelo grupo; na dúvida, perguntar.
- Conjuntos de pilcha (cores) em `src/domain/indumentarias.ts`.
- Entrada do grupo: centro do fundo. Saída: lateral direita dos jurados.

## Banco
- Toda mudança de banco é um novo arquivo em `supabase/migrations/` (nunca editar migrações já aplicadas).
- Toda tabela nova precisa de RLS: membros leem (`e_membro()`), editores escrevem (`pode_editar()`).
- Coordenadas do tablado em metros, origem no centro; **z positivo = frente (mesa dos jurados)**, x positivo = direita de quem está na mesa dos jurados; rotação 0 = de frente para os jurados. Placas: colunas A, B, C… (esquerda→direita dos jurados), fileiras 1, 2, 3… (frente→fundo). Ver `src/domain/tablado.ts`.
- Cena 3D em `src/three/` (React Three Fiber + drei), carregada sob demanda (lazy) para não pesar o resto do app.
- Teste migrações num Postgres local com stub de `auth.users`/`auth.uid()` antes de pedir para aplicar.

## Verificação antes de entregar
`npm run lint && npm test && npm run build`
