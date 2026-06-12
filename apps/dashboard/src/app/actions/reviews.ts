'use server';
import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function approveReview(reviewId: string, restaurantId: string) {
  const supabase = createClient();
  await supabase
    .from('reviews')
    .update({ status: 'approved', responded_at: new Date().toISOString() })
    .eq('id', reviewId);
  revalidatePath(`/restaurante/${restaurantId}/avaliacoes`);
  revalidatePath(`/restaurante/${restaurantId}`);
}

export async function ignoreReview(reviewId: string, restaurantId: string) {
  const supabase = createClient();
  await supabase
    .from('reviews')
    .update({ status: 'ignored' })
    .eq('id', reviewId);
  revalidatePath(`/restaurante/${restaurantId}/avaliacoes`);
  revalidatePath(`/restaurante/${restaurantId}`);
}

export async function saveResponse(reviewId: string, restaurantId: string, finalResponse: string) {
  const supabase = createClient();
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
