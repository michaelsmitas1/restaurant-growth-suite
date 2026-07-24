# spec-010 — Wizard de Onboarding
# Status: [ ] Não iniciado
# Criado em: 2026-07-23 (o arquivo nunca existia — só o resumo em PLAN.md)
# Prioridade: PRIMEIRA da Fase 2 — desbloqueia todas as outras specs
# Depende de: Fase 0 completa (✅), limpeza das páginas legadas quebradas

---

## Pré-requisito antes de iniciar

✅ Fechado em 2026-07-23 (PLAN.md, task 2.0c). As páginas legadas em
`app/restaurante/[id]/{avaliacoes,campanhas,clientes,configuracoes,wallet}`
consultavam tabelas dropadas no reset de 22/07/2026 e quebravam em
runtime — viraram `redirect('/')`, sem patch (serão substituídas pelo
wizard e pelo dashboard 2.9).

⚠️ Achado durante a limpeza, fora do escopo listado acima:
`app/restaurante/[id]/page.tsx` (a página-índice) também quebra em
runtime pelo mesmo motivo (`reviews`, `campaigns`,
`customers.restaurant_id`) e não foi tocada. Resolver antes do Passo 1
desta spec ou como parte dela — provavelmente substituída pela mesma
tela que o wizard/dashboard 2.9 vão introduzir.

---

## Contexto

O dono chega ao Remy sem nenhuma configuração prévia. O wizard é a única
forma de criar um restaurante, configurar um programa e gerar o QR. Sem
o wizard, não há piloto possível.

O dono deve sair do wizard com:
- Restaurante configurado
- Card do programa com identidade visual do estabelecimento
- Programa de fidelidade ativo
- QR de cadastro + QR de visita prontos para imprimir
- Automações de WhatsApp configuradas

Tempo esperado: menos de 10 minutos.

Assinatura "Feito com Remy": aparece discreta no footer do card e da
página pública — não é configurável pelo dono (ver CLAUDE.md, Design
System). O wizard não pergunta sobre isso.

---

## Fluxo completo (8 passos)

### Passo 1 — Dados do restaurante

Campos:
- Nome do restaurante (obrigatório)
- Categoria (select: Bar, Restaurante, Cafeteria, Lanchonete, Outro)
- Endereço completo (obrigatório)
- Logo (upload — JPG/PNG, máx 2MB)
- Cor principal (color picker — usada no card do cliente)
- Slug (gerado do nome, editável; preview: `remy.app.br/farrapos`)

Comportamento:
- Slug sugerido ao digitar o nome (debounce 500ms), disponibilidade
  verificada em tempo real
- Preview do card do cliente atualiza ao vivo com logo e cor

---

### Passo 1b — Design do card

Explicação: "É assim que seus clientes vão ver o cartão de fidelidade
no celular."

Preview ao vivo em dois estados (alternável): vazio (0 selos) e exemplo
(3 de 5 selos preenchidos).

**Cor de fundo:** color picker, sugestão automática extraída da logo.
**Ícone do selo:** presets por categoria (prato/talher/chef/carne para
restaurante; caneca/taça/drinque para bar; xícara/grão/gelado para
cafeteria; hambúrguer/pizza/sanduíche/taco para lanchonete) ou upload
customizado (PNG transparente, máx 200KB, 64×64px).
**Nome do programa:** texto livre, máx 30 chars. Sugestão: "Programa
[Nome do Restaurante]". Este é o nome QUE APARECE em destaque — Remy
aparece só no footer discreto e no campo issuerName da wallet nativa.
**Texto do contador:** padrão "visitas até o prêmio", editável.
**Formato do código:** QR Code (recomendado) ou código de barras.

Constraint documentada inline para o dono: "Seu cartão pode aparecer
levemente diferente no Google Wallet e Apple Wallet por limitações
dessas plataformas. Na versão web é idêntico ao preview."

---

### Passo 2 — Conexão com Google e redes sociais

Campos:
- Link do Google Business + botão "Verificar" (Places API confirma
  nome/endereço/categoria/foto, salva `google_place_id`)
- Link de review (gerado automaticamente se conectado, editável)
- Instagram, Facebook, TikTok, Site (todos opcionais)

Pode pular direto para o Passo 3 sem preencher redes sociais.

---

### Passo 3 — Campos do cadastro do cliente

Explicação: "Quais informações você quer pedir quando um cliente entrar
no programa?"

Campos configuráveis (toggle visível + toggle obrigatório):
- Nome completo (padrão: visível + obrigatório)
- Data de nascimento (padrão: visível + obrigatório)
- Email (padrão: visível + opcional)

