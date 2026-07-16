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

- [x] `npx tsc --noEmit` passa
- [x] `scripts/provision-wallet.ts <restaurantId>` cria a LoyaltyClass e sai com código 0 — verificado contra um restaurante de teste já existente no banco (dado de teste, nenhum piloto real ainda), classId no formato `<issuer-id>.rest_<restaurant-id>`
- [x] `/w/[slug]` carrega e renderiza dados reais (nome, recompensa, contagem de selos) via slug — testado em `next dev` real contra um restaurante de teste. Não medido com Lighthouse/prod build ainda (dev mode não é representativo de tempo de carregamento real)
- [ ] Fluxo real documentado com screenshots em `docs/evidencias/008/`: scan → telefone → pass salvo num Android físico — **intencionalmente não feito nesta sessão**, requer device físico
- [x] Carimbo no dashboard → GET no LoyaltyObject via API confirma contador incrementado — testado via clique real no botão "Adicionar 1 selo" em `/clientes`, confirmado via GET no Google Wallet API
- [x] Linha em `customers` criada no primeiro scan com telefone normalizado (+55...) — `+5511987654321` confirmado
- [x] Mesmo telefone 2x → nenhum customer duplicado — testado enviando o mesmo telefone 2x pelo formulário real, 1 única linha permaneceu
- [x] 10º carimbo → campo de recompensa do objeto muda de estado — testado via 10 cliques reais no botão de carimbo; `textModulesData` mudou de "N/10 selos" para "Pronta para resgate! 🎁" e o botão do dashboard virou "✓ Usar" automaticamente

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
  pode levar dias, ver Plano B); (2) o projeto Supabase (`<supabase-project-ref>`)
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
- 2026-07-12 (retomada) · **Blindagem mínima do `/w/[slug]` aplicada** (escopo
  explícito do dono: não mexer na auth do dashboard como um todo, só nesta rota
  pública). Antes, `enrollInWallet(restaurantId, phone, consent)` aceitava
  `restaurantId` como argumento vindo do client component — como é uma Server
  Action, ela é chamável via POST direto, então nada impedia alguém de mandar
  um `restaurantId` diferente do restaurante cujo QR foi escaneado (qualquer id
  de restaurante publicado servia). Corrigido: a action agora é
  `enrollInWallet(slug, phone, consent)` — o `restaurantId` real é sempre
  resolvido server-side com `.eq('slug', slug).single()` contra o banco, nunca
  aceito como parâmetro. Toda escrita (upsert de `customers`, `LoyaltyObject`)
  usa só esse id resolvido. `WalletEnrollForm` e `/w/[slug]/page.tsx` atualizados
  para passar `slug` em vez de `restaurantId`. `npx tsc --noEmit` passa.
  Isso reduz a superfície do achado crítico acima (não dá mais pra escrever em
  nome de outro restaurante via esta rota) mas não resolve rate-limiting nem a
  ausência de auth no dashboard em geral — isso continua registrado como
  decisão pendente em PLAN.md.
- 2026-07-12 (retomada) · **Bloqueios anteriores resolvidos:** projeto Supabase
  (`<supabase-project-ref>`) reativado (`status: ACTIVE_HEALTHY`) — migration
  `003_wallet_slug.sql` aplicada com sucesso, `restaurants.slug` existe agora.
  Ao inspecionar o schema ao vivo via advisor do Supabase apareceu um achado
  crítico *à parte* deste (não introduzido pela 008): RLS está **desabilitado**
  (não só contornado pela service key) em 8 tabelas, incluindo `restaurants` e
  `customers` — exposição total às roles `anon`/`authenticated`. Não apliquei
  a correção automaticamente (habilitar RLS sem policies quebraria o app
  inteiro); reportado ao dono para decisão, não é escopo da 008.
  Credencial Google Wallet (service account) ainda não configurada nesta
  sessão — dono está configurando manualmente fora do git
  (`apps/dashboard/certs/`, já no `.gitignore`, e `GOOGLE_WALLET_SA_KEY`/
  `GOOGLE_WALLET_ISSUER_ID` em `.env`/`apps/dashboard/.env.local`).
- 2026-07-12 (retomada, parte 3) · **`migration 004_wallet_slug_trigger.sql`
  aplicada** (aprovada pelo dono — só `CREATE OR REPLACE FUNCTION` +
  `CREATE TRIGGER`, nada existente alterado): gera `restaurants.slug`
  automaticamente em qualquer INSERT que não informe um valor, porque a
  migration 003 tornou a coluna `NOT NULL` mas nenhum ponto de criação de
  restaurante (ex.: `scripts/onboard-restaurant.js`) preenchia esse campo —
  sem o trigger, o próximo onboarding real quebraria.
- 2026-07-12 (retomada, parte 3) · **Credencial Google Wallet real configurada
  e testada de ponta a ponta** — não é mais simulação:
  - Handshake OAuth2 autenticado com sucesso com a service account
    configurada (`GOOGLE_WALLET_SA_KEY`, fora do git).
  - `provision-wallet.ts` criou a `LoyaltyClass` real contra um restaurante
    de teste já existente no banco (dado de teste — confirmado que hoje não
    há nenhum restaurante real/piloto cadastrado).
  - Rodei `next dev` de verdade (não simulado) e testei o fluxo completo pelo
    navegador contra `/w/<slug-do-restaurante-de-teste>`: telefone `(11) 98765-4321`
    → submit → redirecionou para `accounts.google.com/Sign in` em
    `pay.google.com/gp/v/save/<jwt>` (prova de que o JWT assinado foi aceito
    por um endpoint real do Google — não tentei logar, isso já é território
    de teste em device/conta, fora do escopo desta sessão).
  - Confirmei no banco: customer criado com `phone = "+5511987654321"`
    (normalizado) e `google_pass_object_id` populado.
  - Reenviei o mesmo telefone pelo formulário → mesma linha de customer,
    nenhuma duplicata.
  - Cliquei "Adicionar 1 selo" no dashboard 10x de verdade (não simulado) e
    confirmei via GET direto no Google Wallet API, a cada passo: o
    `loyaltyPoints.balance` foi de `0/10` até `10/10`, e no 10º o
    `textModulesData` do `reward_status` mudou de `"N/10 selos"` para
    `"Pronta para resgate! 🎁"` — e o dashboard trocou o botão da linha para
    "✓ Usar" sozinho, sem reload manual (via `revalidatePath`).
  - Único critério que sobrou: screenshot em Android físico — não dá pra
    automatizar, fica para o dono. Todo o resto da checklist está ✅ com
    evidência real, não simulada.
