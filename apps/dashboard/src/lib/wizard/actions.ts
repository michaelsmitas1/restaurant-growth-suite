'use server';

import { z } from 'zod';
import { requireOwner } from '@/lib/auth/requireOwner';
import { isValidWizardStep } from './steps';

const advanceStepSchema = z.object({
  restaurantId: z.string().uuid(),
  step: z.number().int().refine(isValidWizardStep, { message: 'Passo do wizard inválido' }),
});

// Persiste o avanço de passo (CLAUDE.md: "Salvo a cada passo em
// restaurants.wizard_step"). Cada passo concreto (Sessões 5+) chama sua
// própria Server Action para salvar os dados do passo E este helper para
// avançar o ponteiro — mantém a lógica de posse (requireOwner) em um só
// lugar em vez de repetir em cada passo.
export async function advanceWizardStep(input: { restaurantId: string; step: number }) {
  const parsed = advanceStepSchema.safeParse(input);
  if (!parsed.success) throw new Error('Dados inválidos para avançar o wizard');

  const { supabase, restaurantId } = await requireOwner(parsed.data.restaurantId);

  const { error } = await supabase
    .from('restaurants')
    .update({ wizard_step: parsed.data.step })
    .eq('id', restaurantId);

  if (error) throw new Error('Não foi possível salvar o progresso do wizard');

  return { step: parsed.data.step };
}
