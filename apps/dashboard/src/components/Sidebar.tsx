import Link from 'next/link';
import LogoutButton from './LogoutButton';

interface Props {
  restaurantId: string;
  restaurantName: string;
  googleConnected?: boolean;
  activeSection?: string;
}

const navItems = [
  { icon: '▦', label: 'Visão geral',   href: '' },
  { icon: '⭐', label: 'Avaliações',   href: '/avaliacoes' },
  { icon: '🎫', label: 'Fidelidade',   href: '/wallet' },
  { icon: '👥', label: 'Clientes',     href: '/clientes' },
  { icon: '📲', label: 'Campanhas',    href: '/campanhas' },
  { icon: '⚙',  label: 'Configurações', href: '/configuracoes' },
];

export default function Sidebar({ restaurantId, restaurantName, googleConnected, activeSection = '' }: Props) {
  const base = `/restaurante/${restaurantId}`;

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
      <div style={{ padding: '18px 16px 14px', borderBottom: '1px solid #2a2a2a' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <div style={{
            width: 28, height: 28, background: 'var(--brand)', borderRadius: 6,
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14,
          }}>🍽</div>
          <span style={{ color: '#fff', fontWeight: 700, fontSize: 14 }}>Growth Suite</span>
        </div>

        <div style={{
          background: '#2a2a2a', borderRadius: 8, padding: '8px 10px',
          display: 'flex', alignItems: 'center', gap: 8,
        }}>
          <div style={{
            width: 28, height: 28, borderRadius: 6, background: 'var(--brand)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 13, fontWeight: 800, color: '#fff', flexShrink: 0,
          }}>
            {restaurantName.charAt(0)}
          </div>
          <span style={{
            color: '#e5e7eb', fontSize: 12, fontWeight: 600,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {restaurantName}
          </span>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ padding: '10px 8px', flex: 1 }}>
        {navItems.map(item => {
          const isActive = activeSection === item.href;
          return (
            <Link
              key={item.href}
              href={`${base}${item.href}`}
              style={{
                display: 'flex', alignItems: 'center', gap: 9,
                padding: '8px 12px', borderRadius: 8, marginBottom: 2,
                textDecoration: 'none', fontSize: 13,
                fontWeight: isActive ? 600 : 400,
                color: isActive ? '#fff' : '#9ca3af',
                background: isActive ? '#2a2a2a' : 'transparent',
              }}
            >
              <span style={{ fontSize: 14 }}>{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Google status */}
      <div style={{ padding: '10px 14px', borderTop: '1px solid #2a2a2a' }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 6,
          fontSize: 11, fontWeight: 600, marginBottom: googleConnected ? 0 : 6,
          color: googleConnected ? '#4ade80' : '#6b7280',
        }}>
          <span style={{
            width: 6, height: 6, borderRadius: '50%',
            background: googleConnected ? '#4ade80' : '#6b7280',
            display: 'inline-block',
          }} />
          Google {googleConnected ? 'conectado' : 'desconectado'}
        </div>
        {!googleConnected && (
          <a
            href={`https://restaurant-growth-suite-production.up.railway.app/auth/google/${restaurantId}`}
            style={{ fontSize: 11, color: 'var(--brand)', textDecoration: 'none', fontWeight: 600 }}
          >
            Conectar Google →
          </a>
        )}
      </div>

      {/* Rodapé */}
      <div style={{ padding: '8px 8px', borderTop: '1px solid #2a2a2a' }}>
        <Link
          href="/"
          style={{
            display: 'block', fontSize: 12, color: '#6b7280',
            textDecoration: 'none', padding: '6px 12px', borderRadius: 8,
          }}
        >
          ← Todos os restaurantes
        </Link>
        <LogoutButton />
      </div>
    </aside>
  );
}
