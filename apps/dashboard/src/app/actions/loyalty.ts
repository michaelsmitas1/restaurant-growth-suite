'use server';
import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { computeEarned, type LoyaltyProgram } from '@/lib/loyalty';

export async function saveStampProgram(
  restaurantId: string,
  programId: string | null,
  formData: FormData,
) {
  const supabase = createClient();

  const required = parseInt(formData.get('required') as string) || 10;
  const reward   = (formData.get('reward') as string)?.trim() || 'item grátis';
  const name     = (formData.get('name') as string)?.trim() || 'Cartão de selos';
  const config   = { required, reward };

  if (programId) {
    const { error } = await supabase
      .from('loyalty_programs').update({ name, config }).eq('id', programId);
    if (error) throw new Error(error.message);
  } else {
    const { error } = await supabase.from('loyalty_programs').insert({
      restaurant_id: restaurantId, name, type: 'stamps', config, active: true,
    });
    if (error) throw new Error(error.message);
  }

  // Keep legacy columns mirrored so any not-yet-migrated read still works
  await supabase.from('restaurants')
    .update({ stamps_required: required, reward_description: reward })
    .eq('id', restaurantId);

  revalidatePath(`/restaurante/${restaurantId}/wallet`);
  revalidatePath(`/restaurante/${restaurantId}/clientes`);
  revalidatePath(`/restaurante/${restaurantId}/campanhas`);
}

export async function savePointsProgram(
  restaurantId: string,
  programId: string | null,
  formData: FormData,
) {
  const supabase = createClient();
  const name          = (formData.get('name') as string)?.trim() || 'Programa de pontos';
  const pointsPerReal = parseFloat(formData.get('points_per_real') as string) || 1;
  const minRedeem     = parseInt(formData.get('min_redeem') as string) || 100;
  const config        = { points_per_real: pointsPerReal, min_redeem: minRedeem };

  if (programId) {
    await supabase.from('loyalty_programs')
      .update({ name, config, active: true })
      .eq('id', programId).eq('restaurant_id', restaurantId);
  } else {
    await supabase.from('loyalty_programs').insert({
      restaurant_id: restaurantId, type: 'points', name, config, active: true,
    });
  }
  revalidatePath(`/restaurante/${restaurantId}/wallet`);
}

export async function saveCashbackProgram(
  restaurantId: string,
  programId: string | null,
  formData: FormData,
) {
  const supabase = createClient();
  const name        = (formData.get('name') as string)?.trim() || 'Cashback';
  const cashbackPct = parseFloat(formData.get('cashback_pct') as string) || 5;
  const minRedeem   = parseFloat(formData.get('min_redeem') as string) || 10;
  const config      = { cashback_pct: cashbackPct, min_redeem: minRedeem };

  if (programId) {
    await supabase.from('loyalty_programs')
      .update({ name, config, active: true })
      .eq('id', programId).eq('restaurant_id', restaurantId);
  } else {
    await supabase.from('loyalty_programs').insert({
      restaurant_id: restaurantId, type: 'cashback', name, config, active: true,
    });
  }
  revalidatePath(`/restaurante/${restaurantId}/wallet`);
}

export async function deactivateLoyaltyProgram(
  programId: string,
  restaurantId: string,
) {
  const supabase = createClient();
  await supabase.from('loyalty_programs')
    .update({ active: false })
    .eq('id', programId).eq('restaurant_id', restaurantId);
  revalidatePath(`/restaurante/${restaurantId}/wallet`);
}

export async function registerPurchase(
  customerId: string,
  restaurantId: string,
  amount: number,
) {
  const supabase = createClient();

  // Get current stamp count to store in the visit record
  const { data: customer } = await supabase
    .from('customers').select('current_stamps').eq('id', customerId).single();

  // Record visit with amount, no stamp change
  await supabase.from('visits').insert({
    customer_id:       customerId,
    restaurant_id:     restaurantId,
    stamps_added:      0,
    stamp_count_after: customer?.current_stamps ?? 0,
    reward_triggered:  false,
    amount,
  });

  // Get active points/cashback programs
  const { data: programs } = await supabase
    .from('loyalty_programs').select('*')
    .eq('restaurant_id', restaurantId).eq('active', true)
    .in('type', ['points', 'cashback']);

  for (const program of (programs || [])) {
    const earned = computeEarned(program as LoyaltyProgram, amount);
    if (earned <= 0) continue;

    const { data: existing } = await supabase
      .from('customer_loyalty').select('balance, lifetime_total')
      .eq('customer_id', customerId).eq('program_id', program.id)
      .maybeSingle();

    if (existing) {
      await supabase.from('customer_loyalty')
        .update({
          balance:        parseFloat((Number(existing.balance) + earned).toFixed(2)),
          lifetime_total: parseFloat((Number(existing.lifetime_total) + earned).toFixed(2)),
        })
        .eq('customer_id', customerId).eq('program_id', program.id);
    } else {
      await supabase.from('customer_loyalty').insert({
        customer_id:    customerId,
        program_id:     program.id,
        restaurant_id:  restaurantId,
        balance:        earned,
        lifetime_total: earned,
      });
    }
  }

  revalidatePath(`/restaurante/${restaurantId}/clientes`);
}

export async function getCustomerLoyaltyBalances(
  restaurantId: string,
  customerId: string,
) {
  const supabase = createClient();
  const { data } = await supabase
    .from('customer_loyalty')
    .select('program_id, balance, lifetime_total, loyalty_programs(name, type)')
    .eq('restaurant_id', restaurantId)
    .eq('customer_id', customerId);

  type Row = {
    program_id: string;
    balance: number;
    lifetime_total: number;
    loyalty_programs: { name: string; type: string } | null;
  };
  return ((data || []) as unknown as Row[]).map(r => ({
    programId:     r.program_id,
    balance:       Number(r.balance),
    lifetimeTotal: Number(r.lifetime_total),
    name:          r.loyalty_programs?.name || '',
    type:          (r.loyalty_programs?.type || '') as string,
  }));
}
