-- Initial social app schema & RLS
create extension if not exists "uuid-ossp";

-- Profiles
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text,
  bio text default '',
  avatar_url text,
  cover_url text,
  dob date,
  is_admin boolean default false,
  suspended boolean default false,
  upload_bytes bigint default 0,
  created_at timestamptz default now()
);

-- Helper function
create or replace function public.is_admin(uid uuid)
returns boolean language sql stable as $$
  select coalesce((select is_admin from public.profiles where id = uid), false);
$$;

-- Posts
create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid references public.profiles(id) on delete cascade,
  content text,
  images text[] default '{}',
  deleted boolean default false,
  deleted_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz
);
create index if not exists idx_posts_author on public.posts(author_id);
create index if not exists idx_posts_created_at on public.posts(created_at desc);

-- Comments
create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid references public.posts(id) on delete cascade,
  author_id uuid references public.profiles(id) on delete cascade,
  content text,
  image_url text,
  deleted boolean default false,
  deleted_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz
);
create index if not exists idx_comments_post on public.comments(post_id);
create index if not exists idx_comments_created_at on public.comments(created_at);

-- Replies
create table if not exists public.replies (
  id uuid primary key default gen_random_uuid(),
  comment_id uuid references public.comments(id) on delete cascade,
  author_id uuid references public.profiles(id) on delete cascade,
  content text,
  image_url text,
  deleted boolean default false,
  deleted_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz
);
create index if not exists idx_replies_comment on public.replies(comment_id);

-- Reaction enum & table
do $$ begin
  if not exists (select 1 from pg_type where typname = 'reaction_kind') then
    create type reaction_kind as enum ('like','love','haha','wow','sad','angry');
  end if;
end $$;
create table if not exists public.reactions (
  id bigserial primary key,
  entity_type text check (entity_type in ('post','comment','reply')),
  entity_id uuid not null,
  user_id uuid references public.profiles(id) on delete cascade,
  reaction_type reaction_kind not null,
  created_at timestamptz default now(),
  unique(entity_type, entity_id, user_id, reaction_type)
);
create index if not exists idx_reactions_entity on public.reactions(entity_id);
create index if not exists idx_reactions_user on public.reactions(user_id);

-- Audit logs (optional)
create table if not exists public.audit_logs (
  id bigserial primary key,
  user_id uuid references public.profiles(id) on delete set null,
  action text,
  entity_type text,
  entity_id uuid,
  meta jsonb,
  created_at timestamptz default now()
);

-- Enable RLS
alter table public.profiles enable row level security;
alter table public.posts enable row level security;
alter table public.comments enable row level security;
alter table public.replies enable row level security;
alter table public.reactions enable row level security;
alter table public.audit_logs enable row level security;

-- Policies (idempotent creation)
do $$ begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='profiles' and policyname='profiles_select_all') then
    create policy profiles_select_all on public.profiles for select using (true);
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='profiles' and policyname='profiles_insert_self') then
    create policy profiles_insert_self on public.profiles for insert with check (auth.uid() = id);
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='profiles' and policyname='profiles_update_self') then
    create policy profiles_update_self on public.profiles for update using (auth.uid() = id);
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='profiles' and policyname='profiles_update_admin') then
    create policy profiles_update_admin on public.profiles for update using (is_admin(auth.uid()));
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='posts' and policyname='posts_select_visible') then
    create policy posts_select_visible on public.posts for select using (not deleted or is_admin(auth.uid()));
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='posts' and policyname='posts_insert_self') then
    create policy posts_insert_self on public.posts for insert with check (auth.uid() = author_id);
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='posts' and policyname='posts_update_owner_admin') then
    create policy posts_update_owner_admin on public.posts for update using (auth.uid() = author_id or is_admin(auth.uid()));
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='posts' and policyname='posts_delete_owner_admin') then
    create policy posts_delete_owner_admin on public.posts for delete using (auth.uid() = author_id or is_admin(auth.uid()));
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='comments' and policyname='comments_select_all') then
    create policy comments_select_all on public.comments for select using (true);
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='comments' and policyname='comments_insert_self') then
    create policy comments_insert_self on public.comments for insert with check (auth.uid() = author_id);
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='comments' and policyname='comments_modify_owner_admin') then
    create policy comments_modify_owner_admin on public.comments for all using (auth.uid() = author_id or is_admin(auth.uid()));
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='replies' and policyname='replies_select_all') then
    create policy replies_select_all on public.replies for select using (true);
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='replies' and policyname='replies_insert_self') then
    create policy replies_insert_self on public.replies for insert with check (auth.uid() = author_id);
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='replies' and policyname='replies_modify_owner_admin') then
    create policy replies_modify_owner_admin on public.replies for all using (auth.uid() = author_id or is_admin(auth.uid()));
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='reactions' and policyname='reactions_select_all') then
    create policy reactions_select_all on public.reactions for select using (true);
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='reactions' and policyname='reactions_insert_self') then
    create policy reactions_insert_self on public.reactions for insert with check (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='reactions' and policyname='reactions_delete_self') then
    create policy reactions_delete_self on public.reactions for delete using (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='reactions' and policyname='reactions_admin_all') then
    create policy reactions_admin_all on public.reactions for all using (is_admin(auth.uid()));
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='audit_logs' and policyname='audit_select_admin') then
    create policy audit_select_admin on public.audit_logs for select using (is_admin(auth.uid()));
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='audit_logs' and policyname='audit_insert_self') then
    create policy audit_insert_self on public.audit_logs for insert with check (auth.uid() = user_id);
  end if;
end $$;
