-- =============================================================================
-- Tablado Anita — estrutura inicial do banco
-- =============================================================================
-- Como aplicar: Supabase → SQL Editor → New query → cole este arquivo → Run.
-- Execute uma única vez, num projeto novo.
--
-- Resumo:
--   perfis        → uma linha por conta de login (papel: admin/professor/dancarino)
--   integrantes   → os dançarinos do grupo (podem existir antes de terem login)
--   pares         → peão + prenda
--   dancas        → as 28 danças do Regulamento ENART (já preenchidas no fim)
--   tablados      → dimensões dos tablados (ENART, ensaio, ...)
--   coreografias  → uma dança (ou entrada/saída) montada pelo grupo em um ano
--   escalacao     → quem participa de cada coreografia
--   formacoes     → os "momentos" de uma coreografia, em ordem
--   posicoes      → onde cada integrante está em cada formação
--
-- Coordenadas: metros, com origem (0,0) no CENTRO do tablado.
--   x → positivo para a direita de quem olha dos jurados para o tablado
--   z → positivo em direção ao FUNDO do tablado (jurados ficam em z negativo)
--   rotacao → graus; 0 = de frente para os jurados, sentido horário visto de cima
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Tipos
-- -----------------------------------------------------------------------------
create type public.papel_usuario as enum ('admin', 'professor', 'dancarino');
create type public.genero_danca as enum ('peao', 'prenda');
create type public.tipo_danca as enum ('fila', 'roda', 'pares_independentes');
create type public.tipo_coreografia as enum ('danca_tradicional', 'entrada', 'saida');
create type public.funcao_escalacao as enum ('titular', 'reserva');

-- -----------------------------------------------------------------------------
-- Função utilitária: mantém a coluna atualizado_em em dia
-- -----------------------------------------------------------------------------
create function public.tocar_atualizado_em()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.atualizado_em := now();
  return new;
end;
$$;

