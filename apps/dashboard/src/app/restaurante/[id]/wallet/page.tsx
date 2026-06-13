import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import MobileNav from '@/components/MobileNav';
import QRCode from 'qrcode';

interface Props { params: { id: string } }

const SERVICE_URL = process.env.SERVICE_URL || 'https://wallet-service-production.up.railway.app';

function timeSince(iso: string | null) {
  if (!iso) return 'nunca';
  const d = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  if (d === 0) return 'hoje';
  if (d === 1) return 'ontem';
  if (d < 7) return `${d}d atrás`;
  return `${Math.floor(d / 7)}sem atrás`;
}

export default async function WalletPage({ params }: Props) {
  const supabase = createClient();

  const { data: restaurant } = await supabase
    .from('restaurants').select('*').eq('id', params.id).single();
  if (!restaurant) notFound();

  const enrollUrl = `${SERVICE_URL}/wallet/${params.id}`;

  const [
    { count: totalCustomers },
    { data: customers },
    { count: stampsToday },
    { count: nearReward },
  ] = await Promise.all([
    supabase.from('customers').select('*', { count: 'exact', head: true }).eq('restaurant_id', params.id),
    supabase.from('customers').select('*').eq('restaurant_id', params.id).order('last_visit_at', { ascending: false }).limit(8),
    supabase.from('visits').select('*', { count: 'exact', head: true })
      .eq('restaurant_id', params.id)
      .gte('created_at', new Date(new Date().setHours(0, 0, 0, 0)).toISOString()),
    supabase.from('customers').select('*', { count: 'exact', head: true })
      .eq('restaurant_id', params.id)
      .gte('current_stamps', Math.max(1, (restaurant.stamps_required || 10) - 2)),
  ]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const qrSvg: string = await (QRCode as any).toString(enrollUrl, {
    type: 'svg', margin: 2,
    color: { dark: '#111111', light: '#ffffff' },
    errorCorrectionLevel: 'M',
  });

  const stampsRequired = restaurant.stamps_required || 10;

  return (
    <div className="app-layout">
      <Sidebar
        restaurantId={params.id}
        restaurantName={restaurant.name}
        googleConnected={!!restaurant.google_refresh_token}
        activeSection="/wallet"
      />

      <main className="page-main">
        <div className="page-header-row">
          <div>
            <h1 style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-0.025em', marginBottom: 3 }}>
              Fidelidade
            </h1>
            <p style={{ fontSize: 13.5, color: 'var(--text-muted)' }}>
              {stampsRequired} selos para recompensa
            </p>
          </div>
        </div>

        {/* QR + stats layout: stack on mobile */}
        <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', alignItems: 'flex-start' }}>

          {/* QR Code card */}
          <div className="card" style={{
            padding: 24, display: 'flex', flexDirection: 'column',
            alignItems: 'center', gap: 14, minWidth: 220, flex: '0 0 auto',
          }}>
            <p style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text-secondary)', textAlign: 'center', margin: 0 }}>
              QR para novos clientes
            </p>
            <div
              dangerouslySetInnerHTML={{ __html: qrSvg }}
              style={{ width: 160, height: 160, borderRadius: 8, overflow: 'hidden' }}
            />
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 10, lineHeight: 1.5 }}>
                Imprima ou exiba no balcão.<br />Cliente escaneia → adiciona ao Wallet.
              </p>
              <a
                href={enrollUrl} target="_blank" rel="noopener noreferrer"
                style={{
                  display: 'inline-block', fontSize: 12, fontWeight: 600,
                  color: 'var(--brand)', textDecoration: 'none',
                  background: 'var(--brand-light)', padding: '7px 14px', borderRadius: 8,
                }}
              >
                Abrir página →
              </a>
            </div>
          </div>

          {/* Right column — stretches to fill */}
          <div style={{ flex: 1, minWidth: 200, display: 'flex', flexDirection: 'column', gap: 14 }}>

            {/* Mini metrics */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
              {[
                { label: 'No Wallet',    value: String(totalCustomers || 0) },
                { label: 'Selos hoje',   value: String(stampsToday || 0) },
                { label: 'Prox. recomp.',value: String(nearReward || 0) },
              ].map(m => (
                <div key={m.label} className="metric-card" style={{ padding: '16px 16px' }}>
                  <div style={{ fontSize: 11.5, color: 'var(--text-muted)', marginBottom: 6 }}>{m.label}</div>
                  <div style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-0.03em' }}>{m.value}</div>
                </div>
              ))}
            </div>

            {/* Programa */}
            <div className="card" style={{ padding: '14px 18px' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>
                Programa de fidelidade
              </div>
              {[
                { label: 'Carimbos para recompensa', value: String(stampsRequired) },
                { label: 'Recompensa',               value: restaurant.reward_description || 'Não definida' },
              ].map((row, i) => (
                <div key={row.label} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '8px 0', borderTop: i > 0 ? '1px solid var(--border-light)' : 'none', gap: 8,
                }}>
                  <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{row.label}</span>
                  <span style={{ fontSize: 13, fontWeight: 600 }}>{row.value}</span>
                </div>
              ))}
            </div>

            {/* Clientes recentes */}
            {customers && customers.length > 0 && (
              <div className="card" style={{ overflow: 'hidden' }}>
                <div style={{ padding: '12px 18px', borderBottom: '1px solid var(--border-light)' }}>
                  <span style={{ fontSize: 13.5, fontWeight: 700 }}>Clientes recentes</span>
                </div>
                {customers.map((c, i) => {
                  const filled = Math.min(c.current_stamps || 0, stampsRequired);
                  const pct = Math.round((filled / stampsRequired) * 100);
                  const complete = filled >= stampsRequired;
                  return (
                    <div key={c.id} style={{
                      padding: '10px 18px',
                      borderTop: i > 0 ? '1px solid var(--border-light)' : 'none',
                      display: 'flex', alignItems: 'center', gap: 10,
                    }}>
                      <div style={{
                        width: 30, height: 30, borderRadius: '50%',
                        background: complete ? 'var(--brand)' : '#f3f4f6',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: complete ? 13 : 10, fontWeight: 700, flexShrink: 0,
                        color: complete ? '#fff' : '#6b7280',
                      }}>
                        {complete ? '🎁' : (c.name ? c.name[0].toUpperCase() : '?')}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                          <span style={{ fontSize: 13, fontWeight: 600 }}>{c.name || c.phone || 'Anônimo'}</span>
                          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{timeSince(c.last_visit_at)}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                          <div style={{ flex: 1, height: 4, background: '#f3f4f6', borderRadius: 99, overflow: 'hidden' }}>
                            <div style={{ width: `${pct}%`, height: '100%', background: complete ? 'var(--brand)' : 'var(--green)', borderRadius: 99 }} />
                          </div>
                          <span style={{ fontSize: 11, fontWeight: 700, flexShrink: 0, color: complete ? 'var(--brand)' : 'var(--text-secondary)' }}>
                            {complete ? 'Pronto!' : `${filled}/${stampsRequired}`}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </main>

      <MobileNav restaurantId={params.id} />
    </div>
  );
}
