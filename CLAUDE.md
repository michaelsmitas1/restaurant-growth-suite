# Balcão — CLAUDE.md v5
# Gerado em 2026-07-22. Substitui todas as versões anteriores.
# Fonte de verdade para arquitetura, design e regras de desenvolvimento.
# Contexto: pós-VERIFY.md — reset limpo de schema aprovado, branch wip abandonada.

---

## O que é o Balcão

Plataforma de relacionamento para food businesses brasileiros.
Primeiro produto: Loyalty — programa de fidelidade digital.
A marca deve permitir expansão futura para CRM, IA, Campanhas e Insights.

Dois usuários com necessidades opostas:

**Dono do restaurante** — configura uma vez, acompanha pelo dashboard.
Não aprende software. O produto funciona sozinho.

**Cliente do restaurante** — escaneia QR, entra no programa, acumula selos.
Tudo pelo celular. Zero dependência de funcionário.

---

## Domínio e URLs

Produto: **app.balcao.ai** — Site institucional (futuro): balcao.ai

```
app.balcao.ai/[restaurant-slug]              Página pública do restaurante
app.balcao.ai/[restaurant-slug]/entrar       Cadastro do cliente (OTP-first)
app.balcao.ai/[restaurant-slug]/u/[uid]      Web Wallet do cliente
app.balcao.ai/[restaurant-slug]/display      QR rotativo (tablet do caixa)
app.balcao.ai/meus-lugares                   Portal do cliente (todos os restaurantes)
app.balcao.ai/scan                           Scanner do caixa
app.balcao.ai/login                          Login do dono
app.balcao.ai/(dashboard)/...                Dashboard do dono (protegido)
```

Todo QR aponta para essas URLs. Nunca para Railway. Nunca para rotas legadas (`/w/[slug]` não existe mais).

---

## Stack

```
Frontend:     Next.js 14 App Router — Vercel
Banco:        Supabase (PostgreSQL + RLS + Auth para o DONO apenas)
Wallet:       Google Wallet API (service account) + Apple Wallet (passkit-generator)
WhatsApp:     Evolution API via n8n (Railway)
SMS:          A definir (avaliar Twilio vs. provedores nacionais)
IA:           Claude API — Sonnet 4.6 (raciocínio) / Haiku (classificação)
Testes:       Vitest (unit/integration) + Playwright (e2e crítico)
CI:           GitHub Actions — tsc + testes em cada PR
State:        Zustand (wizard e fluxos multi-step) / React state (resto)
Validação:    Zod em toda entrada externa (forms, webhooks, API)
Design:       ui-ux-pro-max skill (global) + design-system/MASTER.md (repo)
```

---

## Arquitetura de autenticação — DOIS NÍVEIS (CRÍTICO)

Este é o conceito arquitetural mais importante do projeto. Dono e cliente
são tipos de usuário DIFERENTES com mecanismos de auth DIFERENTES.

### Nível 1 — Dono (Supabase Auth)

- Login via Supabase Auth (email/senha; Google OAuth opcional)
- `restaurants.owner_id uuid references auth.users(id)` é a âncora de posse
- Toda rota `(dashboard)/` protegida por `middleware.ts`
- Padrão obrigatório em TODA Server Action do dashboard:

```typescript
const { data: { user } } = await supabase.auth.getUser()
if (!user) throw new Error('Unauthorized')

const { data: restaurant } = await supabase
  .from('restaurants')
  .select('id')
  .eq('owner_id', user.id)
  .single()
if (!restaurant) throw new Error('Forbidden')
```

### Nível 2 — Cliente (OTP custom, NÃO usa Supabase Auth)

O cliente NÃO é um user do Supabase Auth. Motivos: OTP via WhatsApp é grátis
(Evolution API), phone auth do Supabase exige Twilio pago, e misturar os dois
tipos de usuário no mesmo pool cria complexidade de policies.

Fluxo:
```
Telefone → gera código → envia via WhatsApp (Evolution) ou SMS
  → cliente digita código → valida contra tabela otp_codes
  → cria sessão em customer_sessions → cookie httpOnly 30 dias
  → requests seguintes validam o cookie server-side
```

Tabelas de suporte (nascem no schema novo):
```sql
otp_codes         (phone, code, channel, expires_at, attempts, used)
customer_sessions (id, customer_id, token_hash, expires_at, created_at)
```

Regras:
- Toda rota/action do cliente valida a sessão via `lib/customerSession.ts`
- Após validar, queries filtram SEMPRE pelo `customer_id` da sessão
- `lib/customerSession.ts` é o ÚNICO lugar (além de googleWallet.ts e migrations)
  autorizado a usar `createServiceClient()` — e toda query nele deve ser
  escopada ao customer_id validado. Nunca queries abertas.
