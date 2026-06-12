const typeConfig: Record<string, { label: string; icon: string; color: string; bg: string }> = {
  reactivation: { label: 'Reativação', icon: '🔄', color: '#7c3aed', bg: '#f5f3ff' },
  slow_day:     { label: 'Slow Day',   icon: '📅', color: '#1d4ed8', bg: '#eff6ff' },
  seasonal:     { label: 'Sazonal',    icon: '🎉', color: '#be185d', bg: '#fdf2f8' },
  reward:       { label: 'Recompensa', icon: '🎁', color: '#b45309', bg: '#fffbeb' },
  manual:       { label: 'Manual',     icon: '✏️',  color: '#374151', bg: '#f9fafb' },
};

function formatDate(iso: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
}

interface Campaign {
  id: string; type: string; message_text: string | null;
  sent_to_count: number; status: string; sent_at: string | null; created_at: string;
}

export default function CampaignsList({ campaigns }: { campaigns: Campaign[] }) {
  if (!campaigns.length) return null;

  return (
    <section>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <h2 style={{ fontSize: 15, fontWeight: 700 }}>Campanhas recentes</h2>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
        gap: 12,
      }}>
        {campaigns.map(c => {
          const cfg = typeConfig[c.type] || typeConfig.manual;
          return (
            <div key={c.id} style={{
              background: '#fff',
              border: '1px solid var(--border)',
              borderRadius: 12,
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              gap: 10,
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{
                    fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 99,
                    background: cfg.bg, color: cfg.color,
                  }}>
                    {cfg.icon} {cfg.label}
                  </span>
                </div>
                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                  {formatDate(c.sent_at || c.created_at)}
                </span>
              </div>

              {c.message_text && (
                <p style={{
                  fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5,
                  background: '#f9fafb', borderRadius: 8, padding: '8px 10px',
                  overflow: 'hidden', display: '-webkit-box',
                  WebkitLineClamp: 3, WebkitBoxOrient: 'vertical',
                }}>
                  "{c.message_text}"
                </p>
              )}

              <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                <span style={{ fontSize: 24, fontWeight: 800 }}>{c.sent_to_count}</span>
                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>mensagens enviadas</span>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
