import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import Sidebar from '@/components/Sidebar';

interface Props { params: { id: string } }

const typeConfig: Record<string, { label: string; icon: string; color: string; bg: string }> = {
  reactivation: { label: 'Reativação', icon: '🔄', color: '#7c3aed', bg: '#f5f3ff' },
  slow_day:     { label: 'Slow Day',   icon: '📅', color: '#1d4ed8', bg: '#eff6ff' },
  seasonal:     { label: 'Sazonal',    icon: '🎉', color: '#be185d', bg: '#fdf2f8' },
  reward:       { label: 'Recompensa', icon: '🎁', color: '#b45309', bg: '#fffbeb' },
  manual:       { label: 'Manual',     icon: '✏️',  color: '#374151', bg: '#f9fafb' },
};

export default async function CampanhasPage({ params }: Props) {
  const supabase = createClient();

  const { data: restaurant } = await supabase.from('restaurants').select('*').eq('id', params.id).single();
  if (!restaurant) notFound();

  const { data: campaigns } = await supabase
    .from('campaigns')
    .select('*')
    .eq('restaurant_id', params.id)
    .order('created_at', { ascending: false });

  const totalMsgs = campaigns?.reduce((s, c) => s + (c.sent_to_count || 0), 0) || 0;

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar restaurantId={params.id} restaurantName={restaurant.name} googleConnected={!!restaurant.google_refresh_token} activeSection="/campanhas" />

      <div style={{ flex: 1, minWidth: 0 }}>
        <header style={{
          background: '#fff', borderBottom: '1px solid var(--border)',
          padding: '0 24px', height: 56,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          position: 'sticky', top: 0, zIndex: 10,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <h1 style={{ fontSize: 16, fontWeight: 700 }}>Campanhas</h1>
            <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{totalMsgs} msgs enviadas</span>
          </div>
          <button style={{
            background: 'var(--brand)', color: '#fff', border: 'none',
            fontSize: 13, fontWeight: 700, padding: '7px 16px', borderRadius: 8, cursor: 'pointer',
          }}>
            + Nova campanha
          </button>
        </header>

        <main style={{ padding: 24 }}>
          {!campaigns || campaigns.length === 0 ? (
            <div style={{
              background: '#fff', borderRadius: 12, border: '1px solid var(--border)',
              padding: 40, textAlign: 'center', color: 'var(--text-muted)', fontSize: 14,
            }}>
              Nenhuma campanha ainda
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
              {campaigns.map(c => {
                const cfg = typeConfig[c.type] || typeConfig.manual;
                return (
                  <div key={c.id} style={{
                    background: '#fff', border: '1px solid var(--border)',
                    borderRadius: 12, padding: 16,
                    display: 'flex', flexDirection: 'column', gap: 10,
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{
                        fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 99,
                        background: cfg.bg, color: cfg.color,
                      }}>
                        {cfg.icon} {cfg.label}
                      </span>
                      <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                        {new Date(c.sent_at || c.created_at).toLocaleDateString('pt-BR')}
                      </span>
                    </div>

                    {c.message_text && (
                      <p style={{
                        fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5,
                        background: '#f9fafb', borderRadius: 8, padding: '8px 10px',
                        margin: 0,
                        overflow: 'hidden', display: '-webkit-box',
                        WebkitLineClamp: 3, WebkitBoxOrient: 'vertical',
                      }}>
                        "{c.message_text}"
                      </p>
                    )}

                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                      <span style={{ fontSize: 26, fontWeight: 800 }}>{c.sent_to_count}</span>
                      <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>mensagens enviadas</span>
                    </div>

                    <span style={{
                      fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 99,
                      background: c.status === 'sent' ? 'var(--green-light)' : '#f3f4f6',
                      color: c.status === 'sent' ? 'var(--green)' : 'var(--text-muted)',
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
    </div>
  );
}
