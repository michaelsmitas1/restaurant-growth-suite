# Design System Master File — Remy

> **LOGIC:** When building a specific page, first check `design-system/pages/[page-name].md`.
> If that file exists, its rules **override** this Master file.
> If not, strictly follow the rules below.

---

**Project:** Remy
**Generated:** 2026-07-23 (ui-ux-pro-max `--design-system`, projeto "Remy")
**Categoria/paleta sugeridas pela skill:** Airline / vermelho-mostarda "apetitoso"
(pattern "Waitlist/Coming Soon", tipografia Playfair Display SC + Karla) —
**descartadas nesta edição.** CLAUDE.md é a fonte de verdade de branding e
vence sempre sobre qualquer sugestão de skill (regra do CLAUDE.md, seção
"Fonte de verdade visual"). O que sobrevive da geração automática abaixo é
a ESTRUTURA (specs de componente, states, checklist de UX/acessibilidade),
não os valores de cor/fonte.

---

## Global Rules

### Color Palette — tokens do CLAUDE.md (não os da skill)

Paleta oficial do rebrand: azul royal, branco papel, amarelo fosco.

| Role | Hex | CSS Variable |
|------|-----|--------------|
| Brand — Azul Royal | `#1B3EA4` | `--color-royal-blue` |
| Brand hover | `#142F7D` | `--color-royal-blue-hover` |
| Brand soft | `#D6E0F5` | `--color-royal-blue-soft` |
| Brand subtle | `#EEF2FB` | `--color-royal-blue-subtle` |
| Ink (texto/heading) | `#12224F` | `--color-ink` |
| Ink hover | `#0C1938` | `--color-ink-hover` |
| Ink soft | `#3A4A73` | `--color-ink-soft` |
| Background — Papel | `#FAF9F7` | `--color-paper` |
| Surface | `#FFFFFF` | `--color-surface` |
| Surface hover | `#F5F4F1` | `--color-surface-hover` |
| Surface selected | `#EEF2FB` | `--color-surface-selected` |
| Accent — Amarelo Fosco | `#E1C463` | `--color-matte-yellow` |
| Accent hover | `#CBB050` | `--color-matte-yellow-hover` |
| Accent soft | `#F7EFD6` | `--color-matte-yellow-soft` |
| Text primary | `#12224F` | `--color-text-primary` |
| Text secondary | `#5B6786` | `--color-text-secondary` |
| Text muted | `#8D96AC` | `--color-text-muted` |
| Text inverse | `#FFFFFF` | `--color-text-inverse` |
| Border | `#E3DFD8` | `--color-border` |
| Border strong | `#C7C1B6` | `--color-border-strong` |
| Border focus | `#1B3EA4` | `--color-border-focus` |
| Info | `#1B3EA4` | `--color-info` |
| Success | `#23895E` | `--color-success` |
| Warning | `#B8863A` | `--color-warning` |
| Error | `#C24B4B` | `--color-error` |
| Celebration | `#E1C463` | `--color-celebration` |

Cada cor "soft"/"subtle" tem par de fundo claro (`-soft`) já listado no
bloco CSS completo em `globals.css` (copiado do CLAUDE.md, seção Design
Tokens — não duplicar valores à mão em componentes).

### Typography — tokens do CLAUDE.md (não os da skill)

- **Display + Body:** Manrope (`next/font/google`, pesos 400/500/600/700)
- **Dados/números:** IBM Plex Mono (`--font-data`) — usado em métricas do
  dashboard, valores monetários, contadores de selos
- Carregamento via `next/font/google` em `layout.tsx` (não `@import` CSS —
  evita FOUC e respeita otimização do Next.js)

```ts
import { Manrope, IBM_Plex_Mono } from 'next/font/google';

const manrope = Manrope({
  subsets: ['latin'],
  variable: '--font-manrope',
  display: 'swap',
});

const plexMono = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-plex-mono',
  display: 'swap',
});
```

### Spacing — grid de 8px (CLAUDE.md)

