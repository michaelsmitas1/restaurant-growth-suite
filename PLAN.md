# Remy — PLAN.md v5
# Gerado em 2026-07-22, atualizado 2026-07-23. Substitui todas as versões anteriores.
# Reestruturado pós-VERIFY.md: reset limpo aprovado, Fase 0 refeita.
# v5: análise pós-rebrand — spec-010 criada, criterios de consentimento
# adicionados à spec-023, skill de design escolhida, decisão de data do
# reset resolvida.

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
D8 ✅ Paleta visual do rebrand aplicada nos tokens (2026-07-23): azul
      royal #1B3EA4, papel #FAF9F7, amarelo fosco #E1C463 — CLAUDE.md v6
      só tinha trocado o nome, tokens antigos ficaram; corrigido em v7
D9 ✅ Skills de design: ui-ux-pro-max (direção) + Impeccable (polimento).
      Taste mantida instalada mas inativa nesta fase — redundante
D10 ✅ Fluxo de consentimento (aceite): tela própria pós-OTP, pré-campos
      pessoais. Ver CLAUDE.md "Fluxo de consentimento (LGPD)"
D11 ✅ Auth do cliente permanece CUSTOM (não Supabase Auth) — 2026-07-23.
      Motivos: WhatsApp OTP grátis vs SMS pago (~R$0,25–0,50/verificação),
      privilégio baixíssimo da sessão do cliente, pools separados evitam
      complexidade de RLS. Condicionada ao hardening da task 2.0b —
      hardening fechado em 2026-07-23, decisão sem pendências
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

### 2.0 Design System — MASTER.md ✅ 2026-07-23

**Contexto:** gerar a fonte de consistência visual antes da primeira tela.

**Critérios de aceite:**
- [x] Rodar ui-ux-pro-max: `search.py "restaurant loyalty program dashboard
      brazilian" --design-system -p "Remy" --persist` — executado via skill
      `ui-ux-pro-max:ui-ux-pro-max`, gerou `design-system/remy/MASTER.md`
      (categoria "Airline", paleta vermelho-mostarda — descartados, ver
      próximo item).
- [x] `design-system/MASTER.md` gerado e commitado — movido de
      `design-system/remy/MASTER.md` para o caminho canônico
      `design-system/MASTER.md` (CLAUDE.md/PLAN.md não usam sub-pasta por
      projeto).
- [x] MASTER editado: tokens da skill SUBSTITUÍDOS pelos tokens do CLAUDE.md
      — paleta/tipografia/pattern sugeridos (vermelho #DC2626, Playfair
      Display SC, "Waitlist/Coming Soon") descartados; mantida apenas a
      ESTRUTURA (specs de componente, states, checklist de UX) preenchida
      com os tokens reais do CLAUDE.md v7 (azul royal, papel, amarelo
      fosco). Documentado explicitamente no topo do arquivo.
- [x] Componentes base criados com os tokens: Button, Input, Card, Badge,
      Toggle, Select — `apps/dashboard/src/components/ui/{Button,Input,
      Card,Badge,Toggle,Select}.tsx`, usando classes Tailwind mapeadas para
      os tokens via `tailwind.config.ts` (cores/radius/shadow como
      `var(--token)`).
- [x] `globals.css` com todos os tokens do CLAUDE.md — bloco `:root`
      reescrito com os tokens v7 (royal-blue/paper/matte-yellow/radius/
      spacing/shadow/motion); tokens legados (`--brand`, `--sidebar-*`,
      `--text-*`, `--green` etc.) viram aliases para os tokens novos, para
      não quebrar Sidebar/MetricCard/páginas atuais durante a transição.
- [x] Fontes Manrope + IBM Plex Mono carregadas (next/font) —
      `apps/dashboard/src/app/layout.tsx` usa `next/font/google`
      (`Manrope`, `IBM_Plex_Mono`), confirmado ao vivo:
      `getComputedStyle(button).fontFamily` → `__Manrope_..., Manrope,
      sans-serif` em `/dev/ui`.
- [x] Página de referência `/dev/ui` renderizando todos os componentes
      (dev-only, não deployada em produção) — `app/dev/ui/page.tsx`,
      `notFound()` se `NODE_ENV === 'production'`; testada ao vivo via
      preview local: `GET /dev/ui → 200`, todos os 6 componentes + tela de
      consentimento presentes na árvore de acessibilidade.