Telefone: sempre coletado, não aparece aqui (identificador único, já
verificado por OTP antes desses campos).

Nota informativa (não editável): "Antes desses campos, o Remy pede o
aceite dos termos ao seu cliente — isso já vem pronto e não precisa
configurar." (Referência ao fluxo de consentimento da spec-023.)

Comportamento: preview do formulário atualiza ao vivo.

---

### Passo 4 — Configuração do programa

**Tipo de acúmulo (escolha um):**
```
○ Por visita (recomendado): X selos por visita
○ Por valor: R$X gasto = 1 selo (caixa digita no scanner)
```

**Bônus de cadastro:** toggle + quantidade de selos.
**Milestones (até 3):** selos necessários + descrição da recompensa
(texto livre). Recomendação inline: "Primeiro marco em 3 visitas mantém
o cliente engajado." Preview de linha do tempo visual.
**Bônus opcionais:** dobro em dias da semana selecionados; multiplicador
de aniversário (padrão 3x).

Nota informativa: "Depois do último marco, seus clientes mais fiéis
ganham um status VIP automático — isso já vem configurado."

---

### Passo 5 — Modo de validação de visita

Explicação: "Como seus clientes vão registrar que estão no restaurante?"
Recomendação automática exibida com base na categoria do Passo 1.

```
☐ Modo 1 — Scanner pelo caixa
  Controle total, rastreável. Depende do funcionário estar disponível.
  Recomendado para: pagamento no caixa.

☐ Modo 2 — Senha do dia
  Sistema gera uma palavra-chave automaticamente. Você compartilha com
  os clientes (WhatsApp, placa, à mesa). Sem hardware.
  → configuração de validade (1h–24h, padrão 6h)

☐ Modo 3 — QR rotativo ⚠️ requer tablet/display/celular do funcionário
  Um display mostra um QR que muda a cada 3 minutos. Infalível contra
  fraude, zero dependência de funcionário depois de configurado.
  → exibe link do display + instruções
```

Modos podem ser combinados. Resgate: sempre via scanner, independente
do modo de crédito.

---

### Passo 6 — Automações WhatsApp

Explicação: "O Remy envia mensagens automáticas para seus clientes.
Você escolhe quais ativar." (As mensagens saem em nome do restaurante,
sem assinatura Remy.)

Toggles por momento (Boas-vindas, Perto do prêmio, Inativo [config. de
dias], Aniversário) + tom de voz (Descontraído / Equilibrado / Formal)
com preview gerado por chamada real ao Claude API usando o nome do
restaurante e as recompensas configuradas.

---

### Passo 7 — Ativar

Resumo read-only de tudo configurado, com link para editar cada passo.

QR codes gerados:
- QR 1 — Cadastro: `remy.app.br/[slug]/entrar`
- QR 2 — Visita: `remy.app.br/[slug]` (visível se Modo 2 ou 3 ativo)

Ações: baixar cada QR (PNG 1000×1000), baixar PDF A4 combinado, copiar
link do display (se Modo 3), botão "Ir para o dashboard" (conclui).

---

## Persistência do estado do wizard

- Salvo a cada passo em `restaurants.wizard_step` (0–7) +
  `restaurants.wizard_completed_at` (null até concluir)
- Dono pode sair e voltar de onde parou
- Dashboard só acessível após `wizard_completed_at` preenchido

---

## Schema necessário (migrations novas sobre o schema pós-reset)

`restaurants` já existe com owner_id/slug/cores/redes sociais/wizard_step
(criada em 0a) — confirmar que os campos abaixo estão cobertos, senão
adicionar via migration:
```sql
google_place_id         text
google_review_link      text
social_instagram        text
social_facebook         text
social_tiktok           text
social_website          text
```

`card_design_config` (já existe no schema de 0a — confirmar colunas):
```sql
id                      uuid primary key default gen_random_uuid()
restaurant_id           uuid references restaurants(id) not null unique
color_background        text
stamp_icon_type         text default 'preset'  -- 'preset' | 'custom'
stamp_icon_preset       text default 'plate'
stamp_icon_custom_url   text
program_name            text
stamp_label             text default 'visitas até o prêmio'
barcode_format          text default 'qr'
created_at              timestamptz default now()
updated_at              timestamptz default now()
```