- OTP: máximo 3 tentativas por código, código expira em 5 minutos,
  rate limit de 3 códigos por telefone por hora

### Clientes Supabase

- `createServerClient()` — sessão do dono, respeita RLS. Pages e actions do dashboard.
- `createServiceClient()` — ignora RLS. APENAS: `lib/googleWallet.ts`,
  `lib/customerSession.ts` (escopado), migrations/seed.

---

## Arquitetura de banco — SCHEMA NOVO (pós-reset)

O banco foi resetado em [data do reset]. As migrations no repo são a única
história válida. Tabelas legadas (`loyalty_programs`, `customer_loyalty` antiga)
NÃO existem — não referenciar, não recriar.

Regras:
- Toda mudança de schema = migration em `supabase/migrations/`, idempotente
- Toda tabela nasce com RLS habilitado + policies NA MESMA migration
- Nunca alterar tabelas pelo dashboard do Supabase
- Seed de desenvolvimento: `supabase/seed.sql` — recriável a qualquer momento

Schema core do MVP 1 (nomes canônicos):
```
restaurants          (+ owner_id, slug, cores, google_place_id, redes sociais, wizard_step)
card_design_config   (design do card: cor, ícone, nome do programa, barcode)
loyalty_config       (acúmulo, bônus, modos de validação, automações, tom de voz)
loyalty_milestones   (marcos: selos necessários + recompensa)
form_fields_config   (campos do cadastro: visível/obrigatório)
customers            (phone único global, name, birthday, email — conta única por cliente)
customer_programs    (vínculo cliente↔restaurante: selos, VIP, última visita)
visits               (registro de cada visita: selos, valor, modo de validação usado)
redemptions          (resgates: milestone, data, validado por)
otp_codes            (auth do cliente)
customer_sessions    (sessões do cliente)
daily_passwords      (senha do dia por restaurante)
whatsapp_log         (automações enviadas: evento, mensagem, status)
```

Nota sobre conta única: `customers.phone` é único GLOBALMENTE (não por restaurante).
O vínculo com cada restaurante vive em `customer_programs`. Um cliente = uma conta,
N programas.

---

## Produto — MVP 1 (escopo ativo)

### Programa — Balcão Rewards
- Acúmulo: por visita (X selos) OU por valor (R$X = 1 selo, caixa digita)
- Milestones: até 3 marcos (selos + recompensa). Primeiro marco recomendado: 3ª visita
- Pós-último marco: VIP permanente surpresa (badge no card, sem config do dono)
- Nunca reinicia
- Bônus: cadastro (selos imediatos), dias fracos (2x), aniversário (multiplicador)

### Earn Actions MVP 1 (automáticas)
Cadastro → bônus | Review Google → selos após clique | Aniversário → multiplicador

### Validação de presença — 3 modos (combináveis)
```
Modo 1 — Scanner:      caixa escaneia QR do cliente
Modo 2 — Senha do dia: sistema gera palavra (gastronomia BR), válida X horas,
                       1x por cliente por período
Modo 3 — QR rotativo:  display mostra QR que muda a cada 3 min (HMAC + timestamp)
```
Resgate: SEMPRE via scanner. Geolocalização NÃO existe no produto.

### Cadastro do cliente (OTP-first)
```
Telefone → OTP (WhatsApp ou SMS, igualdade) → verificado
  → campos configuráveis pelo dono (nome/nascimento/email + consentimento)
  → bônus creditado → escolha de wallet → card salvo
```
Deduplicação: telefone já existente → login direto → vincula ao restaurante novo.

### Web Wallet — base do produto
Google e Apple Wallet são EXTENSÕES da Web Wallet.
Conteúdo: card com identidade do restaurante, progresso + caminho completo de
milestones, histórico, QR de resgate, botão "Estou aqui" (explica o modo do
restaurante), link de review, completar perfil. PWA instalável.
Portal `meus-lugares`: todos os restaurantes do cliente com saldos.

### Automações WhatsApp — 4 momentos (AI-native)
```
Boas-vindas (imediato) | Perto do prêmio (falta 1 selo)
Inativo (X dias, padrão 30) | Aniversário (5-7 dias antes + lembrete no dia)
```
Supabase webhook → n8n → Claude API (contexto: restaurante+cliente+evento+tom)
→ Evolution API → registro em whatsapp_log. Tom: Descontraído/Equilibrado/Formal.
Preview real no wizard.

