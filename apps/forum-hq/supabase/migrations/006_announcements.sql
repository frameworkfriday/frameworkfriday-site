-- announcements: admin-to-member broadcast (one-way, no replies)
create table if not exists announcements (
  id uuid primary key default gen_random_uuid(),
  forum_group_id uuid references forum_groups(id) on delete cascade,  -- null = global (all groups)
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

-- RLS
alter table announcements enable row level security;

-- Members see announcements for their group OR global announcements (forum_group_id IS NULL)
create policy "Members see their group announcements and global"
  on announcements for select
  using (
    forum_group_id is null
    or exists (
      select 1 from forum_group_members
      where forum_group_id = announcements.forum_group_id
        and user_id = auth.uid()
    )
  );
