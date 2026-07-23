# Remy — PLAN.md v4
# Gerado em 2026-07-22. Substitui todas as versões anteriores.
# Reestruturado pós-VERIFY.md: reset limpo aprovado, Fase 0 refeita.

---

## Como usar este arquivo

Rotinas e sessões leem este arquivo para identificar a próxima tarefa.
Uma sessão/rotina = UMA tarefa. Ao concluir: marcar [x] + draft PR.
Nunca pular fase sem fechar a anterior.

---

## Status global

```
Fase 0 — Fundação (reset + auth + port)   🟢 CONCLUÍDA (0a-0f) — 2 ações manuais pendentes (ver 0e/0f)
Fase 2 — MVP 1                            🟢 DESBLOQUEADA
Fase 3 — Paralela                         🔵 DESBLOQUEADA (independente)
```

Nota: a antiga "Fase 1 (merge spec-008)" foi absorvida pela Fase 0 —
decisão D4 de 2026-07-22: portar a lib, não mergear a branch.

---

## Decisões que moldaram este plano (2026-07-22)

```
D1 ✅ Domínio: app.balcao.ai (produto) + balcao.ai (site futuro) — SUBSTITUÍDA por D7
D2 ✅ Branch wip/campanhas abandonada — referência visual apenas
D3 ✅ Reset limpo do banco de teste — migrations reescritas do zero
D4 ✅ spec-008: portar lib/googleWallet.ts, não mergear a branch
D5 ✅ OAuth Google de teste revogado; integração por restaurante = spec-024
D6 ✅ RLS resolvido pelo reset (toda migration nasce com RLS + policies)
D7 ✅ Rebrand Balcão → Remy (2026-07-22): domínio remy.app.br (produto);
      site institucional (futuro) a definir
```

---

## 🔴 FASE 0 — Fundação

> Pré-requisito de tudo. Sem remendos: o schema nasce certo.

### 0a. Reset do banco + schema novo completo ✅ 2026-07-22

**Contexto:** banco 100% teste (VERIFY.md). 6 migrations aplicadas sem arquivo
no repo. Tabelas legadas serão substituídas. Janela única para história limpa.

**Critérios de aceite:**
- [x] Backup lógico do banco atual salvo localmente (segurança, não será usado)
      — dump JSON das 11 tabelas legadas via `execute_sql`, salvo fora do repo
      (contém PII de teste). Confirmação do usuário obtida antes do drop.
- [x] Banco de teste dropado/resetado — 11 tabelas legadas (`restaurants`,
      `customers`, `visits`, `reviews`, `campaigns`, `campaign_messages`,
      `review_approvals`, `user_restaurants`, `loyalty_programs`,
      `message_templates`, `customer_loyalty`) + função/trigger órfã
      `generate_restaurant_slug` + extensão `unaccent` não utilizada.
- [x] Migrations novas do zero, numeradas, idempotentes, cobrindo o schema
      canônico do CLAUDE.md: restaurants (expandida com owner_id/slug/cores/
      redes sociais/wizard_step), card_design_config, loyalty_config,
      loyalty_milestones, form_fields_config, customers (phone único global),
      customer_programs, visits, redemptions, otp_codes, customer_sessions,
      daily_passwords, whatsapp_log — 7 arquivos em `supabase/migrations/`
      (20260722010000 a 20260722010600).
- [x] TODA tabela com RLS habilitado + policies NA MESMA migration —
      13/13 tabelas com `rls_enabled: true` confirmado via
      `mcp__supabase__list_tables`. `customers`/`otp_codes`/`customer_sessions`
      nascem sem policy (deny-all intencional — acesso só via
      `lib/customerSession.ts`, documentado em comentário na migration).
- [x] `supabase db push` em ambiente limpo — CLI indisponível localmente
      (`npx supabase` falha por erro de auth do registry npm, não investigado
      pois foge do escopo de 0a). Validado de forma equivalente: as mesmas
      migrations foram aplicadas sequencialmente via MCP Supabase contra o
      projeto de teste (hfqclbihfasnigitxpqj) já resetado, sem erros —
      `get_advisors(security)` confirma 0 problema fora do INFO esperado.
- [x] `supabase/seed.sql` recria dados de desenvolvimento (1 dono em
      auth.users, 1 restaurante "Sorveteria da Vó Maria" configurado —
      card_design_config + loyalty_config + 3 milestones + form_fields_config,
      10 clientes, customer_programs vinculados, 5 visits, 1 redemption VIP).
      Executado com sucesso via `execute_sql`.
