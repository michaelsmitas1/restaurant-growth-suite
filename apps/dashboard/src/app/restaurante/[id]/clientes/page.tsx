import { redirect } from 'next/navigation';

// Página legada — consultava `customers.restaurant_id` (coluna removida
// no reset de 22/07/2026: cliente agora é global, o vínculo com o
// restaurante vive em `customer_programs`, ver CLAUDE.md). Redirect
// simples, sem patch — spec-010/2.9 reconstrói essa tela.
export default function ClientesPage() {
  redirect('/');
}
