import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import Sidebar from '@/components/Sidebar';

interface Props { params: { id: string } }

function timeSince(iso: string | null) {
  if (!iso) return 'nunca';
  const d = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  if (d === 0) return 'hoje';
  if (d === 1) return 'ontem';
  if (d < 7) return `${d}d atrás`;
  if (d < 30) return `${Math.floor(d / 7)}sem atrás`;
  return `${Math.floor(d / 30)}m atrás`;
}

const avatarColors = ['#fde68a', '#bbf7d0', '#bfdbfe', '#ddd6fe', '#fed7aa', '#fecaca'];

export default async function ClientesPage({ params }: Props) {
  const supabase = createClient();

  const { data: restaurant } = await supabase.from('restaurants').select('*').eq('id', params.id).single();
  if (!restaurant) notFound();

  const { data: customers, count } = await supabase
    .from('customers')
    .select('*', { count: 'exact' })
    .eq('restaurant_id', params.id)
    .order('last_visit_at', { ascending: false });

  const stampsRequired = restaurant.stamps_required || 10;

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar restaurantId={params.id} restaurantName={restaurant.name} googleConnected={!!restaurant.google_refresh_token} activeSection="/clientes" />

      <div style={{ flex: 1, minWidth: 0 }}>
        <header style={{
          background: '#fff', borderBottom: '1px solid var(--border)',
          padding: '0 24px', height: 56,
          display: 'flex', alignItems: 'center', gap: 12,
          position: 'sticky', top: 0, zIndex: 10,
        }}>
          <h1 style={{ fontSize: 16, fontWeight: 700 }}>Clientes</h1>
          <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{count || 0} no wallet</span>
        </header>

        <main style={{ padding: 24 }}>
          <div style={{ background: '#fff', borderRadius: 12, border: '1px solid var(--border)', overflow: 'hidden' }}>
            {!customers || customers.length === 0 ? (
              <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)', fontSize: 14 }}>
                Nenhum cliente ainda
              </div>
            ) : customers.map((c, i) => {
              const filled = Math.min(c.current_stamps || 0, stampsRequired);
              const pct = Math.round((filled / stampsRequired) * 100);
              const complete = filled >= stampsRequired;
              return (
                <div key={c.id} style={{
                  padding: '12px 20px',
                  borderTop: i > 0 ? '1px solid var(--border-light)' : 'none',
                  display: 'flex', alignItems: 'center', gap: 14,
                }}>
                  <div style={{
                    width: 38, height: 38, borderRadius: '50%', flexShrink: 0,
                    background: complete ? 'var(--brand)' : avatarColors[i % avatarColors.length],
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 13, fontWeight: 700,
                    color: complete ? '#fff' : '#1a1a1a',
                  }}>
                    {complete ? '🎁' : (c.name ? c.name.split(' ').map((w: string) => w[0]).slice(0, 2).join('').toUpperCase() : (c.phone || '?').slice(-2))}
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                      <span style={{ fontSize: 13, fontWeight: 600 }}>{c.name || c.phone || 'Anônimo'}</span>
                      <div style={{ display: 'flex', gap: 12, flexShrink: 0 }}>
                        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{c.total_visits || 0} visitas</span>
                        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{timeSince(c.last_visit_at)}</span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ flex: 1, height: 5, background: '#f3f4f6', borderRadius: 99, overflow: 'hidden' }}>
                        <div style={{
                          width: `${pct}%`, height: '100%', borderRadius: 99,
                          background: complete ? 'var(--brand)' : 'var(--green)',
                        }} />
                      </div>
                      <span style={{ fontSize: 11, fontWeight: 700, flexShrink: 0, color: complete ? 'var(--brand)' : 'var(--text-secondary)' }}>
                        {complete ? 'Recompensa!' : `${filled}/${stampsRequired}`}
                      </span>
                    </div>
                  </div>

                  {c.phone && (
                    <span style={{ fontSize: 11, color: 'var(--text-muted)', flexShrink: 0 }}>{c.phone}</span>
                  )}
                </div>
              );
            })}
          </div>
        </main>
      </div>
    </div>
  );
}
