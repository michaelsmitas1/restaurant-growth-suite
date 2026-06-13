import Link from 'next/link';
import {
  LayoutDashboard,
  Star,
  Ticket,
  Users,
  Send,
  Settings,
  ChevronLeft,
  Circle,
} from 'lucide-react';

interface Props {
  restaurantId: string;
  restaurantName: string;
  googleConnected?: boolean;
  activeSection?: string;
}

const navItems = [
  { icon: LayoutDashboard, label: 'Visão geral',    href: '' },
  { icon: Star,            label: 'Avaliações',     href: '/avaliacoes' },
  { icon: Ticket,          label: 'Fidelidade',     href: '/wallet' },
  { icon: Users,           label: 'Clientes',       href: '/clientes' },
  { icon: Send,            label: 'Campanhas',      href: '/campanhas' },
  { icon: Settings,        label: 'Configurações',  href: '/configuracoes' },
];

export default function Sidebar({ restaurantId, restaurantName, googleConnected, activeSection = '' }: Props) {
  const base = `/restaurante/${restaurantId}`;
  const initial = restaurantName.charAt(0).toUpperCase();

  return (
    <aside style={{
      width: 220,
      background: 'var(--sidebar-bg)',
      display: 'flex',
      flexDirection: 'column',
      flexShrink: 0,
      position: 'sticky',
      top: 0,
      height: '100vh',
      overflowY: 'auto',
    }}>
      {/* Logo */}
      <div style={{ padding: '18px 14px 16px', borderBottom: '1px solid #1e1e1e' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 14 }}>
          <div style={{
            width: 26, height: 26, background: 'var(--brand)', borderRadius: 6,
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <span style={{ fontSize: 13 }}>🍽</span>
          </div>
          <span style={{ color: '#fff', fontWeight: 700, fontSize: 13.5, letterSpacing: '-0.01em' }}>
            Growth Suite
          </span>
        </div>

        {/* Restaurant chip */}
        <div style={{
          background: '#1a1a1a',
          borderRadius: 8,
          padding: '8px 10px',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          border: '1px solid #252525',
        }}>
          <div style={{
            width: 26, height: 26, borderRadius: 6,
            background: 'var(--brand)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 12, fontWeight: 800, color: '#fff', flexShrink: 0,
          }}>
            {initial}
          </div>
          <span style={{
            color: '#d1d5db', fontSize: 12, fontWeight: 600,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {restaurantName}
          </span>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ padding: '10px 8px', flex: 1 }}>
        {navItems.map(({ icon: Icon, label, href }) => {
          const isActive = activeSection === href;
          return (
            <Link
              key={href}
              href={`${base}${href}`}
              className={`nav-link${isActive ? ' active' : ''}`}
            >
              <Icon size={15} strokeWidth={isActive ? 2.2 : 1.8} />
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Google status */}
      <div style={{ padding: '12px 14px', borderTop: '1px solid #1e1e1e' }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 6,
          fontSize: 11, fontWeight: 600,
          color: googleConnected ? '#4ade80' : '#6b7280',
          marginBottom: googleConnected ? 0 : 6,
        }}>
          <Circle
            size={5}
            fill={googleConnected ? '#4ade80' : '#6b7280'}
            stroke="none"
          />
          Google {googleConnected ? 'conectado' : 'desconectado'}
        </div>
        {!googleConnected && (
          <a
            href={`https://restaurant-growth-suite-production.up.railway.app/auth/google/${restaurantId}`}
            style={{ fontSize: 11, color: 'var(--brand)', textDecoration: 'none', fontWeight: 600 }}
          >
            Conectar →
          </a>
        )}
      </div>

      {/* Footer */}
      <div style={{ padding: '8px 8px 12px', borderTop: '1px solid #1e1e1e' }}>
        <Link
          href="/"
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            fontSize: 12, color: '#4b5563',
            textDecoration: 'none', padding: '6px 10px', borderRadius: 7,
            transition: 'color 0.12s',
          }}
        >
          <ChevronLeft size={13} />
          Todos os restaurantes
        </Link>
      </div>
    </aside>
  );
}
