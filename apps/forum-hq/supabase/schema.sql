-- ============================================================
-- Forum HQ — Full Schema
-- Run this entire file in Supabase SQL Editor (one paste)
-- ============================================================

-- ---- Utility: updated_at trigger ----
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;


-- ---- 1. PROFILES ----
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  first_name text not null default '',
  last_name text not null default '',
  email text not null default '',
  business_name text,
  role_title text,
  avatar_url text,
  linkedin_url text,
  website_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create trigger profiles_updated_at
  before update on profiles
  for each row execute function update_updated_at();

-- Auto-create profile on new auth user
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into profiles (id, first_name, last_name, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'first_name', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'last_name', ''),
    coalesce(new.email, '')
  )
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();


-- ---- 2. USER ROLES (admin management) ----
create table if not exists user_roles (
  user_id uuid not null references profiles(id) on delete cascade,
  role text not null check (role in ('admin', 'member')),
  created_at timestamptz default now(),
  primary key (user_id, role)
);


-- ---- 3. FORUM GROUPS ----
create table if not exists forum_groups (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  description text,
  created_at timestamptz default now()
);

create table if not exists forum_group_members (
  forum_group_id uuid not null references forum_groups(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  joined_at timestamptz default now(),
  role text not null default 'member' check (role in ('member', 'facilitator')),
  primary key (forum_group_id, user_id)
);


-- ---- 4. ONBOARDING ----
create table if not exists onboarding_items (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  action_url text,
  action_label text,
  position int default 0,
  is_required boolean default true,
  created_at timestamptz default now()
);

create table if not exists onboarding_progress (
  user_id uuid not null references profiles(id) on delete cascade,
  item_id uuid not null references onboarding_items(id) on delete cascade,
  completed_at timestamptz,
  completed_by uuid references profiles(id),
  primary key (user_id, item_id)
);

-- Seed the 9 checklist items
insert into onboarding_items (title, description, action_label, position, is_required) values
  ('Watch the onboarding video', 'Your introduction to Forum — watch before Session 1.', 'Watch video', 1, true),
  ('Join the group communication channel', 'Where your Forum group connects between sessions.', 'Join now', 2, true),
  ('Read the Forum Orientation Guide', 'Everything you need to know before your first session.', 'Read guide', 3, true),
  ('Set up Claude Code (L2)', 'Your AI operating system — the foundation of Forum work.', 'Setup guide', 4, true),
  ('Create and connect your GitHub repo', 'Where your Company OS instance will live.', 'Setup guide', 5, true),
  ('Complete Foundations Pod: Identity', 'Define your operator identity and context.', null, 6, true),
  ('Complete Foundations Pod: Business Stage', 'Map your current business stage and constraints.', null, 7, true),
  ('Complete Foundations Pod: Goals', 'Set your 90-day goals for Forum.', null, 8, true),
  ('Draft your first commitment', 'The first real deliverable — bring it to Session 1.', null, 9, true);


-- ---- 5. SESSIONS ----
create table if not exists sessions (
  id uuid primary key default gen_random_uuid(),
  forum_group_id uuid references forum_groups(id) on delete cascade,
  title text not null,
  description text,
  session_type text not null default 'forum_session' check (session_type in ('forum_session', 'office_hours', 'ad_hoc')),
  starts_at timestamptz not null,
  duration_minutes int default 90,
  video_call_url text,
  facilitator_id uuid references profiles(id) on delete set null,
  created_at timestamptz default now()
);


-- ---- 6. RESOURCES ----
create table if not exists resources (
  id uuid primary key default gen_random_uuid(),
  category text not null check (category in ('getting_started', 'setup', 'academy', 'communication', 'sessions')),
  title text not null,
  description text,
  url text not null,
  position int default 0,
  created_at timestamptz default now()
);


-- ---- 7. ANNOUNCEMENTS ----
create table if not exists announcements (
  id uuid primary key default gen_random_uuid(),
  forum_group_id uuid references forum_groups(id) on delete cascade,
  title text not null,
  body text not null,
  author_id uuid references profiles(id),
  is_pinned boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create trigger announcements_updated_at
  before update on announcements
  for each row execute function update_updated_at();


-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

alter table profiles enable row level security;
alter table user_roles enable row level security;
alter table forum_groups enable row level security;
alter table forum_group_members enable row level security;
alter table onboarding_items enable row level security;
alter table onboarding_progress enable row level security;
alter table sessions enable row level security;
alter table resources enable row level security;
alter table announcements enable row level security;

-- profiles: own row + group peers
create policy "Users read their own profile"
  on profiles for select using (id = auth.uid());

create policy "Users read profiles in their groups"
  on profiles for select
  using (
    exists (
      select 1 from forum_group_members a
      join forum_group_members b on a.forum_group_id = b.forum_group_id
      where a.user_id = auth.uid() and b.user_id = profiles.id
    )
  );

create policy "Users update their own profile"
  on profiles for update using (id = auth.uid());

-- forum_groups: members see their groups only
create policy "Members see their groups"
  on forum_groups for select
  using (
    exists (
      select 1 from forum_group_members
      where forum_group_id = forum_groups.id and user_id = auth.uid()
    )
  );

-- forum_group_members: see own group membership + peers
create policy "Members see their group memberships"
  on forum_group_members for select
  using (
    exists (
      select 1 from forum_group_members fgm
      where fgm.forum_group_id = forum_group_members.forum_group_id
        and fgm.user_id = auth.uid()
    )
  );

-- onboarding_items: all authenticated users
create policy "Authenticated users read onboarding items"
  on onboarding_items for select using (auth.uid() is not null);

-- onboarding_progress: own rows only
create policy "Members read own progress"
  on onboarding_progress for select using (user_id = auth.uid());

create policy "Members insert own progress"
  on onboarding_progress for insert with check (user_id = auth.uid());

create policy "Members update own progress"
  on onboarding_progress for update using (user_id = auth.uid());

-- sessions: group-scoped
create policy "Members see their group sessions"
  on sessions for select
  using (
    exists (
      select 1 from forum_group_members
      where forum_group_id = sessions.forum_group_id and user_id = auth.uid()
    )
  );

-- resources: all authenticated
create policy "Authenticated users read resources"
  on resources for select using (auth.uid() is not null);

-- announcements: group-scoped or global (null group_id)
create policy "Members see announcements"
  on announcements for select
  using (
    forum_group_id is null
    or exists (
      select 1 from forum_group_members
      where forum_group_id = announcements.forum_group_id and user_id = auth.uid()
    )
  );
