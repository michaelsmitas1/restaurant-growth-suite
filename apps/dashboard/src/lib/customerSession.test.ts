import { describe, expect, it } from 'vitest';
import {
  shouldRotateSession,
  sessionMatchesUid,
  SESSION_ROTATION_HOURS,
} from './customerSession';

describe('shouldRotateSession (hardening 2.0b — sliding expiry)', () => {
  const lastRotatedAt = new Date('2026-07-22T10:00:00Z');

  it('não rotaciona antes da janela de 24h', () => {
    const now = new Date(lastRotatedAt.getTime() + (SESSION_ROTATION_HOURS * 60 * 60_000 - 1));
    expect(shouldRotateSession(lastRotatedAt, now)).toBe(false);
  });

  it('não rotaciona exatamente no limite', () => {
    const now = new Date(lastRotatedAt.getTime() + SESSION_ROTATION_HOURS * 60 * 60_000);
    expect(shouldRotateSession(lastRotatedAt, now)).toBe(false);
  });

  it('rotaciona passado o limite de 24h', () => {
    const now = new Date(lastRotatedAt.getTime() + SESSION_ROTATION_HOURS * 60 * 60_000 + 1);
    expect(shouldRotateSession(lastRotatedAt, now)).toBe(true);
  });
});

describe('sessionMatchesUid (hardening 2.0b — regra uid↔sessão)', () => {
  it('bate quando customer_id da sessão é igual ao uid da URL', () => {
    expect(sessionMatchesUid('customer-123', 'customer-123')).toBe(true);
  });

  it('não bate quando customer_id diverge do uid da URL (403)', () => {
    expect(sessionMatchesUid('customer-123', 'customer-456')).toBe(false);
  });
});
