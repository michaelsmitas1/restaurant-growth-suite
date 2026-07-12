---
name: deploy
description: Checklist de deploy para produção. Invocar com /deploy antes de qualquer push para main ou deploy no Vercel.
---

## Checklist de deploy

Execute na ordem. Não pule etapas.

### 1. Código
- [ ] TypeScript sem erros: `npx tsc --noEmit` em `apps/dashboard`
- [ ] Sem `console.log` de debug no código que vai para produção
- [ ] Variáveis de ambiente documentadas no `.env.example`
- [ ] Nenhuma chave de API hardcoded

### 2. Banco de dados
- [ ] Migrations testadas localmente antes de aplicar em produção
- [ ] RLS policies verificadas para novas tabelas
- [ ] Backup confirmado antes de migrations destrutivas

### 3. Segurança
- [ ] `SUPABASE_SERVICE_KEY` não está no bundle do cliente
- [ ] `ANTHROPIC_API_KEY` não está no bundle do cliente
- [ ] Certificados Apple não commitados

### 4. Funcionalidade
- [ ] Fluxo de carimbo do Wallet testado manualmente
- [ ] Fluxo de resposta de review testado manualmente
- [ ] Campanha de teste enviada e recebida

### 5. Deploy
- [ ] Push para branch `claude/feature-name` primeiro (não main)
- [ ] PR aberto com descrição do que muda
- [ ] Deploy de preview no Vercel verificado
- [ ] Só então merge para main

### Rollback
Se algo der errado em produção:
1. Vercel → Deployments → reverter para deploy anterior (1 clique)
2. Se foi migration de banco: avaliar manualmente (migrations não têm rollback automático)
