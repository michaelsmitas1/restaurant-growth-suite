'use client';
import { useState, useTransition } from 'react';
import { savePointsProgram, saveCashbackProgram, deactivateLoyaltyProgram } from '@/app/actions/loyalty';
import { resolvePointsConfig, resolveCashbackConfig, type LoyaltyProgram } from '@/lib/loyalty';

interface Props {
  restaurantId: string;
  type: 'points' | 'cashback';
  program: LoyaltyProgram | null;
  totalCustomers: number;
  totalEarned: number;
}

const inputStyle: React.CSSProperties = {
  padding: '8px 11px', borderRadius: 8, border: '1px solid var(--border)',
  fontSize: 13.5, outline: 'none', fontFamily: 'var(--font-inter)',
  width: '100%', boxSizing: 'border-box', color: 'var(--text-primary)',
};

export default function LoyaltyProgramCard({ restaurantId, type, program, totalCustomers, totalEarned }: Props) {
  const [open, setOpen]     = useState(false);
  const [isPending, startTx] = useTransition();
  const isActive = !!program?.active;

  const icon  = type === 'points' ? '⭐' : '💸';
  const label = type === 'points' ? 'Pontos'   : 'Cashback';
  const color = type === 'points' ? '#7c3aed'  : '#0891b2';
  const bg    = type === 'points' ? '#f5f3ff'  : '#f0f9ff';

  const pointsCfg   = type === 'points'   && program ? resolvePointsConfig(program) : null;
  const cashbackCfg = type === 'cashback' && program ? resolveCashbackConfig(program) : null;

  function handleDeactivate() {
    if (!program || !confirm(`Desativar programa de ${label.toLowerCase()}?`)) return;
    startTx(() => { void deactivateLoyaltyProgram(program.id, restaurantId); });
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startTx(async () => {
      if (type === 'points') {
        await savePointsProgram(restaurantId, program?.id || null, fd);
      } else {
        await saveCashbackProgram(restaurantId, program?.id || null, fd);
      }
      setOpen(false);
    });
  }

  return (
    <div className="card" style={{ padding: 20, opacity: isPending ? 0.7 : 1, transition: 'opacity 0.2s' }}>
      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: isActive ? 14 : 0 }}>
        <div style={{
          width: 38, height: 38, borderRadius: 10, flexShrink: 0,
          background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18,
        }}>
          {icon}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 14, fontWeight: 800 }}>{program?.name || label}</span>
            {isActive ? (
              <span style={{ fontSize: 10, fontWeight: 700, background: '#f0fdf4', color: '#16a34a', padding: '2px 8px', borderRadius: 99 }}>
                ● Ativo
              </span>
            ) : (
              <span style={{ fontSize: 10, fontWeight: 600, background: '#f9fafb', color: '#6b7280', padding: '2px 8px', borderRadius: 99 }}>
                Inativo
              </span>
            )}
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
            {isActive
              ? type === 'points'
                ? `${pointsCfg?.points_per_real ?? 1} ponto por R$1 · mín. ${pointsCfg?.min_redeem ?? 100} pts para resgatar`
                : `${cashbackCfg?.cashback_pct ?? 5}% de volta · mín. R$ ${cashbackCfg?.min_redeem ?? 10} para resgatar`
              : type === 'points'
                ? 'Acumula pontos por R$ gasto, troca por prêmios'
                : '% do valor de volta como crédito na conta'}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 7, flexShrink: 0 }}>
          {isActive && (
            <button
              onClick={handleDeactivate}
              disabled={isPending}
              style={{
                fontSize: 11.5, fontWeight: 600, padding: '5px 11px', borderRadius: 7,
                border: '1px solid var(--border)', background: '#fff',
                color: 'var(--text-muted)', cursor: 'pointer',
              }}
            >
              Pausar
            </button>
          )}
          <button
            onClick={() => setOpen(v => !v)}
            disabled={isPending}
            style={{
              fontSize: 12, fontWeight: 700, padding: '6px 14px', borderRadius: 8,
              background: isActive ? 'var(--brand-light)' : color,
              color: isActive ? 'var(--brand)' : '#fff',
              border: 'none', cursor: 'pointer',
            }}
          >
            {isActive ? '✏ Editar' : `Ativar ${label}`}
          </button>
        </div>
      </div>

      {/* Stats — only when active */}
      {isActive && !open && (
        <div style={{ display: 'flex', gap: 10, marginBottom: open ? 16 : 0 }}>
          <div style={{ flex: 1, padding: '10px 14px', borderRadius: 9, background: bg }}>
            <div style={{ fontSize: 11, color, fontWeight: 600, marginBottom: 3 }}>Clientes com saldo</div>
            <div style={{ fontSize: 22, fontWeight: 800, color, letterSpacing: '-0.03em' }}>{totalCustomers}</div>
          </div>
          <div style={{ flex: 1, padding: '10px 14px', borderRadius: 9, background: bg }}>
            <div style={{ fontSize: 11, color, fontWeight: 600, marginBottom: 3 }}>
              {type === 'points' ? 'Total distribuído' : 'Total em cashback'}
            </div>
            <div style={{ fontSize: 22, fontWeight: 800, color, letterSpacing: '-0.03em' }}>
              {type === 'points' ? totalEarned.toLocaleString('pt-BR') : `R$ ${totalEarned.toFixed(2).replace('.', ',')}`}
            </div>
          </div>
        </div>
      )}

      {/* Edit / Activate form */}
      {open && (
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 14, paddingTop: 14, borderTop: '1px solid var(--border-light)' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>Nome do programa</label>
            <input name="name" type="text" style={inputStyle}
              defaultValue={program?.name || label}
              placeholder={type === 'points' ? 'Ex: Pontos Fidelidade' : 'Ex: Cashback VIP'} />
          </div>

          {type === 'points' ? (
            <div style={{ display: 'flex', gap: 12 }}>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 5 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>Pontos por R$ gasto</label>
                <input name="points_per_real" type="number" min={0.1} max={100} step={0.5} style={inputStyle}
                  defaultValue={pointsCfg?.points_per_real ?? 1} />
              </div>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 5 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>Mínimo para resgatar (pts)</label>
                <input name="min_redeem" type="number" min={10} max={10000} step={10} style={inputStyle}
                  defaultValue={pointsCfg?.min_redeem ?? 100} />
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: 12 }}>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 5 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>% de cashback</label>
                <input name="cashback_pct" type="number" min={0.5} max={50} step={0.5} style={inputStyle}
                  defaultValue={cashbackCfg?.cashback_pct ?? 5} />
              </div>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 5 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>Mínimo para resgatar (R$)</label>
                <input name="min_redeem" type="number" min={1} max={500} step={1} style={inputStyle}
                  defaultValue={cashbackCfg?.min_redeem ?? 10} />
              </div>
            </div>
          )}

          <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
            <button type="submit" disabled={isPending} style={{
              padding: '8px 18px', borderRadius: 9, border: 'none',
              background: isPending ? '#e5e7eb' : color, color: '#fff',
              fontSize: 13, fontWeight: 700, cursor: isPending ? 'not-allowed' : 'pointer',
            }}>
              {isPending ? 'Salvando...' : isActive ? 'Salvar' : `Ativar ${label}`}
            </button>
            <button type="button" onClick={() => setOpen(false)} style={{
              padding: '8px 14px', borderRadius: 9, border: '1px solid var(--border)',
              background: '#fff', color: 'var(--text-muted)', fontSize: 13, cursor: 'pointer',
            }}>
              Cancelar
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
