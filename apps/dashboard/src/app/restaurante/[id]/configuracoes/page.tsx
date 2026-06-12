import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import Sidebar from '@/components/Sidebar';

interface Props { params: { id: string } }

export default async function ConfiguracoesPage({ params }: Props) {
  const supabase = createClient();

  const { data: restaurant } = await supabase.from('restaurants').select('*').eq('id', params.id).single();
  if (!restaurant) notFound();

  const googleConnected = !!restaurant.google_refresh_token;
  const tokenExpiry = restaurant.google_token_expires_at
    ? new Date(restaurant.google_token_expires_at).toLocaleDateString('pt-BR')
    : null;

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar restaurantId={params.id} restaurantName={restaurant.name} googleConnected={googleConnected} activeSection="/configuracoes" />

      <div style={{ flex: 1, minWidth: 0 }}>
        <header style={{
          background: '#fff', borderBottom: '1px solid var(--border)',
          padding: '0 24px', height: 56,
          display: 'flex', alignItems: 'center',
          position: 'sticky', top: 0, zIndex: 10,
        }}>
          <h1 style={{ fontSize: 16, fontWeight: 700 }}>Configurações</h1>
        </header>

        <main style={{ padding: 24, maxWidth: 640 }}>
          {/* Restaurante */}
          <section style={{ marginBottom: 24 }}>
            <h2 style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12 }}>
              Restaurante
            </h2>
            <div style={{ background: '#fff', borderRadius: 12, border: '1px solid var(--border)', overflow: 'hidden' }}>
              {[
                { label: 'Nome', value: restaurant.name },
                { label: 'Tipo', value: restaurant.type },
                { label: 'Bairro', value: restaurant.neighborhood },
                { label: 'Cidade', value: restaurant.city },
                { label: 'Selos para recompensa', value: String(restaurant.stamps_required || 10) },
                { label: 'Tom de voz IA', value: restaurant.tone_of_voice || 'Não definido' },
              ].map((row, i) => (
                <div key={row.label} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '12px 20px',
                  borderTop: i > 0 ? '1px solid var(--border-light)' : 'none',
                }}>
                  <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{row.label}</span>
                  <span style={{ fontSize: 13, fontWeight: 600 }}>{row.value}</span>
                </div>
              ))}
            </div>
          </section>

          {/* Google Business */}
          <section style={{ marginBottom: 24 }}>
            <h2 style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12 }}>
              Google Business
            </h2>
            <div style={{ background: '#fff', borderRadius: 12, border: '1px solid var(--border)', padding: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: googleConnected ? 12 : 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{
                    width: 8, height: 8, borderRadius: '50%', display: 'inline-block',
                    background: googleConnected ? '#22c55e' : '#9ca3af',
                  }} />
                  <span style={{ fontSize: 14, fontWeight: 600 }}>
                    {googleConnected ? 'Conectado' : 'Não conectado'}
                  </span>
                </div>
                <a
                  href={`https://restaurant-growth-suite-production.up.railway.app/auth/google/${params.id}`}
                  style={{
                    fontSize: 13, fontWeight: 600, padding: '6px 14px', borderRadius: 8,
                    background: googleConnected ? '#f3f4f6' : 'var(--brand)',
                    color: googleConnected ? 'var(--text-secondary)' : '#fff',
                    textDecoration: 'none',
                  }}
                >
                  {googleConnected ? 'Reconectar' : 'Conectar'}
                </a>
              </div>
              {googleConnected && tokenExpiry && (
                <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0 }}>
                  Token expira em: {tokenExpiry}
                </p>
              )}
            </div>
          </section>

          {/* Wallet */}
          <section>
            <h2 style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12 }}>
              Wallet
            </h2>
            <div style={{ background: '#fff', borderRadius: 12, border: '1px solid var(--border)', padding: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <span style={{ fontSize: 14, fontWeight: 600 }}>QR Code do estabelecimento</span>
                <a
                  href={`https://restaurant-growth-suite-production.up.railway.app/wallet/${params.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    fontSize: 13, fontWeight: 600, padding: '6px 14px', borderRadius: 8,
                    background: '#f3f4f6', color: 'var(--text-secondary)', textDecoration: 'none',
                  }}
                >
                  Ver página →
                </a>
              </div>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0 }}>
                URL para o cliente adicionar o cartão fidelidade ao Wallet:
              </p>
              <code style={{
                display: 'block', marginTop: 6, fontSize: 11,
                background: '#f9fafb', border: '1px solid var(--border)',
                borderRadius: 6, padding: '6px 10px', wordBreak: 'break-all',
              }}>
                {`https://restaurant-growth-suite-production.up.railway.app/wallet/${params.id}`}
              </code>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