- [x] Skill ativa nesta task: ui-ux-pro-max (direção). Impeccable não
      invocada separadamente — o hook de design (`impeccable@1`) já roda
      automaticamente em todo Write/Edit e não sinalizou problemas. Taste
      permanece instalada, não invocada (D9).
- [x] Componente de tela de aceite/consentimento incluído nos base
      components — `components/ui/ConsentScreen.tsx`, testado ao vivo:
      botão "Continuar" desabilitado até o checkbox ser marcado
      (`btn.disabled === true` antes do clique).
- [x] `tsc --noEmit` passa (0 erros) e `npx vitest run` → 23/23 (nenhum
      teste novo necessário — tarefa é de UI/tokens, sem lógica de
      negócio).

---

### 2.0b — Hardening da auth do cliente (addendum ao 0c) ✅ 2026-07-23

**Contexto:** decisão D11 manteve a auth custom, condicionada a fechar
5 lacunas de segurança identificadas na revisão de 2026-07-23. Deve
fechar ANTES da spec-023 consumir a infra OTP. Tarefa pequena (1 sessão).

**Critérios de aceite:**
- [x] Código OTP salvo como hash em `otp_codes` (nunca texto plano);
      verificação compara hash — `lib/otp/rules.ts`: `hashOtpCode`
      (SHA-256) + `lib/otp/index.ts` grava `code_hash` em vez de `code`.
      Migration `supabase/migrations/20260723010000_hardening_customer_auth.sql`
      renomeia a coluna (idempotente, guardada por `information_schema`)
      e comenta o novo significado; aplicada ao vivo no projeto de teste
      (hfqclbihfasnigitxpqj) via `apply_migration` — `get_advisors(security)`
      sem novos problemas (só os INFO de deny-all já documentados em 0a).
- [x] Comparação em tempo constante (`crypto.timingSafeEqual`) —
      `hashesMatch()` em `lib/otp/rules.ts`, usada por
      `evaluateOtpVerification`.
- [x] Sliding expiry: validação com última rotação > 24h → rotaciona
      token da sessão + reemite cookie — `shouldRotateSession()` +
      `getCustomerSession()` em `lib/customerSession.ts`; nova coluna
      `customer_sessions.last_rotated_at` (mesma migration).
- [x] Limpeza embutida: inserir novo código/sessão deleta expirados do
      mesmo telefone/cliente (sem cron) — `requestOtp()` deleta
      `otp_codes` expirados do telefone antes de inserir;
      `createCustomerSession()` deleta `customer_sessions` expiradas do
      cliente antes de inserir.
- [x] Regra uid↔sessão: `customer_id` da sessão ≠ `uid` da URL → 403
      (helper único em `lib/customerSession.ts`, testado) —
      `requireCustomerForUid(uid)` + `sessionMatchesUid()`, lança
      `CustomerSessionForbiddenError` em divergência.
- [x] Multi-dispositivo: N sessões por cliente; logout revoga só a atual —
      já era o comportamento (`revokeCustomerSession` deleta só pelo
      `token_hash` do cookie atual); confirmado que a limpeza embutida
      acima só remove sessões EXPIRADAS do cliente, nunca as válidas de
      outros aparelhos.
- [x] Testes Vitest atualizados cobrindo os 5 itens —
      `lib/otp/rules.test.ts` (hash nunca é o código em claro,
      determinístico, códigos diferentes → hashes diferentes) +
      `lib/customerSession.test.ts` (sliding expiry: não rotaciona <24h,
      rotaciona >24h; uid↔sessão: bate/não bate). `npx vitest run` →
      `Test Files 4 passed (4)`, `Tests 31 passed (31)` (23 anteriores + 8
      novos).
- [x] `tsc --noEmit` passa — 0 erros. API pública de
      `lib/customerSession.ts`/`lib/otp/*` preservada (mesmos nomes de
      função exportados); só o formato interno do registro OTP mudou
      (`code` → `codeHash`), necessário para o próprio hardening.

---

### 2.0c — Limpeza das páginas legadas quebradas (pré-requisito da spec-010) ✅ 2026-07-23

