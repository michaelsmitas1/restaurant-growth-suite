-- Task 2.0b — hardening da auth do cliente (addendum ao 0c, decisão D11).
-- Fecha 2 das 5 lacunas que exigem mudança de schema (as outras 3 são só
-- lógica de aplicação em lib/customerSession.ts e lib/otp/*):
--   1. otp_codes.code passa a guardar HASH (nunca texto plano) — renomeado
--      para code_hash para não confundir futuros devs.
--   3. customer_sessions ganha last_rotated_at para sliding expiry (24h).

do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'otp_codes' and column_name = 'code'
  ) then
    alter table public.otp_codes rename column code to code_hash;
  end if;
end $$;

comment on column public.otp_codes.code_hash is
  'SHA-256 hex do código OTP — nunca texto plano (hardening 2.0b, CLAUDE.md v7)';

alter table public.customer_sessions
  add column if not exists last_rotated_at timestamptz not null default now();

comment on column public.customer_sessions.last_rotated_at is
  'Última rotação do token — sliding expiry de 24h (hardening 2.0b, CLAUDE.md v7)';
