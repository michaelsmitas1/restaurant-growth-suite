'use server';
import { createClient } from '@/lib/supabase/server';
import { ensureLoyaltyObject, buildSaveToWalletUrl } from '@/lib/googleWallet';
import { normalizeBrPhone } from '@/lib/phone';

interface EnrollResult {
  saveUrl: string;
  alreadyEnrolled: boolean;
}

const GENERIC_ERROR = 'Não foi possível salvar seu cartão agora. Tente novamente em instantes.';

/**
 * Página pública /w/[slug] — cliente informa telefone e recebe o link "Salvar no Google Wallet".
 *
 * `slug` é a ÚNICA forma de identificar o restaurante aqui: esta é uma Server
 * Action chamável diretamente (POST), não só pela página que a renderiza — um
 * `restaurantId` vindo do cliente não pode ser confiável. O id real é sempre
 * resolvido server-side a partir do slug, contra o banco.
 */
export async function enrollInWallet(
  slug: string,
  phoneRaw: string,
  consent: boolean,
): Promise<EnrollResult> {
  if (!consent) throw new Error('É preciso aceitar receber mensagens do programa de fidelidade.');

  const phone = normalizeBrPhone(phoneRaw);
  if (!phone) throw new Error('Telefone inválido. Use o formato (DD) 99999-9999.');

  const supabase = createClient();

  const { data: restaurant, error: restErr } = await supabase
    .from('restaurants')
    .select('id, name, reward_description, stamps_required')
    .eq('slug', slug)
    .single();
  if (restErr || !restaurant) throw new Error('Restaurante não encontrado');

  const restaurantId = restaurant.id;

  try {
    const { data: customer, error: custErr } = await supabase
      .from('customers')
      .upsert(
        { restaurant_id: restaurantId, phone },
        { onConflict: 'restaurant_id,phone', ignoreDuplicates: false },
      )
      .select('id, name, phone, current_stamps, google_pass_object_id')
      .single();
    if (custErr || !customer) throw custErr || new Error('Falha ao registrar cliente');

    const alreadyEnrolled = !!customer.google_pass_object_id;
    const objectId = await ensureLoyaltyObject(restaurant, customer);

    if (customer.google_pass_object_id !== objectId) {
      await supabase.from('customers').update({ google_pass_object_id: objectId }).eq('id', customer.id);
    }

    const saveUrl = await buildSaveToWalletUrl(objectId);
    return { saveUrl, alreadyEnrolled };
  } catch (err) {
    // Nunca repassar detalhe interno (erro do Postgres/Google Wallet API) para a página pública.
    console.error('enrollInWallet falhou:', err);
    throw new Error(GENERIC_ERROR);
  }
}
