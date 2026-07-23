-- Dados de desenvolvimento — recriável a qualquer momento.
-- 1 dono (auth.users), 1 restaurante configurado, ~10 clientes com visitas.
-- Nunca rodar contra produção.

-- dono de teste (senha: remy123)
insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, recovery_sent_at, last_sign_in_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, email_change, email_change_token_new, recovery_token
) values (
  '00000000-0000-0000-0000-000000000000',
  'd45e4cb3-13b7-4aa7-ac3a-070a878a94a3',
  'authenticated',
  'authenticated',
  'dono@remy.dev',
  crypt('remy123', gen_salt('bf')),
  now(), now(), now(),
  '{"provider":"email","providers":["email"]}',
  '{}',
  now(), now(),
  '', '', '', ''
)
on conflict (id) do nothing;

-- restaurante
insert into public.restaurants (
  id, owner_id, slug, name, segment, city, neighborhood,
  google_place_id, whatsapp_number, primary_color, secondary_color,
  wizard_step, wizard_completed_at, active
) values (
  '9a588819-e3fc-4817-a0f7-55a5974c4c5b',
  'd45e4cb3-13b7-4aa7-ac3a-070a878a94a3',
  'sorveteria-da-vo-maria',
  'Sorveteria da Vó Maria',
  'sorveteria',
  'São Paulo',
  'Pinheiros',
  'ChIJN1t_tDeuEmsRUsoyG83frY4',
  '5511999990001',
  '#397DE8',
  '#10244A',
  8,
  now(),
  true
)
on conflict (id) do nothing;

-- design do card
insert into public.card_design_config (restaurant_id, program_name, background_color, text_color, barcode_type)
values ('9a588819-e3fc-4817-a0f7-55a5974c4c5b', 'Remy Rewards', '#10244A', '#FFFFFF', 'qr')
on conflict (restaurant_id) do nothing;

-- configuração do programa
insert into public.loyalty_config (
  restaurant_id, accrual_mode, stamps_per_visit, validation_modes,
  signup_bonus_stamps, tone_of_voice
) values (
  '9a588819-e3fc-4817-a0f7-55a5974c4c5b', 'visit', 1,
  array['scanner', 'daily_password'], 1, 'descontraido'
)
on conflict (restaurant_id) do nothing;

-- marcos (milestones)
insert into public.loyalty_milestones (restaurant_id, position, stamps_required, reward_description) values
  ('9a588819-e3fc-4817-a0f7-55a5974c4c5b', 1, 3, 'sobremesa grátis'),
  ('9a588819-e3fc-4817-a0f7-55a5974c4c5b', 2, 6, 'sorvete grande grátis'),
  ('9a588819-e3fc-4817-a0f7-55a5974c4c5b', 3, 10, 'uma bola de sorvete grátis da sua escolha')
on conflict (restaurant_id, position) do nothing;

-- campos do cadastro
insert into public.form_fields_config (
  restaurant_id, name_visible, name_required, birthday_visible, birthday_required,
  email_visible, email_required
) values (
  '9a588819-e3fc-4817-a0f7-55a5974c4c5b', true, true, true, false, false, false
)
on conflict (restaurant_id) do nothing;

-- clientes (conta única global por telefone)
insert into public.customers (id, phone, name, birthday) values
  ('238284bc-c898-4583-9d56-44cacddf7867', '+5511987654321', 'Paulo Souza', null),
  ('9554a660-aea3-48f2-b48b-15f8b8926242', '+5511976543210', 'Bruno Ferreira', null),
  ('1ba5a0a4-12f9-4416-a5fd-7dce962dae9e', '+5511965432109', 'Lucia Pereira', null),
  ('1c17f099-7610-4ce0-81af-039da26714d6', '+5511954321098', 'Marcos Oliveira', null),
  ('77a5baa1-b410-4cd8-a14f-eab82f1f7e37', '+5511984455354', 'Beatriz Karam', '1998-01-19'),
  ('d13fb023-5b47-4728-b42b-9674ca95c15d', '+5511981234567', 'Ana Martins', null),
  ('706aae09-4d49-4ecc-9c75-10c64f7072e0', '+5511973311220', 'Camila Lima', null),
  ('e04059ee-d258-4c44-a1ca-5dbe91a0bb2d', '+5511942221818', 'Michael Smitas', '1998-03-19'),
  ('4861135b-6ba6-4886-b79c-3f743d5991ad', '+5511997075851', 'Hugo Faro', '1998-01-12'),
  ('cece6c0e-e697-441b-bb89-a0bb84ab6bcf', '+5511988776655', 'Fernanda Costa', null)
on conflict (id) do nothing;

