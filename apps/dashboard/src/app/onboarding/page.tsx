import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Wizard from '@/components/wizard/Wizard';

// Retoma o wizard de onde o dono parou: procura um restaurante do owner
// autenticado ainda sem wizard_completed_at (CLAUDE.md: "Dono pode sair e
// voltar de onde parou"). Se não houver nenhum, o Passo 1 (Sessão 5) cria
// o primeiro registro ao salvar.
export default async function OnboardingPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: restaurant } = await supabase
    .from('restaurants')
    .select('id, wizard_step')
    .eq('owner_id', user.id)
    .is('wizard_completed_at', null)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  return (
    <Wizard
      initialStep={restaurant?.wizard_step ?? 0}
      initialRestaurantId={restaurant?.id ?? null}
    />
  );
}
