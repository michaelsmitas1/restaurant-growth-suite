-- restaurants.slug — identificador público usado na página /w/[slug] (spec 008)
create extension if not exists unaccent;

alter table restaurants add column if not exists slug text;

do $$
declare
  r record;
  base text;
  candidate text;
  suffix int;
begin
  for r in select id, name from restaurants where slug is null order by created_at loop
    base := trim(both '-' from regexp_replace(lower(unaccent(r.name)), '[^a-z0-9]+', '-', 'g'));
    if base = '' then base := 'restaurante'; end if;
    candidate := base;
    suffix := 1;
    while exists (select 1 from restaurants where slug = candidate and id <> r.id) loop
      suffix := suffix + 1;
      candidate := base || '-' || suffix;
    end loop;
    update restaurants set slug = candidate where id = r.id;
  end loop;
end $$;

alter table restaurants alter column slug set not null;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'restaurants_slug_unique') then
    alter table restaurants add constraint restaurants_slug_unique unique (slug);
  end if;
end $$;

create index if not exists idx_restaurants_slug on restaurants(slug);
