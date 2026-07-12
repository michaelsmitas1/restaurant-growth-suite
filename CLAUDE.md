# Balcão — Contexto do Projeto

> Contexto permanente. Estado do desenvolvimento vive no PLAN.md. Specs de features vivem em specs/.

---

## O produto em uma frase

**Balcão é o co-piloto de IA para donos de food business brasileiro** — "o sócio que trabalha 24/7". Responde reviews, captura clientes, reativa inativos, alerta sobre finanças e operação. O dono aprova — não opera.

---

## Princípios que guiam cada decisão técnica

- **AI-native:** remove o Claude e o produto não funciona. IA é o núcleo, não feature.
- **Closed loop:** todo output grava contexto que melhora o próximo input. Feature sem loop de feedback é feature incompleta.
- **Input flexível:** WhatsApp, foto, voz, CSV, OAuth — nunca forçar formato.
- **Output como decisão:** ação com contexto, não dado bruto.
- **Proativo por padrão:** o sistema age dentro dos limites; o dono aprova.
- **Simples no uso, profundo nas possibilidades:** o oposto da Chefia (excesso de features, alta fricção).

---

## Stack

| Camada | Tecnologia | Nota |
|---|---|---|
| Frontend | Next.js 14 App Router (Vercel) | Server Components default, Server Actions p/ mutações |
| Banco | Supabase (PostgreSQL) | RLS obrigatório — ver `.claude/rules/rls-security.md` |
| Orquestração | n8n (Railway) | Só workflows sem estado; agente NÃO vive no n8n |
| IA raciocínio | Claude Sonnet 4.6 | Agente, análise, copy |
| IA classificação | Claude Haiku | Tarefas simples |
| IA visão | Claude Vision | Cardápio e NF por foto |
| IA áudio | Whisper (OpenAI) | Transcrição de voz |
| Verificação | Outcome Grader | Rubrics em `specs/graders/` — todo output crítico passa por ele |
| Memória | Claude Managed Agents Memory Stores | 1 store read-write por restaurante + 1 coletivo read-only |
| WhatsApp | Evolution API → Meta Cloud API | Migrar aos 30 clientes |
| Wallet | passkit-generator | Migrar p/ API própria aos 60 clientes |

---

## Convenções de nomenclatura — nunca desviar

`restaurant` (não store/shop) · `customer` (não user/client) · `visit` + `stamp_count` (não checkin) · `review` (não rating) · `campaign` (não blast) · `restaurant_context` (não agent_memory) · `owner` (não admin) · `purchase` (não sale)

---

## Regras path-scoped (carregam automaticamente)

- `.claude/rules/rls-security.md` — toda query Supabase (src/app/api/**, actions/**)
- `.claude/rules/loyalty-engine.md` — qualquer código de loyalty (lib/loyalty*)
- `.claude/rules/ai-outputs.md` — prompts e outputs do agente (lib/ai/**)

---

## Hard limits — nunca implementar

- Execução de pagamentos
- Contratação/demissão de funcionários
- Contratos com fornecedores
- Compartilhar dados de `customers` com terceiros
- Mensagens para números sem opt-in

## Sempre requer aprovação explícita do dono

- Enviar campanha WhatsApp
- Publicar resposta de review negativa
- Alterar Wallet ou valor de recompensa
- Qualquer ação envolvendo dinheiro ou fornecedor

---

## Método de desenvolvimento — spec-driven loop

```
1. Feature nasce como spec em specs/NNN-nome.md (template em specs/TEMPLATE.md)
2. Toda spec tem: hipótese de negócio vinculada, critérios de aceite
   VERIFICÁVEIS (testes/typecheck/comando), e fora-de-escopo explícito
3. nightly-builder (Routine) implementa contra a spec ativa
4. Gate objetivo: npx tsc --noEmit + testes passam = pode abrir draft PR
5. pr-reviewer revisa contra a spec, não só o código
6. Humano aprova de manhã
7. pm-weekly grava aprendizados na própria spec → contexto do próximo ciclo
```

**Regra de ouro:** se a tarefa não tem spec, primeiro escreva a spec. Código sem spec é rascunho.

---

## Tarefas comuns

```bash
npm run dev                    # em apps/dashboard
npx tsc --noEmit               # gate de tipo — roda via hook após toda edição
# Nova migration: supabase/migrations/00N_descricao.sql — NUNCA editar existente
# Workflow n8n alterado: exportar JSON → apps/n8n-workflows/
```

---

## Referências

- Estado e backlog: `PLAN.md` · Specs: `specs/` · Negócio: `docs/BUSINESS.md`
- Decisões: `docs/DECISIONS.md` · Validação: `docs/validacao-restaurantes.md`

*v3.0 · Julho 2026 · Este arquivo só muda quando a arquitetura muda*
