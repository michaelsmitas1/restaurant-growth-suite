-- Fase 0 (0a) — schema canônico: restaurante + configuração do programa.
-- Nível 1 de auth (CLAUDE.md): posse via restaurants.owner_id -> auth.users(id).

create extension if not exists "pgcrypto";

-- restaurants
create table if not exists public.restaurants (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  slug text not null unique,
  name text not null,
  segment text,
  city text default 'São Paulo',
  neighborhood text,
  google_place_id text unique,
  google_review_link text,
  whatsapp_number text,
  instagram_handle text,
  facebook_url text,
  primary_color text not null default '#397DE8',
  secondary_color text not null default '#10244A',
  logo_url text,
  wizard_step integer not null default 0,
  wizard_completed_at timestamptz,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists restaurants_owner_id_idx on public.restaurants(owner_id);

alter table public.restaurants enable row level security;

drop policy if exists "owner full access" on public.restaurants;
create policy "owner full access" on public.restaurants
  for all
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

-- card_design_config
create table if not exists public.card_design_config (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null unique references public.restaurants(id) on delete cascade,
  program_name text not null default 'Fidelidade',
  background_color text not null default '#10244A',
  text_color text not null default '#FFFFFF',
  icon_url text,
  hero_image_url text,
  barcode_type text not null default 'qr' check (barcode_type in ('qr', 'pdf417', 'aztec')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.card_design_config enable row level security;

drop policy if exists "owner full access" on public.card_design_config;
create policy "owner full access" on public.card_design_config
  for all
  using (restaurant_id in (select id from public.restaurants where owner_id = auth.uid()))
  with check (restaurant_id in (select id from public.restaurants where owner_id = auth.uid()));

-- loyalty_config
create table if not exists public.loyalty_config (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null unique references public.restaurants(id) on delete cascade,
  accrual_mode text not null default 'visit' check (accrual_mode in ('visit', 'value')),
  stamps_per_visit integer not null default 1,
  value_per_stamp numeric,
  validation_modes text[] not null default array['scanner'],
  daily_password_valid_hours integer not null default 12,
  signup_bonus_stamps integer not null default 0,
  slow_day_multiplier numeric not null default 2,
  slow_days text[] not null default array[]::text[],
  birthday_multiplier numeric not null default 2,
  google_review_bonus_stamps integer not null default 0,
  tone_of_voice text not null default 'equilibrado' check (tone_of_voice in ('descontraido', 'equilibrado', 'formal')),
  whatsapp_welcome_enabled boolean not null default true,
  whatsapp_near_reward_enabled boolean not null default true,
  whatsapp_inactive_enabled boolean not null default true,
  whatsapp_inactive_days integer not null default 30,
  whatsapp_birthday_enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.loyalty_config enable row level security;

drop policy if exists "owner full access" on public.loyalty_config;
create policy "owner full access" on public.loyalty_config
  for all
  using (restaurant_id in (select id from public.restaurants where owner_id = auth.uid()))
  with check (restaurant_id in (select id from public.restaurants where owner_id = auth.uid()));

-- loyalty_milestones (até 3 marcos por restaurante)
create table if not exists public.loyalty_milestones (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  position integer not null check (position between 1 and 3),
  stamps_required integer not null check (stamps_required > 0),
  reward_description text not null,
  created_at timestamptz not null default now(),
  unique (restaurant_id, position)
);

alter table public.loyalty_milestones enable row level security;

drop policy if exists "owner full access" on public.loyalty_milestones;
create policy "owner full access" on public.loyalty_milestones
  for all
  using (restaurant_id in (select id from public.restaurants where owner_id = auth.uid()))
  with check (restaurant_id in (select id from public.restaurants where owner_id = auth.uid()));

-- form_fields_config
create table if not exists public.form_fields_config (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null unique references public.restaurants(id) on delete cascade,
  name_visible boolean not null default true,
  name_required boolean not null default true,
  birthday_visible boolean not null default true,
  birthday_required boolean not null default false,
  email_visible boolean not null default false,
  email_required boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.form_fields_config enable row level security;

drop policy if exists "owner full access" on public.form_fields_config;
create policy "owner full access" on public.form_fields_config
  for all
  using (restaurant_id in (select id from public.restaurants where owner_id = auth.uid()))
  with check (restaurant_id in (select id from public.restaurants where owner_id = auth.uid()));
