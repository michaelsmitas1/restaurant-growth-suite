# Remy — CLAUDE.md v7
# Gerado em 2026-07-23. Substitui todas as versões anteriores.
# Contexto: rebrand Balcão → Remy (domínio remy.app.br) + Fase 0 concluída
# (0a-0f, ver PLAN.md para evidência de execução). Paleta visual corrigida
# nesta versão — v6 tinha só o nome trocado, tokens antigos permaneciam.

---

## O que é o Remy

Plataforma de relacionamento para food businesses brasileiros.
Primeiro produto: Loyalty — programa de fidelidade digital.
A marca permite expansão futura para CRM, Campanhas, Insights e IA
(arquitetura: Remy Loyalty, Remy Campaigns, Remy Insights, Remy AI —
não lançar subdivisões agora, mas nomear com essa lógica quando chegar).

Dois usuários com necessidades opostas:

**Dono do restaurante** — configura uma vez, acompanha pelo dashboard.
Não aprende software. O produto funciona basicamente sozinho.

**Cliente do restaurante** — escaneia QR, entra no programa, acumula selos.
Tudo pelo celular. Baixa dependência de funcionário.

Princípio central: **Remy sugere e simplifica; o estabelecimento decide
e mantém a relação com o cliente.** Isso vale para toda decisão de produto,
copy e comportamento de IA — não é só um slogan.

---

## Domínio e URLs

Produto: **remy.app.br** — Site institucional (futuro): a definir

```
remy.app.br/[restaurant-slug]              Página pública do restaurante
remy.app.br/[restaurant-slug]/entrar       Cadastro do cliente (OTP-first)
remy.app.br/[restaurant-slug]/u/[uid]      Web Wallet do cliente
remy.app.br/[restaurant-slug]/display      QR rotativo (tablet do caixa)
remy.app.br/meus-lugares                   Portal do cliente (todos os restaurantes)
remy.app.br/scan                           Scanner do caixa
remy.app.br/login                          Login do dono
remy.app.br/(dashboard)/...                Dashboard do dono (protegido)
```

Todo QR aponta para essas URLs. Nunca para Railway. Nunca para rotas legadas
(`/w/[slug]` não existe mais).

---

## Stack

```
Frontend:     Next.js 14 App Router — Vercel
Banco:        Supabase (PostgreSQL + RLS + Auth para o DONO apenas)
Wallet:       Google Wallet API (service account) + Apple Wallet (passkit-generator)
WhatsApp:     Evolution API via n8n (Railway) — instância: ver EVOLUTION_INSTANCE
SMS:          A definir (decisão aberta, ver PLAN.md)
IA:           Claude API — Sonnet 4.6 (raciocínio) / Haiku (classificação)
Testes:       Vitest (unit/integration) + Playwright (e2e crítico)
CI:           GitHub Actions — tsc + testes em cada PR (branch protection em main)
State:        Zustand (wizard e fluxos multi-step) / React state (resto)
Validação:    Zod em toda entrada externa (forms, webhooks, API)
Design:       ui-ux-pro-max (decisão de direção) + Impeccable (polimento/crítica)
              — ver "Skills de design" abaixo
```

---

## Arquitetura de autenticação — DOIS NÍVEIS (CRÍTICO)

Dono e cliente são tipos de usuário DIFERENTES com mecanismos de auth
DIFERENTES. Implementado e verificado na Fase 0 (0b, 0c).

### Nível 1 — Dono (Supabase Auth)

- Login via Supabase Auth (email/senha; Google OAuth opcional)
- `restaurants.owner_id uuid references auth.users(id)` é a âncora de posse
- `middleware.ts` (`lib/supabase/middleware.ts` → `updateSession`) protege
  toda rota exceto `/login` e `/auth/callback`
- Helper obrigatório em toda Server Action: `lib/auth/requireOwner.ts`

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

**Atenção Fase 2:** quando as rotas do cliente (`[slug]/`, `/scan`, etc.)
forem criadas, o matcher do middleware precisa ser revisado para não
bloquear o Nível 2 — hoje ele cobre "tudo exceto /login", o que vai
capturar rotas públicas por engano se não for ajustado antes do merge
da spec-023.

### Nível 2 — Cliente (OTP custom, NÃO usa Supabase Auth)

Fluxo:
```
Telefone → gera código → envia via WhatsApp (Evolution) ou SMS
  → cliente digita código → valida contra tabela otp_codes
  → cria sessão em customer_sessions → cookie httpOnly 30 dias
    (nome do cookie: remy_customer_session)
  → requests seguintes validam o cookie server-side
```

