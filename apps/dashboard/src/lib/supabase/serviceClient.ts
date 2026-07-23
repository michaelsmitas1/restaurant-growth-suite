import { createClient } from '@supabase/supabase-js';

/**
 * Cliente com service role — ignora RLS. Uso restrito (CLAUDE.md): apenas
 * lib/googleWallet.ts e lib/customerSession.ts (toda query escopada ao
 * customer_id validado, nunca queries abertas) e migrations/seed.
 */
export function createServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY;
  if (!url || !key) {
    throw new Error('SUPABASE_SERVICE_KEY/URL não configurados');
  }
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