**Contexto:** as 5 páginas seguintes consultavam tabelas/colunas dropadas
no reset de 22/07/2026 (`reviews`, `campaigns`, `customers.restaurant_id`,
`restaurant.stamps_required`/`type`/`tone_of_voice`/`google_refresh_token`)
e quebravam em runtime (ver notas de 0b/0f). Removidas/redirecionadas
SEM corrigir a lógica — spec-010/2.9 reconstrói essas telas sobre o
schema novo.

**Critérios de aceite:**
- [x] `app/restaurante/[id]/avaliacoes` — conteúdo substituído por
      `redirect('/')`. Componente `AvaliacaoCard.tsx` e a Server Action
      `app/actions/reviews.ts` (únicos consumidores, sem outros usos no
      repo) deletados junto — código morto, não patch.
- [x] `app/restaurante/[id]/campanhas` — idem, `redirect('/')`.
- [x] `app/restaurante/[id]/clientes` — idem, `redirect('/')`.
- [x] `app/restaurante/[id]/configuracoes` — idem, `redirect('/')`.
- [x] `app/restaurante/[id]/wallet` — idem, `redirect('/')`.
- [x] `tsc --noEmit` passa — 0 erros. `npx vitest run` → 31/31 (sem
      regressão).
- [x] Verificado ao vivo: as 5 rotas não fazem mais nenhuma query a
      tabela dropada (removida a query inteira, não só corrigida) —
      confirmado por leitura de cada arquivo pós-edição. Teste end-to-end
      do redirect em si bloqueado pelo middleware de auth do dono neste
      ambiente (sem sessão Supabase configurada, mesma limitação já
      registrada nas tasks 2.0/2.0b) — `next/navigation`'s `redirect()`
      é a API padrão documentada do Next.js, mesmo padrão já usado em
      `login/page.tsx` (via `router.push`), risco de regressão baixo.

**Achado fora de escopo (não corrigido nesta tarefa):**
`app/restaurante/[id]/page.tsx` (a página-índice, NÃO listada no escopo
desta tarefa) também consulta `reviews`, `campaigns` e
`customers.restaurant_id` diretamente — está igualmente quebrada em
runtime pelo mesmo reset. Como não estava no escopo explícito (CLAUDE.md,
PLAN.md 0b/0f e spec-010 só listam as 5 subrotas acima), foi deixada como
está. Precisa ser resolvida antes de qualquer demo com usuário real —
provavelmente junto da spec-010/2.9, que substitui essa tela pela home
do dashboard novo.

---

### spec-010 — Wizard de onboarding (8 passos)

⚠️ **Arquivo criado em 2026-07-23** — `specs/010-onboarding-wizard.md`
não existia até agora (só o resumo inline abaixo). Commitar antes de
iniciar a sessão desta spec.

**Por que primeiro:** cria o restaurante e o programa. Sem ele não existe
nada para o cliente entrar.

**Critérios de aceite:** ver specs/010-onboarding-wizard.md
Resumo: 8 passos, preview do card ao vivo (CardPreview compartilhado),
Google Business via Places API, QRs gerados (PDF impressão), estado persistido,
mobile-first, < 10 minutos.

**Antes de iniciar, resolver:** as páginas legadas em
`app/restaurante/[id]/*` quebram em runtime (ver CLAUDE.md, seção de
banco). Primeira sub-tarefa desta spec: remover ou isolar essas rotas
(redirect simples) antes de construir o wizard novo por cima.

### Progresso — Sessão 1: `app/restaurante/[id]/page.tsx` (achado da 2.0c) ✅ 2026-07-24

**Contexto:** 2.0c deixou explicitamente fora de escopo a página-índice
`app/restaurante/[id]/page.tsx`, que consultava `reviews`, `campaigns` e
`restaurant.type`/`google_refresh_token` — todos removidos/inexistentes
no schema pós-reset (confirmado via `list_tables` no projeto de teste
hfqclbihfasnigitxpqj antes de qualquer edição, sem duplicar 0a).

**O que foi feito:**
- `app/restaurante/[id]/page.tsx` reescrita contra o schema real:
  métricas agora vêm de `customer_programs`/`visits`/`redemptions`/
  `loyalty_config`/`loyalty_milestones` (nenhuma query a `reviews` ou
  `campaigns`, tabelas que não existem mais).
