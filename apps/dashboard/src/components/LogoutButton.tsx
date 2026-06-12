'use client';

import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

export default function LogoutButton() {
  const router = useRouter();
  const supabase = createClient();

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  }

  return (
    <button
      onClick={handleLogout}
      style={{
        width: '100%',
        background: 'transparent',
        border: 'none',
        color: '#9ca3af',
        fontSize: 13,
        padding: '8px 12px',
        borderRadius: 8,
        cursor: 'pointer',
        textAlign: 'left',
        display: 'flex',
        alignItems: 'center',
        gap: 8,
      }}
    >
      <span>↩</span> Sair
    </button>
  );
}
