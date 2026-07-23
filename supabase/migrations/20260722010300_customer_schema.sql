-- Fase 0 (0a) — cliente, vínculo com restaurantes, visitas e resgates.
-- customers.phone é único GLOBAL (conta única por cliente); o vínculo com
-- cada restaurante vive em customer_programs (um cliente, N programas).

-- customers
create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(),
  phone text not null unique,
  name text,
  email text,
  birthday date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.customers enable row level security;
-- Sem policies: acesso exclusivo via service client escopado em lib/customerSession.ts
-- (Nível 2 de auth — cliente não é usuário do Supabase Auth). Nunca queries abertas.

-- customer_programs
create table if not exists public.customer_programs (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.customers(id) on delete cascade,
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  current_stamps integer not null default 0,
  total_stamps_earned integer not null default 0,
  total_visits integer not null default 0,
  is_vip boolean not null default false,
  vip_since timestamptz,
  last_visit_at timestamptz,
  google_wallet_object_id text,
  apple_wallet_serial text,
  opted_out boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (customer_id, restaurant_id)
);

create index if not exists customer_programs_restaurant_id_idx on public.customer_programs(restaurant_id);
create index if not exists customer_programs_customer_id_idx on public.customer_programs(customer_id);

alter table public.customer_programs enable row level security;

-- Dono acessa (leitura e escrita — ex: scanner operado sob a sessão do dono) apenas
-- os programas dos seus restaurantes. Escrita via sessão de cliente acontece pelo
-- service client escopado de lib/customerSession.ts, que ignora RLS por design.
drop policy if exists "owner full access" on public.customer_programs;
create policy "owner full access" on public.customer_programs
  for all
  using (restaurant_id in (select id from public.restaurants where owner_id = auth.uid()))
  with check (restaurant_id in (select id from public.restaurants where owner_id = auth.uid()));

-- visits
create table if not exists public.visits (
  id uuid primary key default gen_random_uuid(),
  customer_program_id uuid not null references public.customer_programs(id) on delete cascade,
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  stamps_added integer not null default 0,
  amount numeric,
  validation_mode text not null check (validation_mode in ('scanner', 'daily_password', 'rotating_qr')),
  daily_password_id uuid references public.daily_passwords(id) on delete set null,
  validated_by text,
  created_at timestamptz not null default now()
);

create index if not exists visits_customer_program_id_idx on public.visits(customer_program_id);
create index if not exists visits_restaurant_id_idx on public.visits(restaurant_id);
create index if not exists visits_created_at_idx on public.visits(created_at);

-- Senha do dia: 1x por cliente por período (por daily_passwords.id).
create unique index if not exists visits_one_daily_password_per_customer
  on public.visits(customer_program_id, daily_password_id)
  where validation_mode = 'daily_password';

alter table public.visits enable row level security;

drop policy if exists "owner full access" on public.visits;
create policy "owner full access" on public.visits
  for all
  using (restaurant_id in (select id from public.restaurants where owner_id = auth.uid()))
  with check (restaurant_id in (select id from public.restaurants where owner_id = auth.uid()));

-- redemptions
create table if not exists public.redemptions (
  id uuid primary key default gen_random_uuid(),
  customer_program_id uuid not null references public.customer_programs(id) on delete cascade,
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  milestone_id uuid references public.loyalty_milestones(id) on delete set null,
  stamps_used integer not null,
  validated_by text,
  created_at timestamptz not null default now()
);

create index if not exists redemptions_customer_program_id_idx on public.redemptions(customer_program_id);
create index if not exists redemptions_restaurant_id_idx on public.redemptions(restaurant_id);

alter table public.redemptions enable row level security;

drop policy if exists "owner full access" on public.redemptions;
create policy "owner full access" on public.redemptions
  for all
  using (restaurant_id in (select id from public.restaurants where owner_id = auth.uid()))
  with check (restaurant_id in (select id from public.restaurants where owner_id = auth.uid()));
