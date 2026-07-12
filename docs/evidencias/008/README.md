# Evidências — Spec 008 (Wallet ponta a ponta)

Status: **código pronto, evidência real pendente.**

Este diretório deve conter o screenshot do fluxo real (scan → telefone →
pass salvo num Android físico), exigido pelo critério de aceite da spec.
Ainda não foi gerado porque três pré-requisitos externos, fora do alcance
de uma sessão automatizada, seguem pendentes:

1. **Google Cloud / Issuer account** — `GOOGLE_WALLET_SA_KEY` e
   `GOOGLE_WALLET_ISSUER_ID` (ver `.env.example`) precisam de uma service
   account real, criada no Google Cloud Console, e um Google Wallet Issuer
   account aprovado. Isso é uma ação humana (conta Google, possível
   aprovação com prazo — ver "Plano B" na spec).
2. **Projeto Supabase pausado** — o projeto `restaurante-growth-suite`
   (`hfqclbihfasnigitxpqj`) está com status `INACTIVE`; a migration 003
   (`supabase/migrations/003_wallet_slug.sql`) não pôde ser aplicada.
   Requer restaurar o projeto (ação com possível custo — não executada
   sem aprovação explícita do dono).
3. **Celular Android físico** — o critério pede evidência de um device
   real, que este ambiente não tem.

## O que já está pronto (verificável sem os itens acima)

- `npx tsc --noEmit` passa em `apps/dashboard`
- `scripts/provision-wallet.ts` roda e falha corretamente por falta de
  credenciais (comportamento esperado sem GCP configurado)
- Página pública `/w/[slug]`, formulário de telefone, server action de
  enrollment e sincronização de carimbo com o LoyaltyObject estão
  implementados — ver `specs/008-wallet-passkit.md` → Aprendizados.

## Próximo passo

Quando o dono fornecer `GOOGLE_WALLET_SA_KEY`/`GOOGLE_WALLET_ISSUER_ID` e
restaurar o projeto Supabase: aplicar a migration 003, rodar
`npm run provision-wallet -- <restaurantId>`, escanear o QR em
`/restaurante/[id]/wallet` num Android real e salvar o screenshot aqui.
