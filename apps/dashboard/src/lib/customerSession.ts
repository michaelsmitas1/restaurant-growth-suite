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

// Hardening 2.0b — sliding expiry: se a última rotação passou desse
// limite, o token é rotacionado (e o cookie reemitido) na próxima
// validação. Um token roubado não vale os 30 dias inteiros.
export const SESSION_ROTATION_HOURS = 24;

function sign(token: string): string {
  const secret = process.env.CUSTOMER_SESSION_SECRET;
  if (!secret) throw new Error('CUSTOMER_SESSION_SECRET não configurado');
  return createHmac('sha256', secret).update(token).digest('hex');
}

/** Regra pura (testável): já passou da janela de rotação? */
export function shouldRotateSession(lastRotatedAt: Date, now: Date): boolean {
  return now.getTime() - lastRotatedAt.getTime() > SESSION_ROTATION_HOURS * 60 * 60_000;
}

/**
 * Regra pura (testável) do hardening 2.0b: o customer_id da sessão tem
 * que bater com o uid da URL (`[slug]/u/[uid]`) — divergência é 403,
 * sem exceção.
 */
export function sessionMatchesUid(customerId: string, uid: string): boolean {
  return customerId === uid;
}

export class CustomerSessionForbiddenError extends Error {
  constructor() {
    super('Forbidden');
  }
}

/** Cria a sessão no banco e seta o cookie httpOnly de 30 dias. */
export async function createCustomerSession(customerId: string): Promise<void> {
  const supabase = createServiceClient();
  const token = randomBytes(32).toString('base64url');
  const tokenHash = sign(token);
  const now = new Date();
  const expiresAt = new Date(now.getTime() + SESSION_DURATION_DAYS * 24 * 60 * 60_000);

  // Hardening 2.0b — limpeza embutida: sem cron, cada nova sessão já
  // remove as sessões expiradas deste cliente (multi-dispositivo: as
  // sessões ainda válidas de outros aparelhos não são tocadas).
  await supabase
    .from('customer_sessions')
    .delete()
    .eq('customer_id', customerId)
    .lt('expires_at', now.toISOString());

  const { error } = await supabase.from('customer_sessions').insert({
    customer_id: customerId,
    token_hash: tokenHash,
    expires_at: expiresAt.toISOString(),
    last_rotated_at: now.toISOString(),
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

/**
 * Valida o cookie da request atual contra customer_sessions.
 * Hardening 2.0b: se a última rotação passou de 24h, rotaciona o token
 * (nova linha assinada, cookie reemitido) sem derrubar a sessão nem
 * afetar as sessões de outros dispositivos do mesmo cliente.
 */
export async function getCustomerSession(): Promise<{ customerId: string } | null> {
  const token = cookies().get(COOKIE_NAME)?.value;
  if (!token) return null;

  const supabase = createServiceClient();
  const { data } = await supabase
    .from('customer_sessions')
    .select('id, customer_id, expires_at, last_rotated_at')
    .eq('token_hash', sign(token))
    .maybeSingle();

  if (!data) return null;
  const now = new Date();
  if (new Date(data.expires_at).getTime() <= now.getTime()) return null;

  if (shouldRotateSession(new Date(data.last_rotated_at), now)) {
    const newToken = randomBytes(32).toString('base64url');
    const newTokenHash = sign(newToken);
    const expiresAt = new Date(now.getTime() + SESSION_DURATION_DAYS * 24 * 60 * 60_000);

    const { error } = await supabase
      .from('customer_sessions')
      .update({
        token_hash: newTokenHash,
        expires_at: expiresAt.toISOString(),
        last_rotated_at: now.toISOString(),
      })
      .eq('id', data.id);

    if (!error) {
      cookies().set(COOKIE_NAME, newToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        expires: expiresAt,
      });
    }
  }

  return { customerId: data.customer_id };
}

/** Revoga a sessão atual (logout do cliente) — só o dispositivo atual. */
export async function revokeCustomerSession(): Promise<void> {
  const token = cookies().get(COOKIE_NAME)?.value;
  if (token) {
    const supabase = createServiceClient();
    await supabase.from('customer_sessions').delete().eq('token_hash', sign(token));
  }
  cookies().delete(COOKIE_NAME);
}

/**
 * Hardening 2.0b — helper único para rotas `[slug]/u/[uid]`: garante que
 * o customer_id da sessão bate com o uid da URL. Divergência = 403.
 */
export async function requireCustomerForUid(uid: string): Promise<{ customerId: string }> {
  const session = await getCustomerSession();
  if (!session || !sessionMatchesUid(session.customerId, uid)) {
    throw new CustomerSessionForbiddenError();
  }
  return session;
}
