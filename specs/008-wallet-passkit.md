# Spec 008 — Wallet ponta a ponta (Google-first)

> Status: 🔄 diurna (/loop) — código implementado, bloqueado em credenciais GCP + projeto Supabase pausado (ver Aprendizados)
> Hipótese vinculada: H5 (reativação) + insight validado na entrevista 1: captura dependente de staff falha por turnover — QR iniciado pelo cliente é o padrão obrigatório
> Onda: 1 · Independente das specs de agente (pode rodar em paralelo à 001)

---

## Por quê

O Wallet é o mecanismo de captura de clientes — a fundação do relacionamento e das campanhas. Hoje é esqueleto: rotas e UI existem, mas nenhum pass jamais chegou a um celular real. Sem isso não há demo crível, não há piloto, não há dado de cliente.

**Decisão Google-first:** Android tem ~80%+ do mercado BR — exatamente o perfil do cliente de restaurante de bairro. Google Wallet API é JWT + service account (sem certificados físicos, sem custo); Apple exige Developer account (US$99) + certs + assinatura de .pkpass. Google primeiro entrega o valor à maioria; Apple é a spec 018.

## O quê

Cliente escaneia QR na mesa → página leve → informa telefone → "Adicionar ao Google Wallet" → pass com selos no celular. Operador registra carimbo no dashboard → pass atualiza. 10 selos → recompensa visível → operador resgata → zera.

## Requisitos

1. Setup Google Wallet API: service account no Google Cloud + Issuer account + uma `LoyaltyClass` por restaurante (script de provisionamento, não manual)
2. Página pública `/w/[slug]` mobile-first: nome do restaurante, recompensa, campo telefone (máscara BR), botão "Salvar no Google Wallet" (JWT assinado server-side)
3. Primeiro scan cria `customer` com telefone + `LoyaltyObject` vinculado (1 objeto por customer×restaurant)
4. Carimbo no dashboard (fluxo existente) → PATCH no LoyaltyObject → contador atualiza no pass
5. 10º selo → pass exibe estado de recompensa; resgate no dashboard → contador zera, `visits` registra o resgate
6. Telefone repetido no mesmo restaurante → reusa customer/objeto (link "salvar de novo"), sem duplicar
7. Secrets do service account: apenas server-side, arquivo no .gitignore

## Critérios de aceite — VERIFICÁVEIS

- [ ] `npx tsc --noEmit` passa
- [ ] `scripts/provision-wallet.ts <restaurantId>` cria a LoyaltyClass e sai com código 0
- [ ] `/w/kitos` carrega em <2s no mobile (Lighthouse ou teste manual documentado)
- [ ] Fluxo real documentado com screenshots em `docs/evidencias/008/`: scan → telefone → pass salvo num Android físico
- [ ] Carimbo no dashboard → GET no LoyaltyObject via API confirma contador incrementado
- [ ] Linha em `customers` criada no primeiro scan com telefone normalizado (+55...)
- [ ] Mesmo telefone 2x → nenhum customer duplicado (query de verificação no PR)
- [ ] 10º carimbo → campo de recompensa do objeto muda de estado

## Fora de escopo

- Apple Wallet (spec 018 — exige Apple Dev account; decisão de compra separada)
- Push notifications de campanha via Wallet (depois do fluxo base)
- Personalização visual por restaurante além de nome/cor/logo
- Pontos/cashback no pass (só selos; loyalty ampliado espera a 014)

## Dados e schema

Tabelas existentes: `customers`, `visits`. Novas colunas: `customers.wallet_object_id`, `restaurants.wallet_class_id` (migration nova, nunca editar existente). Secrets: `GOOGLE_WALLET_SA_KEY` server-side.

## Loop de feedback

Cada scan/carimbo/resgate grava evento — taxa de conversão da página (scans → passes salvos) é o primeiro dado real de H5. Meta de referência: >40% dos scans viram pass.

## Plano B / riscos

- Aprovação do Issuer account demorar: modo demo com classe de teste (funciona em qualquer conta Google) destrava demos enquanto isso
- Google Wallet indisponível no aparelho: fallback = cartão web (mesma página com contador, salva na tela inicial como PWA) — cobre 100% dos aparelhos

