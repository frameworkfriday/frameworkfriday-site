-- 020_direct_messages.sql
-- Direct messaging system: conversations, participants, and messages

-- conversations table
create table conversations (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now()
);

-- conversation_participants table
create table conversation_participants (
  conversation_id uuid not null references conversations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (conversation_id, user_id)
);

-- direct_messages table
create table direct_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references conversations(id) on delete cascade,
  sender_id uuid not null references auth.users(id),
  body text not null,
  created_at timestamptz not null default now(),
  edited_at timestamptz
);

-- Indexes
create index idx_dm_conversation on direct_messages(conversation_id, created_at);
create index idx_conversation_participants on conversation_participants(user_id);

-- Enable RLS on all three tables
alter table conversations enable row level security;
alter table conversation_participants enable row level security;
alter table direct_messages enable row level security;

-- RLS policies: conversations
create policy "Users can view conversations they participate in"
  on conversations for select
  using (
    exists (
      select 1 from conversation_participants
      where conversation_participants.conversation_id = conversations.id
        and conversation_participants.user_id = auth.uid()
    )
  );

create policy "Users can create conversations"
  on conversations for insert
  with check (true);

-- RLS policies: conversation_participants
create policy "Users can view participants of their conversations"
  on conversation_participants for select
  using (
    exists (
      select 1 from conversation_participants cp
      where cp.conversation_id = conversation_participants.conversation_id
        and cp.user_id = auth.uid()
    )
  );

create policy "Users can add participants"
  on conversation_participants for insert
  with check (true);

-- RLS policies: direct_messages
create policy "Users can view messages in their conversations"
  on direct_messages for select
  using (
    exists (
      select 1 from conversation_participants
      where conversation_participants.conversation_id = direct_messages.conversation_id
        and conversation_participants.user_id = auth.uid()
    )
  );

create policy "Users can send messages in their conversations"
  on direct_messages for insert
  with check (
    sender_id = auth.uid()
    and exists (
      select 1 from conversation_participants
      where conversation_participants.conversation_id = direct_messages.conversation_id
        and conversation_participants.user_id = auth.uid()
    )
  );

create policy "Users can edit their own messages"
  on direct_messages for update
  using (sender_id = auth.uid())
  with check (sender_id = auth.uid());

-- Enable Realtime on direct_messages for live chat
alter publication supabase_realtime add table direct_messages;