| Token | Value | Usage |
|-------|-------|-------|
| `--space-1` | `4px` | Gaps mínimos (ícone+label) |
| `--space-2` | `8px` | Inline spacing |
| `--space-3` | `12px` | Padding interno compacto |
| `--space-4` | `16px` | Padding padrão de componente |
| `--space-5` | `20px` | — |
| `--space-6` | `24px` | Padding de card |
| `--space-8` | `32px` | Gaps de seção |
| `--space-10` | `40px` | — |
| `--space-12` | `48px` | Margens de seção |
| `--space-16` | `64px` | — |
| `--space-20` | `80px` | — |
| `--space-24` | `96px` | Hero / topo de página |

### Radius (CLAUDE.md)

| Token | Value | Usage |
|-------|-------|-------|
| `--radius-xs` | `6px` | — |
| `--radius-sm` | `10px` | Input, Select, Button |
| `--radius-md` | `12px` | Dropdown, tabela |
| `--radius-lg` | `16px` | Card, metric card |
| `--radius-xl` | `20px` | AI insight card, celebration card |
| `--radius-2xl` | `24px` | Wallet card |
| `--radius-full` | `999px` | Button full, badge, toggle |

### Shadows (CLAUDE.md — rgba baseado no ink novo)

| Level | Value | Usage |
|-------|-------|-------|
| `--shadow-sm` | `0 2px 8px rgba(18, 34, 79, 0.05)` | Card, metric card |
| `--shadow-md` | `0 8px 24px rgba(18, 34, 79, 0.08)` | Dropdown, tabela |
| `--shadow-lg` | `0 18px 48px rgba(18, 34, 79, 0.12)` | Wallet card |

### Motion (CLAUDE.md)

| Token | Value | Usage |
|-------|-------|-------|
| `--duration-fast` | `150ms` | Micro-interações (hover, foco) |
| `--duration-normal` | `220ms` | Transições de estado |
| `--duration-slow` | `320ms` | Entrada de elementos |
| `--ease-standard` | `cubic-bezier(0.2, 0, 0, 1)` | Todas as transições |

`prefers-reduced-motion` deve ser respeitado em qualquer animação
decorativa (herdado do checklist de UX da skill — ver Anti-Patterns).

---

## Dois contextos visuais (CLAUDE.md)

Todo componente abaixo tem que funcionar nos dois contextos; specs
indicam onde o valor muda entre eles.

**Dashboard do dono** (`(dashboard)/`): fundo `--color-paper`, superfícies
`--color-surface`, Soft UI, densidade média, desktop primário, números em
`--font-data`.

**Consumidor** (`[slug]/`, `u/[uid]/`, `meus-lugares/`, `scan/`): cor do
restaurante como hero (wallet), `--color-paper` como base neutra
(cadastro/aceite), Flat mobile-first, `max-width: 390px`, `100dvh`, touch
targets ≥ 44px, uma ação por tela.

---

## Component Specs

Formato de spec: Default → Hover → Active/Focus → Disabled.

### Button

| Variant | Default | Hover | Active/Focus | Disabled |
|---|---|---|---|---|
| Primary | bg `--color-royal-blue`, texto `--color-text-inverse`, radius `--radius-sm` (full no consumidor) | bg `--color-royal-blue-hover` | anel `--color-border-focus` 3px, `translateY(-1px)` | bg `--color-text-muted`, sem hover |
| Secondary | transparente, borda `--color-border-strong`, texto `--color-text-primary` | bg `--color-surface-hover` | anel `--color-border-focus` | texto `--color-text-muted` |
| Celebration | bg `--color-celebration`, texto `--color-ink` | bg `--color-celebration-hover` | anel `--color-matte-yellow-hover` | — |

Transição: `all var(--duration-fast) var(--ease-standard)`. Touch target
mínimo 44×44px no contexto consumidor. `cursor: pointer` sempre.

### Input

| State | Spec |
|---|---|
| Default | borda `--color-border`, radius `--radius-sm`, padding `--space-3` `--space-4`, fonte 16px (evita zoom automático em iOS) |
| Focus | borda `--color-border-focus`, anel `0 0 0 3px var(--color-royal-blue-subtle)` |
| Error | borda `--color-error`, texto de erro abaixo do campo em `--color-error` (nunca só no topo do form) |
| Disabled | bg `--color-surface-hover`, texto `--color-text-muted` |

