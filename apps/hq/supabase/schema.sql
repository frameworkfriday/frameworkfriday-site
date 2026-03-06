-- Sprint HQ Database Schema
-- Run this in Supabase SQL Editor after creating the project

-- ============================================
-- 1. TABLES
-- ============================================

-- Sprint Templates (admin-managed, shared config)
create table sprint_templates (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  is_active boolean not null default true,
  schedule_config jsonb not null default '[]'::jsonb,
  project_kit_url text,
  submit_work_url text,
  submit_work_embed_url text,
  booking_url_day4 text,
  claude_signup_url text,
  setup_companion_video_url text,
  daily_workflow_video_url text,
  conversation_starters_video_url text,
  conversation_starter_day1_url text,
  conversation_starter_day2_url text,
  conversation_starter_day3_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Sprint Templates Public (read-only mirror for public pages)
create table sprint_templates_public (
  id uuid primary key,
  name text not null,
  is_active boolean not null default true,
  schedule_config jsonb not null default '[]'::jsonb,
  project_kit_url text,
  submit_work_url text,
  submit_work_embed_url text,
  booking_url_day4 text,
  claude_signup_url text,
  setup_companion_video_url text,
  daily_workflow_video_url text,
  conversation_starters_video_url text,
  conversation_starter_day1_url text,
  conversation_starter_day2_url text,
  conversation_starter_day3_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Sprints (individual cohort instances)
create table sprints (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  start_date date not null,
  timezone text not null default 'America/New_York',
  session_time text default '13:00',
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  template_id uuid references sprint_templates(id) on delete set null,
  zoom_url_day1 text,
  zoom_url_day2 text,
  zoom_url_day3 text,
  calendar_url text,
  community_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Sprint Daily Recaps
create table sprint_daily_recaps (
  id uuid primary key default gen_random_uuid(),
  sprint_id uuid not null references sprints(id) on delete cascade,
  day_number integer not null check (day_number between 1 and 4),
  is_published boolean not null default false,
  published_at timestamptz,
  published_by uuid,
  recording_url text,
  recap_summary text,
  key_takeaways text,
  resources jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(sprint_id, day_number)
);

-- User Roles (admin access control)
create table user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'admin' check (role in ('admin')),
  created_at timestamptz not null default now(),
  unique(user_id, role)
);

-- Global Assets (optional, for shared resources)
create table global_assets (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  value text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================
-- 2. INDEXES
-- ============================================

create index idx_sprints_slug on sprints(slug);
create index idx_sprints_status on sprints(status);
create index idx_sprints_start_date on sprints(start_date);
create index idx_sprint_daily_recaps_sprint_id on sprint_daily_recaps(sprint_id);
create index idx_user_roles_user_id on user_roles(user_id);

-- ============================================
-- 3. AUTO-SYNC TRIGGER (templates → templates_public)
-- ============================================

create or replace function sync_template_to_public()
returns trigger as $$
begin
  insert into sprint_templates_public (
    id, name, is_active, schedule_config,
    project_kit_url, submit_work_url, submit_work_embed_url,
    booking_url_day4, claude_signup_url,
    setup_companion_video_url, daily_workflow_video_url,
    conversation_starters_video_url,
    conversation_starter_day1_url, conversation_starter_day2_url,
    conversation_starter_day3_url,
    created_at, updated_at
  ) values (
    NEW.id, NEW.name, NEW.is_active, NEW.schedule_config,
    NEW.project_kit_url, NEW.submit_work_url, NEW.submit_work_embed_url,
    NEW.booking_url_day4, NEW.claude_signup_url,
    NEW.setup_companion_video_url, NEW.daily_workflow_video_url,
    NEW.conversation_starters_video_url,
    NEW.conversation_starter_day1_url, NEW.conversation_starter_day2_url,
    NEW.conversation_starter_day3_url,
    NEW.created_at, NEW.updated_at
  )
  on conflict (id) do update set
    name = EXCLUDED.name,
    is_active = EXCLUDED.is_active,
    schedule_config = EXCLUDED.schedule_config,
    project_kit_url = EXCLUDED.project_kit_url,
    submit_work_url = EXCLUDED.submit_work_url,
    submit_work_embed_url = EXCLUDED.submit_work_embed_url,
    booking_url_day4 = EXCLUDED.booking_url_day4,
    claude_signup_url = EXCLUDED.claude_signup_url,
    setup_companion_video_url = EXCLUDED.setup_companion_video_url,
    daily_workflow_video_url = EXCLUDED.daily_workflow_video_url,
    conversation_starters_video_url = EXCLUDED.conversation_starters_video_url,
    conversation_starter_day1_url = EXCLUDED.conversation_starter_day1_url,
    conversation_starter_day2_url = EXCLUDED.conversation_starter_day2_url,
    conversation_starter_day3_url = EXCLUDED.conversation_starter_day3_url,
    updated_at = EXCLUDED.updated_at;
  return NEW;
end;
$$ language plpgsql security definer;

create trigger on_template_change
  after insert or update on sprint_templates
  for each row execute function sync_template_to_public();

-- Delete sync
create or replace function delete_template_public()
returns trigger as $$
begin
  delete from sprint_templates_public where id = OLD.id;
  return OLD;
end;
$$ language plpgsql security definer;

create trigger on_template_delete
  after delete on sprint_templates
  for each row execute function delete_template_public();

-- ============================================
-- 4. UPDATED_AT TRIGGER
-- ============================================

create or replace function update_updated_at()
returns trigger as $$
begin
  NEW.updated_at = now();
  return NEW;
end;
$$ language plpgsql;

create trigger set_updated_at before update on sprint_templates
  for each row execute function update_updated_at();
create trigger set_updated_at before update on sprints
  for each row execute function update_updated_at();
create trigger set_updated_at before update on sprint_daily_recaps
  for each row execute function update_updated_at();

-- ============================================
-- 5. ROW LEVEL SECURITY (RLS)
-- ============================================

alter table sprint_templates enable row level security;
alter table sprint_templates_public enable row level security;
alter table sprints enable row level security;
alter table sprint_daily_recaps enable row level security;
alter table user_roles enable row level security;
alter table global_assets enable row level security;

-- Public read access for participant-facing data
create policy "Public can read published sprints"
  on sprints for select
  using (status = 'published');

create policy "Public can read templates_public"
  on sprint_templates_public for select
  using (true);

create policy "Public can read published recaps"
  on sprint_daily_recaps for select
  using (is_published = true);

-- Admin full access (authenticated users with admin role)
create policy "Admins have full access to sprints"
  on sprints for all
  using (
    auth.uid() in (select user_id from user_roles where role = 'admin')
  );

create policy "Admins have full access to templates"
  on sprint_templates for all
  using (
    auth.uid() in (select user_id from user_roles where role = 'admin')
  );

create policy "Admins have full access to recaps"
  on sprint_daily_recaps for all
  using (
    auth.uid() in (select user_id from user_roles where role = 'admin')
  );

create policy "Admins can read user_roles"
  on user_roles for select
  using (
    auth.uid() in (select user_id from user_roles where role = 'admin')
  );

create policy "Admins can manage user_roles"
  on user_roles for all
  using (
    auth.uid() in (select user_id from user_roles where role = 'admin')
  );

create policy "Admins can manage global_assets"
  on global_assets for all
  using (
    auth.uid() in (select user_id from user_roles where role = 'admin')
  );

-- Service role bypasses RLS, so middleware admin checks work

-- ============================================
-- 6. STORAGE BUCKETS
-- ============================================

insert into storage.buckets (id, name, public)
values
  ('project-kits', 'project-kits', true),
  ('conversation-starters', 'conversation-starters', true),
  ('recap-resources', 'recap-resources', true);

-- Public read access for all storage buckets
create policy "Public read access" on storage.objects
  for select using (bucket_id in ('project-kits', 'conversation-starters', 'recap-resources'));

-- Admin upload access
create policy "Admin upload access" on storage.objects
  for insert with check (
    auth.uid() in (select user_id from user_roles where role = 'admin')
    and bucket_id in ('project-kits', 'conversation-starters', 'recap-resources')
  );

create policy "Admin update access" on storage.objects
  for update using (
    auth.uid() in (select user_id from user_roles where role = 'admin')
    and bucket_id in ('project-kits', 'conversation-starters', 'recap-resources')
  );

create policy "Admin delete access" on storage.objects
  for delete using (
    auth.uid() in (select user_id from user_roles where role = 'admin')
    and bucket_id in ('project-kits', 'conversation-starters', 'recap-resources')
  );
