---
name: loop
description: Executa uma spec em loop incremental até os critérios de aceite passarem ou travar. Uso /loop (roda a SPEC DIURNA do PLAN.md) ou /loop 008 (spec específica). Invocar numa sessão Code para ver o progresso ao vivo — é o nightly-builder em versão manual.
---

# /loop — motor de execução sob demanda

## Processo

1. Leia PLAN.md. Resolva a spec: argumento (`/loop NNN`) > campo SPEC DIURNA > campo SPEC ATIVA. Leia a spec inteira e as rules dos paths que vai tocar.
2. **Checkpoint de estado:** liste os critérios de aceite e marque quais já passam hoje. Mostre ao usuário antes de começar.
3. **REPITA** até todos os critérios passarem OU 3 falhas consecutivas de gate:
   a. Implemente o MENOR incremento que faz +1 critério passar
   b. Gate: `npx tsc --noEmit` + testes/scripts citados na spec
   c. Passou → commit descritivo no branch `claude/spec-NNN` + informe qual critério virou ✅
   d. Falhou → corrija; na 3ª falha seguida PARE, mostre o erro e o que tentou
4. Todos passando → checklist final com evidência de cada critério. Pergunte antes de abrir o PR.

## Regras absolutas

- **Sem spec, sem loop.** Spec inexistente ou com critérios vagos → PARE e peça para escrevermos a spec primeiro.
- Nunca tocar fora do "Fora de escopo" da spec. Nunca push em main. Nunca migration destrutiva. Nunca commit com gate falhando.
- A cada incremento, uma linha de status: `[3/8 critérios] implementando: <o quê>` — o usuário acompanha o progresso em tempo real.
