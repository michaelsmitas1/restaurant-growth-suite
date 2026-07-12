# Spec 003 — Cardápio por foto

> Status: ⏳ pronta
> Hipótese vinculada: H2 — onboarding automático em <6 min funciona para o ICP
> Onda: 1 · Depende de: 001 (Memory Store, arquivo /menu.md)

---

## Por quê

O cardápio é o dado-fundação da inteligência financeira (margem por prato, spec 010) e o momento "uau" do onboarding. Digitar 40 pratos mata a promessa de 6 minutos; uma foto resolve.

## O quê

Dono fotografa o cardápio (físico, tablet ou print do iFood) → Claude Vision extrai pratos, preços e categorias → interface de confirmação/edição → salva em `/menu.md` no Memory Store.

## Requisitos

1. Upload de 1–5 fotos (página do onboarding + página avulsa `/cardapio`)
2. Claude Vision extrai: nome do prato, preço, categoria, descrição (se houver)
3. Interface de confirmação: tabela editável (nome/preço/categoria), adicionar/remover linha
4. Confirmação grava `/menu.md` no Memory Store com schema comentado no header
5. Baixa confiança na extração (imagem ruim) → mensagem clara pedindo nova foto, nunca salvar dado duvidoso silenciosamente
6. Modelo: Claude Sonnet com visão (não Haiku — precisão > custo aqui)

## Critérios de aceite — VERIFICÁVEIS

- [ ] `npx tsc --noEmit` passa
- [ ] Foto de teste com 12 pratos (fixture em `tests/fixtures/cardapio-teste.jpg`) → ≥10 pratos extraídos com preço correto
- [ ] Edição manual de um preço na tabela → `/menu.md` reflete o valor editado, não o extraído
- [ ] Foto ilegível (fixture borrada) → retorna erro tratado com mensagem, `/menu.md` não é alterado
- [ ] `/menu.md` resultante segue o schema: `| prato | preço | categoria |` com header comentado

## Fora de escopo

- Link do iFood como fonte (scraping — spec futura; MVP é foto, inclusive print do iFood)
- Cálculo de margem (spec 010)
- Fotos dos pratos para o mini-site

## Dados e schema

`/menu.md`:
```
<!-- schema: | prato | preco_R$ | categoria | descricao -->
| Temaki salmão | 32,00 | Temakis | Salmão fresco, arroz, nori |
```

## Loop de feedback

Correções manuais do dono são o sinal: pm-weekly compara extraído vs. confirmado; taxa de edição >30% → revisar prompt de extração (H2 em risco).

## Plano B / riscos

- Vision falhar em cardápios manuscritos/decorativos: fluxo manual da tabela editável já é o fallback embutido — dono digita só o que faltou.

## Aprendizados

- (preencher após entrega)