`inputMode` correto por tipo de campo (telefone, numérico) no contexto
consumidor — regra do CLAUDE.md.

### Card

| Context | Spec |
|---|---|
| Dashboard (`.dashboard-card`, `.metric-card`) | radius `--radius-lg`, shadow `--shadow-sm`, bg `--color-surface` |
| Dropdown/tabela | radius `--radius-md`, shadow `--shadow-md` |
| AI insight / celebration | radius `--radius-xl`, bg `--color-celebration-soft` |
| Wallet | radius `--radius-2xl`, shadow `--shadow-lg` |

Hover (dashboard apenas — consumidor não depende de hover):
`box-shadow: var(--shadow-md); transform: translateY(-2px);` transição
`var(--duration-normal)`.

### Badge

- Radius `--radius-full`, padding `--space-1` `--space-3`, fonte 12–13px semibold
- Variantes semânticas: info (`--color-info-soft` / `--color-info`),
  success (`--color-success-soft` / `--color-success`), warning, error —
  mesma lógica bg-soft + texto-forte
- VIP/celebration: bg `--color-celebration-soft`, texto `--color-ink`

### Toggle

- Trilho: radius `--radius-full`, largura fixa; off = `--color-border-strong`,
  on = `--color-royal-blue`
- Thumb: branco, `box-shadow: var(--shadow-sm)`, transição
  `transform var(--duration-fast) var(--ease-standard)`
- Foco visível: anel `--color-border-focus` no trilho, nunca remover
  outline sem substituto (regra de acessibilidade)

### Select

- Mesma spec visual do Input (radius `--radius-sm`, borda `--color-border`)
- Ícone chevron outline (Lucide), nunca emoji
- Dropdown aberto: `--radius-md` + `--shadow-md`, opção selecionada com
  bg `--color-surface-selected`

### Tela de aceite/consentimento (base compartilhada com spec-023)

- Um único CTA por tela ("Continuar"), desabilitado até o checkbox de
  aceite ser marcado — nunca pré-marcado
- Checkbox usa a mesma spec de foco/contraste do Toggle
- Links de Política de Privacidade/Termos abrem em nova aba, sublinhados,
  cor `--color-royal-blue`
- Contexto consumidor: fundo `--color-paper`, `max-width: 390px`, uma ação

---

## Anti-Patterns (herdado do checklist de UX da skill — continua válido
independente da paleta)

- ❌ Emoji como ícone — sempre SVG outline (Lucide, consistente com
  "Ícones outline" do CLAUDE.md)
- ❌ Elemento clicável sem `cursor: pointer`
- ❌ Mudança de estado instantânea (0ms) — sempre transição 150–320ms
  (`--duration-fast/normal/slow`)
- ❌ Contraste de texto abaixo de 4.5:1
- ❌ Foco de teclado invisível (nunca remover outline sem substituto)
- ❌ Hover como única indicação de interatividade no contexto consumidor
  (mobile não tem hover)
- ❌ Scroll horizontal em mobile
- ❌ Categoria/paleta/pattern sugeridos pela skill (Airline, vermelho,
  Playfair Display SC, "Waitlist/Coming Soon") — substituídos nesta edição

---

## Pre-Delivery Checklist

- [ ] Nenhuma cor hardcoded — sempre `var(--token)`
- [ ] Ícones outline consistentes (Lucide), nunca emoji
- [ ] `cursor: pointer` em todo elemento clicável
- [ ] Estados de hover/focus com transição 150–320ms
- [ ] Contraste mínimo 4.5:1 (texto) em `--color-paper` e `--color-surface`
- [ ] Foco visível em navegação por teclado
- [ ] `prefers-reduced-motion` respeitado
- [ ] Touch target ≥ 44×44px no contexto consumidor
- [ ] Responsivo: 375px, 768px, 1024px, 1440px
- [ ] Sem scroll horizontal em mobile
