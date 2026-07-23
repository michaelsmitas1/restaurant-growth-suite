import { cookies } from 'next/headers';
import { createHmac, randomBytes } from 'crypto';
import { createServiceClient } from './supabase/serviceClient';

/**
 * Nível 2 de auth (CLAUDE.md): cliente não é usuário do Supabase Auth.
 * Único lugar (além de googleWallet.ts e migrations) autorizado a usar
 * createServiceClient() — toda query aqui é escopada ao customer_id validado.
 */

const COOKIE_NAME = 'remy_customer_session';
const SESSION_DURATION_DAYS = 30;

function sign(token: string): string {
  const secret = process.env.CUSTOMER_SESSION_SECRET;
  if (!secret) throw new Error('CUSTOMER_SESSION_SECRET não configurado');
  return createHmac('sha256', secret).update(token).digest('hex');
}

/** Cria a sessão no banco e seta o cookie httpOnly de 30 dias. */
export async function createCustomerSession(customerId: string): Promise<void> {
  const supabase = createServiceClient();
  const token = randomBytes(32).toString('base64url');
  const tokenHash = sign(token);
  const expiresAt = new Date(Date.now() + SESSION_DURATION_DAYS * 24 * 60 * 60_000);

  const { error } = await supabase.from('customer_sessions').insert({
    customer_id: customerId,
    token_hash: tokenHash,
    expires_at: expiresAt.toISOString(),
  });
  if (error) throw new Error(`Falha ao criar sessão do cliente: ${error.message}`);

  cookies().set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    expires: expiresAt,
  });
}

/** Valida o cookie da request atual contra customer_sessions. */
export async function getCustomerSession(): Promise<{ customerId: string } | null> {
  const token = cookies().get(COOKIE_NAME)?.value;
  if (!token) return null;

  const supabase = createServiceClient();
  const { data } = await supabase
    .from('customer_sessions')
    .select('customer_id, expires_at')
    .eq('token_hash', sign(token))
    .maybeSingle();

  if (!data) return null;
  if (new Date(data.expires_at).getTime() <= Date.now()) return null;

  return { customerId: data.customer_id };
}

/** Revoga a sessão atual (logout do cliente). */
export async function revokeCustomerSession(): Promise<void> {
  const token = cookies().get(COOKIE_NAME)?.value;
  if (token) {
    const supabase = createServiceClient();
    await supabase.from('customer_sessions').delete().eq('token_hash', sign(token));
  }
  cookies().delete(COOKIE_NAME);
}
