import { createClient } from '@/lib/supabase/server';

/**
 * Padrão obrigatório em toda Server Action do dashboard (CLAUDE.md):
 * getUser() + validação de posse via owner_id antes de tocar em qualquer dado
 * do restaurante. Lança se não houver sessão ou o restaurante não pertencer
 * ao usuário autenticado.
 */
export async function requireOwner(restaurantId: string) {
  const supabase = createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');

  const { data: restaurant } = await supabase
    .from('restaurants')
    .select('id')
    .eq('id', restaurantId)
    .eq('owner_id', user.id)
    .single();
  if (!restaurant) throw new Error('Forbidden');

  return { supabase, user, restaurantId: restaurant.id };
}
