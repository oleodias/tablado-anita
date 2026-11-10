-- Promove uma conta a administrador (ou professor).
-- Uso: Supabase → SQL Editor → cole, troque o e-mail e o papel → Run.
-- Papéis possíveis: 'admin', 'professor', 'dancarino'.

update public.perfis
set papel = 'admin'
where email = 'SEU-EMAIL-AQUI@exemplo.com'
returning nome, email, papel;
