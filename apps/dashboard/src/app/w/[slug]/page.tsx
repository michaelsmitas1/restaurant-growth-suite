import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import WalletEnrollForm from '@/components/WalletEnrollForm';
import { resolveStampConfig, type LoyaltyProgram } from '@/lib/loyalty';

interface Props { params: { slug: string } }

export default async function PublicWalletPage({ params }: Props) {
  const supabase = createClient();

  const { data: restaurant } = await supabase
    .from('restaurants')
    .select('id, name, reward_description, stamps_required')
    .eq('slug', params.slug)
    .single();
  if (!restaurant) notFound();

  const { data: programs } = await supabase
    .from('loyalty_programs')
    .select('*')
    .eq('restaurant_id', restaurant.id)
    .eq('type', 'stamps')
    .eq('active', true)
    .order('created_at', { ascending: true })
    .limit(1);

  const stampProgram = (programs?.[0] || null) as LoyaltyProgram | null;
  const { stampsRequired, rewardDescription } = resolveStampConfig(stampProgram, restaurant);

  return (
    <div style={{
      minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 20, background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    }}>
      <div style={{
        background: '#fff', borderRadius: 24, padding: '36px 28px', maxWidth: 380,
        width: '100%', textAlign: 'center', boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
      }}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>🍽️</div>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: '#1a1a1a', marginBottom: 6 }}>{restaurant.name}</h1>
        <p style={{ fontSize: 15, color: '#666', marginBottom: 28, lineHeight: 1.5 }}>
          Seu cartão fidelidade digital.<br />Sem app, sem cadastro chato.
        </p>

        <div style={{
          background: 'linear-gradient(135deg, #fff8e1, #fff3cd)', border: '1px solid #fde68a',
          borderRadius: 16, padding: 18, marginBottom: 24,
        }}>
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: '#d97706' }}>
            🎁 Sua recompensa
          </div>
          <div style={{ fontSize: 16, fontWeight: 600, color: '#1a1a1a', marginTop: 4 }}>{rewardDescription}</div>
        </div>

        <p style={{ fontSize: 13, color: '#888', marginBottom: 16 }}>Colecione {stampsRequired} selos</p>

        <WalletEnrollForm slug={params.slug} />
      </div>
    </div>
  );
}
