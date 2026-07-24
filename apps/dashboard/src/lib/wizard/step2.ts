'use server';

import { z } from 'zod';
import { requireOwner } from '@/lib/auth/requireOwner';

// Passo 2 é opcional por natureza (spec-010: "pode pular direto para o
// Passo 3 sem preencher redes sociais") — todo campo aceita string vazia
// virando null, nenhum é obrigatório.
const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .nullable()
    .transform(v => (v && v.length > 0 ? v : null));

const step2Schema = z.object({
  restaurantId: z.string().uuid(),
  googlePlaceId: optionalText(200),
  googleReviewLink: optionalText(500),
  socialInstagram: optionalText(200),
  socialFacebook: optionalText(300),
  socialTiktok: optionalText(200),
  socialWebsite: optionalText(300),
});

export type Step2Input = z.infer<typeof step2Schema>;

export async function saveStep2(input: Step2Input): Promise<{ restaurantId: string }> {
  const parsed = step2Schema.parse(input);
  const { supabase, restaurantId } = await requireOwner(parsed.restaurantId);

  const { error } = await supabase
    .from('restaurants')
    .update({
      google_place_id: parsed.googlePlaceId,
      google_review_link: parsed.googleReviewLink,
      instagram_handle: parsed.socialInstagram,
      facebook_url: parsed.socialFacebook,
      social_tiktok: parsed.socialTiktok,
      social_website: parsed.socialWebsite,
      wizard_step: 3,
    })
    .eq('id', restaurantId);
  if (error) throw new Error('Não foi possível salvar.');

  return { restaurantId };
}
