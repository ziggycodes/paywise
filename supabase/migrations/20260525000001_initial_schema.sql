-- PayWise Phase 1: core schema + identity layer
-- Uses gen_random_uuid() (native on Supabase Postgres 17; no uuid-ossp)

create type account_status as enum (
  'active',
  'pending_verification',
  'flagged',
  'suspended'
);

-- Users profile (1:1 with auth.users)
create table public.users (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  phone text,
  full_name text,
  onboarding_completed boolean not null default false,
  default_currency text not null default 'NGN',
  tax_residency text not null default 'NG',
  has_cac boolean not null default false,
  rc_number text,
  tin text,
  has_bvn_verified boolean not null default false,
  locale text not null default 'en',
  role_type text,
  payment_mix text,
  income_band text,
  is_vat_registered boolean not null default false,
  phone_verified_at timestamptz,
  whatsapp_phone text,
  whatsapp_verified_at timestamptz,
  bvn_hash text,
  nin_hash text,
  identity_verified_at timestamptz,
  identity_provider text,
  identity_verification_status text,
  account_status account_status not null default 'pending_verification',
  signup_fingerprint text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint users_phone_unique unique (phone),
  constraint users_whatsapp_phone_unique unique (whatsapp_phone),
  constraint users_bvn_hash_unique unique (bvn_hash)
);

create index users_email_idx on public.users (email);

create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.users (id) on delete cascade,
  business_name text not null,
  cac_type text,
  annual_turnover_estimate numeric,
  is_vat_registered boolean not null default false,
  is_small_company boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.bank_accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  provider text not null,
  provider_account_id text not null,
  bank_name text,
  account_name text,
  account_type text,
  currency text not null default 'NGN',
  last_synced_at timestamptz,
  created_at timestamptz not null default now(),
  constraint bank_accounts_provider_account_unique unique (provider, provider_account_id)
);

create table public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  account_id uuid references public.bank_accounts (id) on delete set null,
  amount numeric not null,
  currency text not null default 'NGN',
  amount_ngn numeric,
  fx_rate numeric,
  fx_rate_source text,
  merchant_raw text,
  merchant_normalized text,
  category text,
  category_confidence numeric,
  ai_categorized boolean not null default false,
  ai_model_used text,
  user_corrected boolean not null default false,
  date date not null,
  transaction_type text not null,
  source text not null,
  source_metadata jsonb default '{}',
  tax_relevant boolean not null default true,
  wht_deducted numeric,
  vat_charged numeric,
  notes text,
  rule_pack_version text,
  created_at timestamptz not null default now()
);

create index transactions_user_id_date_idx on public.transactions (user_id, date desc);

create table public.merchant_dictionary (
  id uuid primary key default gen_random_uuid(),
  merchant_normalized text not null unique,
  aliases text[] not null default '{}',
  default_category text not null,
  country text not null default 'NG',
  tax_relevant_default boolean not null default true,
  is_subscription boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.user_merchant_preferences (
  user_id uuid not null references public.users (id) on delete cascade,
  merchant_normalized text not null,
  preferred_category text not null,
  tax_relevant boolean,
  primary key (user_id, merchant_normalized)
);

create table public.invoices (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  invoice_number text not null,
  client_name text not null,
  client_email text,
  currency text not null default 'NGN',
  subtotal numeric not null,
  vat_amount numeric not null default 0,
  wht_amount numeric not null default 0,
  total numeric not null,
  status text not null default 'draft',
  due_date date,
  paid_date date,
  payment_link text,
  pdf_url text,
  created_at timestamptz not null default now()
);

create table public.tax_estimates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  period text not null,
  period_start date not null,
  period_end date not null,
  gross_income_ngn numeric not null default 0,
  deductible_expenses_ngn numeric not null default 0,
  taxable_income_ngn numeric not null default 0,
  estimated_pit_ngn numeric not null default 0,
  bracket text,
  wht_credit_ngn numeric not null default 0,
  vat_owed_ngn numeric not null default 0,
  rule_pack_version text not null,
  computed_at timestamptz not null default now()
);

create table public.ai_conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  channel text not null,
  thread_id text not null,
  role text not null,
  content text not null,
  context_snapshot jsonb,
  model_used text,
  input_tokens int,
  output_tokens int,
  cached_tokens int,
  cost_usd numeric,
  created_at timestamptz not null default now()
);

create table public.ai_cost_ledger (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users (id) on delete set null,
  model text not null,
  operation text not null,
  input_tokens int not null default 0,
  output_tokens int not null default 0,
  cached_tokens int not null default 0,
  batch boolean not null default false,
  cost_usd numeric not null default 0,
  created_at timestamptz not null default now()
);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  channel text not null,
  type text not null,
  payload jsonb not null default '{}',
  status text not null default 'pending',
  scheduled_for timestamptz,
  sent_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.audit_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users (id) on delete set null,
  action text not null,
  entity_type text,
  entity_id text,
  before jsonb,
  after jsonb,
  ip text,
  user_agent text,
  created_at timestamptz not null default now()
);

create table public.identity_verification_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  provider text not null,
  status text not null,
  metadata jsonb default '{}',
  created_at timestamptz not null default now()
);

-- Updated_at trigger
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger users_updated_at
  before update on public.users
  for each row execute function public.set_updated_at();

create trigger organizations_updated_at
  before update on public.organizations
  for each row execute function public.set_updated_at();

-- New auth user → public.users row
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, email, full_name, account_status)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'),
    'pending_verification'
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- RLS
alter table public.users enable row level security;
alter table public.organizations enable row level security;
alter table public.bank_accounts enable row level security;
alter table public.transactions enable row level security;
alter table public.merchant_dictionary enable row level security;
alter table public.user_merchant_preferences enable row level security;
alter table public.invoices enable row level security;
alter table public.tax_estimates enable row level security;
alter table public.ai_conversations enable row level security;
alter table public.ai_cost_ledger enable row level security;
alter table public.notifications enable row level security;
alter table public.audit_log enable row level security;
alter table public.identity_verification_attempts enable row level security;

create policy users_select_own on public.users for select using (auth.uid() = id);
create policy users_update_own on public.users for update using (auth.uid() = id);

create policy organizations_all_own on public.organizations
  for all using (auth.uid() = owner_id);

create policy bank_accounts_all_own on public.bank_accounts
  for all using (auth.uid() = user_id);

create policy transactions_all_own on public.transactions
  for all using (auth.uid() = user_id);

create policy merchant_dictionary_read on public.merchant_dictionary
  for select to authenticated using (true);

create policy user_merchant_preferences_all_own on public.user_merchant_preferences
  for all using (auth.uid() = user_id);

create policy invoices_all_own on public.invoices
  for all using (auth.uid() = user_id);

create policy tax_estimates_all_own on public.tax_estimates
  for all using (auth.uid() = user_id);

create policy ai_conversations_all_own on public.ai_conversations
  for all using (auth.uid() = user_id);

create policy ai_cost_ledger_select_own on public.ai_cost_ledger
  for select using (auth.uid() = user_id);

create policy notifications_all_own on public.notifications
  for all using (auth.uid() = user_id);

create policy audit_log_select_own on public.audit_log
  for select using (auth.uid() = user_id);

create policy identity_verification_attempts_all_own on public.identity_verification_attempts
  for all using (auth.uid() = user_id);

-- Realtime for transactions (dashboard stub)
alter publication supabase_realtime add table public.transactions;