**Por que custom e não Supabase Auth (decisão D11, não relitigar):**
Supabase phone auth só fala SMS pago (Twilio etc., ~R$0,25–0,50/verificação);
WhatsApp via Evolution é grátis e é o canal do Brasil. O privilégio da
sessão do cliente é baixíssimo (vê os próprios selos, edita o próprio
perfil; resgate exige scanner físico) — o dado valioso está atrás do
Supabase Auth do dono. Misturar os dois pools em auth.users complicaria
toda policy RLS para sempre.

Regras (implementadas em `lib/otp/rules.ts`, testadas):
- Código de 6 dígitos, expira em 5 minutos
- Máximo 3 tentativas por código
- Rate limit: 3 códigos por telefone por hora
- Cookie assinado com HMAC-SHA256 (`CUSTOMER_SESSION_SECRET`)

Hardening obrigatório (task 2.0b — fechar ANTES da spec-023 consumir):
- Código OTP salvo como HASH no banco, nunca texto plano
- Comparação de código em tempo constante (`crypto.timingSafeEqual`)
- Sliding expiry: a cada validação, se a última rotação > 24h, rotacionar
  o token da sessão e reemitir o cookie (token roubado não vale 30 dias)
- Limpeza embutida: ao inserir novo código/sessão, deletar expirados do
  mesmo telefone/cliente (sem cron)
- Regra uid↔sessão: em `/[slug]/u/[uid]`, o `customer_id` da sessão TEM
  que ser igual ao `uid` da URL — divergência = 403, sem exceção
- Multi-dispositivo permitido: N sessões ativas por cliente (uma linha
  por sessão em `customer_sessions`); logout revoga só a sessão atual

`lib/customerSession.ts` é o ÚNICO lugar (além de `googleWallet.ts` e
migrations) autorizado a usar `createServiceClient()` — toda query nele
é escopada ao `customer_id`/`token_hash` validado. Nunca queries abertas.

`otp_codes`, `customers` e `customer_sessions` nascem com **deny-all**
policy (RLS habilitado, zero policy) — acesso só passa por
`lib/customerSession.ts`. Isso é intencional, documentar em qualquer
migration que toque essas tabelas.

### Clientes Supabase

- `createServerClient()` — anon key + sessão do dono, respeita RLS.
  Usar em TODAS as pages e actions do dashboard.
- `createServiceClient()` — ignora RLS. APENAS: `lib/googleWallet.ts`,
  `lib/customerSession.ts` (escopado), migrations/seed.

---

## Arquitetura de banco — SCHEMA NOVO (pós-reset de 2026-07-22)

O banco foi resetado em 22/07/2026 (11 tabelas legadas dropadas, backup
lógico salvo fora do repo). As migrations em `supabase/migrations/`
(20260722010000–20260722010600) são a única história válida.

Regras:
- Toda mudança de schema = migration idempotente
- Toda tabela nasce com RLS habilitado + policies (ou deny-all documentado)
  NA MESMA migration
- Nunca alterar tabelas pelo dashboard do Supabase
- `supabase/seed.sql` recria dados de desenvolvimento a qualquer momento

Schema core do MVP 1 (13 tabelas, nomes canônicos):
```
restaurants          (+ owner_id, slug, cores, google_place_id, redes sociais, wizard_step)
card_design_config   (design do card: cor, ícone, nome do programa, barcode)
loyalty_config       (acúmulo, bônus, modos de validação, automações, tom de voz)
loyalty_milestones   (marcos: selos necessários + recompensa)
form_fields_config   (campos do cadastro: visível/obrigatório)
customers            (phone único global, name, birthday, email — conta única, deny-all)
customer_programs    (vínculo cliente↔restaurante: selos, VIP, última visita)
visits               (registro de cada visita: selos, valor, modo de validação usado)
redemptions          (resgates: milestone, data, validado por)
otp_codes            (auth do cliente, deny-all)
customer_sessions    (sessões do cliente, deny-all)
daily_passwords      (senha do dia por restaurante)
whatsapp_log         (automações enviadas: evento, mensagem, status)
```

Nota sobre conta única: `customers.phone` é único GLOBALMENTE. O vínculo
com cada restaurante vive em `customer_programs`. Um cliente = uma conta,
N programas.

**Risco conhecido, não bloqueante:** as páginas legadas em
`app/restaurante/[id]/{avaliacoes,campanhas,clientes,configuracoes,wallet}`
consultam tabelas dropadas no reset (`reviews`, `campaigns`,
`customers.restaurant_id`) e quebram em runtime até serem reconstruídas
na Fase 2 (spec-010/2.9) ou removidas. `tsc` não pega isso — sem tipos
gerados do banco. Tratar como prioridade de limpeza no início da Fase 2,
antes de qualquer demo com usuário real.

