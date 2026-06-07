create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  id uuid primary key,
  provider text not null,
  email text not null,
  display_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  provider text not null,
  user_id uuid not null,
  owner_email text not null,
  title text not null,
  description text not null default '',
  type text not null default 'presentation' check (type in ('presentation', 'design', 'whiteboard', 'folder')),
  category text not null default 'Draft',
  thumbnail text not null default '/assets/generated-concept/integrated-scheduling-pipeline.png',
  visibility text not null default 'private' check (visibility in ('private', 'shared')),
  slide_count integer not null default 1 check (slide_count >= 0),
  accent text not null default '#14b8a6',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.slides (
  id uuid primary key default gen_random_uuid(),
  provider text not null,
  project_id uuid not null references public.projects(id) on delete cascade,
  user_id uuid not null,
  slide_index integer not null,
  title text not null default '',
  chapter text not null default '',
  html text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (provider, project_id, slide_index)
);

create table if not exists public.slide_containers (
  id uuid primary key default gen_random_uuid(),
  provider text not null,
  project_id uuid not null references public.projects(id) on delete cascade,
  user_id uuid not null,
  slide_index integer not null,
  kind text not null check (kind in ('html', 'svg', 'image')),
  name text not null default 'Container',
  html text not null default '',
  svg text not null default '',
  image_url text not null default '',
  x numeric not null default 50,
  y numeric not null default 50,
  width numeric not null default 30,
  height numeric not null default 18,
  z_index integer not null default 30,
  depth text not null default 'front' check (depth in ('front', 'back')),
  visible boolean not null default true,
  locked boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.assets (
  id uuid primary key default gen_random_uuid(),
  provider text not null,
  project_id uuid references public.projects(id) on delete cascade,
  user_id uuid not null,
  name text not null,
  kind text not null default 'slide',
  path text not null,
  size_bytes bigint not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.ai_generations (
  id uuid primary key default gen_random_uuid(),
  provider text not null,
  project_id uuid references public.projects(id) on delete cascade,
  user_id uuid not null,
  slide_index integer,
  mode text not null check (mode in ('html', 'svg')),
  prompt text not null,
  result text not null,
  model text not null default '',
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.projects enable row level security;
alter table public.slides enable row level security;
alter table public.slide_containers enable row level security;
alter table public.assets enable row level security;
alter table public.ai_generations enable row level security;

create policy "profiles_select_own" on public.profiles for select to authenticated
using ((select auth.uid()) = id);

create policy "profiles_insert_own" on public.profiles for insert to authenticated
with check ((select auth.uid()) = id);

create policy "profiles_update_own" on public.profiles for update to authenticated
using ((select auth.uid()) = id)
with check ((select auth.uid()) = id);

create policy "projects_select_own" on public.projects for select to authenticated
using ((select auth.uid()) = user_id);

create policy "projects_insert_own" on public.projects for insert to authenticated
with check ((select auth.uid()) = user_id);

create policy "projects_update_own" on public.projects for update to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "projects_delete_own" on public.projects for delete to authenticated
using ((select auth.uid()) = user_id);

create policy "slides_all_own" on public.slides for all to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "slide_containers_all_own" on public.slide_containers for all to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "assets_all_own" on public.assets for all to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "ai_generations_all_own" on public.ai_generations for all to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

