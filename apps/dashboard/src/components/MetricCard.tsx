type Color = 'amber' | 'blue' | 'green' | 'red';

const palette: Record<Color, { bg: string; icon: string; border: string }> = {
  amber: { bg: '#fffbeb', icon: '#d97706', border: '#fde68a' },
  blue:  { bg: '#eff6ff', icon: '#2563eb', border: '#bfdbfe' },
  green: { bg: '#f0fdf4', icon: '#16a34a', border: '#bbf7d0' },
  red:   { bg: '#fff0f1', icon: '#dc2626', border: '#fecaca' },
};

interface Props {
  label: string;
  value: string;
  sub?: string;
  color: Color;
  icon: string;
}

export default function MetricCard({ label, value, sub, color, icon }: Props) {
  const p = palette[color];
  return (
    <div className="metric-card" style={{
      background: '#fff',
      border: '1px solid var(--border)',
      borderRadius: 14,
      padding: '20px 22px',
      display: 'flex',
      flexDirection: 'column',
      gap: 2,
      boxShadow: 'var(--shadow-sm)',
    }}>
      <div style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: 34,
        height: 34,
        borderRadius: 8,
        background: p.bg,
        border: `1px solid ${p.border}`,
        fontSize: 15,
        marginBottom: 10,
      }}>
        {icon}
      </div>
      <div style={{
        fontSize: 30,
        fontWeight: 800,
        lineHeight: 1,
        color: 'var(--text-primary)',
        letterSpacing: '-0.03em',
        marginBottom: 2,
      }}>
        {value}
      </div>
      <div style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 500 }}>
        {label}
      </div>
      {sub && (
        <div style={{ fontSize: 11.5, color: 'var(--text-muted)', marginTop: 2 }}>
          {sub}
        </div>
      )}
    </div>
  );
}
