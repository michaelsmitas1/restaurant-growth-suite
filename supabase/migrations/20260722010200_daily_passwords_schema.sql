-- Fase 0 (0a) — senha do dia (Modo 2 de validação de presença).

create table if not exists public.daily_passwords (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  word text not null,
  valid_from timestamptz not null default now(),
  valid_until timestamptz not null,
  created_at timestamptz not null default now()
);

create index if not exists daily_passwords_restaurant_id_idx on public.daily_passwords(restaurant_id);
create index if not exists daily_passwords_valid_until_idx on public.daily_passwords(valid_until);

alter table public.daily_passwords enable row level security;

drop policy if exists "owner full access" on public.daily_passwords;
create policy "owner full access" on public.daily_passwords
  for all
  using (restaurant_id in (select id from public.restaurants where owner_id = auth.uid()))
  with check (restaurant_id in (select id from public.restaurants where owner_id = auth.uid()));
