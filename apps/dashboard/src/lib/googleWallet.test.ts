import { describe, expect, it } from 'vitest';
import { rewardStatusText, balanceText, type CustomerProgramForWallet } from './googleWallet';

function program(overrides: Partial<CustomerProgramForWallet> = {}): CustomerProgramForWallet {
  return {
    id: 'prog-1',
    customerName: 'Cliente Teste',
    customerPhone: '+5511999999999',
    currentStamps: 2,
    isVip: false,
    ...overrides,
  };
}

describe('rewardStatusText', () => {
  it('mostra status VIP quando o cliente já completou todos os marcos', () => {
    expect(rewardStatusText(program({ isVip: true, currentStamps: 30 }), null)).toBe(
      'VIP permanente 👑'
    );
  });

  it('mostra a recompensa do próximo marco quando ainda não atingido', () => {
    const next = { stampsRequired: 3, rewardDescription: 'sobremesa grátis' };
    expect(rewardStatusText(program({ currentStamps: 2 }), next)).toBe('sobremesa grátis');
  });

  it('mostra "pronta para resgate" quando atinge o próximo marco', () => {
    const next = { stampsRequired: 3, rewardDescription: 'sobremesa grátis' };
    expect(rewardStatusText(program({ currentStamps: 3 }), next)).toBe('Pronta para resgate! 🎁');
  });
});

describe('balanceText', () => {
  it('mostra progresso "atual/próximo marco"', () => {
    const next = { stampsRequired: 6, rewardDescription: 'sorvete grande' };
    expect(balanceText(program({ currentStamps: 4 }), next)).toBe('4/6');
  });

  it('mostra apenas o total quando não há próximo marco (VIP)', () => {
    expect(balanceText(program({ currentStamps: 12, isVip: true }), null)).toBe('12 selos');
  });
});
