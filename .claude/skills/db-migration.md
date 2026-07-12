---
name: db-migration
description: Procedimento para criar e aplicar migrations no Supabase. Invocar com /db-migration sempre que houver mudança de schema.
---

## Procedimento de migration

### Regras absolutas
- **Nunca editar uma migration existente** — criar sempre um novo arquivo
- **Sempre testar localmente** antes de aplicar em produção
- **Nomear de forma descritiva:** `003_add_restaurant_context_table.sql`

### Formato do arquivo

```sql
-- Migration: 00N_descricao.sql
-- Data: YYYY-MM-DD
-- Descrição: O que essa migration faz e por quê

-- Sempre incluir RLS se criar nova tabela
ALTER TABLE nome_da_tabela ENABLE ROW LEVEL SECURITY;

CREATE POLICY "restaurante acessa seus próprios dados" ON nome_da_tabela
  FOR ALL USING (restaurant_id = current_setting('app.restaurant_id')::uuid);
```

### Sequência

1. Criar arquivo em `supabase/migrations/00N_descricao.sql`
2. Testar localmente com Supabase CLI ou no painel de dev
3. Verificar RLS para novas tabelas
4. Aplicar em produção via painel Supabase
5. Commitar o arquivo de migration no Git

### Checklist pós-migration
- [ ] RLS habilitado na nova tabela
- [ ] Policy criada para isolamento por `restaurant_id`
- [ ] Tipos TypeScript atualizados para espelhar novo schema
- [ ] Arquivo de migration commitado no Git
