import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import MetricCard from '@/components/MetricCard';
import CustomersList from '@/components/CustomersList';
import Sidebar from '@/components/Sidebar';
import MobileNav from '@/components/MobileNav';

interface Props { params: { id: string } }

export default async function RestauranteDashboard({ params }: Props) {
  const supabase = createClient();

  const { data: restaurant } = await supabase
    .from('restaurants').select('*').eq('id', params.id).single();
  if (!restaurant) notFound();

  const [
    { data: loyaltyConfig },
    { data: firstMilestone },
    { data: customerPrograms },
    { count: totalCustomers },
    { count: visitsThisWeek },
    { count: redemptionsTotal },
  ] = await Promise.all([
    supabase.from('loyalty_config').select('stamps_per_visit, validation_modes').eq('restaurant_id', params.id).maybeSingle(),
    supabase.from('loyalty_milestones').select('stamps_required').eq('restaurant_id', params.id).order('position').limit(1).maybeSingle(),
    supabase.from('customer_programs')
      .select('id, current_stamps, total_visits, last_visit_at, customer:customers(name, phone)')
      .eq('restaurant_id', params.id)
      .order('last_visit_at', { ascending: false, nullsFirst: false })
      .limit(25),
    supabase.from('customer_programs').select('*', { count: 'exact', head: true }).eq('restaurant_id', params.id),
    supabase.from('visits').select('*', { count: 'exact', head: true }).eq('restaurant_id', params.id)
      .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()),
    supabase.from('redemptions').select('*', { count: 'exact', head: true }).eq('restaurant_id', params.id),
  ]);

  const stampsRequired = firstMilestone?.stamps_required ?? loyaltyConfig?.stamps_per_visit ?? 1;

  const customers = (customerPrograms || []).map((cp: any) => ({
    id: cp.id,
    name: cp.customer?.name ?? null,
    phone: cp.customer?.phone ?? null,
    current_stamps: cp.current_stamps,
    total_visits: cp.total_visits,
    last_visit_at: cp.last_visit_at,
  }));

  return (
    <div className="app-layout">
      <Sidebar
        restaurantId={params.id}
        restaurantName={restaurant.name}
        // Conexão real com Google Business é spec-024 (Fase 3), ainda não existe.
        googleConnected={false}
        activeSection=""
      />

      <main className="page-main">
        <div className="page-header-row">
          <div>
            <h1 style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-0.025em', marginBottom: 3 }}>
              Visão geral
            </h1>
            <p style={{ fontSize: 13.5, color: 'var(--text-muted)' }}>
              {restaurant.name} · {restaurant.segment || 'sem categoria'} · {restaurant.neighborhood || restaurant.city}
            </p>
          </div>
          <div className="page-header-badges">
            <span style={{
              background: restaurant.active ? '#f0fdf4' : '#f9fafb',
              color: restaurant.active ? '#16a34a' : 'var(--text-muted)',
              fontSize: 12, fontWeight: 600, padding: '5px 12px', borderRadius: 99,
              border: `1px solid ${restaurant.active ? '#bbf7d0' : '#e5e7eb'}`,
            }}>
              {restaurant.active ? '● ativo' : '○ inativo'}
            </span>
          </div>
        </div>

        <div className="metrics-grid">
          <MetricCard label="Clientes no programa" value={String(totalCustomers || 0)} sub={`${visitsThisWeek || 0} visitas essa semana`} />
          <MetricCard label="Resgates totais" value={String(redemptionsTotal || 0)} />
          <MetricCard label="Selos por visita" value={String(loyaltyConfig?.stamps_per_visit ?? 1)} />
          <MetricCard label="Modo de validação" value={(loyaltyConfig?.validation_modes || []).join(', ') || '—'} />
        </div>

        <div className="content-grid">
          <CustomersList customers={customers} stampsRequired={stampsRequired} />
        </div>
      </main>

      <MobileNav restaurantId={params.id} />
    </div>
  );
}
