import { createServiceClient } from '../supabase/serviceClient';
import { normalizePhone } from '../phone';
import { sendWhatsAppText } from '../whatsapp/evolution';
import { sendSmsText } from '../sms';
import {
  generateOtpCode,
  hashOtpCode,
  otpExpiresAt,
  isRateLimited,
  evaluateOtpVerification,
  OTP_EXPIRY_MINUTES,
  type OtpVerifyResult,
} from './rules';

export type OtpChannel = 'whatsapp' | 'sms';

export class OtpRateLimitError extends Error {
  constructor() {
    super('Muitos códigos solicitados para este telefone. Tente novamente em uma hora.');
  }
}

/** Gera um código, respeitando o rate limit, e envia pelo canal escolhido. */
export async function requestOtp(rawPhone: string, channel: OtpChannel): Promise<void> {
  const phone = normalizePhone(rawPhone);
  const supabase = createServiceClient();
  const oneHourAgo = new Date(Date.now() - 60 * 60_000).toISOString();

  const { count } = await supabase
    .from('otp_codes')
    .select('id', { count: 'exact', head: true })
    .eq('phone', phone)
    .gte('created_at', oneHourAgo);

  if (isRateLimited(count ?? 0)) {
    throw new OtpRateLimitError();
  }

  // Hardening 2.0b — limpeza embutida: sem cron, cada novo código já
  // remove os códigos expirados deste telefone.
  await supabase
    .from('otp_codes')
    .delete()
    .eq('phone', phone)
    .lt('expires_at', new Date().toISOString());

  const code = generateOtpCode();
  const expiresAt = otpExpiresAt(new Date());

  const { error } = await supabase.from('otp_codes').insert({
    phone,
    code_hash: hashOtpCode(code),
    channel,
    expires_at: expiresAt.toISOString(),
  });
  if (error) throw new Error(`Falha ao gerar OTP: ${error.message}`);

  const message = `Seu código Remy é ${code}. Válido por ${OTP_EXPIRY_MINUTES} minutos.`;
  if (channel === 'whatsapp') {
    await sendWhatsAppText(phone, message);
  } else {
    await sendSmsText(phone, message);
  }
}

/** Verifica o código mais recente não usado para o telefone. */
export async function verifyOtp(rawPhone: string, submittedCode: string): Promise<OtpVerifyResult> {
  const phone = normalizePhone(rawPhone);
  const supabase = createServiceClient();

  const { data: record } = await supabase
    .from('otp_codes')
    .select('id, code_hash, expires_at, attempts, used')
    .eq('phone', phone)
    .eq('used', false)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  const result = evaluateOtpVerification(
    record
      ? {
          codeHash: record.code_hash,
          expiresAt: new Date(record.expires_at),
          attempts: record.attempts,
          used: record.used,
        }
      : null,
    submittedCode,
    new Date()
  );

  if (!record) return result;

  if (result.ok) {
    await supabase.from('otp_codes').update({ used: true }).eq('id', record.id);
  } else if (result.reason === 'invalid_code') {
    await supabase.from('otp_codes').update({ attempts: record.attempts + 1 }).eq('id', record.id);
  }

  return result;
}
