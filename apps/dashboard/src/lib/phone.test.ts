import { describe, expect, it } from 'vitest';
import { normalizePhone } from './phone';

describe('normalizePhone', () => {
  it('mantém números já em E.164', () => {
    expect(normalizePhone('+5511987654321')).toBe('+5511987654321');
  });

  it('remove formatação e mantém o +', () => {
    expect(normalizePhone('+55 11 98765-4321')).toBe('+5511987654321');
  });

  it('adiciona +55 para número local de 11 dígitos sem +', () => {
    expect(normalizePhone('11987654321')).toBe('+5511987654321');
  });

  it('adiciona +55 para número local de 10 dígitos sem +', () => {
    expect(normalizePhone('1132654321')).toBe('+551132654321');
  });
});