`loyalty_config` (já existe — confirmar colunas):
```sql
id                       uuid primary key default gen_random_uuid()
restaurant_id            uuid references restaurants(id) not null
accumulation_type        text check (accumulation_type in ('visit','value'))
accumulation_value       int default 1
welcome_bonus            int default 0
double_points_days       int[] default '{}'
birthday_multiplier      int default 3
validation_modes         text[] default '{scanner}'
time_lock_hours          int default 6
password_expiry_hours    int default 6
whatsapp_welcome         boolean default true
whatsapp_near_prize      boolean default true
whatsapp_inactive        boolean default true
whatsapp_inactive_days   int default 30
whatsapp_birthday        boolean default true
voice_tone               text check (voice_tone in ('casual','balanced','formal')) default 'balanced'
created_at               timestamptz default now()
updated_at               timestamptz default now()
```

`loyalty_milestones` e `form_fields_config`: já existem no schema de 0a
com o formato descrito no CLAUDE.md. Confirmar via `list_tables` antes
de escrever qualquer migration nova — não duplicar o que já existe.

---

## Regras de implementação

- Wizard: componente `<Wizard>`, estado via Zustand
- Cada passo: `components/wizard/Step[N].tsx`
- Preview do card: componente `<CardPreview>` compartilhado com a Web
  Wallet (spec-019) — implementar uma vez, reusar
- Preview de WhatsApp: `POST /api/preview-message` → Claude API → string
- QR codes: biblioteca `qrcode`
- PDF de impressão: `jsPDF`, client-side
- Upload de logo/ícone: Supabase Storage, buckets `restaurant-logos` e
  `stamp-icons`, públicos
- Slug disponível: `GET /api/check-slug?slug=farrapos`
- Google Business: `POST /api/verify-google-business` (server-side,
  usa `GOOGLE_PLACES_API_KEY`)
- Skills de design ativas: ui-ux-pro-max (direção) + Impeccable
  (polimento) — ver CLAUDE.md, "Skills de design"

---

## Critérios de aceite completos

- [x] Páginas legadas quebradas removidas ou redirecionadas (pré-requisito)
      — feito em 2026-07-23 (PLAN.md, task 2.0c): as 5 subrotas viram
      `redirect('/')`. `app/restaurante/[id]/page.tsx` (índice), que
      ficou de fora do escopo de 2.0c, foi corrigida na Sessão 1
      (2026-07-24, ver PLAN.md) — reescrita contra o schema real
      (`customer_programs`/`visits`/`redemptions`/`loyalty_config`),
      sem nenhuma query a `reviews`/`campaigns`.
- [ ] Passo 1: dados salvos, slug único, preview ao vivo
- [ ] Passo 1b: design do card salvo em `card_design_config`, preview
      nos 2 estados, `<CardPreview>` compartilhado com Web Wallet
- [ ] Passo 2: Google Business via Places API, link de review salvo
- [ ] Passo 3: campos salvos em `form_fields_config`, nota sobre aceite
      visível
- [ ] Passo 4: programa salvo em `loyalty_config` + `loyalty_milestones`
- [ ] Passo 5: modos de validação salvos, recomendação por categoria
- [ ] Passo 6: toggles e tom salvos, preview real via Claude API
- [ ] Passo 7: QRs gerados corretamente, PDF funcional
- [ ] Estado persistido: sair e voltar mantém progresso
- [ ] Dashboard só acessível após `wizard_completed_at`
- [ ] Todas as migrations idempotentes, RLS confirmado
- [ ] Mobile-first: wizard funciona no celular do dono
- [ ] `tsc --noEmit` passa
- [ ] Teste end-to-end: wizard completo em menos de 10 minutos
- [ ] QR do Passo 7 abre `remy.app.br/[slug]/entrar` corretamente

---

## Sessões de implementação sugeridas

```
Sessão 1:  Remover/redirecionar páginas legadas quebradas
Sessão 2:  Confirmar schema existente vs. necessário (migrations só do gap)
Sessão 3:  Estrutura do wizard (componente base, navegação, persistência)
Sessão 4:  Componente <CardPreview> (reutilizável)
Sessão 5:  Passo 1 — dados do restaurante + slug + preview
Sessão 6:  Passo 1b — design do card + upload + extração de cor
Sessão 7:  Passo 2 — Google Business + redes sociais
Sessão 8:  Passo 3 — campos do formulário
Sessão 9:  Passo 4 — programa (acúmulo + milestones + bônus)
Sessão 10: Passo 5 — modos de validação
Sessão 11: Passo 6 — automações WhatsApp + preview Claude
Sessão 12: Passo 7 — QR + PDF
Sessão 13: Testes end-to-end + ajustes
```
