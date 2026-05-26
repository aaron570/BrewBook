-- ============================================================
-- Coffee Stand Recipe App — Initial Schema
-- Run this in: Supabase Dashboard → SQL Editor
-- ============================================================

create extension if not exists "uuid-ossp";

-- ── Organizations (coffee stands / tenants) ──────────────────
create table organizations (
  id         uuid primary key default uuid_generate_v4(),
  name       text not null,
  slug       text unique not null,
  logo_url   text,
  created_at timestamptz default now()
);

-- ── Profiles (one per auth user, auto-created on signup) ─────
create table profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  full_name  text,
  avatar_url text,
  created_at timestamptz default now()
);

-- ── Organization members ──────────────────────────────────────
create table organization_members (
  id         uuid primary key default uuid_generate_v4(),
  org_id     uuid not null references organizations(id) on delete cascade,
  user_id    uuid not null references profiles(id) on delete cascade,
  role       text not null check (role in ('owner', 'manager', 'barista')),
  created_at timestamptz default now(),
  unique(org_id, user_id)
);

-- ── Drink categories ──────────────────────────────────────────
create table categories (
  id         uuid primary key default uuid_generate_v4(),
  org_id     uuid not null references organizations(id) on delete cascade,
  name       text not null,
  color      text default '#6F4E37',
  sort_order int default 0,
  created_at timestamptz default now()
);

-- ── Recipes ───────────────────────────────────────────────────
create table recipes (
  id                uuid primary key default uuid_generate_v4(),
  org_id            uuid not null references organizations(id) on delete cascade,
  category_id       uuid references categories(id) on delete set null,
  title             text not null,
  description       text,
  cover_image_url   text,
  difficulty        text check (difficulty in ('easy', 'medium', 'hard')) default 'easy',
  prep_time_minutes int,
  is_published      boolean default false,
  sort_order        int default 0,
  created_by        uuid references profiles(id) on delete set null,
  created_at        timestamptz default now(),
  updated_at        timestamptz default now()
);

-- ── Recipe ingredients ────────────────────────────────────────
create table recipe_ingredients (
  id         uuid primary key default uuid_generate_v4(),
  recipe_id  uuid not null references recipes(id) on delete cascade,
  name       text not null,
  quantity   text,
  unit       text,
  sort_order int default 0
);

-- ── Recipe steps ──────────────────────────────────────────────
create table recipe_steps (
  id          uuid primary key default uuid_generate_v4(),
  recipe_id   uuid not null references recipes(id) on delete cascade,
  step_number int not null,
  instruction text not null,
  image_url   text,
  tip         text
);

-- ── Auto-update updated_at ────────────────────────────────────
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger recipes_updated_at
  before update on recipes
  for each row execute function update_updated_at();

-- ── Auto-create profile on signup ─────────────────────────────
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into profiles (id, full_name)
  values (new.id, new.raw_user_meta_data->>'full_name');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- ── Row Level Security ────────────────────────────────────────
alter table organizations       enable row level security;
alter table profiles            enable row level security;
alter table organization_members enable row level security;
alter table categories          enable row level security;
alter table recipes             enable row level security;
alter table recipe_ingredients  enable row level security;
alter table recipe_steps        enable row level security;

-- Profiles
create policy "own read"   on profiles for select using (auth.uid() = id);
create policy "own update" on profiles for update using (auth.uid() = id);

-- Organizations
create policy "members read"       on organizations for select
  using (exists (select 1 from organization_members where org_id = organizations.id and user_id = auth.uid()));
create policy "owners update"      on organizations for update
  using (exists (select 1 from organization_members where org_id = organizations.id and user_id = auth.uid() and role = 'owner'));
create policy "authenticated create" on organizations for insert
  with check (auth.uid() is not null);

-- Organization members
create policy "org members read" on organization_members for select
  using (exists (select 1 from organization_members om where om.org_id = organization_members.org_id and om.user_id = auth.uid()));
create policy "self or manager insert" on organization_members for insert
  with check (
    auth.uid() = user_id
    or exists (select 1 from organization_members om where om.org_id = organization_members.org_id and om.user_id = auth.uid() and om.role in ('owner', 'manager'))
  );

-- Categories
create policy "members read"         on categories for select
  using (exists (select 1 from organization_members where org_id = categories.org_id and user_id = auth.uid()));
create policy "owners managers write" on categories for all
  using (exists (select 1 from organization_members where org_id = categories.org_id and user_id = auth.uid() and role in ('owner', 'manager')));

-- Recipes
create policy "members read"          on recipes for select
  using (exists (select 1 from organization_members where org_id = recipes.org_id and user_id = auth.uid()));
create policy "owners managers write"  on recipes for all
  using (exists (select 1 from organization_members where org_id = recipes.org_id and user_id = auth.uid() and role in ('owner', 'manager')));

-- Ingredients
create policy "members read" on recipe_ingredients for select
  using (exists (select 1 from recipes r join organization_members om on om.org_id = r.org_id where r.id = recipe_ingredients.recipe_id and om.user_id = auth.uid()));
create policy "owners managers write" on recipe_ingredients for all
  using (exists (select 1 from recipes r join organization_members om on om.org_id = r.org_id where r.id = recipe_ingredients.recipe_id and om.user_id = auth.uid() and om.role in ('owner', 'manager')));

-- Steps
create policy "members read" on recipe_steps for select
  using (exists (select 1 from recipes r join organization_members om on om.org_id = r.org_id where r.id = recipe_steps.recipe_id and om.user_id = auth.uid()));
create policy "owners managers write" on recipe_steps for all
  using (exists (select 1 from recipes r join organization_members om on om.org_id = r.org_id where r.id = recipe_steps.recipe_id and om.user_id = auth.uid() and om.role in ('owner', 'manager')));