- [x] `tsc --noEmit` passa — `cd apps/dashboard && npx tsc --noEmit` sem output
      (0 erros).

---

### 0b. Auth do dono — middleware + posse ✅ 2026-07-22

**Achado crítico corrigido:** `lib/supabase/server.ts` usava `SUPABASE_SERVICE_KEY`
(bypassa RLS) em TODAS as pages/actions do dashboard, e `middleware.ts` era um
no-op (`return NextResponse.next()` sem checar sessão). Ambos violavam
CLAUDE.md diretamente — corrigidos nesta tarefa.

**Critérios de aceite:**
- [x] `middleware.ts` protege todas as rotas — `lib/supabase/middleware.ts`
      (`updateSession`) chama `supabase.auth.getUser()` a cada request; como
      o app ainda não tem o route group `(dashboard)/` (rotas atuais:
      `/`, `/restaurante/[id]/*`), a proteção cobre tudo exceto `/login` e
      `/auth/callback`. Nota: quando a Fase 2 adicionar rotas de cliente
      (`[slug]/`, `/scan`, etc.), `PUBLIC_PATHS`/matcher precisam ser
      revisados para não bloquear o Nível 2 de auth.
- [x] Sem sessão → redirect `/login` — verificado ao vivo:
      `curl -s -o /dev/null -w '%{http_code} %{redirect_url}' localhost:3000/`
      → `307 http://localhost:3000/login`; `GET /login` → `200`.
- [x] Toda Server Action: `getUser()` + validação de posse via `owner_id` —
      novo helper `lib/auth/requireOwner.ts` implementa o padrão exato do
      CLAUDE.md; aplicado às 3 Server Actions existentes em
      `app/actions/reviews.ts`.
- [x] `createServerClient()` (anon + sessão) em todas as pages/actions —
      `lib/supabase/server.ts` reescrito para usar
      `NEXT_PUBLIC_SUPABASE_ANON_KEY` (era `SUPABASE_SERVICE_KEY`).
- [x] `SUPABASE_SERVICE_KEY` apenas nos 3 lugares autorizados — grep
      confirma zero ocorrências em `apps/dashboard/src` após a correção
      (lib/googleWallet.ts e lib/customerSession.ts ainda não existem;
      chegam em 0c/0d).
- [x] `next.config.js`: `allowedOrigins` restrito a `app.balcao.ai` e
      `localhost:3000` (era `['*']`) — atualizado para `remy.app.br` no
      rebrand (D7).
- [x] `tsc --noEmit` passa — 0 erros.

**Fora do escopo desta tarefa (não tocado):** as páginas legadas
`app/restaurante/[id]/{avaliacoes,campanhas,clientes,configuracoes,wallet}`
consultam tabelas dropadas em 0a (`reviews`, `campaigns`, `customers.restaurant_id`)
e vão quebrar em runtime até serem reconstruídas na Fase 2 (spec-010/2.9) ou
removidas em 0f — efeito esperado do reset (D3), não introduzido aqui.

---

### 0c. Auth do cliente — infraestrutura OTP + sessão ✅ 2026-07-22

**Contexto:** base do Nível 2 de auth (CLAUDE.md). Consumida pelas specs
023 (cadastro), 019 (web wallet) e 022 (senha do dia).

**Critérios de aceite:**
- [x] `lib/customerSession.ts`: `createCustomerSession`, `getCustomerSession`,
      `revokeCustomerSession` — único lugar (além de `serviceClient.ts`
      interno e `googleWallet.ts` em 0d) que usa `createServiceClient()`,
      toda query escopada por `token_hash`/`customer_id`.
- [x] Envio de OTP via Evolution API (WhatsApp) — `lib/whatsapp/evolution.ts`,
      `POST {EVOLUTION_API_URL}/message/sendText/{EVOLUTION_INSTANCE}`
      (formato confirmado nos workflows n8n existentes em `apps/n8n-workflows/`).
- [x] Envio de OTP via SMS — `lib/sms/index.ts`: interface `SmsProvider` +
      stub que lança erro explícito se chamado (provider real fica para
      quando a decisão aberta em PLAN.md for resolvida).
