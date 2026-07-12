import { SignJWT, importPKCS8 } from 'jose';

// Google Wallet API (Loyalty) — JWT + service account, sem certificados físicos.
// Requer GOOGLE_WALLET_SA_KEY (JSON da service account) e GOOGLE_WALLET_ISSUER_ID.
// Ver specs/008-wallet-passkit.md.

const WALLET_API = 'https://walletobjects.googleapis.com/walletobjects/v1';
const SCOPE = 'https://www.googleapis.com/auth/wallet_object.issuer';
const TOKEN_URL = 'https://oauth2.googleapis.com/token';

interface ServiceAccount {
  client_email: string;
  private_key: string;
}

export function isWalletConfigured(): boolean {
  return !!(process.env.GOOGLE_WALLET_SA_KEY && process.env.GOOGLE_WALLET_ISSUER_ID);
}

function loadServiceAccount(): ServiceAccount {
  const raw = process.env.GOOGLE_WALLET_SA_KEY;
  if (!raw) throw new Error('GOOGLE_WALLET_SA_KEY não configurada');
  let parsed: Partial<ServiceAccount>;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error('GOOGLE_WALLET_SA_KEY não é um JSON válido');
  }
  if (!parsed.client_email || !parsed.private_key) {
    throw new Error('GOOGLE_WALLET_SA_KEY inválida: faltam client_email/private_key');
  }
  return parsed as ServiceAccount;
}

function issuerId(): string {
  const id = process.env.GOOGLE_WALLET_ISSUER_ID;
  if (!id) throw new Error('GOOGLE_WALLET_ISSUER_ID não configurada');
  return id;
}

async function getAccessToken(): Promise<string> {
  const sa = loadServiceAccount();
  const key = await importPKCS8(sa.private_key, 'RS256');
  const now = Math.floor(Date.now() / 1000);
  const assertion = await new SignJWT({ scope: SCOPE })
    .setProtectedHeader({ alg: 'RS256', typ: 'JWT' })
    .setIssuer(sa.client_email)
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
  if (!res.ok) throw new Error(`Falha ao obter access token Google: ${res.status} ${await res.text()}`);
  const data = (await res.json()) as { access_token: string };
  return data.access_token;
}

function classIdFor(restaurantId: string): string {
  return `${issuerId()}.rest_${restaurantId.replace(/-/g, '')}`;
}

function objectIdFor(customerId: string): string {
  return `${issuerId()}.cust_${customerId.replace(/-/g, '')}`;
}

export interface RestaurantForWallet {
  id: string;
  name: string;
  reward_description: string | null;
  stamps_required: number | null;
}

export interface CustomerForWallet {
  id: string;
  name: string | null;
  phone: string | null;
  current_stamps: number | null;
}

export async function ensureLoyaltyClass(restaurant: RestaurantForWallet): Promise<string> {
  const id = classIdFor(restaurant.id);
  const token = await getAccessToken();

  const getRes = await fetch(`${WALLET_API}/loyaltyClass/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (getRes.ok) return id;
  if (getRes.status !== 404) {
    throw new Error(`Erro ao consultar LoyaltyClass: ${getRes.status} ${await getRes.text()}`);
  }

  const createRes = await fetch(`${WALLET_API}/loyaltyClass`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      id,
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
  // 409 = criado por uma chamada concorrente entre o GET e este POST — não é erro.
  if (!createRes.ok && createRes.status !== 409) {
    throw new Error(`Erro ao criar LoyaltyClass: ${createRes.status} ${await createRes.text()}`);
  }
  return id;
}

/** Cria (ou reusa) o LoyaltyObject do cliente. Retorna o objectId. */
export async function ensureLoyaltyObject(
  restaurant: RestaurantForWallet,
  customer: CustomerForWallet,
): Promise<string> {
  const clsId = await ensureLoyaltyClass(restaurant);
  const objId = objectIdFor(customer.id);
  const token = await getAccessToken();

  const getRes = await fetch(`${WALLET_API}/loyaltyObject/${objId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (getRes.ok) return objId;
  if (getRes.status !== 404) {
    throw new Error(`Erro ao consultar LoyaltyObject: ${getRes.status} ${await getRes.text()}`);
  }

  const stampsRequired = restaurant.stamps_required || 10;
  const stamps = customer.current_stamps || 0;

  const createRes = await fetch(`${WALLET_API}/loyaltyObject`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      id: objId,
      classId: clsId,
      state: 'ACTIVE',
      accountId: customer.id,
      accountName: customer.name || customer.phone || 'Cliente',
      loyaltyPoints: {
        label: 'Selos',
        balance: { string: `${stamps}/${stampsRequired}` },
      },
      textModulesData: [
        {
          id: 'reward_status',
          header: 'Recompensa',
          body: stamps >= stampsRequired ? 'Pronta para resgate! 🎁' : restaurant.reward_description || '',
        },
      ],
    }),
  });
  // 409 = criado por uma chamada concorrente (ex.: duplo tap no botão salvar) — não é erro.
  if (!createRes.ok && createRes.status !== 409) {
    throw new Error(`Erro ao criar LoyaltyObject: ${createRes.status} ${await createRes.text()}`);
  }
  return objId;
}

/** Atualiza o contador de selos no pass já emitido. Não lança se o Wallet não estiver configurado. */
export async function patchLoyaltyObjectStamps(
  customerId: string,
  stamps: number,
  stampsRequired: number,
): Promise<void> {
  if (!isWalletConfigured()) return;

  const objId = objectIdFor(customerId);
  const token = await getAccessToken();
  const rewardReady = stamps >= stampsRequired;

  const res = await fetch(`${WALLET_API}/loyaltyObject/${objId}`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      loyaltyPoints: {
        label: 'Selos',
        balance: { string: `${stamps}/${stampsRequired}` },
      },
      textModulesData: [
        {
          id: 'reward_status',
          header: 'Recompensa',
          body: rewardReady ? 'Pronta para resgate! 🎁' : `${stamps}/${stampsRequired} selos`,
        },
      ],
    }),
  });
  // 404 = cliente ainda não salvou o pass — não é erro.
  if (!res.ok && res.status !== 404) {
    throw new Error(`Erro ao atualizar LoyaltyObject: ${res.status} ${await res.text()}`);
  }
}

/** Gera o link "Salvar no Google Wallet" (JWT assinado) para um objectId já existente. */
export async function buildSaveToWalletUrl(objectId: string): Promise<string> {
  const sa = loadServiceAccount();
  const key = await importPKCS8(sa.private_key, 'RS256');
  const now = Math.floor(Date.now() / 1000);

  const jwt = await new SignJWT({
    iss: sa.client_email,
    aud: 'google',
    typ: 'savetowallet',
    iat: now,
    payload: { loyaltyObjects: [{ id: objectId }] },
  })
    .setProtectedHeader({ alg: 'RS256', typ: 'JWT' })
    .sign(key);

  return `https://pay.google.com/gp/v/save/${jwt}`;
}
