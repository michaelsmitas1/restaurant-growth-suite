import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export default async function Home() {
  const supabase = createClient();
  const { data: restaurants } = await supabase
    .from('restaurants')
    .select('id, name, segment, neighborhood, city, active')
    .order('created_at', { ascending: false });

  if (!restaurants || restaurants.length === 0) {
    redirect('/restaurante/9a588819-e3fc-4817-a0f7-55a5974c4c5b');
  }

  if (restaurants && restaurants.length === 1) {
    redirect(`/restaurante/${restaurants[0].id}`);
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      {/* Sidebar mínima */}
      <aside style={{
        width: 220, background: 'var(--sidebar-bg)',
        display: 'flex', flexDirection: 'column', flexShrink: 0,
      }}>
        <div style={{ padding: '20px 16px', borderBottom: '1px solid #2a2a2a' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{
              width: 28, height: 28, background: 'var(--brand)', borderRadius: 6,
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14,
            }}>🍽</div>
            <span style={{ color: '#fff', fontWeight: 700, fontSize: 14 }}>Growth Suite</span>
          </div>
        </div>
      </aside>

      {/* Conteúdo */}
      <main style={{ flex: 1, padding: 32 }}>
        <div style={{ maxWidth: 600 }}>
          <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 4 }}>Seus restaurantes</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 24 }}>
            Selecione um restaurante para ver o painel
          </p>

          {!restaurants || restaurants.length === 0 ? (
            <div style={{
              background: '#fff', borderRadius: 12, border: '1px solid var(--border)',
              padding: 40, textAlign: 'center',
            }}>
              <p style={{ color: 'var(--text-muted)', marginBottom: 12 }}>Nenhum restaurante cadastrado</p>
              <code style={{
                background: '#f9fafb', border: '1px solid var(--border)',
                padding: '6px 12px', borderRadius: 8, fontSize: 13,
              }}>
                node scripts/onboard-restaurant.js
              </code>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {restaurants.map(r => (
                <Link
                  key={r.id}
                  href={`/restaurante/${r.id}`}
                  style={{
                    background: '#fff', borderRadius: 12,
                    border: '1px solid var(--border)',
                    padding: '16px 20px',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    textDecoration: 'none', color: 'inherit',
                    transition: 'border-color 0.15s, box-shadow 0.15s',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{
                      width: 40, height: 40, borderRadius: 10,
                      background: 'var(--brand)', display: 'flex',
                      alignItems: 'center', justifyContent: 'center',
                      fontSize: 18, fontWeight: 800, color: '#fff',
                    }}>
                      {r.name.charAt(0)}
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 15 }}>{r.name}</div>
                      <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                        {r.segment} · {r.neighborhood}, {r.city}
                      </div>
                    </div>
                  </div>
                  <span style={{
                    fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 99,
                    background: r.active ? 'var(--green-light)' : '#f3f4f6',
                    color: r.active ? 'var(--green)' : 'var(--text-muted)',
                  }}>
                    {r.active ? '● ativo' : '○ inativo'}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
