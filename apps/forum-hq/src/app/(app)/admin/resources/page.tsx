import { createAdminClient } from "@/lib/supabase/admin";
import { createResource, deleteResource } from "./actions";

const CATEGORIES = [
  { value: "getting_started", label: "Getting Started" },
  { value: "setup", label: "Setup & Tools" },
  { value: "academy", label: "Academy" },
  { value: "communication", label: "Communication" },
  { value: "sessions", label: "Sessions" },
];

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 14px",
  borderRadius: "10px",
  border: "1.5px solid #E5E5E5",
  background: "#FFFFFF",
  fontSize: "14px",
  color: "#0F0F0F",
  fontFamily: "var(--font-dm-sans)",
  outline: "none",
  boxSizing: "border-box",
};

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: "11px",
  fontFamily: "var(--font-syne)",
  fontWeight: 600,
  textTransform: "uppercase",
  letterSpacing: "0.1em",
  color: "#6E6E6E",
  marginBottom: "6px",
};

export default async function AdminResourcesPage() {
  const admin = createAdminClient();

  const { data: resources } = await admin
    .from("resources")
    .select("id, title, url, description, category, position")
    .order("category")
    .order("position");

  const allResources = resources ?? [];

  // Group by category
  const grouped: Record<string, typeof allResources> = {};
  for (const r of allResources) {
    if (!grouped[r.category]) grouped[r.category] = [];
    grouped[r.category].push(r);
  }

  const categoryOrder = CATEGORIES.map((c) => c.value);
  const activeCategories = categoryOrder.filter((c) => grouped[c]?.length);
  const allPresentCategories = [...new Set(allResources.map((r) => r.category))];

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: "32px" }}>
        <div style={{ fontSize: "11px", fontFamily: "var(--font-syne)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.12em", color: "#FF4F1A", marginBottom: "6px" }}>
          Admin
        </div>
        <h1 style={{ fontFamily: "var(--font-syne)", fontWeight: 700, fontSize: "28px", color: "#0F0F0F", margin: 0, letterSpacing: "-0.02em" }}>
          Resources
        </h1>
        <p style={{ fontSize: "14px", color: "#6E6E6E", margin: "6px 0 0" }}>
          Manage the member resource library.
        </p>
      </div>

      {/* Add resource form */}
      <div className="card" style={{ padding: "24px 28px", marginBottom: "32px" }}>
        <div style={{ fontFamily: "var(--font-syne)", fontWeight: 700, fontSize: "15px", color: "#0F0F0F", marginBottom: "20px" }}>
          Add Resource
        </div>
        <form action={createResource}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" }}>
            <div>
              <label style={labelStyle}>Title *</label>
              <input name="title" type="text" required placeholder="Forum Member Handbook" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Category *</label>
              <select name="category" required style={{ ...inputStyle, appearance: "none" }}>
                <option value="">Select category…</option>
                {CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ marginBottom: "16px" }}>
            <label style={labelStyle}>URL *</label>
            <input name="url" type="url" required placeholder="https://..." style={inputStyle} />
          </div>

          <div style={{ marginBottom: "20px" }}>
            <label style={labelStyle}>Description</label>
            <input name="description" type="text" placeholder="One-line description (optional)" style={inputStyle} />
          </div>

          <button
            type="submit"
            style={{
              padding: "10px 24px",
              borderRadius: "10px",
              border: "none",
              background: "#0F0F0F",
              color: "#FFFFFF",
              fontFamily: "var(--font-syne)",
              fontSize: "13px",
              fontWeight: 700,
              letterSpacing: "0.04em",
              cursor: "pointer",
            }}
          >
            Add Resource
          </button>
        </form>
      </div>

      {/* Resources list */}
      {allResources.length === 0 ? (
        <div className="card" style={{ padding: "48px 28px", textAlign: "center" }}>
          <div style={{ fontFamily: "var(--font-syne)", fontWeight: 600, fontSize: "15px", color: "#0F0F0F", marginBottom: "6px" }}>
            No resources yet
          </div>
          <div style={{ fontSize: "13px", color: "#6E6E6E" }}>
            Add your first resource using the form above.
          </div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          {(activeCategories.length ? activeCategories : allPresentCategories).map((cat) => {
            const label = CATEGORIES.find((c) => c.value === cat)?.label ?? cat;
            const items = grouped[cat] ?? [];
            return (
              <div key={cat}>
                <div
                  style={{
                    fontSize: "11px",
                    fontFamily: "var(--font-syne)",
                    fontWeight: 600,
                    textTransform: "uppercase",
                    letterSpacing: "0.1em",
                    color: "#A3A3A3",
                    marginBottom: "10px",
                  }}
                >
                  {label}
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  {items.map((resource, idx) => (
                    <div
                      key={resource.id}
                      className="card animate-fade-up"
                      style={{
                        padding: "14px 18px",
                        display: "flex",
                        alignItems: "center",
                        gap: "14px",
                        animationDelay: `${idx * 0.03}s`,
                      }}
                    >
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontFamily: "var(--font-syne)", fontWeight: 600, fontSize: "13px", color: "#0F0F0F", marginBottom: resource.description ? "2px" : 0 }}>
                          {resource.title}
                        </div>
                        {resource.description && (
                          <div style={{ fontSize: "12px", color: "#6E6E6E" }}>{resource.description}</div>
                        )}
                        <div style={{ fontSize: "11px", color: "#A3A3A3", marginTop: "2px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {resource.url}
                        </div>
                      </div>
                      <a
                        href={resource.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          fontSize: "11px",
                          fontFamily: "var(--font-syne)",
                          fontWeight: 600,
                          color: "#6E6E6E",
                          textDecoration: "none",
                          padding: "5px 10px",
                          border: "1px solid #E5E5E5",
                          borderRadius: "6px",
                          flexShrink: 0,
                        }}
                      >
                        Open
                      </a>
                      <form action={deleteResource}>
                        <input type="hidden" name="id" value={resource.id} />
                        <button
                          type="submit"
                          style={{
                            background: "none",
                            border: "1px solid #E5E5E5",
                            borderRadius: "6px",
                            cursor: "pointer",
                            padding: "5px 10px",
                            fontSize: "11px",
                            fontFamily: "var(--font-syne)",
                            fontWeight: 600,
                            color: "#A3A3A3",
                            letterSpacing: "0.04em",
                          }}
                        >
                          Delete
                        </button>
                      </form>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
