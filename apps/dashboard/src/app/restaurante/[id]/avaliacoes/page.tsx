import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import AvaliacaoCard from '@/components/AvaliacaoCard';

interface Props { params: { id: string } }

export default async function AvaliacoesPage({ params }: Props) {
  const supabase = createClient();

  const { data: restaurant } = await supabase
    .from('restaurants')
    .select('*')
    .eq('id', params.id)
    .single();

  if (!restaurant) notFound();

  const { data: reviews } = await supabase
    .from('reviews')
    .select('*')
    .eq('restaurant_id', params.id)
    .order('created_at', { ascending: false });

  const pending = reviews?.filter(r => r.status === 'pending') || [];
  const responded = reviews?.filter(r => ['approved', 'edited', 'published'].includes(r.status)) || [];
  const ignored = reviews?.filter(r => r.status === 'ignored') || [];

  const avgRating = reviews && reviews.length > 0
    ? (reviews.reduce((s, r) => s + (r.rating || 0), 0) / reviews.length).toFixed(1)
    : null;

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar
        restaurantId={params.id}
        restaurantName={restaurant.name}
        googleConnected={!!restaurant.google_refresh_token}
        activeSection="/avaliacoes"
      />

      <div style={{ flex: 1, minWidth: 0 }}>
        <header style={{
          background: '#fff', borderBottom: '1px solid var(--border)',
          padding: '0 24px', height: 56,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          position: 'sticky', top: 0, zIndex: 10,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <h1 style={{ fontSize: 16, fontWeight: 700 }}>Avaliações</h1>
            {avgRating && (
              <span style={{ fontSize: 13, color: '#f59e0b', fontWeight: 700 }}>
                ★ {avgRating}
              </span>
            )}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {pending.length > 0 && (
              <span style={{
                background: '#fef3c7', color: '#b45309',
                fontSize: 12, fontWeight: 700, padding: '3px 10px', borderRadius: 99,
              }}>
                {pending.length} pendente{pending.length > 1 ? 's' : ''}
              </span>
            )}
          </div>
        </header>

        <main style={{ padding: 24, maxWidth: 800 }}>
          {!reviews || reviews.length === 0 ? (
            <div style={{
              background: '#fff', borderRadius: 12, border: '1px solid var(--border)',
              padding: 48, textAlign: 'center', color: 'var(--text-muted)', fontSize: 14,
            }}>
              <div style={{ fontSize: 32, marginBottom: 12 }}>⭐</div>
              Nenhuma avaliação ainda.<br />
              <span style={{ fontSize: 13 }}>Conecte o Google Business para importar avaliações.</span>
            </div>
          ) : (
            <>
              {/* Pendentes */}
              {pending.length > 0 && (
                <section style={{ marginBottom: 32 }}>
                  <h2 style={{ fontSize: 12, fontWeight: 700, color: '#b45309', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>
                    Pendentes ({pending.length})
                  </h2>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {pending.map(r => (
                      <AvaliacaoCard key={r.id} review={r} restaurantId={params.id} />
                    ))}
                  </div>
                </section>
              )}

              {/* Respondidas */}
              {responded.length > 0 && (
                <section style={{ marginBottom: 32 }}>
                  <h2 style={{ fontSize: 12, fontWeight: 700, color: '#15803d', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>
                    Respondidas ({responded.length})
                  </h2>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {responded.map(r => (
                      <AvaliacaoCard key={r.id} review={r} restaurantId={params.id} />
                    ))}
                  </div>
                </section>
              )}

              {/* Ignoradas */}
              {ignored.length > 0 && (
                <section>
                  <h2 style={{ fontSize: 12, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>
                    Ignoradas ({ignored.length})
                  </h2>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {ignored.map(r => (
                      <AvaliacaoCard key={r.id} review={r} restaurantId={params.id} />
                    ))}
                  </div>
                </section>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}
