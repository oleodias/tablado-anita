-- =============================================================================
-- Fase 3 — formações: reordenar numa única operação
-- =============================================================================
-- Como aplicar: Supabase → SQL Editor → New query → cole este arquivo → Run.
-- Execute uma única vez.
--
-- A tabela formacoes tem "ordem" única por coreografia. Trocar duas formações
-- de lugar com comandos separados esbarraria nessa regra; esta função faz tudo
-- numa transação só (a restrição é verificada só no final).
-- Roda com as permissões de quem chama (security invoker): as regras RLS
-- continuam valendo — só professores/admin conseguem alterar.
-- =============================================================================

create function public.reordenar_formacoes(p_coreografia_id uuid, p_ids uuid[])
returns void
language plpgsql
security invoker
set search_path = ''
as $$
begin
  set constraints all deferred;
  update public.formacoes f
  set ordem = nova.posicao
  from unnest(p_ids) with ordinality as nova(id, posicao)
  where f.id = nova.id
    and f.coreografia_id = p_coreografia_id;
end;
$$;

revoke execute on function public.reordenar_formacoes(uuid, uuid[]) from public, anon;
grant execute on function public.reordenar_formacoes(uuid, uuid[]) to authenticated;

-- =============================================================================
-- Duplas por dança
-- =============================================================================
-- O mesmo peão nem sempre dança com a mesma prenda: cada coreografia (dança
-- num ano) tem as suas duplas. A tabela "pares" continua existindo como
-- "pares padrão", usados só como sugestão para preencher uma dança.
-- =============================================================================

create table public.duplas (
  id             uuid primary key default gen_random_uuid(),
  coreografia_id uuid not null references public.coreografias (id) on delete cascade,
  numero         smallint not null check (numero > 0),
  peao_id        uuid not null references public.integrantes (id) on delete cascade,
  prenda_id      uuid not null references public.integrantes (id) on delete cascade,
  cor            text not null default '#888888' check (cor ~ '^#[0-9a-fA-F]{6}$'),
  criado_em      timestamptz not null default now(),
  check (peao_id <> prenda_id),
  -- cada pessoa está em no máximo uma dupla por dança
  constraint duplas_peao_unico unique (coreografia_id, peao_id),
  constraint duplas_prenda_unica unique (coreografia_id, prenda_id),
  constraint duplas_numero_unico unique (coreografia_id, numero) deferrable initially deferred
);

create index duplas_coreografia on public.duplas (coreografia_id);

alter table public.duplas enable row level security;
create policy "membros leem duplas" on public.duplas
  for select to authenticated using (public.e_membro());
create policy "editores inserem duplas" on public.duplas
  for insert to authenticated with check (public.pode_editar());
create policy "editores alteram duplas" on public.duplas
  for update to authenticated using (public.pode_editar()) with check (public.pode_editar());
create policy "editores removem duplas" on public.duplas
  for delete to authenticated using (public.pode_editar());
revoke all on public.duplas from anon;

-- =============================================================================
-- Indumentária usada em cada dança (conjuntos definidos em src/domain/indumentarias.ts)
-- =============================================================================
alter table public.coreografias
  add column indumentaria text not null default 'azul-2026'
  check (indumentaria ~ '^[a-z0-9-]{1,40}$');

-- =============================================================================
-- Kamé e Kairú — tipo de indumentária de cada integrante
-- =============================================================================
-- Inspirados na cultura Kaingang, são os dois tipos de indumentária da invernada.
--   indumentaria             → tipo principal do integrante
--   indumentaria_danca       → só se for DIFERENTE do principal nas danças tradicionais
--   indumentaria_coreografia → só se for DIFERENTE do principal na coreografia (entrada/saída)
-- =============================================================================
create type public.tipo_indumentaria as enum ('kame', 'kairu');

alter table public.integrantes
  add column indumentaria             public.tipo_indumentaria,
  add column indumentaria_danca       public.tipo_indumentaria,
  add column indumentaria_coreografia public.tipo_indumentaria;

-- Cada pessoa define a PRÓPRIA indumentária (dançarinos não podem editar a
-- tabela de integrantes; esta função altera só o integrante vinculado à conta).
create function public.definir_minha_indumentaria(
  p_principal   public.tipo_indumentaria,
  p_danca       public.tipo_indumentaria,
  p_coreografia public.tipo_indumentaria
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_integrante uuid;
begin
  select integrante_id into v_integrante from public.perfis where id = auth.uid();
  if v_integrante is null then
    raise exception 'Sua conta não está vinculada a um integrante.';
  end if;
  update public.integrantes
  set indumentaria = p_principal,
      indumentaria_danca = p_danca,
      indumentaria_coreografia = p_coreografia
  where id = v_integrante;
end;
$$;

revoke execute on function public.definir_minha_indumentaria(public.tipo_indumentaria, public.tipo_indumentaria, public.tipo_indumentaria) from public, anon;
grant execute on function public.definir_minha_indumentaria(public.tipo_indumentaria, public.tipo_indumentaria, public.tipo_indumentaria) to authenticated;
