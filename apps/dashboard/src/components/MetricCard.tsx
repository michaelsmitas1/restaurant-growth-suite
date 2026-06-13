interface Props {
  label: string;
  value: string;
  sub?: string;
  trend?: { value: string; positive: boolean };
}

export default function MetricCard({ label, value, sub, trend }: Props) {
  return (
    <div className="metric-card" style={{ padding: '20px 22px' }}>
      <div style={{ fontSize: 12.5, color: 'var(--text-muted)', fontWeight: 500, marginBottom: 10 }}>
        {label}
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 4 }}>
        <span style={{
          fontSize: 36,
          fontWeight: 800,
          lineHeight: 1,
          letterSpacing: '-0.04em',
          color: 'var(--text-primary)',
        }}>
          {value}
        </span>
        {trend && (
          <span style={{
            fontSize: 11.5,
            fontWeight: 700,
            padding: '2px 7px',
            borderRadius: 99,
            background: trend.positive ? '#f0fdf4' : '#fef2f2',
            color: trend.positive ? '#16a34a' : '#dc2626',
          }}>
            {trend.positive ? '↑' : '↓'} {trend.value}
          </span>
        )}
      </div>
      {sub && (
        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
          {sub}
        </div>
      )}
    </div>
  );
}
