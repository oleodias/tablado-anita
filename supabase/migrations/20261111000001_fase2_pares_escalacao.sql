-- =============================================================================
-- Fase 2 — cadastros: número dos pares e coreografia única por dança/ano
-- =============================================================================
-- Como aplicar: Supabase → SQL Editor → New query → cole este arquivo → Run.
-- Execute uma única vez (depois da estrutura inicial).
-- =============================================================================

-- Número do par ("Par 1", "Par 2", ...). Opcional, mas único quando informado.
alter table public.pares
  add column numero smallint check (numero > 0);

alter table public.pares
  add constraint pares_numero_unico unique (numero);

-- Uma coreografia por dança e por ano.
-- Troca o índice parcial por uma restrição comum, para a aplicação poder usar
-- "inserir ou aproveitar a existente" (upsert). Entradas/saídas têm danca_id
-- nulo e, por isso, continuam podendo existir várias no mesmo ano.
drop index public.coreografias_danca_por_ano;

alter table public.coreografias
  add constraint coreografias_danca_ano_unica unique (danca_id, ano);

-- Escalação: só faz sentido escalar alguém uma vez por coreografia (já garantido
-- pela chave primária). Índice para listar rapidamente "em quais danças eu estou".
create index if not exists escalacao_coreografia on public.escalacao (coreografia_id);
