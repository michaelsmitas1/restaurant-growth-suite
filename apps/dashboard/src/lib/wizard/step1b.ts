'use server';

import { z } from 'zod';
import { requireOwner } from '@/lib/auth/requireOwner';

const step1bSchema = z
  .object({
    restaurantId: z.string().uuid(),
    backgroundColor: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Cor inválida'),
    stampIconType: z.enum(['preset', 'custom']),
    stampIconPreset: z.string().min(1).max(40).nullable(),
    stampIconCustomUrl: z.string().url().nullable(),
    programName: z.string().trim().min(1, 'Dê um nome ao programa').max(30, 'Máximo 30 caracteres'),
    stampLabel: z.string().trim().min(1, 'Campo obrigatório').max(60),
    barcodeType: z.enum(['qr', 'pdf417', 'aztec']),
  })
  .refine(data => (data.stampIconType === 'preset' ? !!data.stampIconPreset : !!data.stampIconCustomUrl), {
    message: 'Selecione um ícone de selo',
  });

export type Step1bInput = z.infer<typeof step1bSchema>;

// Salva o design do card (upsert — Passo 1 já criou o restaurante, esta é
// sempre uma edição da mesma linha de card_design_config) e avança o
// wizard para o Passo 2.
export async function saveStep1b(input: Step1bInput): Promise<{ restaurantId: string }> {
  const parsed = step1bSchema.parse(input);
  const { supabase, restaurantId } = await requireOwner(parsed.restaurantId);

  const { error: upsertError } = await supabase
    .from('card_design_config')
    .upsert(
      {
        restaurant_id: restaurantId,
        background_color: parsed.backgroundColor,
        stamp_icon_type: parsed.stampIconType,
        stamp_icon_preset: parsed.stampIconType === 'preset' ? parsed.stampIconPreset : null,
        stamp_icon_custom_url: parsed.stampIconType === 'custom' ? parsed.stampIconCustomUrl : null,
        program_name: parsed.programName,
        stamp_label: parsed.stampLabel,
        barcode_type: parsed.barcodeType,
      },
      { onConflict: 'restaurant_id' }
    );
  if (upsertError) throw new Error('Não foi possível salvar o design do card.');

  const { error: stepError } = await supabase
    .from('restaurants')
    .update({ wizard_step: 2 })
    .eq('id', restaurantId);
  if (stepError) throw new Error('Não foi possível avançar o wizard.');

  return { restaurantId };
}