- Achado adicional durante a auditoria (fora do escopo listado em 2.0c,
  mas no mesmo caminho crítico): `app/page.tsx` (home) também selecionava
  `restaurant.type`, coluna inexistente (o campo real é `segment`) —
  corrigido, pois sem isso a navegação nunca chega ao dashboard.
- `components/ReviewsList.tsx` e `components/CampaignsList.tsx` removidos
  (único consumidor era a página reescrita; renderizavam dados de tabelas
  dropadas — código morto, não patch).
- `components/Sidebar.tsx`/`components/MobileNav.tsx`: itens de menu para
  Avaliações/Fidelidade/Clientes/Campanhas/Configurações removidos — todas
  essas rotas já são `redirect('/')` desde 2.0c; manter os links criava
  um loop de redirect sem utilidade. Menu fica só com "Visão geral" até
  2.9 reconstruir as telas.
- `CustomersList.tsx`/`MetricCard.tsx` mantidos sem alteração — já eram
  compatíveis com o schema novo (liam `current_stamps`/`total_visits` de
  `customer_programs`, não de `customers.restaurant_id`).
- Ambiente de dev criado para verificação (não versionado): `npm install`
  em `apps/dashboard` (node_modules não existia neste worktree),
  `apps/dashboard/.env.local` com URL/anon key do projeto de teste
  (hfqclbihfasnigitxpqj) via `get_project_url`/`get_publishable_keys`, e
  `.claude/launch.json` (já existia, aponta para `npm run dev`).

**Evidência:**
- `npx tsc --noEmit` → 0 erros (após instalar dependências, que não
  existiam neste worktree; 0 erros também nos módulos pré-existentes).
- `npx vitest run` → `Test Files 4 passed (4)`, `Tests 31 passed (31)`
  (sem regressão, mesmo total de 2.0b).
- Verificado ao vivo via preview local: `GET /` → redirect → `GET /login`
  → 200, tela de login renderiza (`Growth Suite` / `Acesse seu painel`),
  confirmando que o middleware/gate de auth do dono (0b) segue intacto.
- **Limitação registrada:** não foi possível verificar ao vivo o
  conteúdo pós-login do dashboard (as novas queries de
  `app/restaurante/[id]/page.tsx`) — preencher a senha do usuário seed
  no formulário de login é uma ação de credencial bloqueada para
  automação (mesma classe de restrição já registrada em 2.0/2.0b/2.0c
  para fluxos atrás do middleware de auth). Verificação feita por
  revisão de código linha a linha contra as colunas confirmadas via
  `list_tables` (schema real, não o rascunho do CLAUDE.md).

### Progresso — Sessão 2: schema gap (só o que faltava) ✅ 2026-07-24

**Contexto:** `list_tables` (projeto de teste hfqclbihfasnigitxpqj) já
tinha sido consultado na Sessão 1. Comparado campo a campo contra
"Schema necessário" de `specs/010-onboarding-wizard.md`:
`loyalty_config`, `loyalty_milestones` e `form_fields_config` **já
cobrem tudo** que os Passos 3/4/5/6 precisam (nomes diferentes do
rascunho da spec — ex. `accrual_mode` em vez de `accumulation_type`,
`slow_days` em vez de `double_points_days` — mesmo formato) — **zero
migration para essas 3 tabelas**, para não duplicar o que a Fase 0 (0a)
já criou.

Gap real, só em 2 tabelas:
- `restaurants`: faltava um campo de endereço completo (Passo 1 pede
  "Endereço completo, obrigatório" — hoje só existe `city`/`neighborhood`,
  insuficiente) e 2 redes sociais (`instagram_handle`/`facebook_url` já
  cobrem Instagram/Facebook, reaproveitados sem rename).
- `card_design_config`: faltava distinguir ícone preset (por categoria)
  de upload customizado — só existia uma única `icon_url` — e o texto
  do contador (Passo 1b).