- [x] Regras (código 6 dígitos, expira 5 min, máx 3 tentativas, rate limit
      3/telefone/hora) — implementadas como funções puras em `lib/otp/rules.ts`,
      consumidas por `lib/otp/index.ts` (`requestOtp`/`verifyOtp`, via
      `otp_codes`).
- [x] Cookie httpOnly assinado, 30 dias — `customerSession.ts` assina o
      token com HMAC-SHA256 (`CUSTOMER_SESSION_SECRET`) antes de gravar em
      `customer_sessions.token_hash`; cookie `balcao_customer_session`
      (httpOnly, secure em produção, sameSite lax, 30 dias) — renomeado para
      `remy_customer_session` no rebrand (D7).
- [x] Testes Vitest: geração, expiração, tentativas, rate limit — Vitest
      configurado (`vitest.config.ts`, script `test`), 18/18 testes passando
      em `lib/otp/rules.test.ts` + `lib/phone.test.ts`
      (`npx vitest run` → `Test Files 2 passed (2)`, `Tests 18 passed (18)`).
- [x] `tsc --noEmit` passa — 0 erros.

**Notas:** novas env vars documentadas em `.env.example`
(`EVOLUTION_INSTANCE`, `CUSTOMER_SESSION_SECRET`, `SMS_PROVIDER_API_KEY`) e
preenchidas no `.env` local com valor de desenvolvimento. `otp_codes.code`
fica em texto plano no banco (nome de coluna exigido pelo schema canônico
0a) — aceitável porque a tabela nasce sem policies (deny-all) e o código
expira em 5 min/uso único; sem acesso via `EVOLUTION_API_URL`/`_KEY` reais,
o envio de WhatsApp não foi testado end-to-end nesta sessão.

---

### 0d. Port da lib Google Wallet ✅ 2026-07-22

**Contexto:** `lib/googleWallet.ts` da branch spec-008 é a peça mais bem
construída do audit. Portar para main adaptada ao schema novo
(customer_programs em vez de customers.current_stamps).

**Critérios de aceite:**
- [x] `lib/googleWallet.ts` em main: `getAccessToken`, `ensureLoyaltyClass`,
      `ensureLoyaltyObject`, `patchLoyaltyObjectStamps`, `buildSaveToWalletUrl`
      — portadas de `spec-008-wallet-google` (JWT + service account via `jose`,
      sem `googleapis`).
- [x] Adaptada ao schema novo — `ensureLoyaltyObject`/`patchLoyaltyObjectStamps`
      recebem `CustomerProgramForWallet` (selos de `customer_programs`) +
      `NextMilestoneForWallet | null` (próximo marco não atingido, ou `null`
      quando VIP); `rewardStatusText`/`balanceText` isolados e testados
      (5 testes em `googleWallet.test.ts`).
- [x] IDs determinísticos — `classId` por `restaurant.id`
      (`{issuer}.rest_{id}`), **`objectId` agora por `customer_program.id`**
      (`{issuer}.prog_{id}`), não mais por `customer.id`: no schema novo um
      cliente tem N programas (um por restaurante), então o objectId precisa
      ser por vínculo, não por pessoa — desvio deliberado do código original.
- [x] Tratamento 404/409, erros sanitizados — mantido (404 em PATCH = pass
      ainda não salvo, não é erro; 409 em POST = corrida entre GET/POST, não
      é erro); mensagens de erro passaram a expor só o status HTTP, sem o
      corpo cru da resposta.
- [x] Teste de integração com credenciais reais — `GOOGLE_WALLET_SA_KEY`/
      `GOOGLE_WALLET_ISSUER_ID` já estavam configuradas no `.env` local.
      Rodado ao vivo contra o restaurante e customer_program de teste
      (seed 0a): `getAccessToken` → token obtido; `ensureLoyaltyClass` →
      `classId 3388000000023157990.rest_9a588819e3fc4817a0f755a5974c4c5b`;
      `ensureLoyaltyObject` → `objectId ...prog_4bc82a0f90e14b72b87e06964c92ac6b`;
      `buildSaveToWalletUrl` → JWT válido; `patchLoyaltyObjectStamps` →
      confirmado via GET subsequente na API real: `loyaltyPoints.balance
      "3/3"`, `textModulesData[0].body "Pronta para resgate! 🎁"`.
- [x] Screenshot do fluxo — confirmado como movido para spec-023 (Fase 2),
      não se aplica a esta tarefa de infraestrutura.
- [x] `tsc --noEmit` passa — 0 erros. `npx vitest run` → 23/23 (inclui os
      5 novos testes de `googleWallet.test.ts`).

