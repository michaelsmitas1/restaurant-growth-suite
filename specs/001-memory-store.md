# Spec 001 — Memory Store por restaurante

> Status: 🔄 ativa
> Hipótese vinculada: fundação — habilita H1, H3, H7
> Onda: 1

---

## Por quê

O agente sem memória é um chatbot. Toda a tese do Balcão (master skill, closed loop, contexto que cresce) depende de memória persistente por restaurante. Esta é a spec-fundação: nada da Onda 1 funciona sem ela.

## O quê

Cada restaurante tem um Memory Store (Claude Managed Agents) com arquivos markdown estruturados. O agente lê no início de cada interação e grava após cada evento significativo. Existe um store coletivo read-only compartilhado.

## Requisitos

1. Memory Store criado automaticamente no onboarding de cada restaurante
2. Arquivos iniciais: `/preferences.md`, `/financial-context.md`, `/customer-patterns.md`, `/menu.md`, `/reputation.md`, `/purchase-history.md`, `/feedback-log.md`
3. Store coletivo read-only montado em toda sessão: `/shared/benchmarks.md`, `/shared/seasonal-calendar-br.md`
4. Módulo `lib/ai/memory.ts` com funções: `getStore(restaurantId)`, `readContext(restaurantId, files[])`, `appendEvent(restaurantId, file, entry)`
5. Endpoint `POST /api/agent/message` monta contexto: preferences (sempre) + arquivos relevantes por intenção da mensagem
6. Context Compaction ativa via SDK — custo por conversa não cresce com o histórico
7. Cada arquivo tem header com schema comentado (para o dono poder editar via UI futura — padrão Okara)

## Critérios de aceite — VERIFICÁVEIS

- [ ] `npx tsc --noEmit` passa
- [ ] Script `scripts/test-memory.ts` executa: cria store de teste, grava 3 eventos, lê de volta, valida conteúdo — sai com código 0
- [ ] `POST /api/agent/message` com `{restaurantId, message: "qual meu prato mais vendido?"}` retorna resposta que cita dado do `/preferences.md` semeado
- [ ] Segunda chamada na mesma conversa NÃO reenvia histórico completo (verificar tokens de input no log < 3.000)
- [ ] Store coletivo é read-only: tentativa de escrita em `/shared/*` retorna erro tratado
- [ ] Arquivo `/feedback-log.md` existe com schema do template (ver seção Dados)

## Fora de escopo

- UI de edição dos docs pelo dono (spec futura)
- Sumarização semanal automática (entra na spec 002 junto com a cadência)
- Migração dos dados existentes do Supabase para o store (script separado, pós-validação)

## Dados e schema

`/feedback-log.md` — o schema que instrumenta o closed loop:
```
| data | tipo | ref | resultado |
|---|---|---|---|
| 2026-07-03 | campanha_sugerida | camp_123 | aprovada_sem_edicao |
| 2026-07-03 | campanha_sugerida | camp_124 | ignorada_48h |
| 2026-07-04 | lista_compras | list_45 | ajustada: salmao 4kg→6kg |
```
Tipos: `campanha_sugerida`, `review_resposta`, `lista_compras`, `alerta`, `resposta_chat`
Resultados: `aprovada_sem_edicao` · `aprovada_editada` · `ignorada_48h` · `cancelada` · `ajustada: [detalhe]`

## Loop de feedback

Este É o mecanismo de loop. Todo output do agente gera entrada no `/feedback-log.md`. O agente lê o log antes de gerar novas sugestões ("últimas 3 campanhas de terça foram ignoradas → mudar abordagem"). Silêncio vira dado: job n8n marca `ignorada_48h` automaticamente.

## Plano B / riscos

- Se Managed Agents Memory Stores tiver limitação inesperada (latência, cota): fallback para as 4 tabelas Supabase já projetadas (`restaurant_context`, `conversation_history`, `conversation_summaries`, `restaurant_insights`). A interface `lib/ai/memory.ts` abstrai o backend — trocar implementação não toca o resto do código.

## Aprendizados

- (preencher após entrega)