-- -----------------------------------------------------------------------------
-- Integrantes
-- -----------------------------------------------------------------------------
create table public.integrantes (
  id            uuid primary key default gen_random_uuid(),
  nome          text not null check (length(trim(nome)) > 0),
  apelido       text,
  genero        public.genero_danca not null,
  ativo         boolean not null default true,
  observacoes   text,
  criado_em     timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

create trigger integrantes_atualizado_em
  before update on public.integrantes
  for each row execute function public.tocar_atualizado_em();

-- -----------------------------------------------------------------------------
-- Perfis (contas de login)
-- -----------------------------------------------------------------------------
create table public.perfis (
  id            uuid primary key references auth.users (id) on delete cascade,
  nome          text not null,
  email         text,
  papel         public.papel_usuario not null default 'dancarino',
  integrante_id uuid unique references public.integrantes (id) on delete set null,
  criado_em     timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

create trigger perfis_atualizado_em
  before update on public.perfis
  for each row execute function public.tocar_atualizado_em();

-- Cria o perfil automaticamente quando uma conta é criada/convidada no Supabase.
create function public.criar_perfil_para_novo_usuario()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.perfis (id, nome, email)
  values (
    new.id,
    coalesce(nullif(trim(new.raw_user_meta_data ->> 'nome'), ''), split_part(new.email, '@', 1)),
    new.email
  );
  return new;
end;
$$;

create trigger ao_criar_usuario
  after insert on auth.users
  for each row execute function public.criar_perfil_para_novo_usuario();

-- -----------------------------------------------------------------------------
-- Funções de permissão (usadas pelas regras RLS)
-- security definer: leem perfis sem cair em recursão nas próprias regras.
-- -----------------------------------------------------------------------------
create function public.papel_atual()
returns public.papel_usuario
language sql
stable
security definer
set search_path = ''
as $$
  select papel from public.perfis where id = auth.uid();
$$;

create function public.e_membro()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.perfis where id = auth.uid());
$$;

create function public.pode_editar()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(public.papel_atual() in ('admin', 'professor'), false);
$$;

create function public.e_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(public.papel_atual() = 'admin', false);
$$;

-- -----------------------------------------------------------------------------
-- Pares
-- -----------------------------------------------------------------------------
create table public.pares (
  id            uuid primary key default gen_random_uuid(),
  peao_id       uuid not null unique references public.integrantes (id) on delete cascade,
  prenda_id     uuid not null unique references public.integrantes (id) on delete cascade,
  cor           text not null default '#888888' check (cor ~ '^#[0-9a-fA-F]{6}$'),
  criado_em     timestamptz not null default now(),
  check (peao_id <> prenda_id)
);

-- -----------------------------------------------------------------------------
-- Danças (catálogo do regulamento)
-- -----------------------------------------------------------------------------
create table public.dancas (
  id             smallint primary key,
  slug           text not null unique,
  nome           text not null,
  bloco          smallint not null check (bloco between 1 and 4),
  urna           smallint not null check (urna between 1 and 3),
  -- fila / roda / pares independentes: a ser confirmado pelos professores
  tipo           public.tipo_danca,
  -- Regulamento art. 25, parágrafo único: 25 minutos em vez de 20
  tempo_ampliado boolean not null default false,
  observacoes    text
);

-- -----------------------------------------------------------------------------
-- Tablados
-- -----------------------------------------------------------------------------
create table public.tablados (
  id                   uuid primary key default gen_random_uuid(),
  nome                 text not null,
  largura_m            numeric(5, 2) not null check (largura_m > 0),
  profundidade_m       numeric(5, 2) not null check (profundidade_m > 0),
  placa_largura_m      numeric(5, 3) check (placa_largura_m > 0),
  placa_profundidade_m numeric(5, 3) check (placa_profundidade_m > 0),
  padrao               boolean not null default false,
  -- detalhes visuais livres (posição dos jurados, músicos, acessos, ...)
  config               jsonb not null default '{}'::jsonb,
  criado_em            timestamptz not null default now(),
  atualizado_em        timestamptz not null default now()
);

create unique index tablados_um_padrao on public.tablados (padrao) where padrao;

create trigger tablados_atualizado_em
  before update on public.tablados
  for each row execute function public.tocar_atualizado_em();

-- -----------------------------------------------------------------------------
-- Coreografias
-- -----------------------------------------------------------------------------
create table public.coreografias (
  id            uuid primary key default gen_random_uuid(),
  tipo          public.tipo_coreografia not null default 'danca_tradicional',
  danca_id      smallint references public.dancas (id),
  nome          text,
  ano           smallint not null check (ano between 2020 and 2100),
  tablado_id    uuid references public.tablados (id) on delete set null,
  observacoes   text,
  criado_em     timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  -- dança tradicional precisa de uma dança; entrada/saída não
  check ((tipo = 'danca_tradicional') = (danca_id is not null))
);

create unique index coreografias_danca_por_ano
  on public.coreografias (danca_id, ano) where danca_id is not null;

create trigger coreografias_atualizado_em
  before update on public.coreografias
  for each row execute function public.tocar_atualizado_em();

-- -----------------------------------------------------------------------------
-- Escalação
-- -----------------------------------------------------------------------------
create table public.escalacao (
  coreografia_id uuid not null references public.coreografias (id) on delete cascade,
  integrante_id  uuid not null references public.integrantes (id) on delete cascade,
  funcao         public.funcao_escalacao not null default 'titular',
  primary key (coreografia_id, integrante_id)
);

-- -----------------------------------------------------------------------------
-- Formações e posições
-- -----------------------------------------------------------------------------
create table public.formacoes (
  id             uuid primary key default gen_random_uuid(),
  coreografia_id uuid not null references public.coreografias (id) on delete cascade,
  ordem          integer not null,
  nome           text,
  -- momento na música, em segundos (opcional, para a sincronia futura)
  tempo_s        numeric(7, 2),
  observacoes    text,
  criado_em      timestamptz not null default now(),
  atualizado_em  timestamptz not null default now(),
  unique (coreografia_id, ordem) deferrable initially deferred
);

create trigger formacoes_atualizado_em
  before update on public.formacoes
  for each row execute function public.tocar_atualizado_em();

create table public.posicoes (
  formacao_id   uuid not null references public.formacoes (id) on delete cascade,
  integrante_id uuid not null references public.integrantes (id) on delete cascade,
  x             numeric(6, 3) not null,
  z             numeric(6, 3) not null,
  rotacao       numeric(6, 2) not null default 0,
  primary key (formacao_id, integrante_id)
);

create index posicoes_integrante on public.posicoes (integrante_id);
create index formacoes_coreografia on public.formacoes (coreografia_id);
create index escalacao_integrante on public.escalacao (integrante_id);

-- =============================================================================
-- Segurança (Row Level Security)
--   Ninguém sem login vê nada.
--   Membros (qualquer conta com perfil) LEEM tudo.
--   Professores e admin EDITAM o conteúdo.
--   Só admin altera perfis (papéis e vínculos).
-- =============================================================================
revoke all on all tables in schema public from anon;

alter table public.perfis       enable row level security;
alter table public.integrantes  enable row level security;
alter table public.pares        enable row level security;
alter table public.dancas       enable row level security;
alter table public.tablados     enable row level security;
alter table public.coreografias enable row level security;
alter table public.escalacao    enable row level security;
alter table public.formacoes    enable row level security;
alter table public.posicoes     enable row level security;

-- perfis
create policy "membros leem perfis" on public.perfis
  for select to authenticated using (public.e_membro());
create policy "admin altera perfis" on public.perfis
  for update to authenticated using (public.e_admin()) with check (public.e_admin());
create policy "admin remove perfis" on public.perfis
  for delete to authenticated using (public.e_admin());

-- danças: catálogo — membros leem, professores ajustam (ex.: tipo, observações)
create policy "membros leem dancas" on public.dancas
  for select to authenticated using (public.e_membro());
create policy "editores alteram dancas" on public.dancas
  for update to authenticated using (public.pode_editar()) with check (public.pode_editar());

-- demais tabelas: membros leem, editores fazem tudo
do $$
declare
  t text;
begin
  foreach t in array array[
    'integrantes', 'pares', 'tablados', 'coreografias', 'escalacao', 'formacoes', 'posicoes'
  ] loop
    execute format(
      'create policy "membros leem %1$s" on public.%1$I for select to authenticated using (public.e_membro())', t);
    execute format(
      'create policy "editores inserem %1$s" on public.%1$I for insert to authenticated with check (public.pode_editar())', t);
    execute format(
      'create policy "editores alteram %1$s" on public.%1$I for update to authenticated using (public.pode_editar()) with check (public.pode_editar())', t);
    execute format(
      'create policy "editores removem %1$s" on public.%1$I for delete to authenticated using (public.pode_editar())', t);
  end loop;
end;
$$;

-- Funções de permissão não precisam ser chamadas por visitantes sem login.
revoke execute on function public.papel_atual(), public.e_membro(), public.pode_editar(), public.e_admin()
  from public, anon;
grant execute on function public.papel_atual(), public.e_membro(), public.pode_editar(), public.e_admin()
  to authenticated;
revoke execute on function public.criar_perfil_para_novo_usuario() from public, anon, authenticated;

-- =============================================================================
-- Dados iniciais
-- =============================================================================

-- As 28 danças tradicionais — Regulamento ENART 2026, art. 24 (blocos) e §2º (urnas).
-- tempo_ampliado: art. 25, parágrafo único.
insert into public.dancas (id, slug, nome, bloco, urna, tempo_ampliado) values
  -- Bloco 1
  ( 1, 'anu',                    'Anu',                       1, 1, true),
  ( 2, 'cana-verde',             'Cana Verde',                1, 2, false),
  ( 3, 'chote-de-sete-voltas',   'Chote de Sete Voltas',      1, 3, false),
  ( 4, 'chote-de-quatro-passi',  'Chote de "Quatro Passi"',   1, 1, false),
  ( 5, 'pau-de-fitas',           'Pau de Fitas',              1, 2, true),
  ( 6, 'sarrabalho',             'Sarrabalho',                1, 1, false),
  ( 7, 'tirana-do-ombro',        'Tirana do Ombro',           1, 3, false),
  -- Bloco 2
  ( 8, 'balaio',                 'Balaio',                    2, 2, false),
  ( 9, 'chimarrita',             'Chimarrita',                2, 1, false),
  (10, 'caranguejo',             'Caranguejo',                2, 2, false),
  (11, 'rilo',                   'Rilo',                      2, 2, false),
  (12, 'quero-mana',             'Quero Mana',                2, 1, false),
  (13, 'tatu-castanholas',       'Tatu (Castanholas)',        2, 3, false),
  (14, 'valsa-da-mao-trocada',   'Valsa da Mão Trocada',      2, 2, true),
  -- Bloco 3
  (15, 'chico-sapateado',        'Chico Sapateado',           3, 3, false),
  (16, 'chimarrita-balao',       'Chimarrita Balão',          3, 3, false),
  (17, 'chote-carreirinho',      'Chote Carreirinho',         3, 3, false),
  (18, 'meia-canha',             'Meia Canha',                3, 2, true),
  (19, 'macanico',               'Maçanico',                  3, 1, false),
  (20, 'tirana-do-lenco',        'Tirana do Lenço',           3, 3, false),
  (21, 'vanerao-sapateado',      'Vanerão Sapateado',         3, 3, false),
  -- Bloco 4
  (22, 'chote-de-duas-damas',    'Chote de Duas Damas',       4, 3, false),
  (23, 'roseira',                'Roseira',                   4, 2, true),
  (24, 'rancheira-de-carreirinha','Rancheira de Carreirinha', 4, 3, false),
  (25, 'chote-ingles',           'Chote Inglês',              4, 1, false),
  (26, 'pezinho',                'Pezinho',                   4, 3, false),
  (27, 'havaneira-marcada',      'Havaneira Marcada',         4, 3, false),
  (28, 'tatu-de-volta-no-meio',  'Tatu de Volta no Meio',     4, 3, false);

-- Tablado provisório (14 × 14 m, mínimo nacional CBTG) até levantarmos as medidas reais.
insert into public.tablados (nome, largura_m, profundidade_m, padrao, config)
values ('ENART (provisório)', 14, 14, true, '{"provisorio": true}'::jsonb);