**Nota de divergência com CLAUDE.md:** a seção de variáveis de ambiente do
CLAUDE.md lista `GOOGLE_APPLICATION_CREDENTIALS` (caminho de arquivo); o
código real (branch spec-008 e `.env` já configurado) usa
`GOOGLE_WALLET_SA_KEY` (JSON inline) + `GOOGLE_WALLET_ISSUER_ID`, mais
compatível com deploy serverless (Vercel). Mantive a convenção que já está
configurada e comprovadamente funcional; vale atualizar o CLAUDE.md para
refletir isso.

---

### 0e. Setup de testes + CI ✅ 2026-07-22 (branch protection pendente — ação manual)

**Critérios de aceite:**
- [x] Vitest configurado, primeiro teste rodando — feito em 0c
      (`vitest.config.ts`), 23/23 passando após 0c/0d (`rules.test.ts`,
      `phone.test.ts`, `googleWallet.test.ts`).
- [x] GitHub Actions: `tsc --noEmit` + `vitest run` em todo PR —
      `.github/workflows/ci.yml`, job `dashboard` (`working-directory:
      apps/dashboard`), roda em `pull_request`/`push` para `main`.
- [ ] PR com falha não mergeia (branch protection em main) — **não
      configurado nesta sessão**: é uma mudança de configuração do
      repositório GitHub (afeta todos os colaboradores), fora do escopo de
      uma edição de arquivo, e o check `dashboard` só existe para o GitHub
      selecionar como obrigatório depois de rodar pelo menos uma vez (ou
      seja, depois deste PR ser aberto/mergeado). Ação manual sugerida ao
      usuário: Settings → Branches → Branch protection rule para `main` →
      exigir o status check `dashboard`.
- [x] Badge de status no README — adicionado no topo do `README.md`,
      apontando para `actions/workflows/ci.yml/badge.svg`.

---

### 0f. Limpeza de referências legadas ✅ 2026-07-22 (domínio Vercel pendente — ação manual)

**Critérios de aceite:**
- [x] Zero referências a URLs do Railway no dashboard — 5 usos encontrados
      (`Sidebar.tsx`, `restaurante/[id]/wallet/page.tsx`,
      `restaurante/[id]/configuracoes/page.tsx`) e removidos: os links de
      "Conectar Google"/OAuth viram um estado "em breve" (o fluxo real é
      spec-024, Fase 3, ainda não existe); os links/QR do wallet passam a
      usar `${NEXT_PUBLIC_APP_URL}/${restaurant.slug}` (página pública
      `[slug]` ainda não implementada — spec-010/023, Fase 2 — mas o domínio
      já é o correto). `grep -ri railway apps/dashboard/src` só retorna
      comentários explicando a remoção, nenhuma URL.
- [x] Zero referências a `/w/[slug]` em código — confirmado (já estava limpo).
- [x] Zero referências a `loyalty_programs`/`customer_loyalty` — confirmado
      (já estava limpo).
- [x] `NEXT_PUBLIC_APP_URL` = https://app.balcao.ai em todos os ambientes —
      adicionado a `.env.example` e ao `.env` local (mesmo valor, conforme
      CLAUDE.md — QRs/links de wallet precisam de domínio público real
      mesmo em dev). Atualizado para `https://remy.app.br` no rebrand (D7).
- [ ] Domínio configurado no Vercel — **não feito nesta sessão**: é mudança
      de infraestrutura de produção (DNS + configuração do projeto Vercel
      `restaurante-growth-suite`, `prj_1z1GSNdI7qPTL8Fk3iRgyeSvxjqt`), fora
      do escopo de edição de arquivos e sem acesso a DNS/registrador. O
      usuário reportou (2026-07-22) já ter registrado `remy.app.br` — falta
      confirmar se já está anexado ao projeto Vercel. Ação manual: Vercel →
      Project Settings → Domains → adicionar `remy.app.br` + configurar os
      registros DNS indicados pela Vercel no registrador do domínio.
- [x] `tsc --noEmit` passa — 0 erros. `vitest run` → 23/23.

**Nota:** as páginas legadas em `restaurante/[id]/{avaliacoes,campanhas,
clientes,wallet,configuracoes}` continuam consultando colunas/tabelas
removidas em 0a (`stamps_required`, `reward_description`,
`customers.restaurant_id`, `reviews`, `campaigns`) e vão quebrar em runtime
até a Fase 2 reconstruir essas telas — fora do escopo desta tarefa
(limpeza de *referências legadas específicas*, não reescrita de páginas).

