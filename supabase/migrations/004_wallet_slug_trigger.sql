-- migration 003 tornou restaurants.slug NOT NULL, mas nenhum ponto de criação
-- de restaurante (scripts/onboard-restaurant.js e futuros) preenchia esse campo.
-- Trigger gera o slug automaticamente no INSERT quando não informado — mesma
-- lógica de slugify do backfill da 003 (spec 008).
create or replace function generate_restaurant_slug()
returns trigger as $$
declare
  base text;
  candidate text;
  suffix int;
begin
  if new.slug is not null and new.slug <> '' then
    return new;
  end if;

  base := trim(both '-' from regexp_replace(lower(unaccent(new.name)), '[^a-z0-9]+', '-', 'g'));
  if base = '' then base := 'restaurante'; end if;
  candidate := base;
  suffix := 1;
  while exists (select 1 from restaurants where slug = candidate and id <> new.id) loop
    suffix := suffix + 1;
    candidate := base || '-' || suffix;
  end loop;

  new.slug := candidate;
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_generate_restaurant_slug on restaurants;
create trigger trg_generate_restaurant_slug
  before insert on restaurants
  for each row
  execute function generate_restaurant_slug();
