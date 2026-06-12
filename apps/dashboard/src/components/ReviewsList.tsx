'use client';
import { useState } from 'react';

const sentimentStyle: Record<string, { bg: string; color: string; label: string }> = {
  positive: { bg: '#f0fdf4', color: '#15803d', label: 'Positiva' },
  neutral:  { bg: '#f9fafb', color: '#6b7280', label: 'Neutra' },
  negative: { bg: '#fff0f1', color: '#b91c1c', label: 'Negativa' },
};

const statusStyle: Record<string, { bg: string; color: string; label: string }> = {
  pending:   { bg: '#fffbeb', color: '#b45309', label: '⏳ Aguardando' },
  published: { bg: '#eff6ff', color: '#1d4ed8', label: '🌐 Publicada' },
  approved:  { bg: '#f0fdf4', color: '#15803d', label: '✅ Aprovada' },
  ignored:   { bg: '#f9fafb', color: '#9ca3af', label: '— Ignorada' },
  edited:    { bg: '#f5f3ff', color: '#7c3aed', label: '✏️ Editada' },
};

function Stars({ n }: { n: number }) {
  return (
    <span>
      {Array.from({ length: 5 }, (_, i) => (
        <span key={i} style={{ color: i < n ? '#f59e0b' : '#e5e7eb', fontSize: 13 }}>★</span>
      ))}
    </span>
  );
}

interface Review {
  id: string; author: string; rating: number; text: string;
  sentiment: string; status: string; ai_response: string;
  final_response: string; created_at: string;
}

export default function ReviewsList({ reviews }: { reviews: Review[] }) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  return (
    <section>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <h2 style={{ fontSize: 15, fontWeight: 700 }}>Avaliações Google</h2>
        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{reviews.length} total</span>
      </div>

      <div style={{ background: '#fff', borderRadius: 12, border: '1px solid var(--border)', overflow: 'hidden' }}>
        {reviews.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
            Nenhuma avaliação ainda
          </div>
        ) : reviews.map((r, i) => {
          const expanded = expandedId === r.id;
          const sent = sentimentStyle[r.sentiment] || sentimentStyle.neutral;
          const stat = statusStyle[r.status] || statusStyle.pending;
          return (
            <div
              key={r.id}
              style={{ borderTop: i > 0 ? '1px solid var(--border-light)' : 'none' }}
            >
              <button
                onClick={() => setExpandedId(expanded ? null : r.id)}
                style={{
                  width: '100%', textAlign: 'left', padding: '12px 16px',
                  background: expanded ? '#fafafa' : 'transparent',
                  border: 'none', cursor: 'pointer', display: 'block',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                      <Stars n={r.rating} />
                      <span style={{ fontWeight: 600, fontSize: 13 }}>{r.author}</span>
                    </div>
                    <p style={{
                      fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.4,
                      overflow: 'hidden', display: '-webkit-box',
                      WebkitLineClamp: expanded ? 99 : 2, WebkitBoxOrient: 'vertical',
                    }}>
                      {r.text || '(sem texto)'}
                    </p>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-end', flexShrink: 0 }}>
                    <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 99, background: sent.bg, color: sent.color }}>
                      {sent.label}
                    </span>
                    <span style={{ fontSize: 11, fontWeight: 500, padding: '2px 8px', borderRadius: 99, background: stat.bg, color: stat.color }}>
                      {stat.label}
                    </span>
                  </div>
                </div>
              </button>

              {expanded && (
                <div style={{ padding: '0 16px 14px', background: '#fafafa' }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>
                    {r.final_response ? 'Resposta publicada' : 'Resposta gerada pela IA'}
                  </div>
                  <div style={{
                    fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5,
                    background: '#fff', borderRadius: 8, padding: '10px 12px',
                    borderLeft: '3px solid #3b82f6',
                  }}>
                    {r.final_response || r.ai_response || '—'}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
