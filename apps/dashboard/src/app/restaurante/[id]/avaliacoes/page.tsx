import { redirect } from 'next/navigation';

// Página legada — consultava `reviews` (tabela dropada no reset de
// 22/07/2026, ver CLAUDE.md). Removida em vez de corrigida (spec-010
// reconstrói essa tela sobre o schema novo). Redirect simples, sem patch.
export default function AvaliacoesPage() {
  redirect('/');
}
