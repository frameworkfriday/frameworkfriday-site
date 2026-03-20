"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";

interface Profile {
  id: string;
  first_name: string;
  last_name: string;
  avatar_url: string | null;
}

interface LastMessage {
  body: string;
  created_at: string;
  sender_id: string;
}

export interface ConversationSummary {
  id: string;
  participants: Profile[];
  lastMessage: LastMessage | null;
  unread: boolean;
}

interface MessageWithSender {
  id: string;
  conversation_id: string;
  sender_id: string;
  body: string;
  created_at: string;
  edited_at: string | null;
  sender: Profile;
}

export async function getOrCreateConversation(otherUserId: string): Promise<string> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const admin = createAdminClient();

  // Find conversations where BOTH users are participants
  const { data: myConversations } = await admin
    .from("conversation_participants")
    .select("conversation_id")
    .eq("user_id", user.id);

  const { data: theirConversations } = await admin
    .from("conversation_participants")
    .select("conversation_id")
    .eq("user_id", otherUserId);

  const myConvoIds = new Set((myConversations ?? []).map((c) => c.conversation_id));
  const sharedConvoIds = (theirConversations ?? [])
    .map((c) => c.conversation_id)
    .filter((id) => myConvoIds.has(id));

  // Check each shared conversation to confirm it's a 1:1 (exactly 2 participants)
  for (const convoId of sharedConvoIds) {
    const { count } = await admin
      .from("conversation_participants")
      .select("*", { count: "exact", head: true })
      .eq("conversation_id", convoId);

    if (count === 2) {
      return convoId;
    }
  }

  // No existing 1:1 conversation found — create one
  const { data: conversation, error: convoError } = await admin
    .from("conversations")
    .insert({})
    .select("id")
    .single();

  if (convoError || !conversation) {
    throw new Error("Failed to create conversation");
  }

  await admin.from("conversation_participants").insert([
    { conversation_id: conversation.id, user_id: user.id },
    { conversation_id: conversation.id, user_id: otherUserId },
  ]);

  return conversation.id;
}

export async function sendMessage(
  conversationId: string,
  body: string
): Promise<MessageWithSender> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const admin = createAdminClient();

  // Verify the sender is a participant
  const { data: participant } = await admin
    .from("conversation_participants")
    .select("user_id")
    .eq("conversation_id", conversationId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!participant) {
    throw new Error("Not a participant in this conversation");
  }

  const trimmed = body.trim();
  if (!trimmed) {
    throw new Error("Message body cannot be empty");
  }

  const { data: message, error } = await admin
    .from("direct_messages")
    .insert({
      conversation_id: conversationId,
      sender_id: user.id,
      body: trimmed,
    })
    .select("id, conversation_id, sender_id, body, created_at, edited_at")
    .single();

  if (error || !message) {
    throw new Error("Failed to send message");
  }

  // Fetch sender profile
  const { data: profile } = await admin
    .from("profiles")
    .select("id, first_name, last_name, avatar_url")
    .eq("id", user.id)
    .single();

  return {
    ...message,
    sender: profile as Profile,
  };
}

export async function getConversations(): Promise<ConversationSummary[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const admin = createAdminClient();

  // Get all conversations the user is part of
  const { data: myParticipations } = await admin
    .from("conversation_participants")
    .select("conversation_id")
    .eq("user_id", user.id);

  if (!myParticipations || myParticipations.length === 0) {
    return [];
  }

  const conversationIds = myParticipations.map((p) => p.conversation_id);

  // Get all participants for these conversations with their profiles
  const { data: allParticipants } = await admin
    .from("conversation_participants")
    .select("conversation_id, user_id")
    .in("conversation_id", conversationIds);

  // Get profiles for all participants
  const allUserIds = [...new Set((allParticipants ?? []).map((p) => p.user_id))];
  const { data: profiles } = await admin
    .from("profiles")
    .select("id, first_name, last_name, avatar_url")
    .in("id", allUserIds);

  const profileMap: Record<string, Profile> = {};
  for (const p of profiles ?? []) {
    profileMap[p.id] = p;
  }

  // Get latest message for each conversation
  const { data: latestMessages } = await admin
    .from("direct_messages")
    .select("id, conversation_id, sender_id, body, created_at")
    .in("conversation_id", conversationIds)
    .order("created_at", { ascending: false });

  // Build a map of conversation_id -> latest message
  const latestMessageMap: Record<string, LastMessage> = {};
  for (const msg of latestMessages ?? []) {
    if (!latestMessageMap[msg.conversation_id]) {
      latestMessageMap[msg.conversation_id] = {
        body: msg.body,
        created_at: msg.created_at,
        sender_id: msg.sender_id,
      };
    }
  }

  // Build conversation summaries
  const conversations: ConversationSummary[] = conversationIds.map((convoId) => {
    const participantEntries = (allParticipants ?? [])
      .filter((p) => p.conversation_id === convoId && p.user_id !== user.id)
      .map((p) => profileMap[p.user_id])
      .filter(Boolean);

    return {
      id: convoId,
      participants: participantEntries,
      lastMessage: latestMessageMap[convoId] ?? null,
      unread: false, // Placeholder — can be extended with read receipts
    };
  });

  // Sort by latest message timestamp (newest first), conversations with no messages last
  conversations.sort((a, b) => {
    if (!a.lastMessage && !b.lastMessage) return 0;
    if (!a.lastMessage) return 1;
    if (!b.lastMessage) return -1;
    return new Date(b.lastMessage.created_at).getTime() - new Date(a.lastMessage.created_at).getTime();
  });

  return conversations;
}

export async function getMessages(conversationId: string): Promise<MessageWithSender[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const admin = createAdminClient();

  // Verify user is a participant
  const { data: participant } = await admin
    .from("conversation_participants")
    .select("user_id")
    .eq("conversation_id", conversationId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!participant) {
    throw new Error("Not a participant in this conversation");
  }

  // Fetch all messages
  const { data: messages } = await admin
    .from("direct_messages")
    .select("id, conversation_id, sender_id, body, created_at, edited_at")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true });

  if (!messages || messages.length === 0) {
    return [];
  }

  // Fetch sender profiles
  const senderIds = [...new Set(messages.map((m) => m.sender_id))];
  const { data: profiles } = await admin
    .from("profiles")
    .select("id, first_name, last_name, avatar_url")
    .in("id", senderIds);

  const profileMap: Record<string, Profile> = {};
  for (const p of profiles ?? []) {
    profileMap[p.id] = p;
  }

  return messages.map((msg) => ({
    ...msg,
    sender: profileMap[msg.sender_id] ?? {
      id: msg.sender_id,
      first_name: "Unknown",
      last_name: "",
      avatar_url: null,
    },
  }));
}