### Wizard de onboarding — 8 passos (spec-010)
Restaurante → Design do card → Google Business/redes → Campos do cadastro
→ Programa → Modo de validação (recomendação por segmento) → Automações → Ativar (QRs)
Dono sai com QR ativo em < 10 minutos.

---

## Fora do MVP 1 — não implementar

```
❌ Cashback em R$ reais            ❌ Geolocalização
❌ Campanhas WhatsApp manuais      ❌ Push notifications
❌ Referral / follow Instagram     ❌ Analytics avançado
❌ Múltiplos programas por rest.   ❌ Níveis VIP configuráveis
❌ AI companion proativo           ❌ iFood / Stone / Mercado Pago
❌ Cardápio por foto               ❌ Gestão automática de reviews
❌ Retail media / cruzamento de bases entre restaurantes
❌ Qualquer feature do wallet-service legado
```

---

## Legado — regras de não-contato

- `apps/wallet-service/` — LEGADO. Não modificar, não referenciar. Desligar do
  Railway após spec-024 (OAuth Google Business no dashboard) entrar.
- Branch `wip/campanhas-clientes-templates-ui` — ABANDONADA (decisão 2026-07-22).
  Referência visual apenas. Não mergear, não portar código.
- Branch `spec-008-wallet-google` — fonte do PORT de `lib/googleWallet.ts`.
  A rota `/w/[slug]` dessa branch NÃO será portada (substituída por `[slug]/entrar`).
- Tabelas `loyalty_programs` / `customer_loyalty` — mortas no reset. Não recriar.

---

## Design System

### Personalidade
Simples. Inteligente. Próximo. Otimista. Confiável.
Nunca: burocrático, infantil, frio, exagerado, corporativo.
Regra principal: o restaurante é o protagonista. O Balcão é infraestrutura.

### Fonte de verdade visual
1. Tokens abaixo (definidos pelo branding — NÃO substituir pelos da skill)
2. `design-system/MASTER.md` — gerado pela ui-ux-pro-max na Fase 2, editado
   para usar os tokens do Balcão
3. `design-system/pages/[nome].md` — overrides por página

### Design Tokens

```css
:root {
  /* Brand */
  --color-ink: #10244A;
  --color-ink-hover: #0B1935;
  --color-ink-soft: #29436F;
  /* Backgrounds */
  --color-background: #F3F7FF;
  --color-background-blue: #E9F1FF;
  --color-background-warm: #FAF8F4;
  --color-surface: #FFFFFF;
  --color-surface-hover: #F8FAFD;
  --color-surface-selected: #EDF4FF;
  /* Brand blue */
  --color-brand-blue: #397DE8;
  --color-brand-blue-hover: #286BD2;
  --color-brand-blue-soft: #D9E8FF;
  --color-brand-blue-subtle: #F0F6FF;
  /* Text */
  --color-text-primary: #10244A;
  --color-text-secondary: #5F708C;
  --color-text-muted: #8D9AAF;
  --color-text-inverse: #FFFFFF;
  /* Borders */
  --color-border: #DDE5F0;
  --color-border-strong: #C4D0E0;
  --color-border-focus: #397DE8;
  /* Semantic */
  --color-info: #397DE8;
  --color-info-soft: #E5F0FF;
  --color-success: #249B61;
  --color-success-soft: #E6F6EE;
  --color-warning: #D98A16;
  --color-warning-soft: #FFF3D9;
  --color-error: #D94A4A;
  --color-error-soft: #FDEAEA;
  /* Celebration */
  --color-celebration: #FFB82E;
  --color-celebration-hover: #F2A817;
  --color-celebration-soft: #FFF2CC;
  /* Typography */
  --font-display: "Manrope", sans-serif;
  --font-body: "Manrope", sans-serif;
  --font-data: "IBM Plex Mono", monospace;
  --font-regular: 400;
  --font-medium: 500;
  --font-semibold: 600;
  --font-bold: 700;
  /* Radius */
  --radius-xs: 6px;
  --radius-sm: 10px;
  --radius-md: 12px;
  --radius-lg: 16px;
  --radius-xl: 20px;
  --radius-2xl: 24px;
  --radius-full: 999px;
  /* Spacing — grid 8px */
  --space-1: 4px;  --space-2: 8px;   --space-3: 12px;  --space-4: 16px;
  --space-5: 20px; --space-6: 24px;  --space-8: 32px;  --space-10: 40px;
  --space-12: 48px; --space-16: 64px; --space-20: 80px; --space-24: 96px;
  /* Shadows */
  --shadow-sm: 0 2px 8px rgba(16, 36, 74, 0.05);
  --shadow-md: 0 8px 24px rgba(16, 36, 74, 0.08);
  --shadow-lg: 0 18px 48px rgba(16, 36, 74, 0.12);
  /* Motion */
  --duration-fast: 150ms;
  --duration-normal: 220ms;
  --duration-slow: 320ms;
  --ease-standard: cubic-bezier(0.2, 0, 0, 1);
}
```

