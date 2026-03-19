-- 015: Member feedback / friction capture
-- Allows Forum members to submit feedback, friction, questions, and praise.
-- Ladders up to facilitators (group-scoped) and admins (all).

create table if not exists member_feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  forum_group_id uuid references forum_groups(id) on delete set null,

  -- Content
  feedback_type text not null check (feedback_type in ('friction', 'suggestion', 'question', 'praise')),
  subject text not null,
  body text not null,
  context text, -- where in the experience this came from (e.g., "onboarding step 3", "session 2", "workflow-strategist")

  -- Severity (for friction type)
  severity text check (severity in ('blocker', 'frustrating', 'minor')),

  -- Routing and status
  status text not null default 'new' check (status in ('new', 'acknowledged', 'in-progress', 'resolved', 'wont-fix')),
  assigned_to uuid references profiles(id) on delete set null,
  facilitator_note text,
  resolution_note text,

  -- Timestamps
  created_at timestamptz default now(),
  acknowledged_at timestamptz,
  resolved_at timestamptz
);

-- Indexes
-- Facilitator view: filter by group + status
create index if not exists member_feedback_group_status_idx
  on member_feedback (forum_group_id, status);

-- Admin view: filter by status across all groups
create index if not exists member_feedback_status_idx
  on member_feedback (status);

-- RLS
alter table member_feedback enable row level security;

-- 1. Members can insert their own feedback
create policy "Members can submit feedback"
  on member_feedback for insert
  with check (user_id = auth.uid());

-- 2. Members can read their own feedback
create policy "Members can read their own feedback"
  on member_feedback for select
  using (user_id = auth.uid());

-- 3. Admins can read all feedback
create policy "Admins can read all feedback"
  on member_feedback for select
  using (
    exists (
      select 1 from user_roles
      where user_id = auth.uid()
        and role = 'admin'
    )
  );

-- 4. Admins can update all feedback (status, assignment, notes)
create policy "Admins can update all feedback"
  on member_feedback for update
  using (
    exists (
      select 1 from user_roles
      where user_id = auth.uid()
        and role = 'admin'
    )
  );

-- 5. Facilitators can read feedback from members in their group(s)
create policy "Facilitators can read feedback from their group members"
  on member_feedback for select
  using (
    exists (
      select 1 from forum_group_members facilitator_membership
      where facilitator_membership.user_id = auth.uid()
        and facilitator_membership.role = 'facilitator'
        and facilitator_membership.forum_group_id = member_feedback.forum_group_id
    )
  );

-- 6. Facilitators can update feedback from members in their group(s)
create policy "Facilitators can update feedback from their group members"
  on member_feedback for update
  using (
    exists (
      select 1 from forum_group_members facilitator_membership
      where facilitator_membership.user_id = auth.uid()
        and facilitator_membership.role = 'facilitator'
        and facilitator_membership.forum_group_id = member_feedback.forum_group_id
    )
  );

-- 7. Members can update their own feedback only while status is 'new'
create policy "Members can edit their own feedback before it is picked up"
  on member_feedback for update
  using (
    user_id = auth.uid()
    and status = 'new'
  );
