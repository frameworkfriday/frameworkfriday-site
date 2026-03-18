-- forum_groups: cohort groups (e.g., "Forum Atlas")
create table if not exists forum_groups (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  description text,
  created_at timestamptz default now()
);

-- forum_group_members: junction — who belongs to which group
create table if not exists forum_group_members (
  forum_group_id uuid not null references forum_groups(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  joined_at timestamptz default now(),
  primary key (forum_group_id, user_id)
);

-- RLS
alter table forum_groups enable row level security;
alter table forum_group_members enable row level security;

-- Members see only groups they belong to
create policy "Members see their own groups"
  on forum_groups for select
  using (
    exists (
      select 1 from forum_group_members
      where forum_group_id = forum_groups.id
        and user_id = auth.uid()
    )
  );

-- Members see their own memberships
create policy "Members see their own memberships"
  on forum_group_members for select
  using (user_id = auth.uid());

-- Members can see other members in the same group
create policy "Members see group members"
  on forum_group_members for select
  using (
    exists (
      select 1 from forum_group_members fgm
      where fgm.forum_group_id = forum_group_members.forum_group_id
        and fgm.user_id = auth.uid()
    )
  );
