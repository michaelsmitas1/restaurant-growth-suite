#!/usr/bin/env tsx
/**
 * Provisiona a Google Wallet LoyaltyClass de um restaurante.
 *
 * Uso:
 *   npm run provision-wallet -- <restaurantId>
 *
 * Variáveis necessárias no ambiente (ou .env na raiz):
 *   SUPABASE_URL, SUPABASE_SERVICE_KEY, GOOGLE_WALLET_SA_KEY, GOOGLE_WALLET_ISSUER_ID
 */
import { createClient } from '@supabase/supabase-js';
import { SignJWT, importPKCS8 } from 'jose';
import { config } from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

config({ path: resolve(dirname(fileURLToPath(import.meta.url)), '../.env') });

const WALLET_API = 'https://walletobjects.googleapis.com/walletobjects/v1';
const SCOPE = 'https://www.googleapis.com/auth/wallet_object.issuer';
const TOKEN_URL = 'https://oauth2.googleapis.com/token';

function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v) {
    console.error(`❌ ${name} não configurada`);
    process.exit(1);
  }
  return v;
}

async function getAccessToken(clientEmail: string, privateKey: string): Promise<string> {
  const key = await importPKCS8(privateKey, 'RS256');
  const now = Math.floor(Date.now() / 1000);
  const assertion = await new SignJWT({ scope: SCOPE })
    .setProtectedHeader({ alg: 'RS256', typ: 'JWT' })
    .setIssuer(clientEmail)
    .setAudience(TOKEN_URL)
    .setIssuedAt(now)
    .setExpirationTime(now + 3600)
    .sign(key);

  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion,
    }),
  });
  if (!res.ok) {
    throw new Error(`Falha ao obter access token Google: ${res.status} ${await res.text()}`);
  }
  const data = (await res.json()) as { access_token: string };
  return data.access_token;
}

async function main() {
  const restaurantId = process.argv[2];
  if (!restaurantId) {
    console.error('Uso: npm run provision-wallet -- <restaurantId>');
    process.exit(1);
  }

  const supabaseUrl = requireEnv('SUPABASE_URL');
  const supabaseKey = requireEnv('SUPABASE_SERVICE_KEY');
  const issuerId = requireEnv('GOOGLE_WALLET_ISSUER_ID');
  const saKeyRaw = requireEnv('GOOGLE_WALLET_SA_KEY');

  let sa: { client_email: string; private_key: string };
  try {
    sa = JSON.parse(saKeyRaw);
    if (!sa.client_email || !sa.private_key) throw new Error('faltam client_email/private_key');
  } catch (err) {
    console.error('❌ GOOGLE_WALLET_SA_KEY inválida:', err instanceof Error ? err.message : err);
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseKey);
  const { data: restaurant, error } = await supabase
    .from('restaurants')
    .select('id, name, reward_description')
    .eq('id', restaurantId)
    .single();

  if (error || !restaurant) {
    console.error(`❌ Restaurante ${restaurantId} não encontrado:`, error?.message);
    process.exit(1);
  }

  const classId = `${issuerId}.rest_${restaurant.id.replace(/-/g, '')}`;
  const token = await getAccessToken(sa.client_email, sa.private_key);

  const getRes = await fetch(`${WALLET_API}/loyaltyClass/${classId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (getRes.ok) {
    console.log(`✅ LoyaltyClass já existe: ${classId}`);
  } else if (getRes.status === 404) {
    const createRes = await fetch(`${WALLET_API}/loyaltyClass`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: classId,
        issuerName: restaurant.name,
        programName: restaurant.name,
        programLogo: {
          sourceUri: { uri: process.env.GOOGLE_WALLET_LOGO_URL || 'https://placehold.co/200x200?text=%F0%9F%8D%BD' },
        },
        reviewStatus: 'UNDER_REVIEW',
        rewardsTier: 'Fidelidade',
        rewardsTierLabel: restaurant.reward_description || 'Recompensa',
      }),
    });
    // 409 = criada por uma chamada concorrente entre o GET e este POST — não é erro.
    if (!createRes.ok && createRes.status !== 409) {
      console.error(`❌ Erro ao criar LoyaltyClass: ${createRes.status} ${await createRes.text()}`);
      process.exit(1);
    }
    console.log(`✅ LoyaltyClass criada: ${classId}`);
  } else {
    console.error(`❌ Erro ao consultar LoyaltyClass: ${getRes.status} ${await getRes.text()}`);
    process.exit(1);
  }

  const { error: updateErr } = await supabase
    .from('restaurants')
    .update({ google_wallet_class_id: classId })
    .eq('id', restaurant.id);

  if (updateErr) {
    console.error('❌ Falha ao salvar google_wallet_class_id:', updateErr.message);
    process.exit(1);
  }

  console.log(`✅ ${restaurant.name} pronto para emitir passes (classId: ${classId})`);
  process.exit(0);
}

main().catch((err) => {
  console.error('❌ Erro inesperado:', err instanceof Error ? err.message : err);
  process.exit(1);
});
