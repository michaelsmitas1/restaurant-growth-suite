// ─── Loyalty program abstraction ───
// Program config lives in loyalty_programs.config (jsonb). Each type reads
// the keys it cares about.

export type ProgramType = 'stamps' | 'points' | 'cashback' | 'tiers' | 'subscription';

export interface LoyaltyProgram {
  id: string;
  restaurant_id: string;
  name: string;
  type: ProgramType;
  config: Record<string, unknown>;
  active: boolean;
}

export interface StampConfig {
  required: number;
  reward: string;
}

export interface PointsConfig {
  points_per_real: number;
  min_redeem: number;
}

export interface CashbackConfig {
  cashback_pct: number;
  min_redeem: number;
}

export const PROGRAM_TYPES: {
  type: ProgramType;
  label: string;
  icon: string;
  description: string;
  available: boolean;
}[] = [
  { type: 'stamps',       label: 'Cartão de selos', icon: '🎟️', description: 'Compre N, ganhe a recompensa',            available: true  },
  { type: 'points',       label: 'Pontos',          icon: '⭐',  description: 'Acumula por R$ gasto, troca por prêmios', available: true  },
  { type: 'cashback',     label: 'Cashback',        icon: '💸',  description: '% do valor de volta como crédito',        available: true  },
  { type: 'tiers',        label: 'Níveis VIP',      icon: '🏆',  description: 'Bronze→Ouro com benefícios crescentes',   available: false },
  { type: 'subscription', label: 'Clube',           icon: '🔑',  description: 'Mensalidade com benefício recorrente',    available: false },
];

/**
 * Derive stamp rules from the active program, falling back to the legacy
 * restaurant columns if no program row exists yet.
 */
export function resolveStampConfig(
  program: LoyaltyProgram | null | undefined,
  fallback: { stamps_required: number | null; reward_description: string | null },
): { stampsRequired: number; rewardDescription: string } {
  const cfg = (program?.config || {}) as Partial<StampConfig>;
  return {
    stampsRequired:    cfg.required ?? fallback.stamps_required ?? 10,
    rewardDescription: cfg.reward   ?? fallback.reward_description ?? 'item grátis',
  };
}

export function resolvePointsConfig(program: LoyaltyProgram): PointsConfig {
  const cfg = (program?.config || {}) as Partial<PointsConfig>;
  return {
    points_per_real: cfg.points_per_real ?? 1,
    min_redeem:      cfg.min_redeem      ?? 100,
  };
}

export function resolveCashbackConfig(program: LoyaltyProgram): CashbackConfig {
  const cfg = (program?.config || {}) as Partial<CashbackConfig>;
  return {
    cashback_pct: cfg.cashback_pct ?? 5,
    min_redeem:   cfg.min_redeem   ?? 10,
  };
}

export function computeEarned(program: LoyaltyProgram, amount: number): number {
  if (program.type === 'points') {
    const { points_per_real } = resolvePointsConfig(program);
    return Math.floor(amount * points_per_real);
  }
  if (program.type === 'cashback') {
    const { cashback_pct } = resolveCashbackConfig(program);
    return parseFloat((amount * cashback_pct / 100).toFixed(2));
  }
  return 0;
}
