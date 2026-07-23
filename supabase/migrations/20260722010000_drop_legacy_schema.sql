-- Fase 0 (0a) — reset do schema legado.
-- Decisão D3/D4 (PLAN.md, 2026-07-22): banco de teste, história reescrita do zero.
-- Backup lógico salvo localmente antes da execução (fora do repo, contém PII de teste).
-- Tabelas substituídas pelo schema canônico das migrations seguintes desta mesma pasta.

drop table if exists public.campaign_messages cascade;
drop table if exists public.review_approvals cascade;
drop table if exists public.customer_loyalty cascade;
drop table if exists public.message_templates cascade;
drop table if exists public.loyalty_programs cascade;
drop table if exists public.campaigns cascade;
drop table if exists public.reviews cascade;
drop table if exists public.visits cascade;
drop table if exists public.user_restaurants cascade;
drop table if exists public.customers cascade;
drop table if exists public.restaurants cascade;
