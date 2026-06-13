import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import MetricCard from '@/components/MetricCard';
import ReviewsList from '@/components/ReviewsList';
import CustomersList from '@/components/CustomersList';
import CampaignsList from '@/components/CampaignsList';
import Sidebar from '@/components/Sidebar';

interface Props { params: { id: string } }

export default async function RestauranteDashboard({ params }: Props) {
  const supabase = createClient();

  const { data: restaurant } = await supabase
    .from('restaurants').select('*').eq('id', params.id).single();

  if (!restaurant) notFound();

  const [
    { data: reviews },
    { data: customers },
    { data: campaigns },
    { count: totalCustomers },
    { count: visitsThisWeek },
  ] = await Promise.all([
    supabase.from('reviews').select('*').eq('restaurant_id', params.id).order('created_at', { ascending: false }).limit(15),
    supabase.from('customers').select('*').eq('restaurant_id', params.id).order('last_visit_at', { ascending: false }).limit(25),
    supabase.from('campaigns').select('*').eq('restaurant_id', params.id).order('created_at', { ascending: false }).limit(6),
    supabase.from('customers').select('*', { count: 'exact', head: true }).eq('restaurant_id', params.id),
    supabase.from('visits').select('*', { count: 'exact', head: true }).eq('restaurant_id', params.id)
      .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()),
  ]);

  const publishedReviews = reviews?.filter(r => r.status === 'published') || [];
  const avgRating = reviews && reviews.length > 0
    ? (reviews.reduce((s, r) => s + (r.rating || 0), 0) / reviews.length).toFixed(1)
    : '—';
  const responseRate = reviews && reviews.length > 0
    ? Math.round((publishedReviews.length / reviews.length) * 100)
    : 0;
  const pendingReviews = reviews?.filter(r => r.status === 'pending').length || 0;
  const googleConnected = !!restaurant.google_refresh_token;
  const totalMsgs = campaigns?.reduce((s, c) => s + (c.sent_to_count || 0), 0) || 0;

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar
        restaurantId={params.id}
        restaurantName={restaurant.name}
        googleConnected={googleConnected}
        activeSection=""
      />

      <main style={{ flex: 1, minWidth: 0, padding: '32px 36px' }}>
        {/* Page header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32 }}>
          <div>
            <h1 style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-0.025em', marginBottom: 3 }}>
              Visão geral
            </h1>
            <p style={{ fontSize: 13.5, color: 'var(--text-muted)' }}>
              {restaurant.name} · {restaurant.type} · {restaurant.neighborhood}
            </p>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            {pendingReviews > 0 && (
              <span style={{
                background: 'var(--brand)', color: '#fff',
                fontSize: 12, fontWeight: 700, padding: '5px 12px', borderRadius: 99,
              }}>
                {pendingReviews} pendente{pendingReviews > 1 ? 's' : ''}
              </span>
            )}
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

        {/* Metric cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: 14,
          marginBottom: 28,
        }}>
          <MetricCard
            label="Nota no Google"
            value={avgRating}
            sub={`${reviews?.length || 0} avaliações`}
          />
          <MetricCard
            label="Taxa de resposta"
            value={`${responseRate}%`}
            sub={`${publishedReviews.length} respondidas`}
          />
          <MetricCard
            label="Clientes no Wallet"
            value={String(totalCustomers || 0)}
            sub={`${visitsThisWeek || 0} visitas essa semana`}
          />
          <MetricCard
            label="Msgs enviadas"
            value={String(totalMsgs)}
            sub={`${campaigns?.length || 0} campanhas`}
          />
        </div>

        {/* Content grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
          gap: 20,
          marginBottom: 20,
        }}>
          <ReviewsList reviews={reviews || []} />
          <CustomersList customers={customers || []} stampsRequired={restaurant.stamps_required} />
        </div>

        <CampaignsList campaigns={campaigns || []} />
      </main>
    </div>
  );
}
