# Evidências — Spec 008 (Wallet ponta a ponta)

Status: **tudo verificado de ponta a ponta, exceto o screenshot em Android físico.**

## O que já foi verificado com dados/credenciais reais (2026-07-12)

- Credencial `GOOGLE_WALLET_SA_KEY` real, autenticação OAuth2 confirmada.
- `scripts/provision-wallet.ts` criou a `LoyaltyClass` real contra um
  restaurante de teste já existente no banco (dado de teste — hoje não há
  nenhum restaurante real/piloto cadastrado), classId no formato
  `<issuer-id>.rest_<restaurant-id>`.
- `next dev` real + navegador: `/w/<slug-de-teste>` carregado, form
  preenchido, submetido — redirecionou para `pay.google.com/gp/v/save/<jwt>`
  → `accounts.google.com` (JWT aceito por um endpoint real do Google).
- `customers` recebeu a linha com `phone = "+5511987654321"` (normalizado) e
  `google_pass_object_id` populado.
- Mesmo telefone reenviado 2x → mesma linha, sem duplicata.
- 10 cliques reais em "Adicionar 1 selo" no dashboard → confirmado via GET no
  Google Wallet API a cada incremento; no 10º, `textModulesData.reward_status`
  mudou para "Pronta para resgate! 🎁" e o botão do dashboard virou "✓ Usar"
  automaticamente.

Detalhes completos em `specs/008-wallet-passkit.md` → Aprendizados.

## O que falta — só isto

**Screenshot do fluxo num Android físico**: scan do QR → `/w/[slug]` →
"Salvar no Google Wallet" → pass visível no app Google Wallet do celular.
Isso não pode ser automatizado (precisa de login numa conta Google real e um
device físico) — fica por conta do dono. Quando tiver, salvar aqui.
