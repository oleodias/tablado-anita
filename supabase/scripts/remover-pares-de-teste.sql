-- Apaga os integrantes de teste criados por pares-de-teste.sql.
-- Os pares, duplas, escalações e posições deles são apagados junto.
delete from public.integrantes
where nome like 'Teste Peão %' or nome like 'Teste Prenda %'
returning nome;