## Aprendizados

- 2026-07-12 · Sessão `/loop` implementou o código completo do fluxo Google-first:
  migration `003_wallet_slug.sql` (coluna `restaurants.slug`, com backfill),
  `apps/dashboard/src/lib/googleWallet.ts` (JWT + REST da Google Wallet API via
  `jose`, sem depender do pacote `googleapis`), `scripts/provision-wallet.ts`
  (provisionamento de `LoyaltyClass`, testado e falha corretamente sem
  credenciais), página pública `/w/[slug]` + `WalletEnrollForm` + action
  `enrollInWallet`, e sincronização do carimbo (`addStamps`/`redeemReward`
  em `actions/customers.ts`) com o `LoyaltyObject` via `patchLoyaltyObjectStamps`
  (silenciosa se o Wallet não estiver configurado ou o cliente não tiver pass —
  nunca bloqueia o carimbo). `npx tsc --noEmit` passa.
- **Reuso de colunas existentes:** `customers.google_pass_object_id` e
  `restaurants.google_wallet_class_id` já existiam desde a migration 001 —
  não foi necessário criar `wallet_object_id`/`wallet_class_id` como a spec
  original sugeria. A única coluna nova foi `restaurants.slug`.
- **Bloqueios que exigem ação humana, não completáveis por uma sessão automatizada:**
  (1) `GOOGLE_WALLET_SA_KEY`/`GOOGLE_WALLET_ISSUER_ID` reais — precisam de
  service account + Issuer account criados no Google Cloud Console (aprovação
  pode levar dias, ver Plano B); (2) o projeto Supabase (`hfqclbihfasnigitxpqj`)
  está pausado (`status: INACTIVE`) — a migration 003 não foi aplicada; restaurar
  tem custo e não foi feito sem aprovação explícita; (3) evidência em
  `docs/evidencias/008/` exige um Android físico, indisponível neste ambiente.
  Ver `docs/evidencias/008/README.md` para o handoff.
- Critérios de aceite ainda não verificáveis até os bloqueios acima serem resolvidos:
  provisionamento real, `/w/kitos` num device real, scan→pass→carimbo ponta a ponta,
  dedupe de telefone em produção, estado de recompensa no 10º selo.
- **Revisão (security + reviewer agents) rodada após a implementação — corrigido nesta sessão:**
  race condition em `ensureLoyaltyClass`/`ensureLoyaltyObject` (409 concorrente
  agora tratado como sucesso, replicado em `provision-wallet.ts`); constraint
  `restaurants_slug_unique` da migration 003 agora é idempotente (guard via
  `pg_constraint`); erros crus do Postgres/Google Wallet API não são mais
  repassados à página pública (`enrollInWallet` agora sempre retorna uma
  mensagem genérica ao cliente, loga o detalhe só no servidor); checkbox de
  opt-in explícito adicionado ao `/w/[slug]` (antes era só um texto, não uma
  ação afirmativa do usuário); `enrollInWallet` agora exige `restaurants.slug
  is not null` (só restaurantes publicados aceitam enrollment); `syncWalletStamps`
  agora filtra por `restaurant_id` também.
- **Achado CRÍTICO não resolvido nesta sessão — decisão do dono necessária:**
  `apps/dashboard/src/middleware.ts` é um no-op (nenhuma rota do dashboard tem
  autenticação) e todo cliente Supabase do app (`lib/supabase/server.ts`) usa a
  `SUPABASE_SERVICE_KEY`, que bypassa RLS. Isso é anterior à spec 008, mas a nova
  rota pública `/w/[slug]` + `enrollInWallet` (Server Action chamável diretamente,
  não só pela página) herda o padrão: sem rate limiting real, qualquer um pode
  enumerar `restaurantId`s e criar `customers` falsos ou esgotar a quota da Google
  Wallet API. Mitigação real (rate limit por IP/telefone) exige infra nova
  (ex.: Upstash Redis, Vercel KV, ou tabela de token-bucket no Supabase) — decisão
  de arquitetura que não foi tomada de forma autônoma. Ver PLAN.md → Bloqueios.