**Migration:** `supabase/migrations/20260724010000_wizard_schema_gap.sql`
(idempotente, padrão `information_schema`/`pg_constraint` já usado em
2.0b) —
- `restaurants`: `+ address`, `+ social_tiktok`, `+ social_website`.
- `card_design_config`: `icon_url` renomeada para `stamp_icon_custom_url`
  (não usada em nenhum código, grep confirmou); `+ stamp_icon_type`
  (`preset`|`custom`, check constraint), `+ stamp_icon_preset`
  (default `'plate'`), `+ stamp_label` (default `'visitas até o
  prêmio'`).
- Nenhuma mudança de RLS necessária — as 2 tabelas já nascem com RLS +
  policy "owner full access" (0a), colunas novas herdam a mesma policy.

**Evidência:**
- Aplicada ao vivo via `apply_migration` no projeto de teste
  (hfqclbihfasnigitxpqj) — `{"success":true}`.
- `list_tables` pós-migration confirma as 6 colunas novas com os tipos/
  defaults/comments esperados.
- Idempotência testada: re-executado o mesmo SQL via `execute_sql` —
  sem erro (`"idempotent rerun ok"`).
- `get_advisors(security)` — mesmos 3 INFO de deny-all já documentados
  em 0a/0c (customers/otp_codes/customer_sessions) + 1 WARN pré-existente
  de "leaked password protection" (não relacionado a esta migration,
  não introduzido por ela). Nenhum problema novo.
- `npx tsc --noEmit` → 0 erros. `npx vitest run` → 31/31 (sem regressão
  — mudança é só de schema, nenhum código de aplicação ainda lê as
  colunas novas).

### Progresso — Sessão 3: estrutura do wizard (componente base, navegação, persistência) ✅ 2026-07-24

**O que foi feito:**
- Dependências novas: `zustand` (estado do wizard, conforme CLAUDE.md) e
  `zod` (validação de entrada externa nas Server Actions — CLAUDE.md
  exige em "toda entrada externa"; ainda não havia nenhum uso no
  dashboard, primeira vez que entra).
- `lib/wizard/steps.ts`: fonte única dos 8 passos (id 0-7 + título),
  `clampWizardStep`/`isValidWizardStep` — funções puras, testadas.
- `lib/wizard/store.ts`: Zustand store só com `step` + `restaurantId`
  (navegação). Dados de cada passo (nome, cor, design do card etc.)
  ficam no estado do próprio componente de passo, não aqui — decisão
  registrada no comentário do arquivo, relevante para a Sessão 4
  (`<CardPreview>`) e 5-7.
- `lib/wizard/actions.ts`: Server Action `advanceWizardStep` — zod
  valida `{restaurantId, step}`, `requireOwner` valida posse (mesmo
  helper usado em todo o dashboard), grava `restaurants.wizard_step`.
  Centraliza a checagem de posse para as Sessões 5-7 não repetirem.
- `components/wizard/Wizard.tsx` (client): shell com progresso
  (`WizardProgress`), navegação Voltar/Continuar, e um registro de
  componentes por passo (`STEP_COMPONENTS`) — hoje todos `null`
  (renderiza `WizardStepPlaceholder`); Sessões 5/6/7 substituem os 3
  primeiros. "Continuar" fica desabilitado sem `restaurantId` — é o
  Passo 1 (Sessão 5) quem cria o restaurante ao salvar, não existe o
  que persistir antes disso.
- `app/onboarding/page.tsx`: Server Component — busca o restaurante do
  owner autenticado com `wizard_completed_at is null` (retomar de onde
  parou); se não houver nenhum, `initialRestaurantId = null` (fluxo
  novo, aguardando o Passo 1). Rota já protegida pelo middleware
  existente (não está em `PUBLIC_PATHS`); `getUser()`+redirect mantido
  na própria página também, na mesma linha do checklist de segurança do
  CLAUDE.md.
- Gate de acesso ao dashboard só após `wizard_completed_at`
  (critério de aceite da spec) **não foi ligado ainda** — decisão
  deliberada: os Passos 3-7 não existem até a Sessão 12/13, ligar o gate
  agora deixaria qualquer dono preso no wizard sem conseguir sair. Fica
  para quando o wizard estiver completo (fora do escopo desta rodada,
  Sessões 8+).

**Evidência:**
- `npx tsc --noEmit` → 0 erros. `npx vitest run` →
  `Test Files 5 passed (5)`, `Tests 38 passed (38)` (31 anteriores + 7
  novos de `lib/wizard/steps.test.ts`).
