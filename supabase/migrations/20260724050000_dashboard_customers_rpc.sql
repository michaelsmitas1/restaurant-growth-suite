-- Fix: app/restaurante/[id]/page.tsx (Sessão 1 da spec-010) embutia
-- customer:customers(name, phone) via PostgREST a partir de
-- customer_programs — mas customers nasce deny-all (0a/0c, decisão
-- deliberada do CLAUDE.md: acesso só controlado, não RLS aberta). O
-- client do dono nunca conseguia ler o embed, todo cliente aparecia como
-- "Anônimo" no dashboard. Mesmo padrão da Sessão 5 (is_slug_available):
-- função SECURITY DEFINER com escopo estreito, em vez de abrir uma policy
-- ampla em customers ou usar o service client (restrito a 3 lugares).

create or replace function public.dashboard_customers_for_restaurant(p_restaurant_id uuid)
returns table (
  id uuid,
  name text,
  phone text,
  current_stamps int,
  total_visits int,
  last_visit_at timestamptz
)
language sql
security definer
set search_path = public
as $$
  select
    cp.id,
    c.name,
    c.phone,
    cp.current_stamps,
    cp.total_visits,
    cp.last_visit_at
  from public.customer_programs cp
  join public.customers c on c.id = cp.customer_id
  where cp.restaurant_id = p_restaurant_id
    and exists (
      select 1 from public.restaurants r
      where r.id = p_restaurant_id and r.owner_id = auth.uid()
    )
  order by cp.last_visit_at desc nulls last
  limit 25;
$$;

revoke all on function public.dashboard_customers_for_restaurant(uuid) from public, anon, authenticated;
grant execute on function public.dashboard_customers_for_restaurant(uuid) to authenticated;
