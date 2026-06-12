import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import Sidebar from '@/components/Sidebar';

interface Props { params: { id: string } }

const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
  pending:        { label: 'Pendente',        color: '#b45309', bg: '#fffbeb' },
  published:      { label: 'Publicada',       color: '#15803d', bg: '#f0fdf4' },
  auto_published: { label: 'Auto-publicada',  color: '#1d4ed8', bg: '#eff6ff' },
  ignored:        { label: 'Ignorada',        color: '#6b7280', bg: '#f9fafb' },
};

const sentimentConfig: Record<string, { label: string; color: string }> = {
  positive: { label: 'Positiva', color: '#15803d' },
  neutral:  { label: 'Neutra',   color: '#b45309' },
  negative: { label: 'Negativa', color: '#dc2626' },
};

export default async function AvaliacoesPage({ params }: Props) {
  const supabase = createClient();

  const { data: restaurant } = await supabase.from('restaurants').select('*').eq('id', params.id).single();
  if (!restaurant) notFound();

  const { data: reviews } = await supabase
    .from('reviews')
    .select('*')
    .eq('restaurant_id', params.id)
    .order('created_at', { ascending: false });

  const stars = (n: number) => '★'.repeat(n) + '☆'.repeat(5 - n);

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar restaurantId={params.id} restaurantName={restaurant.name} googleConnected={!!restaurant.google_refresh_token} activeSection="/avaliacoes" />

      <div style={{ flex: 1, minWidth: 0 }}>
        <header style={{
          background: '#fff', borderBottom: '1px solid var(--border)',
          padding: '0 24px', height: 56,
          display: 'flex', alignItems: 'center',
          position: 'sticky', top: 0, zIndex: 10,
        }}>
          <h1 style={{ fontSize: 16, fontWeight: 700 }}>Avaliações</h1>
          <span style={{ fontSize: 13, color: 'var(--text-muted)', marginLeft: 8 }}>
            {reviews?.length || 0} no total
          </span>
        </header>

        <main style={{ padding: 24 }}>
          {!reviews || reviews.length === 0 ? (
            <div style={{
              background: '#fff', borderRadius: 12, border: '1px solid var(--border)',
              padding: 40, textAlign: 'center', color: 'var(--text-muted)', fontSize: 14,
            }}>
              Nenhuma avaliação ainda
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {reviews.map(r => {
                const st = statusConfig[r.status] || statusConfig.pending;
                const sent = sentimentConfig[r.sentiment || 'neutral'];
                return (
                  <div key={r.id} style={{
                    background: '#fff', borderRadius: 12,
                    border: '1px solid var(--border)', padding: '16px 20px',
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{ fontSize: 14, color: '#f59e0b', letterSpacing: 1 }}>{stars(r.rating || 0)}</span>
                        <span style={{ fontWeight: 600, fontSize: 14 }}>{r.author_name || 'Anônimo'}</span>
                        {r.sentiment && (
                          <span style={{ fontSize: 11, fontWeight: 600, color: sent.color }}>{sent.label}</span>
                        )}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{
                          fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 99,
                          background: st.bg, color: st.color,
                        }}>
                          {st.label}
                        </span>
                        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                          {new Date(r.created_at).toLocaleDateString('pt-BR')}
                        </span>
                      </div>
                    </div>

                    {r.review_text && (
                      <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5, margin: '0 0 10px' }}>
                        {r.review_text}
                      </p>
                    )}

                    {r.ai_response && (
                      <div style={{
                        background: '#eff6ff', borderLeft: '3px solid #3b82f6',
                        borderRadius: '0 8px 8px 0', padding: '10px 14px',
                      }}>
                        <p style={{ fontSize: 11, fontWeight: 600, color: '#1d4ed8', marginBottom: 4 }}>Resposta IA</p>
                        <p style={{ fontSize: 13, color: '#1e40af', lineHeight: 1.5, margin: 0 }}>{r.ai_response}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