- Verificado ao vivo via preview local: `GET /onboarding` sem sessão →
  redireciona para `/login` (200, tela renderiza), sem erro de
  compilação no servidor Next (`preview_logs` sem erros) — confirma que
  a rota nova compila e o middleware cobre corretamente o caminho
  novo. Conteúdo pós-login do wizard não verificado ao vivo pelo mesmo
  motivo já registrado na Sessão 1 (preencher senha do dono é ação de
  credencial bloqueada para automação).

### Progresso — Sessão 4: `<CardPreview>` reutilizável ✅ 2026-07-24

**O que foi feito:**
- `lib/wizard/stampIconPresets.ts`: presets de ícone de selo por
  categoria (Passo 1b) — `restaurante`/`bar`/`cafeteria`/`lanchonete`,
  ícones do `lucide-react` já instalado (conferidos um a um em
  `dynamicIconImports.js` antes de importar — lib não tem ícone de
  hambúrguer/taco nativo, `Beef`/`Drumstick` usados como aproximação,
  documentado no comentário do arquivo). `findStampIconPreset`/
  `presetsForSegment` são funções puras, testadas (7 casos).
- `components/CardPreview.tsx`: componente compartilhado (fora de
  `components/wizard/`, de propósito — vai ser consumido pela Web
  Wallet real, spec-019, não só pelo wizard). Props não dependem de
  nada específico do wizard: `totalStamps`/`currentStamps` são
  genéricos (marco ilustrativo no wizard, milestone real na wallet),
  `stampIcon` aceita preset OU URL customizada, `isVip` já no shape
  para quando a wallet precisar do badge. Rodapé "Feito com Remy"
  fixo, não é prop — CLAUDE.md: não é configurável pelo dono.
- Adicionado a `/dev/ui` (rota pública, dev-only) com toggle
  vazio/exemplo (3/5) + uma segunda instância mostrando o estado VIP —
  única forma de verificar visualmente sem depender de login (ver
  limitação registrada na Sessão 1).

**Evidência:**
- `npx tsc --noEmit` → 0 erros. `npx vitest run` →
  `Test Files 6 passed (6)`, `Tests 44 passed (44)` (38 anteriores + 6
  novos de `stampIconPresets.test.ts`).
- Verificado ao vivo via preview local em `/dev/ui`: `get_page_text`
  confirma as duas instâncias renderizando corretamente — card 1
  "Clube do Farrapos" em `0/5 visitas até o prêmio` (estado vazio,
  preset `plate`) e card 2 "Clube VIP" com badge `VIP` visível em
  `5/5 visitas até o prêmio` (preset `mug`, `textColor` customizado)
  — confirma que preset resolution, contagem de selos e o badge VIP
  condicional funcionam. `preview_logs` sem erros de servidor.

### Progresso — Sessão 5: Passo 1 — dados do restaurante + slug + preview ✅ 2026-07-24

**Refatoração necessária no shell (Sessão 3):** o `<Wizard>` genérico
tinha um botão "Continuar" único que só avançava o passo — não dava
para validar/salvar os dados de um passo real ali. Mudei para cada
passo controlar seu próprio submit (`WizardStepProps.onSaved`, em
`lib/wizard/types.ts`) — o shell só sabe navegar (Voltar) e trocar de
passo quando o passo avisa que salvou. `Wizard.tsx` e `store.ts`
ajustados (`setRestaurantId` novo).

**Infra nova (migration `20260724030000_wizard_step1_infra.sql`):**
- Bucket de Storage `restaurant-logos` (público, 2MB, jpg/png) —
  path `{owner_id}/logo-{timestamp}.ext`, escopado por **owner_id**
  (não restaurant_id) de propósito: o dono pode enviar a logo antes do
  restaurante existir (a linha só nasce quando o Passo 1 é salvo).
- `is_slug_available(check_slug, exclude_id)`: função `SECURITY
  DEFINER` — a policy de `restaurants` (0a) restringe SELECT ao
  próprio dono, então uma query direta reportaria "disponível" para
  slugs de OUTROS donos (falso positivo); a função expõe só um
  boolean, sem abrir uma policy de leitura ampla nem usar o service
  client (CLAUDE.md restringe a 3 lugares, este não seria um deles).
