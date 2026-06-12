function timeSince(iso: string | null) {
  if (!iso) return 'nunca';
  const d = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  if (d === 0) return 'hoje';
  if (d === 1) return 'ontem';
  if (d < 7) return `${d}d atrás`;
  if (d < 30) return `${Math.floor(d / 7)}sem`;
  return `${Math.floor(d / 30)}m atrás`;
}

function initials(name: string | null, phone: string | null) {
  if (name) return name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
  if (phone) return phone.slice(-2);
  return '?';
}

const avatarColors = ['#fde68a', '#bbf7d0', '#bfdbfe', '#ddd6fe', '#fed7aa', '#fecaca'];

interface Customer {
  id: string; name: string | null; phone: string | null;
  current_stamps: number; total_visits: number; last_visit_at: string | null;
}

export default function CustomersList({ customers, stampsRequired }: { customers: Customer[]; stampsRequired: number }) {
  return (
    <section>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <h2 style={{ fontSize: 15, fontWeight: 700 }}>Clientes no Wallet</h2>
        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{customers.length} recentes</span>
      </div>

      <div style={{ background: '#fff', borderRadius: 12, border: '1px solid var(--border)', overflow: 'hidden' }}>
        {customers.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
            Nenhum cliente ainda
          </div>
        ) : customers.map((c, i) => {
          const filled = Math.min(c.current_stamps || 0, stampsRequired);
          const pct = Math.round((filled / stampsRequired) * 100);
          const complete = filled >= stampsRequired;
          const avatarBg = avatarColors[i % avatarColors.length];

          return (
            <div
              key={c.id}
              style={{
                padding: '11px 16px',
                borderTop: i > 0 ? '1px solid var(--border-light)' : 'none',
                display: 'flex',
                alignItems: 'center',
                gap: 12,
              }}
            >
              {/* Avatar */}
              <div style={{
                width: 36, height: 36, borderRadius: '50%',
                background: complete ? 'var(--brand)' : avatarBg,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 12, fontWeight: 700, flexShrink: 0,
                color: complete ? '#fff' : '#1a1a1a',
              }}>
                {complete ? '🎁' : initials(c.name, c.phone)}
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {c.name || c.phone || 'Anônimo'}
                  </span>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)', flexShrink: 0, marginLeft: 8 }}>
                    {timeSince(c.last_visit_at)}
                  </span>
                </div>

                {/* Barra de progresso */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{
                    flex: 1, height: 5, background: '#f3f4f6', borderRadius: 99, overflow: 'hidden',
                  }}>
                    <div style={{
                      width: `${pct}%`,
                      height: '100%',
                      background: complete ? 'var(--brand)' : 'var(--green)',
                      borderRadius: 99,
                      transition: 'width 0.3s',
                    }} />
                  </div>
                  <span style={{
                    fontSize: 11, fontWeight: 700, flexShrink: 0,
                    color: complete ? 'var(--brand)' : 'var(--text-secondary)',
                  }}>
                    {complete ? 'Recompensa!' : `${filled}/${stampsRequired}`}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
