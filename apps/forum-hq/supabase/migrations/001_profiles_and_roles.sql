-- profiles: extends auth.users with Forum HQ member data
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  first_name text not null,
  last_name text not null,
  email text not null,
  business_name text,
  role_title text,
  avatar_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Auto-update updated_at
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger profiles_updated_at
  before update on profiles
  for each row execute function update_updated_at();

-- Trigger to auto-create profile row on new auth user signup
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into profiles (id, first_name, last_name, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'first_name', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'last_name', ''),
    new.email
  )
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- user_roles: admin role management (checked in middleware via service role key)
create table if not exists user_roles (
  user_id uuid not null references profiles(id) on delete cascade,
  role text not null check (role in ('admin', 'member')),
  created_at timestamptz default now(),
  primary key (user_id, role)
);

-- RLS
alter table profiles enable row level security;
alter table user_roles enable row level security;

-- profiles: members can see profiles of people in their same group
-- admins can see/edit all
create policy "Members can read profiles in their groups"
  on profiles for select
  using (
    id = auth.uid()
    or exists (
      select 1 from forum_group_members fgm1
      join forum_group_members fgm2 on fgm1.forum_group_id = fgm2.forum_group_id
      where fgm1.user_id = auth.uid()
        and fgm2.user_id = profiles.id
    )
  );

create policy "Users can update their own profile"
  on profiles for update
  using (id = auth.uid());

-- user_roles: only readable via service role (admin middleware check)
-- No anon/user policies needed — middleware uses service role key
