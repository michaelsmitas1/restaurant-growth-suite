type Color = 'amber' | 'blue' | 'green' | 'red';

const colors: Record<Color, { bg: string; text: string; border: string }> = {
  amber: { bg: '#fffbeb', text: '#b45309', border: '#fde68a' },
  blue:  { bg: '#eff6ff', text: '#1d4ed8', border: '#bfdbfe' },
  green: { bg: '#f0fdf4', text: '#15803d', border: '#bbf7d0' },
  red:   { bg: '#fff0f1', text: '#b91c1c', border: '#fecaca' },
};

interface Props {
  label: string;
  value: string;
  sub?: string;
  color: Color;
  icon: string;
}

export default function MetricCard({ label, value, sub, color, icon }: Props) {
  const c = colors[color];
  return (
    <div style={{
      background: '#fff',
      border: '1px solid var(--border)',
      borderRadius: 12,
      padding: '18px 20px',
      display: 'flex',
      flexDirection: 'column',
      gap: 4,
    }}>
      <div style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: 36,
        height: 36,
        borderRadius: 8,
        background: c.bg,
        border: `1px solid ${c.border}`,
        fontSize: 16,
        marginBottom: 6,
      }}>
        {icon}
      </div>
      <div style={{ fontSize: 28, fontWeight: 800, lineHeight: 1, color: 'var(--text-primary)' }}>
        {value}
      </div>
      <div style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 500 }}>{label}</div>
      {sub && <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{sub}</div>}
    </div>
  );
}
