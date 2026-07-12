# Spec 004 — Onboarding automático via Google Maps

> Status: ⏳ pronta
> Hipótese vinculada: H2 — onboarding automático em <6 min
> Onda: 1 · Depende de: 001 · Combina com: 003

---

## Por quê

Padrão Okara aplicado ao Balcão: pedir só o mínimo (nome + link) e o agente descobre o resto. Cada campo de formulário eliminado é fricção a menos no momento mais frágil da conversão.

## O quê

Dono informa nome + link do Google Maps → Places API extrai dados públicos → Claude analisa reviews e infere produtos citados e tom de voz → dono confirma ou corrige em 1 tela → `/preferences.md` e `/reputation.md` populados.

## Requisitos

1. Input: nome do restaurante OU link do Google Maps (aceitar ambos)
2. Places API extrai: tipo, endereço/bairro, horários, nota, volume de reviews, telefone, fotos
3. Claude (Sonnet) analisa as 20 reviews mais recentes: produtos mais citados, tom (formal/informal/emoji), temas de elogio e reclamação
4. Tela de confirmação: dados em cards editáveis, botão "Está correto" ou edição inline
5. Confirmação grava `/preferences.md` (dados do negócio) e `/reputation.md` (análise de reviews) no Memory Store
6. 2 perguntas de custo após confirmação: custo mensal de equipe + 3 principais insumos → grava em `/financial-context.md` (COGS estimado desde a semana 1)
7. Restaurante não encontrado → fluxo manual mínimo (5 campos) sem quebrar o onboarding

## Critérios de aceite — VERIFICÁVEIS

- [ ] `npx tsc --noEmit` passa
- [ ] Busca por "Kito's Vila Madalena" (ou restaurante real de teste) retorna dados do Places em <5s
- [ ] `/preferences.md` gerado contém: tipo, bairro, horários, top 3 produtos citados
- [ ] `/reputation.md` contém nota, volume e ≥2 temas identificados nas reviews
- [ ] Edição de um campo na confirmação → arquivo reflete o valor editado
- [ ] Busca por nome inexistente → fluxo manual aparece, sem erro não tratado
- [ ] Tempo total do fluxo completo (busca → confirmação → 2 perguntas) cronometrado <4 min em teste manual

## Fora de escopo

- Instagram como fonte (scraping frágil — Fase 2)
- OAuth Google Business (spec própria — aqui é só leitura pública via Places)
- Configuração do Wallet (já existe no fluxo atual, mantém como etapa seguinte)

## Dados e schema

Places API (Google Cloud, ~US$0,02/busca). Arquivos `/preferences.md`, `/reputation.md`, `/financial-context.md` (schemas na spec 001).

## Loop de feedback

Taxa de correção por campo na tela de confirmação → campos com >40% de edição indicam extração ruim → pm-weekly sinaliza para ajuste de prompt.

## Plano B / riscos

- Places API sem alguns dados (horários, telefone): campos vazios viram perguntas na tela de confirmação — nunca inventar.
- Custo por busca em escala: cache de resultados por place_id (busca repetida = grátis).

## Aprendizados

- (preencher após entrega)
