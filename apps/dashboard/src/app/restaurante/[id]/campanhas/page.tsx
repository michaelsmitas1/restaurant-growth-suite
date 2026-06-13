import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import Sidebar from '@/components/Sidebar';

interface Props { params: { id: string } }

const typeConfig: Record<string, { label: string; color: string; bg: string }> = {
  reactivation: { label: 'Reativação', color: '#7c3aed', bg: '#f5f3ff' },
  slow_day:     { label: 'Slow Day',   color: '#2563eb', bg: '#eff6ff' },
  seasonal:     { label: 'Sazonal',    color: '#be185d', bg: '#fdf2f8' },
  reward:       { label: 'Recompensa', color: '#b45309', bg: '#fffbeb' },
  manual:       { label: 'Manual',     color: '#374151', bg: '#f9fafb' },
};

export default async function CampanhasPage({ params }: Props) {
  const supabase = createClient();

  const { data: restaurant } = await supabase.from('restaurants').select('*').eq('id', params.id).single();
  if (!restaurant) notFound();

  const { data: campaigns } = await supabase
    .from('campaigns').select('*').eq('restaurant_id', params.id)
    .order('created_at', { ascending: false });

  const totalMsgs = campaigns?.reduce((s, c) => s + (c.sent_to_count || 0), 0) || 0;

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar
        restaurantId={params.id}
        restaurantName={restaurant.name}
        googleConnected={!!restaurant.google_refresh_token}
        activeSection="/campanhas"
      />

      <main style={{ flex: 1, minWidth: 0, padding: '32px 36px' }}>
        {/* Page header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32 }}>
          <div>
            <h1 style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-0.025em', marginBottom: 3 }}>
              Campanhas
            </h1>
            <p style={{ fontSize: 13.5, color: 'var(--text-muted)' }}>
              {totalMsgs} mensagens enviadas · {campaigns?.length || 0} campanhas
            </p>
          </div>
          <button style={{
            background: 'var(--brand)', color: '#fff', border: 'none',
            fontSize: 13.5, fontWeight: 600, padding: '9px 18px',
            borderRadius: 9, cursor: 'pointer',
          }}>
            + Nova campanha
          </button>
        </div>

        {!campaigns || campaigns.length === 0 ? (
          <div className="card" style={{
            padding: 48, textAlign: 'center', color: 'var(--text-muted)', fontSize: 14,
          }}>
            Nenhuma campanha ainda
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))', gap: 14 }}>
            {campaigns.map(c => {
              const cfg = typeConfig[c.type] || typeConfig.manual;
              return (
                <div key={c.id} className="card" style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{
                      fontSize: 11, fontWeight: 700, padding: '3px 9px', borderRadius: 99,
                      background: cfg.bg, color: cfg.color,
                    }}>
                      {cfg.label}
                    </span>
                    <span style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>
                      {new Date(c.sent_at || c.created_at).toLocaleDateString('pt-BR')}
                    </span>
                  </div>

                  {c.message_text && (
                    <p style={{
                      fontSize: 12.5, color: 'var(--text-secondary)', lineHeight: 1.55,
                      background: '#f9fafb', borderRadius: 8, padding: '9px 11px',
                      margin: 0, overflow: 'hidden', display: '-webkit-box',
                      WebkitLineClamp: 3, WebkitBoxOrient: 'vertical',
                    }}>
                      "{c.message_text}"
                    </p>
                  )}

                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                    <span style={{ fontSize: 30, fontWeight: 800, letterSpacing: '-0.03em' }}>{c.sent_to_count}</span>
                    <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>msgs enviadas</span>
                  </div>

                  <span style={{
                    fontSize: 11.5, fontWeight: 600, padding: '2px 8px', borderRadius: 99,
                    background: c.status === 'sent' ? '#f0fdf4' : '#f3f4f6',
                    color: c.status === 'sent' ? '#16a34a' : 'var(--text-muted)',
                    alignSelf: 'flex-start',
                  }}>
                    {c.status === 'sent' ? '● Enviada' : c.status}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
