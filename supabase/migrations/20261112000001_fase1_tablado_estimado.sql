-- =============================================================================
-- Fase 1 — medidas estimadas do tablado do ENART
-- =============================================================================
-- Como aplicar: Supabase → SQL Editor → New query → cole este arquivo → Run.
-- Execute uma única vez.
--
-- Estimativa feita a partir de imagens das transmissões (ver docs/tablado.md):
--   placa padrão 2,44 × 1,22 m, lado maior paralelo à frente;
--   ~6,5 placas na largura (pontas cortadas) e 11 fileiras na profundidade.
-- Professores podem corrigir as medidas na própria aplicação (tela Tablado).
--
-- ORIENTAÇÃO (corrige o comentário da estrutura inicial):
--   z POSITIVO = FRENTE, lado da mesa principal dos jurados; z negativo = fundo.
--   x positivo = direita de quem está na mesa dos jurados.
--   rotação 0 = de frente para os jurados.
-- =============================================================================

update public.tablados
set nome                 = 'ENART (estimado)',
    largura_m            = 15.86,
    profundidade_m       = 13.42,
    placa_largura_m      = 2.44,
    placa_profundidade_m = 1.22,
    config               = '{"estimado": true}'::jsonb
where padrao;

comment on column public.posicoes.x is 'metros; positivo = direita de quem está na mesa dos jurados; 0 = centro';
comment on column public.posicoes.z is 'metros; positivo = frente (mesa dos jurados); negativo = fundo; 0 = centro';
comment on column public.posicoes.rotacao is 'graus; 0 = de frente para os jurados; sentido horário visto de cima';
