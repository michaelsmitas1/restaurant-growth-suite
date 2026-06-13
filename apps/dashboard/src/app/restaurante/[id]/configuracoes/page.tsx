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

  function Row({ label, value }: { label: string; value: string }) {
    return (
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '12px 20px', borderTop: '1px solid var(--border-light)',
      }}>
        <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{label}</span>
        <span style={{ fontSize: 13, fontWeight: 600 }}>{value}</span>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar
        restaurantId={params.id}
        restaurantName={restaurant.name}
        googleConnected={googleConnected}
        activeSection="/configuracoes"
      />

      <main style={{ flex: 1, minWidth: 0, padding: '32px 36px' }}>
        {/* Page header */}
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-0.025em', marginBottom: 3 }}>
            Configurações
          </h1>
          <p style={{ fontSize: 13.5, color: 'var(--text-muted)' }}>
            Dados do restaurante e integrações
          </p>
        </div>

        <div style={{ maxWidth: 600, display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Restaurante */}
          <section>
            <h2 style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>
              Restaurante
            </h2>
            <div className="card" style={{ overflow: 'hidden' }}>
              <div style={{ padding: '12px 20px' }}>
                <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Nome</span>
                <div style={{ fontSize: 13, fontWeight: 600, marginTop: 2 }}>{restaurant.name}</div>
              </div>
              <Row label="Tipo" value={restaurant.type} />
              <Row label="Bairro" value={restaurant.neighborhood} />
              <Row label="Cidade" value={restaurant.city} />
              <Row label="Selos para recompensa" value={String(restaurant.stamps_required || 10)} />
              <Row label="Tom de voz IA" value={restaurant.tone_of_voice || 'Não definido'} />
            </div>
          </section>

          {/* Google Business */}
          <section>
            <h2 style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>
              Google Business
            </h2>
            <div className="card" style={{ padding: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{
                    width: 7, height: 7, borderRadius: '50%', display: 'inline-block',
                    background: googleConnected ? '#22c55e' : '#9ca3af',
                  }} />
                  <span style={{ fontSize: 14, fontWeight: 600 }}>
                    {googleConnected ? 'Conectado' : 'Não conectado'}
                  </span>
                  {googleConnected && tokenExpiry && (
                    <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                      · expira em {tokenExpiry}
                    </span>
                  )}
                </div>
                <a
                  href={`https://restaurant-growth-suite-production.up.railway.app/auth/google/${params.id}`}
                  style={{
                    fontSize: 13, fontWeight: 600, padding: '7px 14px', borderRadius: 8,
                    background: googleConnected ? '#f3f4f6' : 'var(--brand)',
                    color: googleConnected ? 'var(--text-secondary)' : '#fff',
                    textDecoration: 'none',
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
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
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
    </div>
  );
}
