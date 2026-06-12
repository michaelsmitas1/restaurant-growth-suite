-- extensions
create extension if not exists "uuid-ossp";

-- restaurants
create table restaurants (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  type text,
  neighborhood text,
  city text default 'São Paulo',
  google_place_id text unique,
  google_access_token text,
  google_refresh_token text,
  google_token_expires_at timestamptz,
  whatsapp_number text,
  whatsapp_session_id text,
  saas_whatsapp_number text,
  passkit_template_id text,
  google_wallet_class_id text,
  tone_of_voice text default 'amigável e próximo',
  stamps_required integer default 10,
  reward_description text default 'item grátis da sua escolha',
  auto_publish_reviews boolean default false,
  auto_publish_delay_hours integer default 4,
  active boolean default true,
  created_at timestamptz default now()
);

-- customers
create table customers (
  id uuid primary key default uuid_generate_v4(),
  restaurant_id uuid references restaurants(id) on delete cascade,
  phone text,
  name text,
  wallet_pass_id text,
  apple_pass_serial text,
  google_pass_object_id text,
  total_visits integer default 0,
  current_stamps integer default 0,
  last_visit_at timestamptz,
  opted_out boolean default false,
  created_at timestamptz default now(),
  unique(restaurant_id, phone)
);

-- visits
create table visits (
  id uuid primary key default uuid_generate_v4(),
  customer_id uuid references customers(id) on delete cascade,
  restaurant_id uuid references restaurants(id) on delete cascade,
  stamps_added integer default 1,
  stamp_count_after integer,
  reward_triggered boolean default false,
  created_at timestamptz default now()
);

-- reviews
create table reviews (
  id uuid primary key default uuid_generate_v4(),
  restaurant_id uuid references restaurants(id) on delete cascade,
  google_review_id text unique,
  author text,
  rating integer check (rating between 1 and 5),
  text text,
  sentiment text check (sentiment in ('positive', 'neutral', 'negative')),
  ai_response text,
  final_response text,
  status text default 'pending' check (status in ('pending', 'approved', 'edited', 'ignored', 'published')),
  responded_at timestamptz,
  created_at timestamptz default now()
);

-- campaigns
create table campaigns (
  id uuid primary key default uuid_generate_v4(),
  restaurant_id uuid references restaurants(id) on delete cascade,
  type text check (type in ('reactivation', 'slow_day', 'seasonal', 'reward', 'manual')),
  message_text text,
  sent_to_count integer default 0,
  status text default 'sent' check (status in ('draft', 'sent', 'failed')),
  sent_at timestamptz,
  created_at timestamptz default now()
);

-- campaign_messages (envios individuais)
create table campaign_messages (
  id uuid primary key default uuid_generate_v4(),
  campaign_id uuid references campaigns(id) on delete cascade,
  customer_id uuid references customers(id) on delete cascade,
  phone text,
  status text default 'sent' check (status in ('sent', 'delivered', 'failed', 'opted_out')),
  sent_at timestamptz default now()
);

-- review_approvals (estado do fluxo de aprovação via WhatsApp)
create table review_approvals (
  id uuid primary key default uuid_generate_v4(),
  review_id uuid references reviews(id) on delete cascade,
  restaurant_id uuid references restaurants(id) on delete cascade,
  whatsapp_message_id text,
  status text default 'waiting' check (status in ('waiting', 'approved', 'edited', 'ignored', 'auto_published')),
  expires_at timestamptz,
  created_at timestamptz default now()
);

-- indexes
create index on customers(restaurant_id);
create index on customers(last_visit_at);
create index on reviews(restaurant_id);
create index on reviews(status);
create index on campaigns(restaurant_id);
create index on visits(customer_id);
create index on visits(created_at);
create index on review_approvals(status);
create index on review_approvals(expires_at);

-- RLS (service key bypassa, mas mantém configurado para segurança)
alter table restaurants enable row level security;
alter table customers enable row level security;
alter table visits enable row level security;
alter table reviews enable row level security;
alter table campaigns enable row level security;
alter table campaign_messages enable row level security;
alter table review_approvals enable row level security;