-- vínculo cliente <-> restaurante
insert into public.customer_programs (customer_id, restaurant_id, current_stamps, total_stamps_earned, total_visits, last_visit_at) values
  ('238284bc-c898-4583-9d56-44cacddf7867', '9a588819-e3fc-4817-a0f7-55a5974c4c5b', 2, 9, 9, now() - interval '16 days'),
  ('9554a660-aea3-48f2-b48b-15f8b8926242', '9a588819-e3fc-4817-a0f7-55a5974c4c5b', 1, 22, 22, now() - interval '14 days'),
  ('1ba5a0a4-12f9-4416-a5fd-7dce962dae9e', '9a588819-e3fc-4817-a0f7-55a5974c4c5b', 1, 4, 4, now() - interval '36 days'),
  ('1c17f099-7610-4ce0-81af-039da26714d6', '9a588819-e3fc-4817-a0f7-55a5974c4c5b', 0, 6, 6, now() - interval '41 days'),
  ('77a5baa1-b410-4cd8-a14f-eab82f1f7e37', '9a588819-e3fc-4817-a0f7-55a5974c4c5b', 0, 0, 0, null),
  ('d13fb023-5b47-4728-b42b-9674ca95c15d', '9a588819-e3fc-4817-a0f7-55a5974c4c5b', 0, 18, 18, now() - interval '7 days'),
  ('706aae09-4d49-4ecc-9c75-10c64f7072e0', '9a588819-e3fc-4817-a0f7-55a5974c4c5b', 0, 7, 7, now() - interval '7 days'),
  ('e04059ee-d258-4c44-a1ca-5dbe91a0bb2d', '9a588819-e3fc-4817-a0f7-55a5974c4c5b', 0, 0, 0, null),
  ('4861135b-6ba6-4886-b79c-3f743d5991ad', '9a588819-e3fc-4817-a0f7-55a5974c4c5b', 1, 1, 1, now() - interval '35 days'),
  ('cece6c0e-e697-441b-bb89-a0bb84ab6bcf', '9a588819-e3fc-4817-a0f7-55a5974c4c5b', 0, 10, 10, now() - interval '10 days')
on conflict (customer_id, restaurant_id) do nothing;

-- Fernanda completou o programa (10 selos) — marcar VIP permanente
update public.customer_programs
  set is_vip = true, vip_since = now() - interval '10 days'
  where customer_id = 'cece6c0e-e697-441b-bb89-a0bb84ab6bcf'
    and restaurant_id = '9a588819-e3fc-4817-a0f7-55a5974c4c5b';

-- visitas (amostra)
insert into public.visits (customer_program_id, restaurant_id, stamps_added, validation_mode, created_at)
select cp.id, cp.restaurant_id, 1, 'scanner', now() - interval '20 days'
from public.customer_programs cp
where cp.customer_id = '706aae09-4d49-4ecc-9c75-10c64f7072e0'
on conflict do nothing;

insert into public.visits (customer_program_id, restaurant_id, stamps_added, validation_mode, created_at)
select cp.id, cp.restaurant_id, 1, 'scanner', now() - interval '7 days'
from public.customer_programs cp
where cp.customer_id = '706aae09-4d49-4ecc-9c75-10c64f7072e0'
on conflict do nothing;

insert into public.visits (customer_program_id, restaurant_id, stamps_added, validation_mode, created_at)
select cp.id, cp.restaurant_id, 1, 'daily_password', now() - interval '7 days'
from public.customer_programs cp
where cp.customer_id = 'd13fb023-5b47-4728-b42b-9674ca95c15d'
on conflict do nothing;

insert into public.visits (customer_program_id, restaurant_id, stamps_added, validation_mode, created_at)
select cp.id, cp.restaurant_id, 1, 'scanner', now() - interval '35 days'
from public.customer_programs cp
where cp.customer_id = '4861135b-6ba6-4886-b79c-3f743d5991ad'
on conflict do nothing;

insert into public.visits (customer_program_id, restaurant_id, stamps_added, validation_mode, created_at)
select cp.id, cp.restaurant_id, 0, 'scanner', now() - interval '10 days'
from public.customer_programs cp
where cp.customer_id = 'cece6c0e-e697-441b-bb89-a0bb84ab6bcf'
on conflict do nothing;

-- resgate (Fernanda completou o 3º marco)
insert into public.redemptions (customer_program_id, restaurant_id, milestone_id, stamps_used, validated_by)
select cp.id, cp.restaurant_id, m.id, 10, 'seed'
from public.customer_programs cp
join public.loyalty_milestones m
  on m.restaurant_id = cp.restaurant_id and m.position = 3
where cp.customer_id = 'cece6c0e-e697-441b-bb89-a0bb84ab6bcf'
on conflict do nothing;
