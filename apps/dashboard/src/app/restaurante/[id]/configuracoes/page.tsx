import { redirect } from 'next/navigation';

// Página legada — consultava colunas removidas no reset de 22/07/2026
// (`restaurant.type`, `stamps_required`, `tone_of_voice`,
// `google_refresh_token`, ver CLAUDE.md). Redirect simples, sem patch —
// spec-010/2.9 reconstrói essa tela sobre loyalty_config/card_design_config.
export default function ConfiguracoesPage() {
  redirect('/');
}
