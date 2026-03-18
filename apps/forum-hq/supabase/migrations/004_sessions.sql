-- sessions: Forum group sessions with video call links
create table if not exists sessions (
  id uuid primary key default gen_random_uuid(),
  forum_group_id uuid not null references forum_groups(id) on delete cascade,
  title text not null,
  description text,
  starts_at timestamptz not null,
  duration_minutes int default 90,
  video_call_url text,
  created_at timestamptz default now()
);

-- RLS
alter table sessions enable row level security;

-- Members see sessions for their groups only
create policy "Members see their group sessions"
  on sessions for select
  using (
    exists (
      select 1 from forum_group_members
      where forum_group_id = sessions.forum_group_id
        and user_id = auth.uid()
    )
  );
