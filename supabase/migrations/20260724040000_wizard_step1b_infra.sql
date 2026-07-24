-- spec-010 (wizard de onboarding), Sessão 6 — infra do Passo 1b: upload de
-- ícone de selo customizado. Diferente do bucket restaurant-logos (Sessão
-- 5), aqui o restaurante já existe (Passo 1 já rodou) — path escopado por
-- restaurant_id, verificado contra a posse real via subquery em
-- restaurants (mesmo padrão de posse usado no resto do schema).

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('stamp-icons', 'stamp-icons', true, 204800, array['image/png'])
on conflict (id) do nothing;

-- Sem policy de SELECT — bucket público, leitura por URL não passa por
-- RLS (mesmo raciocínio do restaurant-logos, ver migration anterior).
drop policy if exists "owner manage own stamp icons" on storage.objects;
create policy "owner manage own stamp icons" on storage.objects
  for all
  to authenticated
  using (
    bucket_id = 'stamp-icons'
    and (storage.foldername(name))[1] in (select id::text from public.restaurants where owner_id = auth.uid())
  )
  with check (
    bucket_id = 'stamp-icons'
    and (storage.foldername(name))[1] in (select id::text from public.restaurants where owner_id = auth.uid())
  );
