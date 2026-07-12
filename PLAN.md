# PLAN.md — Balcão
> Índice de specs + estado do desenvolvimento. Atualizado pelo pm-weekly (sexta 17h), lido pelo backlog-worker (domingo) e nightly-builder (diário 02h).
> Última atualização: Julho 2026 · v2.1 — estado auditado contra o repositório

---

## Estado

```
SPEC ATIVA (nightly-builder):  001 — Memory Store
SPEC DIURNA (/loop):           008 — Wallet ponta a ponta (Google-first) — verificado de ponta a ponta com dados reais (banco só tem dado de teste); só falta screenshot em Android físico
BLOQUEIOS:                     008 aguarda só a evidência em device Android físico (docs/evidencias/008/) — todo o resto passou com credenciais reais e dado de teste
DECISÃO PENDENTE:              LoyaltyEngine (014) antes de qualquer spec de loyalty · rate limiting real no /w/[slug] (restaurant_id já resolvido só via slug, mas sem rate limit — ver specs/008-wallet-passkit.md → Aprendizados)
```

🔴 **BLOQUEADOR PRÉ-PILOTO:** RLS desabilitado em 8 tabelas (`restaurants`, `customers`, `visits`, `reviews`, `campaigns`, `loyalty_programs`, `message_templates`, `customer_loyalty`) + dashboard sem auth middleware. Deve ser resolvido ANTES do primeiro restaurante real ser cadastrado — não antes disso, mas obrigatório antes disso. Sem data fixa, mas é gate de lançamento, não item de backlog solto.

---

## ⚠ Correção de estado — auditoria Jul 2026

A versão anterior listava o Wallet como "construído e funcionando". **Auditoria revelou: é esqueleto** (rotas e UI existem; o fluxo passkit ponta a ponta — QR → pass no celular → carimbo → atualização — nunca rodou). Corrigido: Wallet virou spec 008.

**Regra nova:** nada entra em "Entregue" sem critério de aceite verificado. O pm-weekly audita alegações de estado contra o repositório, não contra documentos.

---

## Como este arquivo funciona

Cada linha aponta para uma spec em `specs/`. A spec é a fonte de verdade — este arquivo é índice e status. O nightly-builder só trabalha na SPEC ATIVA. O founder pode rodar `/loop [NNN]` de dia em qualquer spec ⏳ pronta (padrão: a SPEC DIURNA). Hipótese de negócio enfraquecida → spec vinculada vira ⚠ e sai da fila.

---

## Onda 1 — Núcleo AI-native + Wallet real

| # | Spec | Hipótese/insight | Status |
|---|---|---|---|
| 001 | [Memory Store por restaurante](specs/001-memory-store.md) | fundação do agente | 🔄 ativa (nightly) |
| 002 | [AI Companion — cadência proativa](specs/002-companion-cadence.md) | H7 | ⏳ pronta |
| 003 | [Cardápio por foto](specs/003-menu-vision.md) | H2 | ⏳ pronta |
| 004 | [Onboarding automático Google Maps](specs/004-onboarding-auto.md) | H2 | ⏳ pronta |
| 008 | [Wallet ponta a ponta — Google-first](specs/008-wallet-passkit.md) | H5 + insight validado: captura iniciada pelo cliente via QR | 🔄 diurna (/loop) |

## Onda 2 — Dados reais e integrações

| # | Spec | Hipótese | Status |
|---|---|---|---|
| 005 | iFood integration (sandbox validado, discrepâncias documentadas) | canal de captura de dados | 🔒 aguardando acesso completo (4–8 sem) |
| 006 | Outcome Grader — rubrics versionadas | H1 | 📝 escrever |
| 007 | Feedback-schema — instrumentação do closed loop | closed loop | 📝 escrever (schema base já na 001) |
| 009 | Stone/MP OAuth read-only | H1-fin | 📝 escrever · ⚠ OAuth = risco de capacidade, Plano B conversacional obrigatório na spec |
| 010 | DRE automático | H3 | 🔒 depende de 009 |

## Onda 3 — Inteligência

| # | Spec | Hipótese | Status |
|---|---|---|---|
| 011 | Margem por prato | H3 | 🔒 depende de 003 + 009/dados |
| 012 | Foto de NF → purchase-history | H3 | ⏳ pronta p/ spec |
| 013 | AI Prospecting (Maps → score → WhatsApp) | H8 | 📝 escrever |

## Onda 4 — Escala e refatoração

| # | Spec | Hipótese | Status |
|---|---|---|---|
| 014 | LoyaltyEngine unificado | dívida técnica | ⚠ bloqueia VIP/Resgate |
| 015 | VIP + Resgate | H5 | 🔒 depende de 014 |
| 016 | packages/types compartilhado | dívida técnica | ⏳ |
| 017 | Mini-site balcao.app/[slug] | — | ⏳ |
| 018 | Apple Wallet (fase 2 da 008) | H5 | 🔒 depende de 008 + Apple Dev account |

---

## Legenda

`🔄 ativa/diurna` · `⏳ pronta` (spec completa, aguardando vez) · `📝 escrever` · `🔒 bloqueada` · `⚠ revisar/risco` · `✅ entregue (critérios verificados)`

---

## Entregue — estado real auditado

- ✅ Auth + onboarding básico de restaurante
- ✅ Reviews Google: OAuth, leitura, resposta via Claude
- ✅ /clientes (busca, ordenação, quick actions) + ClienteDrawer
- ✅ Dashboard acionável + templates com tokens
- ✅ Campanhas manuais com segmentação e filtro de inativos
- ✅ Loyalty pontos/cashback (lógica e tabelas — sem resgate, sem VIP)
- ✅ n8n + Evolution API no Railway
- ◐ Wallet: **esqueleto apenas** → spec 008

---

## Hipóteses de negócio

| # | Hipótese | Sinal atual |
|---|---|---|
| H1 | Dono usa respostas de review sem editar | não testada |
| H2 | Onboarding automático <6 min funciona p/ ICP | não testada |
| H3 | DRE real desde semana 1 é o maior diferencial na demo | não testada |
| H4 | Dono paga R$199+/mês após 30 dias grátis | não testada |
| H5 | Reativação WhatsApp ≥10% dos inativos | não testada |
| H6 | Nota Google sobe ≥0,2 em 60 dias | não testada |
| H7 | Dono interage com Companion ≥3x/semana | não testada |
| H8 | Demo presencial converte ≥3x mais que digital | não testada |
| ✔ | Captura dependente de staff falha (turnover) → QR customer-initiated é o padrão | **validada — entrevista 1 (grupo multi-unidade)** |

---

## Aprendizados

- Jul 2026 · **Routines na nuvem leem o GitHub, não o disco local.** Infra spec-driven ficou 5 dias sem push e as routines rodaram em vazio — corretamente: recusaram inventar backlog e não tocaram código. Gates validados em produção · sistema
- Jul 2026 · **Documentação de estado divergia da realidade** (Wallet "pronto" era esqueleto). Regra: Entregue exige critério verificado; pm-weekly audita contra o repo · PLAN
- Jul 2026 · Spec 005 (iFood): monetários em reais não centavos, ack payload difere da doc, 202 ≠ confirmado, UTF-8 double-encoding — validar sempre contra sandbox · 005
- Jun 2026 · OAuth flows exigem engenharia real · 009 com Plano B obrigatório
- Jun 2026 · LoyaltyEngine sem interface unificada bloqueia VIP · 014

*Índice apenas. A verdade de cada feature está na spec.*
