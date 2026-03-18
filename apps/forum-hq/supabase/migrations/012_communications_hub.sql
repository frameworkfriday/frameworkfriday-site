-- Communications Hub: posts, comments, notifications, preferences
-- Replaces one-way announcements with bidirectional communication

-- 1. Posts — unified content model
create table if not exists posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references profiles(id),
  title text,
  body text not null,
  post_type text not null default 'discussion' check (post_type in ('announcement', 'discussion', 'question')),
  is_pinned boolean default false,
  is_global boolean default false,
  edited_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create trigger posts_updated_at
  before update on posts
  for each row execute function update_updated_at();

-- 2. Post audiences — multi-group targeting
create table if not exists post_audiences (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references posts(id) on delete cascade,
  forum_group_id uuid not null references forum_groups(id) on delete cascade,
  unique(post_id, forum_group_id)
);

-- 3. Comments
create table if not exists comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references posts(id) on delete cascade,
  author_id uuid not null references profiles(id),
  body text not null,
  edited_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create trigger comments_updated_at
  before update on comments
  for each row execute function update_updated_at();

-- 4. Notifications
create table if not exists notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  type text not null check (type in ('new_post', 'new_comment', 'mention', 'new_event')),
  title text not null,
  body text,
  link text,
  post_id uuid references posts(id) on delete cascade,
  actor_id uuid references profiles(id),
  read_at timestamptz,
  created_at timestamptz default now()
);

-- 5. Notification preferences
create table if not exists notification_preferences (
  user_id uuid primary key references profiles(id) on delete cascade,
  email_announcements boolean default true,
  email_direct_mentions boolean default true,
  email_comment_replies boolean default true,
  email_new_events boolean default true,
  email_group_posts boolean default false,
  in_app_group_posts boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create trigger notification_preferences_updated_at
  before update on notification_preferences
  for each row execute function update_updated_at();

-- Indexes
create index idx_posts_created on posts(created_at desc);
create index idx_posts_author on posts(author_id);
create index idx_post_audiences_post on post_audiences(post_id);
create index idx_post_audiences_group on post_audiences(forum_group_id);
create index idx_comments_post on comments(post_id, created_at);
create index idx_comments_author on comments(author_id);
create index idx_notifications_user on notifications(user_id, read_at, created_at desc);
create index idx_notifications_unread on notifications(user_id, created_at desc) where read_at is null;

-- RLS
alter table posts enable row level security;
alter table post_audiences enable row level security;
alter table comments enable row level security;
alter table notifications enable row level security;
alter table notification_preferences enable row level security;

-- Posts: users see global posts + posts targeted to their groups
create policy "Users see global and group posts"
  on posts for select
  using (
    is_global = true
    or exists (
      select 1 from post_audiences pa
      join forum_group_members fgm on fgm.forum_group_id = pa.forum_group_id
      where pa.post_id = posts.id
        and fgm.user_id = auth.uid()
    )
    or author_id = auth.uid()
  );

-- Post audiences: same visibility as posts
create policy "Users see audiences for visible posts"
  on post_audiences for select
  using (
    exists (
      select 1 from forum_group_members fgm
      where fgm.forum_group_id = post_audiences.forum_group_id
        and fgm.user_id = auth.uid()
    )
  );

-- Comments: visible if the parent post is visible
create policy "Users see comments on visible posts"
  on comments for select
  using (
    exists (
      select 1 from posts p
      where p.id = comments.post_id
        and (
          p.is_global = true
          or exists (
            select 1 from post_audiences pa
            join forum_group_members fgm on fgm.forum_group_id = pa.forum_group_id
            where pa.post_id = p.id
              and fgm.user_id = auth.uid()
          )
          or p.author_id = auth.uid()
        )
    )
  );

-- Notifications: users see only their own
create policy "Users see own notifications"
  on notifications for select
  using (user_id = auth.uid());

-- Notification preferences: users see/edit only their own
create policy "Users see own preferences"
  on notification_preferences for select
  using (user_id = auth.uid());

create policy "Users update own preferences"
  on notification_preferences for update
  using (user_id = auth.uid());

create policy "Users insert own preferences"
  on notification_preferences for insert
  with check (user_id = auth.uid());

-- Migrate existing announcements to posts
insert into posts (author_id, title, body, post_type, is_pinned, is_global, created_at, updated_at)
select
  author_id,
  title,
  body,
  'announcement',
  is_pinned,
  forum_group_id is null,
  created_at,
  updated_at
from announcements
where author_id is not null;

-- Create post_audiences for group-scoped announcements
insert into post_audiences (post_id, forum_group_id)
select p.id, a.forum_group_id
from announcements a
join posts p on p.title = a.title
  and p.body = a.body
  and p.author_id = a.author_id
  and p.created_at = a.created_at
where a.forum_group_id is not null;
