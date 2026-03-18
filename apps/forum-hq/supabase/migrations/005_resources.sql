-- resources: curated link directory (global — all members see the same links)
create table if not exists resources (
  id uuid primary key default gen_random_uuid(),
  category text not null check (category in ('getting_started', 'setup', 'academy', 'communication', 'sessions')),
  title text not null,
  description text,
  url text not null,
  position int default 0,
  created_at timestamptz default now()
);

-- RLS
alter table resources enable row level security;

-- All authenticated users can read resources
create policy "Authenticated users read resources"
  on resources for select
  using (auth.uid() is not null);
