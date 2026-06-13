import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import MobileNav from '@/components/MobileNav';

interface Props { params: { id: string } }

export default async function ConfiguracoesPage({ params }: Props) {
  const supabase = createClient();

  const { data: restaurant } = await supabase.from('restaurants').select('*').eq('id', params.id).single();
  if (!restaurant) notFound();

  const googleConnected = !!restaurant.google_refresh_token;
  const tokenExpiry = restaurant.google_token_expires_at
    ? new Date(restaurant.google_token_expires_at).toLocaleDateString('pt-BR') : null;

  return (
    <div className="app-layout">
      <Sidebar
        restaurantId={params.id}
        restaurantName={restaurant.name}
        googleConnected={googleConnected}
        activeSection="/configuracoes"
      />

      <main className="page-main">
        <div className="page-header-row">
          <div>
            <h1 style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-0.025em', marginBottom: 3 }}>
              Configurações
            </h1>
            <p style={{ fontSize: 13.5, color: 'var(--text-muted)' }}>
              Dados do restaurante e integrações
            </p>
          </div>
        </div>

        <div style={{ maxWidth: 580, display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Restaurante */}
          <section>
            <h2 style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>
              Restaurante
            </h2>
            <div className="card" style={{ overflow: 'hidden' }}>
              {[
                { label: 'Nome',                  value: restaurant.name },
                { label: 'Tipo',                  value: restaurant.type },
                { label: 'Bairro',                value: restaurant.neighborhood },
                { label: 'Cidade',                value: restaurant.city },
                { label: 'Selos para recompensa', value: String(restaurant.stamps_required || 10) },
                { label: 'Tom de voz IA',          value: restaurant.tone_of_voice || 'Não definido' },
              ].map((row, i) => (
                <div key={row.label} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '12px 20px',
                  borderTop: i > 0 ? '1px solid var(--border-light)' : 'none',
                  gap: 12,
                }}>
                  <span style={{ fontSize: 13, color: 'var(--text-muted)', flexShrink: 0 }}>{row.label}</span>
                  <span style={{ fontSize: 13, fontWeight: 600, textAlign: 'right' }}>{row.value}</span>
                </div>
              ))}
            </div>
          </section>

          {/* Google Business */}
          <section>
            <h2 style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>
              Google Business
            </h2>
            <div className="card" style={{ padding: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 2 }}>
                    <span style={{
                      width: 7, height: 7, borderRadius: '50%', display: 'inline-block',
                      background: googleConnected ? '#22c55e' : '#9ca3af',
                    }} />
                    <span style={{ fontSize: 14, fontWeight: 600 }}>
                      {googleConnected ? 'Conectado' : 'Não conectado'}
                    </span>
                  </div>
                  {googleConnected && tokenExpiry && (
                    <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Expira em {tokenExpiry}</span>
                  )}
                </div>
                <a
                  href={`https://restaurant-growth-suite-production.up.railway.app/auth/google/${params.id}`}
                  style={{
                    fontSize: 13, fontWeight: 600, padding: '7px 14px', borderRadius: 8,
                    background: googleConnected ? '#f3f4f6' : 'var(--brand)',
                    color: googleConnected ? 'var(--text-secondary)' : '#fff',
                    textDecoration: 'none', whiteSpace: 'nowrap',
                  }}
                >
                  {googleConnected ? 'Reconectar' : 'Conectar'}
                </a>
              </div>
            </div>
          </section>

          {/* Wallet */}
          <section>
            <h2 style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>
              Wallet
            </h2>
            <div className="card" style={{ padding: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, gap: 12, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 14, fontWeight: 600 }}>QR Code do estabelecimento</span>
                <a
                  href={`https://restaurant-growth-suite-production.up.railway.app/wallet/${params.id}`}
                  target="_blank" rel="noopener noreferrer"
                  style={{
                    fontSize: 13, fontWeight: 600, padding: '7px 14px', borderRadius: 8,
                    background: '#f3f4f6', color: 'var(--text-secondary)', textDecoration: 'none',
                  }}
                >
                  Ver página →
                </a>
              </div>
              <code style={{
                display: 'block', fontSize: 11, background: '#f9fafb',
                border: '1px solid var(--border)', borderRadius: 7,
                padding: '8px 12px', wordBreak: 'break-all', color: 'var(--text-secondary)',
              }}>
                {`https://restaurant-growth-suite-production.up.railway.app/wallet/${params.id}`}
              </code>
            </div>
          </section>
        </div>
      </main>

      <MobileNav restaurantId={params.id} />
    </div>
  );
}