---

## 🟢 FASE 2 — MVP 1

> Ordem por dependência real. Cada spec consome o que a anterior entrega.

### 2.0 Design System — MASTER.md

**Contexto:** gerar a fonte de consistência visual antes da primeira tela.

**Critérios de aceite:**
- [ ] Rodar ui-ux-pro-max: `search.py "restaurant loyalty program dashboard
      brazilian" --design-system -p "Remy" --persist`
- [ ] `design-system/MASTER.md` gerado e commitado
- [ ] MASTER editado: tokens da skill SUBSTITUÍDOS pelos tokens do CLAUDE.md
      (os do branding vencem sempre)
- [ ] Componentes base criados com os tokens: Button, Input, Card, Badge,
      Toggle, Select (em `components/ui/`)
- [ ] `globals.css` com todos os tokens do CLAUDE.md
- [ ] Fontes Manrope + IBM Plex Mono carregadas (next/font)
- [ ] Página de referência `/dev/ui` renderizando todos os componentes
      (dev-only, não deployada em produção)

---

### spec-010 — Wizard de onboarding (8 passos)

**Por que primeiro:** cria o restaurante e o programa. Sem ele não existe
nada para o cliente entrar.

**Critérios de aceite:** ver specs/010-onboarding-wizard.md
Resumo: 8 passos, preview do card ao vivo (CardPreview compartilhado),
Google Business via Places API, QRs gerados (PDF impressão), estado persistido,
mobile-first, < 10 minutos.

---

### spec-023 — Cadastro do cliente (OTP-first) **[NOVA]**

**Por que segundo:** é a porta de entrada do cliente. Substitui a rota
`/w/[slug]` da branch abandonada. Consome a infra OTP (0c) e a lib
Google Wallet (0d).

**Critérios de aceite:**
- [ ] Rota `[slug]/entrar`: telefone primeiro → OTP → verificado
- [ ] Campos pós-verificação conforme form_fields_config do restaurante
- [ ] Consentimento obrigatório
- [ ] Deduplicação: telefone existente → login → vincula ao restaurante
      (cria customer_programs, não duplica customers)
- [ ] Bônus de cadastro creditado
- [ ] Oferta de wallet: Google Wallet (0d) / Apple (placeholder) / Web Wallet
- [ ] WhatsApp de boas-vindas disparado (se toggle ativo — stub até spec-004)
- [ ] Mobile-first, `--color-background-warm`, uma ação por tela
- [ ] Teste em Android físico: QR → cadastro → Google Wallet salvo + SCREENSHOT
      (critério herdado da antiga spec-008)
- [ ] Testes Vitest: dedupe, bônus, validação Zod
- [ ] `tsc --noEmit` passa

---

### spec-011 — Remy Rewards (motor)

**Por que terceiro:** o motor que credita selos, avalia milestones e VIP.
Consome o schema (0a) e é consumido por wallet, scanner e automações.

**Critérios de aceite:**
- [ ] Motor unificado em `lib/rewards.ts` (única fonte de crédito de selos)
- [ ] Acúmulo por visita e por valor
- [ ] Milestones (até 3) + VIP permanente surpresa após o último
- [ ] Nunca reinicia
- [ ] Bônus: cadastro, dias fracos (2x), aniversário (multiplicador)
- [ ] Earn action review Google (selos após clique no link)
- [ ] Trava de tempo por modo respeitada
- [ ] Atualização em tempo real: customer_programs → Google Wallet PATCH
- [ ] Testes Vitest: TODOS os caminhos (acúmulo, marcos, VIP, bônus, trava)
- [ ] `tsc --noEmit` passa

---

### spec-019 — Web Wallet + Meus Lugares

**Critérios de aceite:**
- [ ] `[slug]/u/[uid]`: card hero com identidade do restaurante
- [ ] Progresso + caminho completo de milestones + VIP badge
- [ ] Histórico, QR de resgate, "Estou aqui" (modal explica o modo do restaurante)
- [ ] Link de review, completar perfil
- [ ] Sessão via customerSession (0c), cookie 30 dias
- [ ] `meus-lugares`: todos os restaurantes + saldos
- [ ] PWA instalável, mobile-first
- [ ] `tsc --noEmit` passa

---

