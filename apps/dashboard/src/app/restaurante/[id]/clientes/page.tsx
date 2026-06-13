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

export default async function ClientesPage({ params }: Props) {
  const supabase = createClient();

  const { data: restaurant } = await supabase.from('restaurants').select('*').eq('id', params.id).single();
  if (!restaurant) notFound();

  const { data: customers, count } = await supabase
    .from('customers').select('*', { count: 'exact' })
    .eq('restaurant_id', params.id)
    .order('last_visit_at', { ascending: false });

  const stampsRequired = restaurant.stamps_required || 10;

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar
        restaurantId={params.id}
        restaurantName={restaurant.name}
        googleConnected={!!restaurant.google_refresh_token}
        activeSection="/clientes"
      />

      <main style={{ flex: 1, minWidth: 0, padding: '32px 36px' }}>
        {/* Page header */}
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-0.025em', marginBottom: 3 }}>
            Clientes
          </h1>
          <p style={{ fontSize: 13.5, color: 'var(--text-muted)' }}>
            {count || 0} clientes no wallet
          </p>
        </div>

        <div className="card" style={{ overflow: 'hidden' }}>
          {!customers || customers.length === 0 ? (
            <div style={{ padding: 48, textAlign: 'center', color: 'var(--text-muted)', fontSize: 14 }}>
              Nenhum cliente ainda
            </div>
          ) : customers.map((c, i) => {
            const filled = Math.min(c.current_stamps || 0, stampsRequired);
            const pct = Math.round((filled / stampsRequired) * 100);
            const complete = filled >= stampsRequired;
            const initials = c.name
              ? c.name.split(' ').map((w: string) => w[0]).slice(0, 2).join('').toUpperCase()
              : (c.phone || '?').slice(-2);

            return (
              <div key={c.id} style={{
                padding: '13px 22px',
                borderTop: i > 0 ? '1px solid var(--border-light)' : 'none',
                display: 'flex', alignItems: 'center', gap: 14,
              }}>
                {/* Avatar */}
                <div style={{
                  width: 38, height: 38, borderRadius: '50%', flexShrink: 0,
                  background: complete ? 'var(--brand)' : '#f3f4f6',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: complete ? 16 : 12, fontWeight: 700,
                  color: complete ? '#fff' : '#6b7280',
                }}>
                  {complete ? '🎁' : initials}
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ fontSize: 13.5, fontWeight: 600 }}>{c.name || 'Anônimo'}</span>
                      {c.phone && (
                        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{c.phone}</span>
                      )}
                    </div>
                    <div style={{ display: 'flex', gap: 14, flexShrink: 0 }}>
                      <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{c.total_visits || 0} visitas</span>
                      <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{timeSince(c.last_visit_at)}</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ flex: 1, height: 4, background: '#f3f4f6', borderRadius: 99, overflow: 'hidden' }}>
                      <div style={{
                        width: `${pct}%`, height: '100%', borderRadius: 99,
                        background: complete ? 'var(--brand)' : 'var(--green)',
                      }} />
                    </div>
                    <span style={{ fontSize: 11.5, fontWeight: 700, flexShrink: 0, color: complete ? 'var(--brand)' : 'var(--text-secondary)' }}>
                      {complete ? 'Recompensa!' : `${filled}/${stampsRequired}`}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}
