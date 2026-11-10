-- Cria 16 integrantes de teste (8 peões e 8 prendas) e 8 pares padrão.
-- Uso: Supabase → SQL Editor → cole → Run. Pode rodar só uma vez.
-- Todos os nomes começam com "Teste", para apagar fácil depois
-- (veja supabase/scripts/remover-pares-de-teste.sql).
-- Metade é Kamé e metade é Kairú. Os números dos pares continuam
-- depois dos que já existirem.

with dados (ordem, peao, prenda, tipo, cor) as (
  values
    (1, 'Teste Peão 1', 'Teste Prenda 1', 'kame',  '#e6194b'),
    (2, 'Teste Peão 2', 'Teste Prenda 2', 'kairu', '#3cb44b'),
    (3, 'Teste Peão 3', 'Teste Prenda 3', 'kame',  '#4363d8'),
    (4, 'Teste Peão 4', 'Teste Prenda 4', 'kairu', '#f58231'),
    (5, 'Teste Peão 5', 'Teste Prenda 5', 'kame',  '#911eb4'),
    (6, 'Teste Peão 6', 'Teste Prenda 6', 'kairu', '#42d4f4'),
    (7, 'Teste Peão 7', 'Teste Prenda 7', 'kame',  '#f032e6'),
    (8, 'Teste Peão 8', 'Teste Prenda 8', 'kairu', '#bfef45')
),
peoes as (
  insert into public.integrantes (nome, genero, indumentaria)
  select peao, 'peao', tipo::public.tipo_indumentaria from dados
  returning id, nome
),
prendas as (
  insert into public.integrantes (nome, genero, indumentaria)
  select prenda, 'prenda', tipo::public.tipo_indumentaria from dados
  returning id, nome
)
insert into public.pares (numero, peao_id, prenda_id, cor)
select (select coalesce(max(numero), 0) from public.pares) + d.ordem, pe.id, pr.id, d.cor
from dados d
join peoes pe on pe.nome = d.peao
join prendas pr on pr.nome = d.prenda
returning numero, cor;
