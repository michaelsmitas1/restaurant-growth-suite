import { describe, expect, it } from 'vitest';
import {
  generateOtpCode,
  otpExpiresAt,
  isOtpExpired,
  isRateLimited,
  hasAttemptsLeft,
  evaluateOtpVerification,
  OTP_CODE_LENGTH,
  OTP_EXPIRY_MINUTES,
  OTP_MAX_ATTEMPTS,
  OTP_RATE_LIMIT_PER_HOUR,
} from './rules';

describe('generateOtpCode', () => {
  it('gera código de 6 dígitos numéricos', () => {
    for (let i = 0; i < 50; i++) {
      const code = generateOtpCode();
      expect(code).toHaveLength(OTP_CODE_LENGTH);
      expect(code).toMatch(/^\d{6}$/);
    }
  });
});

describe('expiração', () => {
  it('expira exatamente 5 minutos após a geração', () => {
    const now = new Date('2026-07-22T10:00:00Z');
    const expiresAt = otpExpiresAt(now);
    expect(expiresAt.getTime() - now.getTime()).toBe(OTP_EXPIRY_MINUTES * 60_000);
  });

  it('não considera expirado antes do prazo', () => {
    const now = new Date('2026-07-22T10:00:00Z');
    const expiresAt = otpExpiresAt(now);
    const justBefore = new Date(expiresAt.getTime() - 1);
    expect(isOtpExpired(expiresAt, justBefore)).toBe(false);
  });

  it('considera expirado exatamente no prazo e depois', () => {
    const now = new Date('2026-07-22T10:00:00Z');
    const expiresAt = otpExpiresAt(now);
    expect(isOtpExpired(expiresAt, expiresAt)).toBe(true);
    expect(isOtpExpired(expiresAt, new Date(expiresAt.getTime() + 1))).toBe(true);
  });
});

describe('rate limit', () => {
  it(`permite até ${OTP_RATE_LIMIT_PER_HOUR} códigos por hora`, () => {
    expect(isRateLimited(0)).toBe(false);
    expect(isRateLimited(OTP_RATE_LIMIT_PER_HOUR - 1)).toBe(false);
  });

  it(`bloqueia a partir do ${OTP_RATE_LIMIT_PER_HOUR}º código na última hora`, () => {
    expect(isRateLimited(OTP_RATE_LIMIT_PER_HOUR)).toBe(true);
    expect(isRateLimited(OTP_RATE_LIMIT_PER_HOUR + 5)).toBe(true);
  });
});

describe('tentativas', () => {
  it(`permite tentar até ${OTP_MAX_ATTEMPTS} vezes`, () => {
    expect(hasAttemptsLeft(0)).toBe(true);
    expect(hasAttemptsLeft(OTP_MAX_ATTEMPTS - 1)).toBe(true);
  });

  it('bloqueia após atingir o máximo de tentativas', () => {
    expect(hasAttemptsLeft(OTP_MAX_ATTEMPTS)).toBe(false);
    expect(hasAttemptsLeft(OTP_MAX_ATTEMPTS + 1)).toBe(false);
  });
});

describe('evaluateOtpVerification', () => {
  const now = new Date('2026-07-22T10:00:00Z');
  const baseRecord = { code: '123456', expiresAt: otpExpiresAt(now), attempts: 0, used: false };

  it('rejeita quando não há registro', () => {
    expect(evaluateOtpVerification(null, '123456', now)).toEqual({ ok: false, reason: 'not_found' });
  });

  it('rejeita quando o registro já foi usado', () => {
    expect(evaluateOtpVerification({ ...baseRecord, used: true }, '123456', now)).toEqual({
      ok: false,
      reason: 'not_found',
    });
  });

  it('rejeita quando expirado', () => {
    const afterExpiry = new Date(baseRecord.expiresAt.getTime() + 1);
    expect(evaluateOtpVerification(baseRecord, '123456', afterExpiry)).toEqual({
      ok: false,
      reason: 'expired',
    });
  });

  it('rejeita quando esgotou tentativas', () => {
    expect(
      evaluateOtpVerification({ ...baseRecord, attempts: OTP_MAX_ATTEMPTS }, '123456', now)
    ).toEqual({ ok: false, reason: 'too_many_attempts' });
  });

  it('rejeita código incorreto', () => {
    expect(evaluateOtpVerification(baseRecord, '000000', now)).toEqual({
      ok: false,
      reason: 'invalid_code',
    });
  });

  it('aceita código correto dentro do prazo e das tentativas', () => {
    expect(evaluateOtpVerification(baseRecord, '123456', now)).toEqual({ ok: true });
  });
});
