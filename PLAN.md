# Balcão — PLAN.md v4
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
Fase 0 — Fundação (reset + auth + port)   🔴 EM ANDAMENTO
Fase 2 — MVP 1                            ⏸️  BLOQUEADA (aguarda Fase 0)
Fase 3 — Paralela                         🔵 DESBLOQUEADA (independente)
```

Nota: a antiga "Fase 1 (merge spec-008)" foi absorvida pela Fase 0 —
decisão D4 de 2026-07-22: portar a lib, não mergear a branch.

---

## Decisões que moldaram este plano (2026-07-22)

```
D1 ✅ Domínio: app.balcao.ai (produto) + balcao.ai (site futuro)
D2 ✅ Branch wip/campanhas abandonada — referência visual apenas
D3 ✅ Reset limpo do banco de teste — migrations reescritas do zero
D4 ✅ spec-008: portar lib/googleWallet.ts, não mergear a branch
D5 ✅ OAuth Google de teste revogado; integração por restaurante = spec-024
D6 ✅ RLS resolvido pelo reset (toda migration nasce com RLS + policies)
```

---

## 🔴 FASE 0 — Fundação

> Pré-requisito de tudo. Sem remendos: o schema nasce certo.

### 0a. Reset do banco + schema novo completo

**Contexto:** banco 100% teste (VERIFY.md). 6 migrations aplicadas sem arquivo
no repo. Tabelas legadas serão substituídas. Janela única para história limpa.

**Critérios de aceite:**
- [ ] Backup lógico do banco atual salvo localmente (segurança, não será usado)
- [ ] Banco de teste dropado/resetado
- [ ] Migrations novas do zero, numeradas, idempotentes, cobrindo o schema
      canônico do CLAUDE.md: restaurants (expandida), card_design_config,
      loyalty_config, loyalty_milestones, form_fields_config, customers
      (phone único global), customer_programs, visits, redemptions,
      otp_codes, customer_sessions, daily_passwords, whatsapp_log
- [ ] TODA tabela com RLS habilitado + policies NA MESMA migration
- [ ] `supabase db push` em ambiente limpo sobe sem erros
- [ ] `supabase/seed.sql` recria dados de desenvolvimento (1 restaurante,
      ~10 clientes, visitas, 1 programa configurado)
- [ ] `tsc --noEmit` passa

---

### 0b. Auth do dono — middleware + posse

**Critérios de aceite:**
- [ ] `middleware.ts` protege todas as rotas `(dashboard)/`
- [ ] Sem sessão → redirect `/login`
- [ ] Toda Server Action: `getUser()` + validação de posse via `owner_id`
- [ ] `createServerClient()` (anon + sessão) em todas as pages/actions do dashboard
- [ ] `SUPABASE_SERVICE_KEY` apenas nos 3 lugares autorizados
- [ ] `next.config.js`: `allowedOrigins` restrito ao domínio
- [ ] `tsc --noEmit` passa

---

### 0c. Auth do cliente — infraestrutura OTP + sessão

**Contexto:** base do Nível 2 de auth (CLAUDE.md). Consumida pelas specs
023 (cadastro), 019 (web wallet) e 022 (senha do dia).

**Critérios de aceite:**
- [ ] `lib/customerSession.ts`: criar sessão, validar cookie, revogar
- [ ] Envio de OTP via Evolution API (WhatsApp) funcional
- [ ] Envio de OTP via SMS: interface pronta, provider stub (definir provider depois)
- [ ] Regras: código 6 dígitos, expira 5 min, máx 3 tentativas,
      rate limit 3 códigos/telefone/hora
- [ ] Cookie httpOnly assinado, 30 dias
- [ ] Testes Vitest: geração, expiração, tentativas, rate limit
- [ ] `tsc --noEmit` passa

---

### 0d. Port da lib Google Wallet

**Contexto:** `lib/googleWallet.ts` da branch spec-008 é a peça mais bem
construída do audit. Portar para main adaptada ao schema novo
(customer_programs em vez de customers.current_stamps).

**Critérios de aceite:**
- [ ] `lib/googleWallet.ts` em main: getAccessToken, ensureLoyaltyClass,
      ensureLoyaltyObject, patchLoyaltyObjectStamps, buildSaveToWalletUrl
- [ ] Adaptada ao schema novo (selos vêm de customer_programs)
- [ ] IDs determinísticos, tratamento 404/409, erros sanitizados
- [ ] Teste de integração com credenciais reais (classe criada, object gerado)
- [ ] Screenshot do fluxo será feito na rota nova (spec-023) — critério movido
- [ ] `tsc --noEmit` passa

---

### 0e. Setup de testes + CI

**Critérios de aceite:**
- [ ] Vitest configurado, primeiro teste rodando (pode ser dos itens 0c/0d)
- [ ] GitHub Actions: `tsc --noEmit` + `vitest run` em todo PR
- [ ] PR com falha não mergeia (branch protection em main)
- [ ] Badge de status no README (opcional)

---

### 0f. Limpeza de referências legadas

**Critérios de aceite:**
- [ ] Zero referências a URLs do Railway no dashboard
- [ ] Zero referências a `/w/[slug]` em código
- [ ] Zero referências a `loyalty_programs`/`customer_loyalty` (schema velho)
- [ ] `NEXT_PUBLIC_APP_URL` = https://app.balcao.ai em todos os ambientes
- [ ] Domínio app.balcao.ai configurado no Vercel
- [ ] `tsc --noEmit` passa

---

## 🟢 FASE 2 — MVP 1

> Ordem por dependência real. Cada spec consome o que a anterior entrega.

### 2.0 Design System — MASTER.md

**Contexto:** gerar a fonte de consistência visual antes da primeira tela.

**Critérios de aceite:**
- [ ] Rodar ui-ux-pro-max: `search.py "restaurant loyalty program dashboard
      brazilian" --design-system -p "Balcão" --persist`
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

### spec-011 — Balcão Rewards (motor)

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
