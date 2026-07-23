import { redirect } from 'next/navigation';

// Página legada — consultava `customers.restaurant_id`/`stamps_required`
// (removidos no reset de 22/07/2026, ver CLAUDE.md) e apontava para o
// wallet-service legado do Railway. Redirect simples, sem patch —
// spec-010/023 reconstrói o wallet sobre `[slug]`/Web Wallet.
export default function WalletPage() {
  redirect('/');
}