### Uso por componente
```css
.dashboard-card, .metric-card  { border-radius: var(--radius-lg);  box-shadow: var(--shadow-sm); }
.input, .select                { border-radius: var(--radius-sm);  border: 1px solid var(--color-border); }
.button-primary                { border-radius: var(--radius-sm);  background: var(--color-brand-blue); }
.button-full                   { border-radius: var(--radius-full); }
.dropdown, .table-container    { border-radius: var(--radius-md);  box-shadow: var(--shadow-md); }
.ai-insight-card, .celebration-card { border-radius: var(--radius-xl); background: var(--color-celebration-soft); }
.wallet-card                   { border-radius: var(--radius-2xl); box-shadow: var(--shadow-lg); }
```
Nunca hardcoded. Sempre `var(--token)`.

### Dois contextos visuais

**Dashboard do dono** `(dashboard)/`: background `--color-background`, surface
branca, Soft UI (referências Zentra/Toast), densidade média, desktop primário,
números em `--font-data`. Cada tela responde: o que aconteceu, por quê, o que fazer.

**Consumidor** `[slug]/`, `u/[uid]/`, `meus-lugares/`, `scan/`: cor do restaurante
como hero (wallet), `--color-background-warm` (cadastro), Flat mobile-first,
uma ação por tela, `max-width: 390px`, `100dvh`, touch targets ≥ 44px,
`inputMode` correto, sem hover como única indicação.

### Regras visuais
Uma ação principal por tela. Espaço > linhas. Ícones outline. Ilustrações só em
onboarding/celebração. Motion: fast (micro), normal (transição), slow (entrada),
sempre `--ease-standard`. Erros explicam + próximo passo. Empty states ensinam.
Sucesso discreto: "Boa! Mais um cliente voltou."

---

## Linguagem e voz

| Contexto | Tom |
|---|---|
| Dashboard | Objetivo |
| Wallet / consumidor | Leve |
| WhatsApp | Configurado pelo dono (3 opções) |
| IA | Consultiva — resume, sugere. Nunca decide. |
| Erros | Direto — o que houve + próximo passo |

Evitar: sinergia, alavancar, ecossistema, transformação digital, disruptivo, omnichannel.

---

## Testes e CI

- Vitest para lógica de negócio: motor de selos, milestones, VIP, OTP, senha do dia,
  validação HMAC do QR rotativo. Todo motor tem teste ANTES do merge.
- Playwright para os 2 fluxos críticos e2e: cadastro do cliente completo e
  wizard completo (podem ser adicionados no fim da Fase 2).
- GitHub Actions em todo PR: `tsc --noEmit` + `vitest run`. PR não mergeia com falha.

---

## Segurança — checklist pré-commit

- [ ] Nenhuma rota do dashboard sem sessão do dono
- [ ] Nenhuma Server Action sem `getUser()` + validação de posse
- [ ] Nenhuma rota do cliente sem validação de `customerSession`
- [ ] Service client apenas nos 3 lugares autorizados
- [ ] Toda migration com RLS + policies
- [ ] Zod em toda entrada externa
- [ ] Nenhum segredo em código
- [ ] QRs apontam para app.balcao.ai
- [ ] `tsc --noEmit` e testes passam

---

## Regras de desenvolvimento

Uma sessão = uma tarefa = critérios de aceite verificáveis.
Nunca misturar duas specs na mesma sessão.
Toda feature nova precisa de spec antes de implementar.
Schema drift é proibido — banco muda só por migration.
TypeScript strict. Sem `as any`. Sem `@ts-ignore`.
Evidência, não afirmação — mostrar output de teste, não "implementei X".

---

## Variáveis de ambiente

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_KEY=            # apenas googleWallet.ts, customerSession.ts, migrations
GOOGLE_APPLICATION_CREDENTIALS=
GOOGLE_WALLET_ISSUER_ID=
GOOGLE_PLACES_API_KEY=
APPLE_PASS_TYPE_ID=
APPLE_TEAM_ID=
APPLE_CERT_PATH=
EVOLUTION_API_URL=
EVOLUTION_API_KEY=
SMS_PROVIDER_API_KEY=            # a definir
CUSTOMER_SESSION_SECRET=         # assinatura de sessões do cliente
ROTATING_QR_SECRET=              # HMAC do QR rotativo
ANTHROPIC_API_KEY=
NEXT_PUBLIC_APP_URL=https://app.balcao.ai
```
