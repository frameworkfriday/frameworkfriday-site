import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";

const CATEGORY_LABELS: Record<string, string> = {
  getting_started: "Getting Started",
  setup: "Setup & Tools",
  academy: "Academy",
  communication: "Communication",
  sessions: "Sessions",
};

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  getting_started: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  ),
  setup: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.07 4.93A10 10 0 0 1 21 12a10 10 0 0 1-10 10 10 10 0 0 1-7.07-2.93" />
    </svg>
  ),
  academy: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
      <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
    </svg>
  ),
  communication: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  ),
  sessions: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  ),
};

export default async function ResourcesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const admin = createAdminClient();
  const { data: resources } = await admin
    .from("resources")
    .select("id, category, title, description, url, position")
    .order("category")
    .order("position");

  // Group by category
  const grouped: Record<string, typeof resources> = {};
  for (const r of resources ?? []) {
    if (!grouped[r.category]) grouped[r.category] = [];
    grouped[r.category]!.push(r);
  }

  const categoryOrder = ["getting_started", "setup", "academy", "communication", "sessions"];
  const orderedCategories = categoryOrder.filter((c) => grouped[c]?.length);

  return (
    <div>
      {/* Page header */}
      <div style={{ marginBottom: "32px" }}>
        <div
          style={{
            fontSize: "11px",
            fontFamily: "var(--font-syne)",
            fontWeight: 600,
            textTransform: "uppercase",
            letterSpacing: "0.12em",
            color: "#FF4F1A",
            marginBottom: "6px",
          }}
        >
          Resources
        </div>
        <h1
          style={{
            fontFamily: "var(--font-syne)",
            fontWeight: 700,
            fontSize: "28px",
            color: "#0F0F0F",
            margin: 0,
            letterSpacing: "-0.02em",
          }}
        >
          Member Resources
        </h1>
        <p style={{ fontSize: "14px", color: "#6E6E6E", margin: "6px 0 0" }}>
          Everything you need for Forum — guides, tools, and session materials.
        </p>
      </div>

      {/* Empty state */}
      {orderedCategories.length === 0 && (
        <div
          className="card animate-fade-up"
          style={{ padding: "48px 28px", textAlign: "center" }}
        >
          <div
            style={{
              width: "48px",
              height: "48px",
              borderRadius: "12px",
              background: "rgba(255,79,26,0.10)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 16px",
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FF4F1A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
            </svg>
          </div>
          <div style={{ fontFamily: "var(--font-syne)", fontWeight: 600, fontSize: "15px", color: "#0F0F0F", marginBottom: "6px" }}>
            Resources will appear here
          </div>
          <div style={{ fontSize: "13px", color: "#6E6E6E" }}>
            Your facilitator will add guides and materials before Session 1.
          </div>
        </div>
      )}

      {/* Category sections */}
      {orderedCategories.map((cat, catIdx) => (
        <div key={cat} style={{ marginBottom: "32px" }}>
          {/* Category header */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              marginBottom: "12px",
            }}
          >
            <div
              style={{
                color: "#FF4F1A",
                display: "flex",
                alignItems: "center",
              }}
            >
              {CATEGORY_ICONS[cat]}
            </div>
            <div
              style={{
                fontFamily: "var(--font-syne)",
                fontWeight: 700,
                fontSize: "13px",
                color: "#0F0F0F",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
              }}
            >
              {CATEGORY_LABELS[cat] ?? cat}
            </div>
          </div>

          {/* Resources grid */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
              gap: "12px",
            }}
          >
            {(grouped[cat] ?? []).map((resource, idx) => (
              <a
                key={resource.id}
                href={resource.url}
                target="_blank"
                rel="noopener noreferrer"
                className={`card card-hover animate-fade-up`}
                style={{
                  padding: "18px 20px",
                  textDecoration: "none",
                  display: "block",
                  animationDelay: `${(catIdx * 3 + idx) * 0.04}s`,
                }}
              >
                <div
                  style={{
                    fontFamily: "var(--font-syne)",
                    fontWeight: 600,
                    fontSize: "14px",
                    color: "#0F0F0F",
                    marginBottom: resource.description ? "5px" : 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: "8px",
                  }}
                >
                  <span>{resource.title}</span>
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#A3A3A3"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    style={{ flexShrink: 0 }}
                  >
                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                    <polyline points="15 3 21 3 21 9" />
                    <line x1="10" y1="14" x2="21" y2="3" />
                  </svg>
                </div>
                {resource.description && (
                  <div style={{ fontSize: "12px", color: "#6E6E6E", lineHeight: 1.5 }}>
                    {resource.description}
                  </div>
                )}
              </a>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