---

## Produto — MVP 1 (escopo ativo)

### Programa — Remy Recompensas
- Acúmulo: por visita (X selos) OU por valor (R$X = 1 selo, caixa digita)
- Milestones: até 3 marcos (selos + recompensa). Primeiro marco recomendado: 3ª visita
- Pós-último marco: VIP permanente surpresa (badge no card, sem config do dono)
- Nunca reinicia
- Bônus: cadastro (selos imediatos), dias fracos (2x), aniversário (multiplicador)

Nota de nomenclatura: "Remy Recompensas" é o nome do MECANISMO/produto (como
"Starbucks Rewards"), não um nome forçado para todo restaurante. Cada
dono configura o NOME do PRÓPRIO programa no wizard (ex: "Clube do
Farrapos"), com sugestão padrão "Programa [Nome do Restaurante]". A marca
Remy aparece discreta via "Feito com Remy" (ver seção de Design System).

### Earn Actions MVP 1 (automáticas)
Cadastro → bônus | Review Google → selos após clique | Aniversário → multiplicador

### Validação de presença — 3 modos (combináveis)
```
Modo 1 — Scanner:      caixa escaneia QR do cliente
Modo 2 — Senha do dia: sistema gera palavra (do mundo da gastronomia BR), válida X horas,
                       1x por cliente por período
Modo 3 — QR rotativo:  display mostra QR que muda a cada 3 min (HMAC + timestamp)
```
Resgate: SEMPRE via scanner. Geolocalização NÃO existe no produto.

### Cadastro do cliente (OTP-first) + consentimento

```
Telefone → OTP (WhatsApp ou SMS, igualdade) → verificado
  → tela de aceite (ver "Fluxo de consentimento" abaixo)
  → campos configuráveis pelo dono (nome/nascimento/email)
  → bônus creditado → escolha de wallet → card salvo
```
Deduplicação: telefone já existente → login direto → vincula ao restaurante novo
(cria `customer_programs`, nunca duplica `customers`).

#### Fluxo de consentimento (LGPD) — recomendado

O aceite é uma etapa própria, não uma checkbox perdida no formulário.
Acontece IMEDIATAMENTE após a verificação OTP e ANTES de qualquer campo
pessoal ser exibido — o cliente já provou posse do telefone, mas ainda
não deu nenhum dado adicional.

```
Tela de aceite (uma ação, sem distração):

  "Antes de continuar"

  [nome do restaurante] usa o Remy para gerenciar seu programa
  de fidelidade. Isso significa que:

  • Seus dados (nome, telefone e o que mais você compartilhar)
    ficam com [nome do restaurante] e com o Remy, que faz o
    programa funcionar.
  • Você recebe mensagens do restaurante pelo WhatsApp
    (novidades do seu progresso, nunca spam).
  • Você pode sair quando quiser — apagamos seus dados a pedido.

  [Link: Política de Privacidade]   [Link: Termos de Uso]

  ( ) Li e aceito para continuar        ← obrigatório, sem pré-marcado
  [Botão: Continuar]  — desabilitado até o checkbox marcado
```

Regras de implementação:
- Registro do aceite: `customer_programs.consent_accepted_at` (timestamp)
  + `consent_version` (referencia qual versão do texto foi aceita —
  necessário para re-consentimento se o texto mudar)
- Texto do aceite é MASTER (não editável pelo restaurante) — o restaurante
  configura CAMPOS do formulário (Passo 3 do wizard), não os termos legais
- Sem aceite → sem cadastro. Não é opcional, não tem "pular"
- Linguagem: direta, sem jurês. Nada de "outorga", "anuência". Segue a
  seção "Linguagem e voz" abaixo
- Política de Privacidade e Termos de Uso: documentos próprios, ainda
  não escritos — bloqueador antes do piloto real (não do desenvolvimento)

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
Preview real no wizard. **Sem assinatura "Feito com Remy" nas mensagens** —
a mensagem é do restaurante, não da Remy (ver Design System).

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
- Branch `wip/campanhas-clientes-templates-ui` — ABANDONADA. Referência
  visual apenas. Não mergear, não portar código.
- Branch `spec-008-wallet-google` — já portada (0d): `lib/googleWallet.ts`
  vive em main, adaptada ao schema novo. A branch em si não será mergeada.
- Tabelas legadas (`loyalty_programs`, `customer_loyalty` antiga,
  `reviews`, `campaigns`, `user_restaurants`, etc.) — dropadas no reset
  de 22/07/2026. Não recriar.
- Páginas legadas em `app/restaurante/[id]/*` — quebradas em runtime
  (ver seção de banco acima). Não corrigir com patches — reconstruir na
  Fase 2 sobre o schema novo, ou remover se obsoletas.

---

## Design System

### Personalidade
Simples. Inteligente. Próximo. Otimista. Confiável.
Mais leve e positiva que antes do rebrand — sem virar infantil.
Nunca: burocrático, infantil, frio, exagerado, corporativo, mascote,
chatbot com nome próprio de personagem.

Regra principal: o restaurante é o protagonista. O Remy é infraestrutura
que aparece discreta, nunca compete visualmente com a marca do cliente.

### Assinatura "Feito com Remy"

```
Web Wallet do cliente:     footer discreto, sempre visível
Google/Apple Wallet:       campo issuerName/organizationName = "Remy"
                            (o nome do PROGRAMA, configurado pelo dono,
                            é o que aparece em destaque no card — Remy
                            aparece no campo de emissor, papel de infra)
WhatsApp automações:       SEM assinatura — a mensagem é do restaurante
Dashboard do dono:         footer discreto (rodapé, não header)
Página pública [slug]:     footer discreto
```

### Papel da IA — regra de tom

A IA é integrada ao produto para explicar, sugerir e preparar ações.
NUNCA funciona como personagem ou assistente com identidade própria.

```
✅ "Remy encontrou 3 clientes prontos para voltar"
✅ "Remy sugere ativar o bônus de aniversário — restaurantes parecidos
    tiveram mais retorno com isso"
✅ Usado como sujeito de uma ação do sistema, sempre em 3ª pessoa

❌ Avatar, ícone de personagem, emoji fixo representando "o Remy"
❌ "Oi! Eu sou o Remy 👋" — primeira pessoa, tom de chat persona
❌ Qualquer forma de personificação que sugira presença/consciência
```

A regra de fundo não mudou: **Remy sugere; o dono decide.** A IA nunca
executa uma ação irreversível sem confirmação do dono — isso é regra de
produto, não só de copy.

### Fonte de verdade visual
1. Tokens abaixo (definidos pelo branding — nunca substituir pelos
   sugeridos pelas skills de design)
2. `design-system/MASTER.md` — gerado na Fase 2 (task 2.0), editado para
   usar os tokens do Remy
3. `design-system/pages/[nome].md` — overrides por página

### Design Tokens

Paleta oficial do rebrand: azul royal `#1B3EA4`, branco papel `#FAF9F7`,
amarelo fosco `#E1C463`. Cascata completa derivada abaixo.

```css
:root {
  /* Brand — Azul Royal */
  --color-royal-blue: #1B3EA4;
  --color-royal-blue-hover: #142F7D;
  --color-royal-blue-soft: #D6E0F5;
  --color-royal-blue-subtle: #EEF2FB;

  /* Ink — derivado do azul, não preto puro */
  --color-ink: #12224F;
  --color-ink-hover: #0C1938;
  --color-ink-soft: #3A4A73;

  /* Backgrounds — Branco Papel */
  --color-paper: #FAF9F7;
  --color-surface: #FFFFFF;
  --color-surface-hover: #F5F4F1;
  --color-surface-selected: #EEF2FB;

  /* Accent — Amarelo Fosco */
  --color-matte-yellow: #E1C463;
  --color-matte-yellow-hover: #CBB050;
  --color-matte-yellow-soft: #F7EFD6;
  --color-matte-yellow-subtle: #FBF6E9;

  /* Text */
  --color-text-primary: #12224F;
  --color-text-secondary: #5B6786;
  --color-text-muted: #8D96AC;
  --color-text-inverse: #FFFFFF;

  /* Borders — tom quente, combina com paper */
  --color-border: #E3DFD8;
  --color-border-strong: #C7C1B6;
  --color-border-focus: #1B3EA4;

  /* Semantic */
  --color-info: #1B3EA4;
  --color-info-soft: #EEF2FB;
  --color-success: #23895E;
  --color-success-soft: #E4F4EC;
  --color-warning: #B8863A;
  --color-warning-soft: #FBF0DC;
  --color-error: #C24B4B;
  --color-error-soft: #FBEAEA;

  /* Celebration — o amarelo fosco é a cor de celebração */
  --color-celebration: #E1C463;
  --color-celebration-hover: #CBB050;
  --color-celebration-soft: #F7EFD6;

  /* Typography — inalterada pelo rebrand (logo é lettering
     proprietário separado, tipografia de produto continua) */
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

  /* Shadows — rgba baseado no ink novo */
  --shadow-sm: 0 2px 8px rgba(18, 34, 79, 0.05);
  --shadow-md: 0 8px 24px rgba(18, 34, 79, 0.08);
  --shadow-lg: 0 18px 48px rgba(18, 34, 79, 0.12);

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
.button-primary                { border-radius: var(--radius-sm);  background: var(--color-royal-blue); }
.button-full                   { border-radius: var(--radius-full); }
.dropdown, .table-container    { border-radius: var(--radius-md);  box-shadow: var(--shadow-md); }
.ai-insight-card, .celebration-card { border-radius: var(--radius-xl); background: var(--color-celebration-soft); }
.wallet-card                   { border-radius: var(--radius-2xl); box-shadow: var(--shadow-lg); }
```
Nunca hardcoded. Sempre `var(--token)`.

### Skills de design — hierarquia (evitar conflito)

Três skills opinativas de UI foram instaladas ao longo do projeto
(ui-ux-pro-max, Impeccable, Taste). Rodar as três com igual autoridade
na mesma sessão produz decisões inconsistentes entre telas.

```
1. ui-ux-pro-max  → decisão INICIAL de direção (estilo/layout por tipo
                     de página). Configurada com os tokens deste arquivo.
2. Impeccable      → camada de polimento/crítica (/polish, /critique,
                     /audit) após a primeira versão existir.
3. Taste            → MANTER INSTALADA MAS INATIVA nesta fase. Redundante
                     com Impeccable; ativar só se Impeccable não resolver
                     um caso específico.
```
Nunca invocar mais de uma skill de design na mesma sessão de UI.

### Dois contextos visuais

**Dashboard do dono** `(dashboard)/`: background `--color-paper`, surface
`--color-surface`, Soft UI (referências Zentra/Toast), densidade média,
desktop primário, números em `--font-data`. Cada tela responde: o que
aconteceu, por quê, o que fazer.

**Consumidor** `[slug]/`, `u/[uid]/`, `meus-lugares/`, `scan/`: cor do
restaurante como hero (wallet), `--color-paper` como base neutra
(cadastro, aceite), Flat mobile-first, uma ação por tela,
`max-width: 390px`, `100dvh`, touch targets ≥ 44px, `inputMode` correto,
sem hover como única indicação.

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
| WhatsApp | Configurado pelo dono (3 opções), sem assinatura Remy |
| IA | Consultiva, 3ª pessoa — sugere, nunca decide, nunca personagem |
| Erros | Direto — o que houve + próximo passo |
| Aceite/consentimento | Direto, sem jurês — ver fluxo de consentimento |

Evitar: sinergia, alavancar, ecossistema, transformação digital, disruptivo,
omnichannel. E, específico do rebrand: qualquer linguagem que personifique
o Remy como personagem, mascote ou chef.

---

## Testes e CI

- Vitest para lógica de negócio: motor de selos, milestones, VIP, OTP, senha do dia,
  validação HMAC do QR rotativo, aceite de consentimento. Todo motor tem teste
  ANTES do merge.
- Playwright para os 2 fluxos críticos e2e: cadastro do cliente completo
  (incluindo tela de aceite) e wizard completo.
- GitHub Actions em todo PR: `tsc --noEmit` + `vitest run`. PR não mergeia
  com falha (branch protection pendente de configurar em main — ver PLAN.md).

---

## Segurança — checklist pré-commit

- [ ] Nenhuma rota do dashboard sem sessão do dono
- [ ] Nenhuma Server Action sem `getUser()` + validação de posse
- [ ] Nenhuma rota do cliente sem validação de `customerSession`
- [ ] Service client apenas nos 3 lugares autorizados
- [ ] Toda migration com RLS + policies (ou deny-all documentado)
- [ ] Zod em toda entrada externa
- [ ] Nenhum segredo em código
- [ ] QRs apontam para remy.app.br
- [ ] Consentimento registrado (`consent_accepted_at` + `consent_version`)
      antes de qualquer dado pessoal ser persistido
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
EVOLUTION_INSTANCE=              # nome da instância WhatsApp (rebrand aplicado em 0c)
SMS_PROVIDER_API_KEY=            # a definir
CUSTOMER_SESSION_SECRET=         # assinatura de sessões do cliente (cookie remy_customer_session)
ROTATING_QR_SECRET=              # HMAC do QR rotativo
ANTHROPIC_API_KEY=
NEXT_PUBLIC_APP_URL=https://remy.app.br
```
