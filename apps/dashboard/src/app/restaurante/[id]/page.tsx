import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import MetricCard from '@/components/MetricCard';
import ReviewsList from '@/components/ReviewsList';
import CustomersList from '@/components/CustomersList';
import CampaignsList from '@/components/CampaignsList';
import Sidebar from '@/components/Sidebar';

interface Props { params: { id: string } }

export default async function RestauranteDashboard({ params }: Props) {
  const supabase = createClient();

  const { data: restaurant } = await supabase
    .from('restaurants')
    .select('*')
    .eq('id', params.id)
    .single();

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
    supabase.from('visits').select('*', { count: 'exact', head: true }).eq('restaurant_id', params.id).gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()),
  ]);

  const publishedReviews = reviews?.filter(r => r.status === 'published') || [];
  const avgRating = reviews && reviews.length > 0
    ? (reviews.reduce((s, r) => s + (r.rating || 0), 0) / reviews.length).toFixed(1)
    : '—';
  const responseRate = reviews && reviews.length > 0
    ? Math.round((publishedReviews.length / reviews.length) * 100)
    : 0;
  const pendingReviews = reviews?.filter(r => r.status === 'pending').length || 0;

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar restaurantId={params.id} restaurantName={restaurant.name} />

      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        {/* Top bar */}
        <header style={{
          background: '#fff',
          borderBottom: '1px solid var(--border)',
          padding: '0 24px',
          height: 56,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          position: 'sticky',
          top: 0,
          zIndex: 10,
        }}>
          <div>
            <span style={{ fontWeight: 700, fontSize: 16 }}>{restaurant.name}</span>
            <span style={{ color: 'var(--text-muted)', fontSize: 13, marginLeft: 8 }}>
              {restaurant.type} · {restaurant.neighborhood}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {pendingReviews > 0 && (
              <span style={{
                background: 'var(--brand)',
                color: '#fff',
                fontSize: 12,
                fontWeight: 700,
                padding: '3px 10px',
                borderRadius: 99,
              }}>
                {pendingReviews} pendente{pendingReviews > 1 ? 's' : ''}
              </span>
            )}
            <span style={{
              background: restaurant.active ? 'var(--green-light)' : '#f3f4f6',
              color: restaurant.active ? 'var(--green)' : 'var(--text-muted)',
              fontSize: 12,
              fontWeight: 600,
              padding: '3px 10px',
              borderRadius: 99,
            }}>
              {restaurant.active ? '● ativo' : '○ inativo'}
            </span>
          </div>
        </header>

        <main style={{ padding: '24px', flex: 1 }}>
          {/* Métricas */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: 16,
            marginBottom: 24,
          }}>
            <MetricCard
              label="Nota no Google"
              value={avgRating}
              sub={`${reviews?.length || 0} avaliações`}
              color="amber"
              icon="⭐"
            />
            <MetricCard
              label="Taxa de resposta"
              value={`${responseRate}%`}
              sub={`${publishedReviews.length} respondidas`}
              color="blue"
              icon="💬"
            />
            <MetricCard
              label="Clientes no Wallet"
              value={String(totalCustomers || 0)}
              sub={`${visitsThisWeek || 0} visitas essa semana`}
              color="green"
              icon="👥"
            />
            <MetricCard
              label="Msgs enviadas"
              value={String(campaigns?.reduce((s, c) => s + (c.sent_to_count || 0), 0) || 0)}
              sub={`${campaigns?.length || 0} campanhas`}
              color="red"
              icon="📲"
            />
          </div>

          {/* Grid reviews + clientes */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
            gap: 20,
            marginBottom: 20,
          }}>
            <ReviewsList reviews={reviews || []} />
            <CustomersList customers={customers || []} stampsRequired={restaurant.stamps_required} />
          </div>

          {/* Campanhas */}
          <CampaignsList campaigns={campaigns || []} />
        </main>
      </div>
    </div>
  );
}
