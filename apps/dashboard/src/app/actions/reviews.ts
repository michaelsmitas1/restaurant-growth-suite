'use server';
import { requireOwner } from '@/lib/auth/requireOwner';
import { revalidatePath } from 'next/cache';

export async function approveReview(reviewId: string, restaurantId: string) {
  const { supabase } = await requireOwner(restaurantId);
  await supabase
    .from('reviews')
    .update({ status: 'approved', responded_at: new Date().toISOString() })
    .eq('id', reviewId);
  revalidatePath(`/restaurante/${restaurantId}/avaliacoes`);
  revalidatePath(`/restaurante/${restaurantId}`);
}

export async function ignoreReview(reviewId: string, restaurantId: string) {
  const { supabase } = await requireOwner(restaurantId);
  await supabase
    .from('reviews')
    .update({ status: 'ignored' })
    .eq('id', reviewId);
  revalidatePath(`/restaurante/${restaurantId}/avaliacoes`);
  revalidatePath(`/restaurante/${restaurantId}`);
}

export async function saveResponse(reviewId: string, restaurantId: string, finalResponse: string) {
  const { supabase } = await requireOwner(restaurantId);
  await supabase
    .from('reviews')
    .update({
      status: 'edited',
      final_response: finalResponse,
      responded_at: new Date().toISOString(),
    })
    .eq('id', reviewId);
  revalidatePath(`/restaurante/${restaurantId}/avaliacoes`);
  revalidatePath(`/restaurante/${restaurantId}`);
}
