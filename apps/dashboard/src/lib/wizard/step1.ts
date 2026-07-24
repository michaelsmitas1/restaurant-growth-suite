'use server';

import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { isValidSlug } from '@/lib/slug';

const SEGMENTS = ['bar', 'restaurante', 'cafeteria', 'lanchonete', 'outro'] as const;

const step1Schema = z.object({
  restaurantId: z.string().uuid().nullable(),
  name: z.string().trim().min(2, 'Nome muito curto').max(120),
  segment: z.enum(SEGMENTS),
  address: z.string().trim().min(5, 'Endereço incompleto').max(300),
  primaryColor: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Cor inválida'),
  slug: z.string().refine(isValidSlug, 'Slug inválido'),
  logoUrl: z.string().url().nullable(),
});

export type Step1Input = z.infer<typeof step1Schema>;

// Cria (1ª vez) ou atualiza (retomando) o restaurante do Passo 1. A
// disponibilidade do slug é reconferida aqui no banco (fonte de verdade) —
// o debounce no cliente (GET /api/check-slug) é só UX, pode ter corrida.
export async function saveStep1(input: Step1Input): Promise<{ restaurantId: string }> {
  const parsed = step1Schema.parse(input);

  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Sessão expirada. Faça login novamente.');

  const { data: available } = await supabase.rpc('is_slug_available', {
    check_slug: parsed.slug,
    exclude_id: parsed.restaurantId,
  });
  if (!available) throw new Error('Esse link já está em uso. Escolha outro.');

  const payload = {
    name: parsed.name,
    segment: parsed.segment,
    address: parsed.address,
    primary_color: parsed.primaryColor,
    slug: parsed.slug,
    logo_url: parsed.logoUrl,
    wizard_step: 1,
  };

  if (parsed.restaurantId) {
    const { data, error } = await supabase
      .from('restaurants')
      .update(payload)
      .eq('id', parsed.restaurantId)
      .eq('owner_id', user.id)
      .select('id')
      .single();
    if (error || !data) throw new Error('Não foi possível salvar.');
    return { restaurantId: data.id };
  }

  const { data, error } = await supabase
    .from('restaurants')
    .insert({ ...payload, owner_id: user.id })
    .select('id')
    .single();
  if (error || !data) throw new Error('Não foi possível criar o restaurante.');
  return { restaurantId: data.id };
}