- **2 problemas achados pelo `get_advisors(security)` e corrigidos
  antes de seguir** (não estavam óbvios até rodar o advisor): (1) a
  policy de SELECT pública em `storage.objects` era desnecessária e
  permitia *listar* todos os arquivos do bucket (bucket público já
  serve por URL sem RLS) — removida; (2) `revoke ... from public` não
  bastou para tirar o acesso de `anon`/`authenticated` — o Supabase
  concede `EXECUTE` por default privileges na criação da função,
  precisou revogar de cada role explicitamente antes de conceder só a
  `authenticated`. Migration corrigida no arquivo E reaplicada no
  banco de teste antes de prosseguir.
- WARN aceito conscientemente (não é bug): `authenticated` pode
  executar uma função `SECURITY DEFINER` — intencional, é exatamente
  quem precisa chamá-la (o dono autenticado no wizard).

**Código:**
- `lib/slug.ts`: `slugify`/`isValidSlug`, funções puras testadas (9
  casos — acentos, pontuação, espaços/underscores repetidos, corte em
  60 chars).
- `lib/wizard/step1.ts`: Server Action `saveStep1` — zod valida,
  reconfere a disponibilidade do slug no banco (fonte de verdade, o
  debounce do cliente é só UX), cria OU atualiza `restaurants`
  (`.eq('owner_id', user.id)` + RLS como segunda camada), avança
  `wizard_step` para 1.
- `app/api/check-slug/route.ts`: `GET ?slug=&excludeId=` (conforme
  "Regras de implementação" da spec), usa a RPC acima.
- `components/wizard/Step1.tsx`: formulário completo — nome,
  categoria, endereço, cor (color picker), upload de logo (client-side
  direto pro Storage via `lib/supabase/client.ts`, valida tipo/tamanho
  antes de enviar), slug sugerido do nome (debounce 500ms, editável) +
  checagem de disponibilidade ao vivo (debounce 500ms), preview ao
  vivo com `<CardPreview>` (Sessão 4). Retomada: se `restaurantId` já
  existe, carrega os dados salvos ao montar.

**Evidência:**
- `npx tsc --noEmit` → 0 erros. `npx vitest run` →
  `Test Files 7 passed (7)`, `Tests 53 passed (53)` (44 anteriores + 9
  novos de `lib/slug.test.ts`).
- RPC testada ao vivo via `execute_sql`: slug já usado pelo seed
  (`sorveteria-da-vo-maria`) → `available = false`; slug livre →
  `true`; mesmo slug usado, mas excluindo o próprio id → `true`
  (confirma que editar o Passo 1 sem trocar de slug não se autobloqueia).
- `get_advisors(security)` pós-correção: só os 3 INFO de deny-all já
  documentados + o WARN aceito de `authenticated` na função + o WARN
  pré-existente de leaked password protection. Nenhum problema não
  documentado.
- Verificado ao vivo via preview local: `/onboarding` sem sessão →
  redireciona para `/login` (200) sem erro de compilação — confirma
  que `Step1.tsx` e suas dependências (Server Action, rota de API,
  upload client-side) compilam limpo no bundler do Next, não só no
  `tsc`. `/dev/ui` seguiu 200 sem regressão. Preencher o formulário do
  Passo 1 de ponta a ponta (upload de logo real, submit) não foi
  verificado ao vivo pelo mesmo motivo já registrado na Sessão 1
  (login bloqueado para automação).

### Progresso — Sessão 6: Passo 1b — design do card + upload + extração de cor ✅ 2026-07-24

**Infra nova (migration `20260724040000_wizard_step1b_infra.sql`):**
- Bucket de Storage `stamp-icons` (público, 200KB, só PNG). Diferente do
  `restaurant-logos` (Sessão 5), aqui o path é escopado por
  **restaurant_id** (não owner_id) — no Passo 1b o restaurante já existe
  (o Passo 1 já criou), então dá pra verificar posse real via subquery em
  `restaurants` (mesmo padrão de posse do resto do schema). Sem policy de
  SELECT, mesmo raciocínio documentado na migration da Sessão 5 (bucket
  público não precisa — só criaria uma forma de listar os arquivos).
  `get_advisors(security)` pós-aplicação: nenhum problema novo.

