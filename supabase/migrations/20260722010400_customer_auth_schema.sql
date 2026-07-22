-- Fase 0 (0a/0c) — infraestrutura de auth do cliente (Nível 2, OTP custom).
-- Cliente não é usuário do Supabase Auth: WhatsApp OTP é grátis via Evolution API,
-- phone auth do Supabase exigiria Twilio pago, e misturar os dois tipos de usuário
-- no mesmo pool cria complexidade de policies (CLAUDE.md).

-- otp_codes
create table if not exists public.otp_codes (
  id uuid primary key default gen_random_uuid(),
  phone text not null,
  code text not null,
  channel text not null check (channel in ('whatsapp', 'sms')),
  expires_at timestamptz not null,
  attempts integer not null default 0,
  used boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists otp_codes_phone_idx on public.otp_codes(phone);
create index if not exists otp_codes_created_at_idx on public.otp_codes(created_at);

alter table public.otp_codes enable row level security;
-- Sem policies: acesso exclusivo via service client escopado em lib/customerSession.ts.

-- customer_sessions
create table if not exists public.customer_sessions (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.customers(id) on delete cascade,
  token_hash text not null unique,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

create index if not exists customer_sessions_customer_id_idx on public.customer_sessions(customer_id);

alter table public.customer_sessions enable row level security;
-- Sem policies: acesso exclusivo via service client escopado em lib/customerSession.ts.
