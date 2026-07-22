import { randomInt } from 'crypto';

export const OTP_CODE_LENGTH = 6;
export const OTP_EXPIRY_MINUTES = 5;
export const OTP_MAX_ATTEMPTS = 3;
export const OTP_RATE_LIMIT_PER_HOUR = 3;

export function generateOtpCode(): string {
  return randomInt(0, 10 ** OTP_CODE_LENGTH)
    .toString()
    .padStart(OTP_CODE_LENGTH, '0');
}

export function otpExpiresAt(from: Date): Date {
  return new Date(from.getTime() + OTP_EXPIRY_MINUTES * 60_000);
}

export function isOtpExpired(expiresAt: Date, now: Date): boolean {
  return now.getTime() >= expiresAt.getTime();
}

export function isRateLimited(recentCodesInLastHour: number): boolean {
  return recentCodesInLastHour >= OTP_RATE_LIMIT_PER_HOUR;
}

export function hasAttemptsLeft(attempts: number): boolean {
  return attempts < OTP_MAX_ATTEMPTS;
}

export type OtpVerifyResult =
  | { ok: true }
  | { ok: false; reason: 'not_found' | 'expired' | 'too_many_attempts' | 'invalid_code' };

interface OtpRecordLike {
  code: string;
  expiresAt: Date;
  attempts: number;
  used: boolean;
}

/** Regra pura de verificação — recebe o registro já buscado do banco. */
export function evaluateOtpVerification(
  record: OtpRecordLike | null,
  submittedCode: string,
  now: Date
): OtpVerifyResult {
  if (!record || record.used) return { ok: false, reason: 'not_found' };
  if (isOtpExpired(record.expiresAt, now)) return { ok: false, reason: 'expired' };
  if (!hasAttemptsLeft(record.attempts)) return { ok: false, reason: 'too_many_attempts' };
  if (record.code !== submittedCode) return { ok: false, reason: 'invalid_code' };
  return { ok: true };
}
