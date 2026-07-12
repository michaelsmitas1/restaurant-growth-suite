# Spec 002 — AI Companion: cadência proativa

> Status: ⏳ pronta
> Hipótese vinculada: H7 — dono interage com Companion ≥3x/semana sem lembrete
> Onda: 1 · Depende de: 001 (Memory Store)

---

## Por quê

Proatividade é o diferencial vs. Chefia (robô reativo por regras). Se o agente só responde quando perguntado, é um chatbot. O hábito do dono se forma pela cadência: mensagens úteis em momentos previsíveis criam o ritual de checagem.

## O quê

O agente envia mensagens proativas 3x/semana via WhatsApp e feed, com conteúdo baseado no Memory Store. O dono aprova campanhas respondendo "sim" no próprio WhatsApp. Alertas ad-hoc fora da cadência para eventos críticos.

## Requisitos

1. 3 workflows n8n de cadência:
   - Segunda 08h: resumo da semana anterior (dados do `/financial-context.md` + `/customer-patterns.md`) + agenda da semana
   - Quarta 10h30: detecção de slow day + campanha sugerida com aprovação inline
   - Sexta 17h: fechamento + 3 perguntas financeiras (respostas gravam no Memory Store)
2. Fluxo de aprovação WhatsApp: dono responde "sim"/"pode enviar" → campanha dispara; "não"/silêncio 48h → registra em `/feedback-log.md`
3. Sumarização semanal segunda 07h (antes do resumo das 08h) via Context Compaction
4. Alertas ad-hoc (fora da cadência): review ≤2★, cliente VIP sem visita >21 dias, anomalia de faturamento (>30% vs. média)
5. Toda mensagem proativa passa pelo Outcome Grader antes do envio (rubric mínima inline até spec 005)

## Critérios de aceite — VERIFICÁVEIS

- [ ] `npx tsc --noEmit` passa
- [ ] 3 workflows exportados em `apps/n8n-workflows/` com nomes descritivos
- [ ] Disparo manual do workflow de segunda gera mensagem citando ≥2 dados reais do Memory Store do restaurante de teste
- [ ] Resposta "sim" simulada no webhook → status da campanha muda para `sent` no Supabase
- [ ] Sem resposta em 48h (simulado com timestamp) → entrada `ignorada_48h` aparece no `/feedback-log.md`
- [ ] Review 2★ inserida no banco → alerta chega em <15 min (polling atual)

## Fora de escopo

- Meta Cloud API (Evolution até 30 clientes)
- Personalização de horários por dono (fixo seg/qua/sex no MVP)
- AgentService separado — API route basta para a cadência; decisão antes de sessões longas

## Dados e schema

Nova coluna `campaigns.approval_channel` (`whatsapp` | `dashboard`). Eventos no `/feedback-log.md` (schema da spec 001).

## Loop de feedback

Aprovações/silêncios gravados por tipo de mensagem → o agente ajusta: 3 campanhas de quarta ignoradas seguidas → muda abordagem ou pergunta ao dono o que prefere.

## Plano B / riscos

- Ban do número Evolution: cadência degrada para feed do dashboard + e-mail. Throttling: máx 10 msgs/hora/número.
- n8n instável no Railway: workflows têm retry 3x; falha grava em log para o pm-weekly reportar.

## Aprendizados

- (preencher após entrega)
