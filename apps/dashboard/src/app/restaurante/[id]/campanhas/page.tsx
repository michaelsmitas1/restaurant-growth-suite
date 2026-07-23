import { redirect } from 'next/navigation';

// Página legada — consultava `campaigns` (tabela dropada no reset de
// 22/07/2026, ver CLAUDE.md). Campanhas manuais estão fora do MVP 1
// (CLAUDE.md, "Fora do MVP 1"). Redirect simples, sem patch.
export default function CampanhasPage() {
  redirect('/');
}
