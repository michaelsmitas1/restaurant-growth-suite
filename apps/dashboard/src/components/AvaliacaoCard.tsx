'use client';
import { useState, useTransition } from 'react';
import { approveReview, ignoreReview, saveResponse } from '@/app/actions/reviews';

interface Review {
  id: string;
  author: string;
  rating: number;
  text: string;
  sentiment: string | null;
  status: string;
  ai_response: string | null;
  final_response: string | null;
  created_at: string;
}

const sentimentStyle: Record<string, { bg: string; color: string; label: string }> = {
  positive: { bg: '#f0fdf4', color: '#15803d', label: 'Positiva' },
  neutral:  { bg: '#f9fafb', color: '#6b7280', label: 'Neutra'   },
  negative: { bg: '#fff0f1', color: '#b91c1c', label: 'Negativa' },
};

const statusStyle: Record<string, { bg: string; color: string; label: string }> = {
  pending:   { bg: '#fffbeb', color: '#b45309', label: '⏳ Pendente'    },
  approved:  { bg: '#f0fdf4', color: '#15803d', label: '✓ Aprovada'     },
  edited:    { bg: '#f5f3ff', color: '#7c3aed', label: '✏ Editada'      },
  ignored:   { bg: '#f9fafb', color: '#9ca3af', label: '— Ignorada'     },
  published: { bg: '#eff6ff', color: '#1d4ed8', label: '● Publicada'    },
};

function Stars({ n }: { n: number }) {
  return (
    <span>
      {[1,2,3,4,5].map(i => (
        <span key={i} style={{ color: i <= n ? '#f59e0b' : '#e5e7eb', fontSize: 14 }}>★</span>
      ))}
    </span>
  );
}

export default function AvaliacaoCard({ review, restaurantId }: { review: Review; restaurantId: string }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(review.final_response || review.ai_response || '');
  const [isPending, startTransition] = useTransition();

  const sent = sentimentStyle[review.sentiment || 'neutral'];
  const stat = statusStyle[review.status] || statusStyle.pending;
  const isPendingReview = review.status === 'pending';
  const response = review.final_response || review.ai_response;

  function handleApprove() {
    startTransition(() => approveReview(review.id, restaurantId));
  }

  function handleIgnore() {
    if (!confirm('Ignorar esta avaliação?')) return;
    startTransition(() => ignoreReview(review.id, restaurantId));
  }

  function handleSave() {
    if (!draft.trim()) return;
    startTransition(() => saveResponse(review.id, restaurantId, draft));
    setEditing(false);
  }

  return (
    <div style={{
      background: '#fff',
      border: `1px solid ${isPendingReview ? '#fde68a' : 'var(--border)'}`,
      borderLeft: isPendingReview ? '3px solid #f59e0b' : '3px solid transparent',
      borderRadius: 12,
      padding: '16px 20px',
      opacity: isPending ? 0.6 : 1,
      transition: 'opacity 0.2s',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Stars n={review.rating || 0} />
          <span style={{ fontWeight: 700, fontSize: 14 }}>{review.author || 'Anônimo'}</span>
          {review.sentiment && (
            <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 7px', borderRadius: 99, background: sent.bg, color: sent.color }}>
              {sent.label}
            </span>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 99, background: stat.bg, color: stat.color }}>
            {stat.label}
          </span>
          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
            {new Date(review.created_at).toLocaleDateString('pt-BR')}
          </span>
        </div>
      </div>

      {/* Review text */}
      {review.text && (
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.55, marginBottom: 12 }}>
          {review.text}
        </p>
      )}

      {/* AI response / edit area */}
      {response && (
        <div style={{ marginBottom: 12 }}>
          {editing ? (
            <textarea
              value={draft}
              onChange={e => setDraft(e.target.value)}
              rows={4}
              style={{
                width: '100%', fontSize: 13, lineHeight: 1.55, padding: '10px 12px',
                border: '1px solid #93c5fd', borderRadius: 8, outline: 'none',
                resize: 'vertical', fontFamily: 'inherit', background: '#eff6ff',
              }}
            />
          ) : (
            <div style={{
              fontSize: 13, color: '#1e40af', lineHeight: 1.55,
              background: '#eff6ff', borderLeft: '3px solid #3b82f6',
              borderRadius: '0 8px 8px 0', padding: '10px 14px',
            }}>
              <span style={{ display: 'block', fontSize: 10, fontWeight: 700, color: '#60a5fa', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>
                {review.final_response ? 'Resposta editada' : 'Resposta gerada pela IA'}
              </span>
              {response}
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      {isPendingReview && !editing && (
        <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
          <button onClick={handleApprove} disabled={isPending} style={btnStyle('green')}>
            ✓ Aprovar
          </button>
          <button onClick={() => { setDraft(response || ''); setEditing(true); }} disabled={isPending} style={btnStyle('blue')}>
            ✏ Editar
          </button>
          <button onClick={handleIgnore} disabled={isPending} style={btnStyle('gray')}>
            — Ignorar
          </button>
        </div>
      )}

      {editing && (
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={handleSave} disabled={isPending || !draft.trim()} style={btnStyle('green')}>
            💾 Salvar
          </button>
          <button onClick={() => setEditing(false)} disabled={isPending} style={btnStyle('gray')}>
            ✕ Cancelar
          </button>
        </div>
      )}
    </div>
  );
}

function btnStyle(variant: 'green' | 'blue' | 'gray') {
  const variants = {
    green: { background: '#f0fdf4', color: '#15803d', border: '1px solid #bbf7d0' },
    blue:  { background: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe' },
    gray:  { background: '#f9fafb', color: '#6b7280', border: '1px solid #e5e7eb' },
  };
  return {
    ...variants[variant],
    fontSize: 12, fontWeight: 700, padding: '6px 14px',
    borderRadius: 7, cursor: 'pointer', transition: 'opacity 0.15s',
  } as React.CSSProperties;
}
