# Spec NNN — [Nome da feature]

> Status: 📝 rascunho | ⏳ pronta | 🔄 ativa | ✅ entregue
> Hipótese vinculada: HX — [texto da hipótese]
> Onda: N

---

## Por quê (contexto de negócio)

[2-4 frases: qual dor do dono isso resolve, por que agora, o que acontece se não fizermos]

## O quê (comportamento esperado)

[Descrição do comportamento final do ponto de vista do dono/sistema. Job story quando aplicável: "Quando X, quero Y, para Z"]

## Requisitos

1. [Requisito funcional numerado — específico, não vago]
2. ...

## Critérios de aceite — VERIFICÁVEIS

> Regra: cada critério deve ser checável por comando, teste ou inspeção objetiva. "Funciona bem" não é critério.

- [ ] `npx tsc --noEmit` passa sem erros
- [ ] [Teste/comando específico que prova o comportamento]
- [ ] [Inspeção objetiva: "arquivo X existe com schema Y", "endpoint retorna Z"]

## Fora de escopo (explícito)

- [O que NÃO entra — protege contra scope creep do agente]

## Dados e schema

[Tabelas, arquivos de Memory Store, ou APIs tocadas. Schema exato quando novo.]

## Loop de feedback

[Como esta feature grava contexto que melhora o próximo ciclo? Se não grava, justificar.]

## Plano B / riscos

[O que fazer se a abordagem principal falhar. Para OAuth/integrações: sempre ter modo degradado válido.]

## Aprendizados (preenchido pelo pm-weekly após entrega)

- [data · o que aprendemos implementando]
