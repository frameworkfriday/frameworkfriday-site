"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { sendMessage } from "../actions";

export default function ChatInput({
  conversationId,
  currentUserId,
}: {
  conversationId: string;
  currentUserId: string;
}) {
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const router = useRouter();

  // Subscribe to realtime messages
  useEffect(() => {
    const supabase = createClient();

    const channel = supabase
      .channel(`dm-${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "direct_messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          // Only refresh for messages from other users
          if (payload.new && (payload.new as { sender_id: string }).sender_id !== currentUserId) {
            router.refresh();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, currentUserId, router]);

  const handleSend = useCallback(async () => {
    const trimmed = body.trim();
    if (!trimmed || sending) return;

    setSending(true);
    try {
      await sendMessage(conversationId, trimmed);
      setBody("");
      router.refresh();
    } catch {
      // Silently handle — message stays in input for retry
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  }, [body, sending, conversationId, router]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div
      className="chat-input-container"
      style={{
        display: "flex",
        gap: 10,
        alignItems: "flex-end",
        flexShrink: 0,
      }}
    >
      <textarea
        ref={inputRef}
        value={body}
        onChange={(e) => setBody(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Type a message..."
        rows={1}
        className="chat-input-textarea"
        style={{
          flex: 1,
          padding: "12px 16px",
          borderRadius: 14,
          border: "1px solid #EAEAE8",
          background: "#FFFFFF",
          fontSize: 14,
          color: "#0F0F0F",
          outline: "none",
          resize: "none",
          fontFamily: "inherit",
          lineHeight: 1.5,
          maxHeight: 120,
          boxShadow:
            "0 1px 3px rgba(0,0,0,0.05), 0 1px 2px rgba(0,0,0,0.03)",
          transition: "border-color 0.15s ease",
        }}
        onFocus={(e) => {
          e.currentTarget.style.borderColor = "#FF4F1A";
        }}
        onBlur={(e) => {
          e.currentTarget.style.borderColor = "#EAEAE8";
        }}
      />
      <button
        onClick={handleSend}
        disabled={!body.trim() || sending}
        className="chat-send-btn"
        style={{
          padding: "12px 20px",
          borderRadius: 14,
          border: "none",
          background: body.trim() && !sending ? "#FF4F1A" : "#E0E0E0",
          color: body.trim() && !sending ? "#FFFFFF" : "#A3A3A3",
          fontSize: 14,
          fontWeight: 700,
          cursor: body.trim() && !sending ? "pointer" : "default",
          transition: "background 0.15s ease, color 0.15s ease",
          flexShrink: 0,
          fontFamily: "inherit",
        }}
      >
        {sending ? "..." : "Send"}
      </button>
    </div>
  );
}
