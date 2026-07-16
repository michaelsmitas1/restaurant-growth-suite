'use server';
import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { patchLoyaltyObjectStamps } from '@/lib/googleWallet';

/** Sincroniza o contador do Google Wallet pass — nunca bloqueia o fluxo de carimbo/resgate. */
async function syncWalletStamps(customerId: string, restaurantId: string, stamps: number) {
  const supabase = createClient();
  const [{ data: customer }, { data: restaurant }] = await Promise.all([
    supabase.from('customers').select('google_pass_object_id').eq('id', customerId).eq('restaurant_id', restaurantId).single(),
    supabase.from('restaurants').select('stamps_required').eq('id', restaurantId).single(),
  ]);
  if (!customer?.google_pass_object_id) return;

  try {
    await patchLoyaltyObjectStamps(customerId, stamps, restaurant?.stamps_required || 10);
  } catch (err) {
    console.error('Falha ao sincronizar Google Wallet:', err);
  }
}

export async function addStamps(customerId: string, restaurantId: string, count: number) {
  const supabase = createClient();

  const { data: customer } = await supabase
    .from('customers').select('current_stamps, total_visits').eq('id', customerId).single();
  if (!customer) throw new Error('Cliente não encontrado');

  const newStamps = (customer.current_stamps || 0) + count;
  const newVisits = (customer.total_visits || 0) + 1;

  await supabase.from('customers').update({
    current_stamps: newStamps,
    total_visits:   newVisits,
    last_visit_at:  new Date().toISOString(),
  }).eq('id', customerId);

  await supabase.from('visits').insert({
    customer_id:       customerId,
    restaurant_id:     restaurantId,
    stamps_added:      count,
    stamp_count_after: newStamps,
  });

  await syncWalletStamps(customerId, restaurantId, newStamps);

  revalidatePath(`/restaurante/${restaurantId}/clientes`);
  revalidatePath(`/restaurante/${restaurantId}/wallet`);
}

export async function redeemReward(customerId: string, restaurantId: string, stampsRequired: number) {
  const supabase = createClient();

  const { data: customer } = await supabase
    .from('customers').select('current_stamps').eq('id', customerId).single();
  if (!customer) throw new Error('Cliente não encontrado');

  const newStamps = Math.max(0, (customer.current_stamps || 0) - stampsRequired);

  await supabase.from('customers').update({ current_stamps: newStamps }).eq('id', customerId);

  await supabase.from('visits').insert({
    customer_id:       customerId,
    restaurant_id:     restaurantId,
    stamps_added:      0,
    stamp_count_after: newStamps,
    reward_triggered:  true,
  });

  await syncWalletStamps(customerId, restaurantId, newStamps);

  revalidatePath(`/restaurante/${restaurantId}/clientes`);
  revalidatePath(`/restaurante/${restaurantId}/wallet`);
}

export async function getCustomerDetails(customerId: string, restaurantId: string) {
  const supabase = createClient();

  const [{ data: visits }, { data: messages }] = await Promise.all([
    supabase.from('visits')
      .select('id, stamps_added, stamp_count_after, reward_triggered, created_at, amount')
      .eq('customer_id', customerId)
      .eq('restaurant_id', restaurantId)
      .order('created_at', { ascending: false })
      .limit(50),
    supabase.from('campaign_messages')
      .select('id, sent_at, campaigns(name, type)')
      .eq('customer_id', customerId)
      .order('sent_at', { ascending: false })
      .limit(30),
  ]);

  type VisitRow = { id: string; stamps_added: number | null; stamp_count_after: number | null; reward_triggered: boolean | null; created_at: string; amount: number | null };
  type MsgRow   = { id: string; sent_at: string; campaigns: { name: string; type: string } | null };

  return {
    visits:   (visits   || []) as VisitRow[],
    messages: ((messages || []) as unknown) as MsgRow[],
  };
}

export async function createCustomer(restaurantId: string, formData: FormData) {
  const supabase = createClient();

  const name     = (formData.get('name') as string)?.trim() || null;
  const phone    = (formData.get('phone') as string)?.trim() || null;
  const birthday = (formData.get('birthday') as string) || null;
  const stamps   = formData.get('current_stamps');

  if (!name && !phone) throw new Error('Informe ao menos nome ou telefone');

  const { error } = await supabase.from('customers').insert({
    restaurant_id:  restaurantId,
    name,
    phone,
    birthday,
    current_stamps: stamps ? parseInt(stamps as string) : 0,
  });

  if (error) throw new Error(error.message);
  revalidatePath(`/restaurante/${restaurantId}/clientes`);
}

export async function updateCustomer(customerId: string, restaurantId: string, formData: FormData) {
  const supabase = createClient();

  const { error } = await supabase.from('customers').update({
    name:     (formData.get('name') as string)?.trim() || null,
    phone:    (formData.get('phone') as string)?.trim() || null,
    birthday: (formData.get('birthday') as string) || null,
  }).eq('id', customerId);

  if (error) throw new Error(error.message);
  revalidatePath(`/restaurante/${restaurantId}/clientes`);
}

export async function toggleOptOut(customerId: string, restaurantId: string, optedOut: boolean) {
  const supabase = createClient();
  await supabase.from('customers').update({ opted_out: optedOut }).eq('id', customerId);
  revalidatePath(`/restaurante/${restaurantId}/clientes`);
}
