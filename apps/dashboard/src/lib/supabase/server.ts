import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

/**
 * Cliente do dono (Nível 1 de auth): anon key + sessão via cookie, RLS ativo.
 * Nunca usar SUPABASE_SERVICE_KEY aqui — os 3 lugares autorizados são
 * lib/googleWallet.ts, lib/customerSession.ts e migrations/seed.
 */
export function createClient() {
  const cookieStore = cookies();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'https://placeholder.supabase.co';
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? 'placeholder';
  return createServerClient(
    url,
    key,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options?: Parameters<typeof cookieStore.set>[2] }[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // chamado de um Server Component sem permissão de escrita — ignorado,
            // o middleware já cuida do refresh da sessão nesse caso.
          }
        },
      },
    }
  );
}
