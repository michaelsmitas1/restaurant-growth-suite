-- Fase 0 (0a) — remove artefatos órfãos do schema legado que sobreviveram
-- ao drop das tabelas (trigger function de geração de slug + extensão usada só por ela).

drop function if exists public.generate_restaurant_slug() cascade;
drop extension if exists unaccent;
