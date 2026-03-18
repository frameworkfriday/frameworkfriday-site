-- onboarding_items: the 9-step checklist (global, same for all groups)
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

-- onboarding_progress: per-user completion state
create table if not exists onboarding_progress (
  user_id uuid not null references profiles(id) on delete cascade,
  item_id uuid not null references onboarding_items(id) on delete cascade,
  completed_at timestamptz,
  completed_by uuid references profiles(id),
  primary key (user_id, item_id)
);

-- RLS
alter table onboarding_items enable row level security;
alter table onboarding_progress enable row level security;

-- All authenticated users can read checklist items
create policy "Authenticated users read onboarding items"
  on onboarding_items for select
  using (auth.uid() is not null);

-- Members read/write their own progress
create policy "Members read their own progress"
  on onboarding_progress for select
  using (user_id = auth.uid());

create policy "Members update their own progress"
  on onboarding_progress for insert
  with check (user_id = auth.uid());

create policy "Members can mark items complete"
  on onboarding_progress for update
  using (user_id = auth.uid());

-- Seed the 9 onboarding checklist items
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
