-- spec-010 (wizard de onboarding), Sessão 2 — gap entre o schema existente
-- (0a) e o necessário para os 8 passos do wizard. Confirmado via
-- list_tables no projeto de teste (hfqclbihfasnigitxpqj) antes de escrever
-- esta migration: restaurants/card_design_config precisam de colunas novas;
-- loyalty_config, loyalty_milestones e form_fields_config já cobrem tudo
-- que os Passos 3/4/5/6 precisam (nomes diferentes do rascunho da spec,
-- mesmo formato — ver specs/010-onboarding-wizard.md) e não são tocados.

-- restaurants: endereço completo (Passo 1, campo obrigatório — hoje só
-- existe city/neighborhood) e as duas redes sociais que ainda não tinham
-- coluna (instagram/facebook já existem como instagram_handle/facebook_url,
-- reaproveitados sem rename).
alter table public.restaurants
  add column if not exists address text,
  add column if not exists social_tiktok text,
  add column if not exists social_website text;

-- card_design_config: Passo 1b precisa distinguir ícone preset (por
-- categoria) de upload customizado, e configurar o texto do contador.
-- icon_url passa a ser especificamente a URL do ícone customizado.
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'card_design_config' and column_name = 'icon_url'
  ) then
    alter table public.card_design_config rename column icon_url to stamp_icon_custom_url;
  end if;
end $$;

alter table public.card_design_config
  add column if not exists stamp_icon_type text not null default 'preset',
  add column if not exists stamp_icon_preset text not null default 'plate',
  add column if not exists stamp_label text not null default 'visitas até o prêmio';

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'card_design_config_stamp_icon_type_check'
  ) then
    alter table public.card_design_config
      add constraint card_design_config_stamp_icon_type_check
      check (stamp_icon_type in ('preset', 'custom'));
  end if;
end $$;

comment on column public.card_design_config.stamp_icon_custom_url is
  'URL do ícone de selo customizado (upload do dono) — usado quando stamp_icon_type = custom (spec-010, Sessão 2)';
comment on column public.card_design_config.stamp_icon_preset is
  'Nome do preset de ícone por categoria (ex: plate, mug, cup) — usado quando stamp_icon_type = preset (spec-010, Sessão 2)';
comment on column public.card_design_config.stamp_label is
  'Texto do contador de selos no card, ex: "visitas até o prêmio" (spec-010, Passo 1b)';
