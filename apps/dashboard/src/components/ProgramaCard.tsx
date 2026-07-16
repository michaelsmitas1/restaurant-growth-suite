'use client';
import { useState } from 'react';
import { saveStampProgram } from '@/app/actions/loyalty';
import { PROGRAM_TYPES, type LoyaltyProgram } from '@/lib/loyalty';

interface Props {
  restaurantId: string;
  program: LoyaltyProgram | null;
  stampsRequired: number;
  rewardDescription: string;
  programName: string;
}

export default function ProgramaCard({
  restaurantId, program, stampsRequired, rewardDescription, programName,
}: Props) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving]   = useState(false);
  const [feedback, setFeedback] = useState<'saved' | 'error' | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setFeedback(null);
    try {
      await saveStampProgram(restaurantId, program?.id || null, new FormData(e.currentTarget));
      setEditing(false);
      setFeedback('saved');
      setTimeout(() => setFeedback(null), 2500);
    } catch {
      setFeedback('error');
    } finally {
      setSaving(false);
    }
  }

  const rowStyle: React.CSSProperties = {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '11px 0', gap: 12,
  };
  const inputStyle: React.CSSProperties = {
    padding: '8px 11px', borderRadius: 8, border: '1px solid var(--border)',
    fontSize: 13.5, outline: 'none', fontFamily: 'var(--font-inter)',
  };

  return (
    <div className="card" style={{ padding: '16px 18px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 16 }}>🎟️</span>
          <span style={{ fontSize: 13.5, fontWeight: 700 }}>{programName}</span>
          <span style={{
            fontSize: 10.5, fontWeight: 700, padding: '2px 7px', borderRadius: 99,
            background: '#f0fdf4', color: '#16a34a',
          }}>
            ● Ativo
          </span>
        </div>
        {!editing && (
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            {feedback === 'saved' && <span style={{ fontSize: 12, color: 'var(--green)', fontWeight: 600 }}>✓ Salvo</span>}
            <button
              onClick={() => setEditing(true)}
              style={{
                fontSize: 12.5, fontWeight: 600, padding: '6px 13px', borderRadius: 8,
                background: '#fff', border: '1px solid var(--border)',
                color: 'var(--text-secondary)', cursor: 'pointer',
              }}
            >
              ✏ Editar
            </button>
          </div>
        )}
      </div>

      {editing ? (
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 10 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label style={{ fontSize: 12, color: 'var(--text-muted)' }}>Nome do programa</label>
            <input name="name" defaultValue={programName} style={inputStyle} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label style={{ fontSize: 12, color: 'var(--text-muted)' }}>Selos necessários</label>
            <input name="required" type="number" min="1" max="50" defaultValue={String(stampsRequired)} style={{ ...inputStyle, width: 100 }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label style={{ fontSize: 12, color: 'var(--text-muted)' }}>Recompensa</label>
            <input name="reward" defaultValue={rewardDescription} placeholder="Ex: sobremesa grátis" style={inputStyle} />
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <button
              type="submit" disabled={saving}
              style={{
                padding: '8px 18px', borderRadius: 8, border: 'none',
                background: saving ? '#e5e7eb' : 'var(--brand)',
                color: saving ? 'var(--text-muted)' : '#fff',
                fontSize: 13, fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer',
              }}
            >
              {saving ? 'Salvando...' : 'Salvar'}
            </button>
            <button
              type="button" onClick={() => setEditing(false)}
              style={{
                padding: '8px 14px', borderRadius: 8, border: '1px solid var(--border)',
                background: '#fff', color: 'var(--text-muted)', fontSize: 13, cursor: 'pointer',
              }}
            >
              Cancelar
            </button>
            {feedback === 'error' && <span style={{ fontSize: 12, color: 'var(--red)' }}>Erro ao salvar</span>}
          </div>
        </form>
      ) : (
        <>
          <div style={{ ...rowStyle, borderTop: '1px solid var(--border-light)' }}>
            <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Selos para recompensa</span>
            <span style={{ fontSize: 13, fontWeight: 600 }}>{stampsRequired}</span>
          </div>
          <div style={{ ...rowStyle, borderTop: '1px solid var(--border-light)' }}>
            <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Recompensa</span>
            <span style={{ fontSize: 13, fontWeight: 600, textAlign: 'right' }}>{rewardDescription}</span>
          </div>
        </>
      )}

      {/* Roadmap of other program types */}
      <div style={{ marginTop: 14, paddingTop: 12, borderTop: '1px solid var(--border-light)' }}>
        <div style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
          Outros tipos de programa
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {PROGRAM_TYPES.filter(t => t.type !== 'stamps').map(t => (
            <div
              key={t.type}
              title={t.description}
              style={{
                display: 'flex', alignItems: 'center', gap: 5,
                fontSize: 11.5, fontWeight: 600, padding: '5px 10px', borderRadius: 8,
                background: '#f9fafb', color: 'var(--text-muted)', border: '1px solid var(--border-light)',
              }}
            >
              <span>{t.icon}</span> {t.label}
              <span style={{ fontSize: 9.5, fontWeight: 700, color: '#9ca3af' }}>em breve</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