**Código:**
- `lib/wizard/color.ts`: `averageColorFromPixels`/`rgbToHex` — a
  matemática pura da "sugestão automática extraída da logo" (spec), 5
  casos testados (média de pixels sólidos, ignora pixels 100%
  transparentes, default quando tudo é transparente). A leitura de
  pixels em si (canvas + `Image`, só existe no DOM) fica no componente,
  não dá pra testar sem canvas real — mesma fronteira pura/IO já usada
  em `lib/otp/rules.ts` vs `lib/otp/index.ts`.
- `lib/wizard/step1b.ts`: Server Action `saveStep1b` — `requireOwner`
  (restaurante já existe neste passo, diferente do Passo 1), zod valida
  (inclui `refine`: preset OU URL customizada, nunca os dois vazios),
  `upsert` em `card_design_config` (`onConflict: restaurant_id`),
  avança `wizard_step` para 2.
- `components/wizard/Step1b.tsx`: cor de fundo (color picker + botão
  "Sugerir da logo", só aparece se houver logo do Passo 1), grade de
  presets de ícone por categoria (`lib/wizard/stampIconPresets.ts`,
  Sessão 4) + upload de PNG customizado, nome do programa (máx 30,
  contador visível, sugestão "Programa {nome}" pré-carregada), texto do
  contador, formato do código (QR/código de barras), aviso sobre
  diferenças entre wallets (texto fixo da spec), preview ao vivo com
  toggle vazio/exemplo via `<CardPreview>`. Retomada: carrega
  `card_design_config` existente ao montar, se houver.

**Evidência:**
- `npx tsc --noEmit` → 0 erros. `npx vitest run` →
  `Test Files 8 passed (8)`, `Tests 58 passed (58)` (53 anteriores + 5
  novos de `lib/wizard/color.test.ts`).
- Verificado ao vivo via preview local: `/onboarding` (sem sessão) e
  `/dev/ui` seguem 200 sem erro de compilação — confirma que
  `Step1b.tsx` e o novo Server Action compilam limpo no bundler do
  Next. Preenchimento completo do Passo 1b (upload de ícone real,
  extração de cor de uma logo real, submit) não verificado ao vivo pelo
  mesmo motivo da Sessão 1 (login bloqueado para automação).

---

### spec-023 — Cadastro do cliente (OTP-first) **[NOVA]**

**Por que segundo:** é a porta de entrada do cliente. Substitui a rota
`/w/[slug]` da branch abandonada. Consome a infra OTP (0c + hardening
2.0b — pré-requisito) e a lib Google Wallet (0d).

**Critérios de aceite:**
- [ ] Rota `[slug]/entrar`: telefone primeiro → OTP → verificado
- [ ] Tela de aceite (consentimento) IMEDIATAMENTE após OTP, ANTES dos
      campos pessoais — ver fluxo completo em CLAUDE.md
- [ ] Checkbox de aceite sem pré-marcação; botão "Continuar" desabilitado
      até marcar; texto do aceite é MASTER, não editável pelo restaurante
- [ ] Registro: `customer_programs.consent_accepted_at` + `consent_version`
- [ ] Sem aceite → sem cadastro, sem opção de pular
- [ ] Campos pós-aceite conforme form_fields_config do restaurante
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

### spec-011 — Remy Recompensas (motor)

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
[x] Data efetiva do reset do banco → 22/07/2026, registrado em CLAUDE.md v7
[ ] Política de Privacidade e Termos de Uso — textos ainda não escritos.
    Não bloqueia desenvolvimento (spec-023 usa placeholder), mas bloqueia
    qualquer piloto com cliente real
[ ] Nome de exibição do WhatsApp Business / perfil verificado, redes
    sociais @remy, Google Wallet issuer account name no Console — ativos
    fora do repositório, checklist operacional separado do PLAN.md
```

---

## Fora do roadmap atual

```
❌ Cashback R$ | ❌ Geolocalização | ❌ Campanhas manuais | ❌ Push
❌ Referral | ❌ Analytics avançado | ❌ Múltiplos programas | ❌ VIP configurável
❌ AI companion | ❌ iFood | ❌ Stone/MP | ❌ Cardápio por foto
❌ Retail media | ❌ wallet-service
```
