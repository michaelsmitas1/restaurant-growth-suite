import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import MobileNav from '@/components/MobileNav';
import AvaliacaoCard from '@/components/AvaliacaoCard';

interface Props { params: { id: string } }

export default async function AvaliacoesPage({ params }: Props) {
  const supabase = createClient();

  const { data: restaurant } = await supabase
    .from('restaurants').select('*').eq('id', params.id).single();
  if (!restaurant) notFound();

  const { data: reviews } = await supabase
    .from('reviews').select('*').eq('restaurant_id', params.id)
    .order('created_at', { ascending: false });

  const pending   = reviews?.filter(r => r.status === 'pending') || [];
  const responded = reviews?.filter(r => ['approved', 'edited', 'published'].includes(r.status)) || [];
  const ignored   = reviews?.filter(r => r.status === 'ignored') || [];

  const avgRating = reviews && reviews.length > 0
    ? (reviews.reduce((s, r) => s + (r.rating || 0), 0) / reviews.length).toFixed(1) : null;

  return (
    <div className="app-layout">
      <Sidebar
        restaurantId={params.id}
        restaurantName={restaurant.name}
        googleConnected={!!restaurant.google_refresh_token}
        activeSection="/avaliacoes"
      />

      <main className="page-main">
        <div className="page-header-row">
          <div>
            <h1 style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-0.025em', marginBottom: 3 }}>
              Avaliações
            </h1>
            <p style={{ fontSize: 13.5, color: 'var(--text-muted)' }}>
              {reviews?.length || 0} avaliações
              {avgRating && <span style={{ color: '#d97706', fontWeight: 600 }}> · ★ {avgRating}</span>}
            </p>
          </div>
          {pending.length > 0 && (
            <div className="page-header-badges">
              <span style={{
                background: '#fffbeb', color: '#b45309',
                fontSize: 12, fontWeight: 700, padding: '5px 12px', borderRadius: 99,
                border: '1px solid #fde68a',
              }}>
                {pending.length} pendente{pending.length > 1 ? 's' : ''}
              </span>
            </div>
          )}
        </div>

        <div style={{ maxWidth: 800 }}>
          {!reviews || reviews.length === 0 ? (
            <div className="card" style={{ padding: 48, textAlign: 'center', color: 'var(--text-muted)', fontSize: 14 }}>
              <div style={{ fontSize: 32, marginBottom: 12 }}>⭐</div>
              Nenhuma avaliação ainda.<br />
              <span style={{ fontSize: 13 }}>Conecte o Google Business para importar avaliações.</span>
            </div>
          ) : (
            <>
              {pending.length > 0 && (
                <section style={{ marginBottom: 32 }}>
                  <h2 style={{ fontSize: 11, fontWeight: 700, color: '#b45309', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>
                    Pendentes ({pending.length})
                  </h2>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {pending.map(r => <AvaliacaoCard key={r.id} review={r} restaurantId={params.id} />)}
                  </div>
                </section>
              )}
              {responded.length > 0 && (
                <section style={{ marginBottom: 32 }}>
                  <h2 style={{ fontSize: 11, fontWeight: 700, color: '#16a34a', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>
                    Respondidas ({responded.length})
                  </h2>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {responded.map(r => <AvaliacaoCard key={r.id} review={r} restaurantId={params.id} />)}
                  </div>
                </section>
              )}
              {ignored.length > 0 && (
                <section>
                  <h2 style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>
                    Ignoradas ({ignored.length})
                  </h2>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {ignored.map(r => <AvaliacaoCard key={r.id} review={r} restaurantId={params.id} />)}
                  </div>
                </section>
              )}
            </>
          )}
        </div>
      </main>

      <MobileNav restaurantId={params.id} />
    </div>
  );
}
