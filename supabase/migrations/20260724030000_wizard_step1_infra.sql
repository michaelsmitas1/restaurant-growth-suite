-- spec-010 (wizard de onboarding), Sessão 5 — infra do Passo 1: upload de
-- logo (Supabase Storage) e checagem de disponibilidade de slug.

-- Bucket público de logos. Path convention: {owner_id}/logo-{timestamp}.ext
-- — escopado por owner_id (não restaurant_id) de propósito: no Passo 1 o
-- dono pode enviar a logo ANTES do restaurante existir (a linha só nasce
-- quando o passo é salvo), então não há restaurant_id ainda para
-- particionar o path.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('restaurant-logos', 'restaurant-logos', true, 2097152, array['image/jpeg', 'image/png'])
on conflict (id) do nothing;

-- Sem policy de SELECT: o bucket já é público (`public = true` acima),
-- então a leitura via URL pública (`getPublicUrl`) não passa por RLS. Uma
-- policy de SELECT em storage.objects só afetaria a API de *listagem*
-- (`storage.list()`), permitindo enumerar todos os arquivos do bucket —
-- desnecessário e sinalizado pelo linter de segurança do Supabase
-- (0025_public_bucket_allows_listing).

drop policy if exists "owner manage own logo folder" on storage.objects;
create policy "owner manage own logo folder" on storage.objects
  for all
  to authenticated
  using (bucket_id = 'restaurant-logos' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'restaurant-logos' and (storage.foldername(name))[1] = auth.uid()::text);

-- Checagem de disponibilidade de slug (GET /api/check-slug). Não pode ser
-- uma query direta: a policy "owner full access" de restaurants (0a)
-- restringe SELECT às linhas do próprio dono, então uma query comum
-- sempre reportaria "disponível" para slugs de OUTROS donos (falso
-- positivo). Função SECURITY DEFINER expõe só um boolean — nenhuma linha
-- de restaurants é exposta — evitando abrir uma policy de leitura ampla
-- ou usar o service client (CLAUDE.md restringe a 3 lugares, este não é
-- um deles).
create or replace function public.is_slug_available(check_slug text, exclude_id uuid default null)
returns boolean
language sql
security definer
set search_path = public
as $$
  select not exists (
    select 1 from public.restaurants
    where slug = check_slug
    and (exclude_id is null or id <> exclude_id)
  );
$$;

-- Supabase concede EXECUTE por default privileges a anon/authenticated na
-- criação da função — revogar de "public" não basta, precisa revogar de
-- cada role explicitamente antes de conceder só ao que precisa
-- (0028/0029_..._security_definer_function_executable).
revoke all on function public.is_slug_available(text, uuid) from public, anon, authenticated;
grant execute on function public.is_slug_available(text, uuid) to authenticated;
