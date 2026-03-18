"use client";

import { useState, useTransition } from "react";

interface Comment {
  id: string;
  body: string;
  created_at: string;
  edited_at: string | null;
  author_id: string;
  author: {
    first_name: string;
    last_name: string;
    avatar_url: string | null;
  } | null;
}

interface Props {
  postId: string;
  comments: Comment[];
  currentUserId: string;
  canModerate: boolean;
  createAction: (formData: FormData) => Promise<void>;
  editAction: (formData: FormData) => Promise<void>;
  deleteAction: (formData: FormData) => Promise<void>;
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default function CommentThread({
  postId,
  comments,
  currentUserId,
  canModerate,
  createAction,
  editAction,
  deleteAction,
}: Props) {
  const [newComment, setNewComment] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editBody, setEditBody] = useState("");
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    const fd = new FormData();
    fd.set("post_id", postId);
    fd.set("body", newComment.trim());
    startTransition(async () => {
      await createAction(fd);
      setNewComment("");
    });
  };

  const handleEdit = (comment: Comment) => {
    setEditingId(comment.id);
    setEditBody(comment.body);
  };

  const handleSaveEdit = () => {
    if (!editingId || !editBody.trim()) return;
    const fd = new FormData();
    fd.set("id", editingId);
    fd.set("body", editBody.trim());
    startTransition(async () => {
      await editAction(fd);
      setEditingId(null);
      setEditBody("");
    });
  };

  const handleDelete = (commentId: string) => {
    const fd = new FormData();
    fd.set("id", commentId);
    startTransition(() => deleteAction(fd));
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "10px 14px",
    borderRadius: "8px",
    border: "1.5px solid #E5E5E5",
    background: "#FFFFFF",
    fontSize: "14px",
    color: "#0F0F0F",
    fontFamily: "inherit",
    outline: "none",
    boxSizing: "border-box",
    resize: "vertical",
    lineHeight: 1.6,
  };

  return (
    <div>
      {/* Comments list */}
      {comments.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: "0", marginBottom: "20px" }}>
          {comments.map((c) => {
            const authorName = c.author
              ? `${c.author.first_name} ${c.author.last_name}`.trim()
              : "Member";
            const initials = authorName.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();
            const isAuthor = c.author_id === currentUserId;
            const canDelete = isAuthor || canModerate;

            return (
              <div
                key={c.id}
                style={{
                  padding: "14px 12px",
                  borderBottom: "1px solid #F0F0EE",
                  borderRadius: "8px",
                  transition: "background 0.15s ease",
                  margin: "0 -12px",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "#FAFAF9")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              >
                <div style={{ display: "flex", gap: "10px" }}>
                  {c.author?.avatar_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={c.author.avatar_url}
                      alt={authorName}
                      style={{ width: "32px", height: "32px", borderRadius: "50%", objectFit: "cover", flexShrink: 0, marginTop: "2px" }}
                    />
                  ) : (
                    <div style={{
                      width: "32px", height: "32px", borderRadius: "50%",
                      background: "rgba(255,79,26,0.1)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: "11px", fontWeight: 700, color: "#FF4F1A", flexShrink: 0, marginTop: "2px",
                    }}>
                      {initials}
                    </div>
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                      <span style={{ fontSize: "13px", fontWeight: 600, color: "#0F0F0F" }}>
                        {authorName}
                      </span>
                      <span style={{ fontSize: "11px", color: "#A3A3A3" }}>
                        {timeAgo(c.created_at)}
                        {c.edited_at && " (edited)"}
                      </span>
                    </div>

                    {editingId === c.id ? (
                      <div>
                        <textarea
                          value={editBody}
                          onChange={(e) => setEditBody(e.target.value)}
                          rows={2}
                          style={inputStyle}
                        />
                        <div style={{ display: "flex", gap: "8px", marginTop: "6px" }}>
                          <button
                            onClick={handleSaveEdit}
                            disabled={isPending}
                            style={{
                              padding: "5px 14px", borderRadius: "6px", border: "none",
                              background: "#FF4F1A", color: "#FFFFFF", fontSize: "12px",
                              fontWeight: 600, cursor: "pointer",
                            }}
                          >
                            Save
                          </button>
                          <button
                            onClick={() => setEditingId(null)}
                            style={{
                              padding: "5px 14px", borderRadius: "6px",
                              border: "1px solid #E5E5E5", background: "none",
                              fontSize: "12px", fontWeight: 600, color: "#6E6E6E", cursor: "pointer",
                            }}
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div style={{ fontSize: "14px", color: "#3D3D3D", lineHeight: 1.6, whiteSpace: "pre-wrap" }}>
                        {c.body}
                      </div>
                    )}

                    {/* Actions */}
                    {editingId !== c.id && (
                      <div style={{ display: "flex", gap: "12px", marginTop: "6px" }}>
                        {isAuthor && (
                          <button
                            onClick={() => handleEdit(c)}
                            style={{
                              background: "none", border: "none", cursor: "pointer",
                              fontSize: "11px", color: "#A3A3A3", padding: 0,
                            }}
                          >
                            Edit
                          </button>
                        )}
                        {canDelete && (
                          <button
                            onClick={() => handleDelete(c.id)}
                            style={{
                              background: "none", border: "none", cursor: "pointer",
                              fontSize: "11px", color: "#A3A3A3", padding: 0,
                            }}
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Compose */}
      <form onSubmit={handleSubmit} style={{ display: "flex", gap: "10px", alignItems: "flex-start" }}>
        <textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Write a comment..."
          rows={2}
          style={{ ...inputStyle, flex: 1 }}
        />
        <button
          type="submit"
          disabled={!newComment.trim() || isPending}
          style={{
            padding: "10px 20px",
            borderRadius: "8px",
            border: "none",
            background: newComment.trim() ? "#FF4F1A" : "#E5E5E5",
            color: newComment.trim() ? "#FFFFFF" : "#A3A3A3",
            fontSize: "13px",
            fontWeight: 700,
            cursor: newComment.trim() && !isPending ? "pointer" : "default",
            flexShrink: 0,
          }}
        >
          {isPending ? "..." : "Reply"}
        </button>
      </form>
    </div>
  );
}
