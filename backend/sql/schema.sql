create table if not exists public.uploads (
  id uuid primary key default gen_random_uuid(),
  bucket text not null,
  path text not null,
  original_name text,
  mime_type text,
  size_bytes bigint,
  public_url text,
  created_at timestamptz not null default now()
);

create table if not exists public.blueprints (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  data jsonb not null,
  created_at timestamptz not null default now()
);

create table if not exists public.waitlist (
  id uuid primary key default gen_random_uuid(),
  first_name text not null,
  last_name text not null,
  email text not null,
  studio_type text,
  volume text,
  created_at timestamptz not null default now()
);

create table if not exists public.contact_submissions (
  id uuid primary key default gen_random_uuid(),
  first_name text not null,
  last_name text not null,
  email text not null,
  role text,
  business text,
  channel text,
  volume text,
  challenge text,
  tier text,
  extra text,
  updates_opt_in boolean default false,
  created_at timestamptz not null default now()
);

create table if not exists public.signup_requests (
  id uuid primary key default gen_random_uuid(),
  first_name text not null,
  last_name text not null,
  email text not null,
  password_hash text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.password_reset_requests (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  order_id text not null unique,
  customer text not null,
  email text,
  memory text,
  formula text,
  emotion text,
  size text,
  total numeric,
  lead_weeks int,
  status text,
  dna jsonb,
  scores jsonb,
  quote jsonb,
  brief text,
  created_at timestamptz not null default now()
);

create table if not exists public.drop_logs (
  id uuid primary key default gen_random_uuid(),
  drop_id text not null unique,
  name text not null,
  formula text,
  units int,
  total int,
  price numeric,
  cogs numeric,
  revenue numeric,
  profit numeric,
  margin numeric,
  sell_thru numeric,
  month text,
  created_at timestamptz not null default now()
);

create table if not exists public.blueprint_library (
  id uuid primary key default gen_random_uuid(),
  bp_id text not null unique,
  name text not null,
  formula text,
  emotion text,
  notes text,
  tags text[],
  version int default 1,
  versions jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.shopify_listings (
  id uuid primary key default gen_random_uuid(),
  listing_id text not null unique,
  title text,
  handle text,
  data jsonb,
  published boolean default false,
  created_at timestamptz not null default now()
);
