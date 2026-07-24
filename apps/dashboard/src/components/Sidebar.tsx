import Link from 'next/link';
import { LayoutDashboard, ChevronLeft, Circle } from 'lucide-react';

interface Props {
  restaurantId: string;
  restaurantName: string;
  googleConnected?: boolean;
  activeSection?: string;
}

// As demais seções (Avaliações, Fidelidade, Clientes, Campanhas, Configurações)
// consultavam tabelas dropadas no reset e viram redirect('/') (PLAN.md 2.0c) —
// removidas do menu até serem reconstruídas (spec-010/2.9).
const menuItems = [
  { icon: LayoutDashboard, label: 'Visão geral', href: '' },
];

export default function Sidebar({ restaurantId, restaurantName, googleConnected, activeSection = '' }: Props) {
  const base = `/restaurante/${restaurantId}`;
  const initial = restaurantName.charAt(0).toUpperCase();

  function NavItem({ icon: Icon, label, href }: { icon: typeof LayoutDashboard; label: string; href: string }) {
    const isActive = activeSection === href;
    return (
      <Link href={`${base}${href}`} className={`nav-link${isActive ? ' active' : ''}`}>
        <Icon size={15} strokeWidth={isActive ? 2.2 : 1.8} />
        <span>{label}</span>
      </Link>
    );
  }

  return (
    <>
      {/* ─── Desktop sidebar ─── */}
      <aside className="app-sidebar" style={{
        background: 'var(--sidebar-bg)',
        borderRight: '1px solid var(--sidebar-border)',
      }}>
        {/* Logo */}
        <div style={{ padding: '20px 16px 14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{
              width: 28, height: 28, background: 'var(--brand)', borderRadius: 7,
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, flexShrink: 0,
            }}>🍽</div>
            <span style={{ fontWeight: 700, fontSize: 14, letterSpacing: '-0.01em' }}>Growth Suite</span>
          </div>
        </div>

        {/* Restaurant chip */}
        <div style={{ padding: '0 10px 14px' }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '7px 10px', borderRadius: 9,
            background: '#f7f7f8', border: '1px solid #ebebeb',
          }}>
            <div style={{
              width: 24, height: 24, borderRadius: 6, background: 'var(--brand)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 11, fontWeight: 800, color: '#fff', flexShrink: 0,
            }}>{initial}</div>
            <span style={{
              fontSize: 12.5, fontWeight: 600,
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>{restaurantName}</span>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ padding: '0 8px', flex: 1 }}>
          <div className="section-label">Menu</div>
          {menuItems.map(item => <NavItem key={item.href} {...item} />)}
        </nav>

        {/* Google status */}
        <div style={{ padding: '12px 16px', borderTop: '1px solid var(--sidebar-border)' }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 5,
            fontSize: 11.5, fontWeight: 500,
            color: googleConnected ? '#16a34a' : 'var(--text-muted)',
            marginBottom: googleConnected ? 0 : 4,
          }}>
            <Circle size={5} fill={googleConnected ? '#16a34a' : '#9ca3af'} stroke="none" />
            Google {googleConnected ? 'conectado' : 'desconectado'}
          </div>
          {!googleConnected && (
            // Fluxo de conexão por restaurante ainda não existe (spec-024, Fase 3) —
            // o antigo endpoint no wallet-service (Railway) foi desativado.
            <span style={{ fontSize: 11.5, color: 'var(--text-muted)', fontWeight: 600 }}>
              Conectar (em breve)
            </span>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: '8px 8px 12px', borderTop: '1px solid var(--sidebar-border)' }}>
          <Link href="/" style={{
            display: 'flex', alignItems: 'center', gap: 5,
            fontSize: 12, color: 'var(--text-muted)',
            textDecoration: 'none', padding: '6px 10px', borderRadius: 7,
          }}>
            <ChevronLeft size={12} />
            Todos os restaurantes
          </Link>
        </div>
      </aside>

      {/* ─── Mobile top bar ─── */}
      <div className="mobile-top-bar">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            width: 26, height: 26, background: 'var(--brand)', borderRadius: 6,
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, flexShrink: 0,
          }}>🍽</div>
          <span style={{ fontWeight: 700, fontSize: 13.5 }}>Growth Suite</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          <div style={{
            width: 22, height: 22, borderRadius: 5, background: 'var(--brand)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 10, fontWeight: 800, color: '#fff',
          }}>{initial}</div>
          <span style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text-secondary)', maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {restaurantName}
          </span>
        </div>
      </div>
    </>
  );
}
