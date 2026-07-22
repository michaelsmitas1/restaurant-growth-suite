-- Fase 0 (0a) — registro de automações WhatsApp (4 momentos AI-native).

create table if not exists public.whatsapp_log (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  customer_id uuid references public.customers(id) on delete set null,
  event text not null check (event in ('welcome', 'near_reward', 'inactive', 'birthday')),
  message text,
  status text not null default 'pending' check (status in ('pending', 'sent', 'failed')),
  sent_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists whatsapp_log_restaurant_id_idx on public.whatsapp_log(restaurant_id);
create index if not exists whatsapp_log_customer_id_idx on public.whatsapp_log(customer_id);

alter table public.whatsapp_log enable row level security;

drop policy if exists "owner read access" on public.whatsapp_log;
create policy "owner read access" on public.whatsapp_log
  for select
  using (restaurant_id in (select id from public.restaurants where owner_id = auth.uid()));
-- Escrita apenas via webhook Supabase -> n8n -> Claude API (service client), nunca do dono direto.