### spec-020 — Scanner do caixa

**Critérios de aceite:**
- [ ] `/scan` PWA com câmera
- [ ] Lê QR de Web/Google/Apple Wallet
- [ ] Credita selos (via lib/rewards) ou processa resgate
- [ ] Modo valor: campo R$ da compra
- [ ] Feedback imediato: ✅ nome + selos / ❌ motivo
- [ ] `tsc --noEmit` passa

---

### spec-004 — Automações WhatsApp

**Critérios de aceite:**
- [ ] Webhook Supabase → n8n nos 4 eventos
- [ ] Claude API gera mensagem (contexto + tom), registro em whatsapp_log
- [ ] Aniversário: 5-7 dias antes + lembrete no dia
- [ ] Toggles respeitados, webhook n8n com secret
- [ ] Preview do wizard usa a mesma chamada da produção
- [ ] Teste e2e: cadastro → WhatsApp recebido
- [ ] `tsc --noEmit` passa

---

### spec-021 — QR rotativo (Modo 3)

**Critérios de aceite:**
- [ ] `[slug]/display`: QR com token HMAC + timestamp, expira 3 min
- [ ] Auto-refresh, modo quiosque (tela cheia, sem timeout)
- [ ] Scanner/rewards valida assinatura antes de creditar
- [ ] Testes Vitest: assinatura, expiração
- [ ] `tsc --noEmit` passa

---

### spec-022 — Senha do dia (Modo 2)

**Critérios de aceite:**
- [ ] Geração automática (lista ~50 termos gastronomia BR) em daily_passwords
- [ ] Válida X horas (config), 1x por cliente por período
- [ ] Dono vê a senha na vista principal do dashboard
- [ ] Cliente digita na Web Wallet → lib/rewards credita
- [ ] Testes Vitest: validade, unicidade por cliente
- [ ] `tsc --noEmit` passa

---

### 2.9 Dashboard do dono — vista principal

**Contexto:** consolida o que as specs entregaram em uma home acionável.

**Critérios de aceite:**
- [ ] Métricas: clientes ativos 30d, selos da semana, resgates,
      próximos do milestone
- [ ] Senha do dia visível (se Modo 2)
- [ ] Lista de clientes com busca (nome/telefone)
- [ ] Configurações: editar programa, campos, automações, tom
      (earn actions dentro de configurações — decisão D3 do MVP1)
- [ ] `tsc --noEmit` passa

---

### 2.10 Playwright — fluxos críticos

**Critérios de aceite:**
- [ ] E2E: wizard completo (dono)
- [ ] E2E: cadastro completo do cliente (OTP mockado)
- [ ] Rodando no CI

---

## 🔵 FASE 3 — Paralela

### spec-018 — Apple Wallet
- [ ] `lib/appleWallet.ts` (passkit-generator): generatePass, updatePass, URL
- [ ] Web service de push (update em tempo real)
- [ ] Estrutura testável com certs locais; com credenciais: teste em iPhone físico
- [ ] Integrada ao fluxo de cadastro (spec-023) como opção real
- [ ] `tsc --noEmit` passa

### spec-024 — Google Business OAuth por restaurante **[NOVA]**
**Contexto:** decisão D5. Cada restaurante conecta sua conta Google Business
pelo dashboard (substitui o que vivia no wallet-service). Habilita review link
automático hoje e gestão de reviews no futuro.
- [ ] Fluxo OAuth no dashboard: conectar/desconectar conta Google Business
- [ ] Tokens criptografados no banco (nunca em texto puro)
- [ ] Review link extraído automaticamente ao conectar
- [ ] Após entrar: desligar wallet-service do Railway
- [ ] `tsc --noEmit` passa

---

## Decisões abertas

```
[ ] SMS provider (Twilio vs. nacional — Zenvia/TotalVoice) → afeta 0c
[ ] Google OAuth para login do CLIENTE na Web Wallet → avaliar UX, afeta spec-019
[ ] Data efetiva do reset do banco → registrar no CLAUDE.md ao executar
```

---

## Fora do roadmap atual

```
❌ Cashback R$ | ❌ Geolocalização | ❌ Campanhas manuais | ❌ Push
❌ Referral | ❌ Analytics avançado | ❌ Múltiplos programas | ❌ VIP configurável
❌ AI companion | ❌ iFood | ❌ Stone/MP | ❌ Cardápio por foto
❌ Retail media | ❌ wallet-service
```
