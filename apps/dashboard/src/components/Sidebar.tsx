import Link from 'next/link';

interface Props {
  restaurantId: string;
  restaurantName: string;
}

const navItems = [
  { icon: '▦', label: 'Visão geral', href: '' },
  { icon: '★', label: 'Avaliações', href: '#reviews' },
  { icon: '⬡', label: 'Clientes', href: '#clientes' },
  { icon: '✉', label: 'Campanhas', href: '#campanhas' },
];

export default function Sidebar({ restaurantId, restaurantName }: Props) {
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
    }}>
      {/* Logo */}
      <div style={{
        padding: '20px 16px 16px',
        borderBottom: '1px solid #2a2a2a',
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          marginBottom: 16,
        }}>
          <div style={{
            width: 28,
            height: 28,
            background: 'var(--brand)',
            borderRadius: 6,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 14,
          }}>🍽</div>
          <span style={{ color: '#fff', fontWeight: 700, fontSize: 14 }}>Growth Suite</span>
        </div>

        {/* Restaurante ativo */}
        <div style={{
          background: '#2a2a2a',
          borderRadius: 8,
          padding: '8px 10px',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}>
          <div style={{
            width: 24,
            height: 24,
            borderRadius: '50%',
            background: 'var(--brand)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 11,
            fontWeight: 700,
            color: '#fff',
            flexShrink: 0,
          }}>
            {restaurantName.charAt(0)}
          </div>
          <span style={{
            color: '#e5e5e5',
            fontSize: 12,
            fontWeight: 500,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}>
            {restaurantName}
          </span>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ padding: '12px 8px', flex: 1 }}>
        {navItems.map((item) => (
          <a
            key={item.label}
            href={`/restaurante/${restaurantId}${item.href}`}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '9px 12px',
              borderRadius: 8,
              color: item.href === '' ? '#fff' : 'var(--sidebar-muted)',
              background: item.href === '' ? '#2d2d2d' : 'transparent',
              fontSize: 13,
              fontWeight: item.href === '' ? 600 : 400,
              textDecoration: 'none',
              marginBottom: 2,
              transition: 'background 0.1s',
            }}
          >
            <span style={{ fontSize: 14, opacity: 0.8 }}>{item.icon}</span>
            {item.label}
          </a>
        ))}
      </nav>

      {/* Rodapé */}
      <div style={{
        padding: '12px 16px',
        borderTop: '1px solid #2a2a2a',
      }}>
        <Link
          href="/"
          style={{
            color: 'var(--sidebar-muted)',
            fontSize: 12,
            textDecoration: 'none',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          ← Todos os restaurantes
        </Link>
      </div>
    </aside>
  );
}
