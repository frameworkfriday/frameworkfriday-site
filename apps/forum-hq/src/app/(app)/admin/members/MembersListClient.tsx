"use client";

import { useState, useMemo } from "react";
import Link from "next/link";

interface Member {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string;
  business_name: string | null;
  role_title: string | null;
  industry: string | null;
  archived_at: string | null;
  created_at: string;
  onboarding_path: string | null;
  phone: string | null;
  city: string | null;
  state: string | null;
}

interface MemberGroup {
  id: string;
  name: string;
}

interface Props {
  members: Member[];
  adminIds: string[];
  facilitatorIds: string[];
  userGroups: Record<string, MemberGroup[]>;
  allGroups: MemberGroup[];
}

const PAGE_SIZE = 25;

type SortKey = "name" | "email" | "group" | "joined" | "business";
type SortDir = "asc" | "desc";

export default function MembersListClient({ members, adminIds, facilitatorIds, userGroups, allGroups }: Props) {
  const [search, setSearch] = useState("");
  const [groupFilter, setGroupFilter] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<"active" | "archived" | "all">("active");
  const [joinFrom, setJoinFrom] = useState("");
  const [joinTo, setJoinTo] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [page, setPage] = useState(1);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const adminSet = useMemo(() => new Set(adminIds), [adminIds]);
  const facilitatorSet = useMemo(() => new Set(facilitatorIds), [facilitatorIds]);

  const filtered = useMemo(() => {
    let result = members;

    // Status filter
    if (statusFilter === "active") result = result.filter((m) => !m.archived_at);
    else if (statusFilter === "archived") result = result.filter((m) => m.archived_at);

    // Search
    if (search) {
      const q = search.toLowerCase();
      result = result.filter((m) => {
        const name = `${m.first_name ?? ""} ${m.last_name ?? ""}`.toLowerCase();
        const email = m.email.toLowerCase();
        const biz = (m.business_name ?? "").toLowerCase();
        const industry = (m.industry ?? "").toLowerCase();
        return name.includes(q) || email.includes(q) || biz.includes(q) || industry.includes(q);
      });
    }

    // Group filter
    if (groupFilter) {
      result = result.filter((m) => (userGroups[m.id] ?? []).some((g) => g.id === groupFilter));
    }

    // Role filter
    if (roleFilter === "admin") result = result.filter((m) => adminSet.has(m.id));
    else if (roleFilter === "facilitator") result = result.filter((m) => facilitatorSet.has(m.id));
    else if (roleFilter === "member") result = result.filter((m) => !adminSet.has(m.id) && !facilitatorSet.has(m.id));

    // Join date range
    if (joinFrom) {
      const from = new Date(joinFrom);
      result = result.filter((m) => new Date(m.created_at) >= from);
    }
    if (joinTo) {
      const to = new Date(joinTo);
      to.setHours(23, 59, 59, 999);
      result = result.filter((m) => new Date(m.created_at) <= to);
    }

    // Sort
    result = [...result].sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case "name":
          cmp = `${a.last_name ?? ""} ${a.first_name ?? ""}`.localeCompare(`${b.last_name ?? ""} ${b.first_name ?? ""}`);
          break;
        case "email":
          cmp = a.email.localeCompare(b.email);
          break;
        case "business":
          cmp = (a.business_name ?? "").localeCompare(b.business_name ?? "");
          break;
        case "group": {
          const ag = (userGroups[a.id] ?? []).map((g) => g.name).join(", ");
          const bg = (userGroups[b.id] ?? []).map((g) => g.name).join(", ");
          cmp = ag.localeCompare(bg);
          break;
        }
        case "joined":
          cmp = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
          break;
      }
      return sortDir === "asc" ? cmp : -cmp;
    });

    return result;
  }, [members, search, groupFilter, roleFilter, statusFilter, joinFrom, joinTo, sortKey, sortDir, adminSet, facilitatorSet, userGroups]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageMembers = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(key); setSortDir("asc"); }
  };

  const clearFilters = () => {
    setSearch("");
    setGroupFilter("");
    setRoleFilter("");
    setStatusFilter("active");
    setJoinFrom("");
    setJoinTo("");
    setPage(1);
  };

  const hasActiveFilters = search || groupFilter || roleFilter || statusFilter !== "active" || joinFrom || joinTo;

  const sortIcon = (key: SortKey) => {
    if (sortKey !== key) return <span style={{ color: "#D4D4D4", marginLeft: "4px" }}>↕</span>;
    return <span style={{ color: "#FF4F1A", marginLeft: "4px" }}>{sortDir === "asc" ? "↑" : "↓"}</span>;
  };

  const inputStyle: React.CSSProperties = {
    padding: "7px 10px",
    fontSize: "13px",
    border: "1px solid #E5E5E5",
    borderRadius: "8px",
    outline: "none",
    fontFamily: "inherit",
    color: "#0F0F0F",
    background: "#FFFFFF",
    boxSizing: "border-box",
  };

  const labelStyle: React.CSSProperties = {
    fontSize: "10px",
    fontWeight: 600,
    color: "#A3A3A3",
    textTransform: "uppercase",
    letterSpacing: "0.08em",
    marginBottom: "4px",
    display: "block",
  };

  const thStyle: React.CSSProperties = {
    padding: "10px 14px",
    textAlign: "left",
    fontSize: "11px",
    fontWeight: 700,
    color: "#6E6E6E",
    textTransform: "uppercase",
    letterSpacing: "0.06em",
    cursor: "pointer",
    userSelect: "none",
    whiteSpace: "nowrap",
    borderBottom: "2px solid #E5E5E5",
    background: "#FAFAF9",
  };

  const tdStyle: React.CSSProperties = {
    padding: "12px 14px",
    fontSize: "13px",
    color: "#0F0F0F",
    borderBottom: "1px solid #F0F0EE",
    verticalAlign: "middle",
  };

  const badgeBase: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    padding: "2px 8px",
    borderRadius: "10px",
    fontSize: "10px",
    fontWeight: 600,
    letterSpacing: "0.04em",
    whiteSpace: "nowrap",
  };

  return (
    <div>
      {/* Search bar */}
      <div style={{ marginBottom: "16px", display: "flex", gap: "10px", alignItems: "center" }}>
        <div style={{ position: "relative", flex: 1, maxWidth: "400px" }}>
          <svg
            width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#A3A3A3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)" }}
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search by name, email, business, industry..."
            style={{ ...inputStyle, width: "100%", paddingLeft: "36px" }}
          />
        </div>
        <button
          onClick={() => setFiltersOpen(!filtersOpen)}
          style={{
            padding: "7px 14px",
            fontSize: "12px",
            fontWeight: 600,
            border: filtersOpen ? "1.5px solid #FF4F1A" : "1.5px solid #E5E5E5",
            borderRadius: "8px",
            background: filtersOpen ? "rgba(255,79,26,0.04)" : "#FFFFFF",
            color: filtersOpen ? "#FF4F1A" : "#6E6E6E",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "6px",
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="4" y1="6" x2="20" y2="6" />
            <line x1="8" y1="12" x2="16" y2="12" />
            <line x1="11" y1="18" x2="13" y2="18" />
          </svg>
          Filters
          {hasActiveFilters && <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#FF4F1A" }} />}
        </button>
        <div style={{ fontSize: "12px", color: "#A3A3A3", fontWeight: 600 }}>
          {filtered.length} result{filtered.length !== 1 ? "s" : ""}
        </div>
      </div>

      {/* Filter panel */}
      {filtersOpen && (
        <div className="card" style={{ padding: "18px 20px", marginBottom: "16px", display: "flex", gap: "16px", alignItems: "flex-end", flexWrap: "wrap" }}>
          <div>
            <label style={labelStyle}>Group</label>
            <select
              value={groupFilter}
              onChange={(e) => { setGroupFilter(e.target.value); setPage(1); }}
              style={{ ...inputStyle, minWidth: "160px" }}
            >
              <option value="">All groups</option>
              {allGroups.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Role</label>
            <select
              value={roleFilter}
              onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}
              style={{ ...inputStyle, minWidth: "130px" }}
            >
              <option value="">All roles</option>
              <option value="admin">Admin</option>
              <option value="facilitator">Facilitator</option>
              <option value="member">Member</option>
            </select>
          </div>
          <div>
            <label style={labelStyle}>Status</label>
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value as "active" | "archived" | "all"); setPage(1); }}
              style={{ ...inputStyle, minWidth: "120px" }}
            >
              <option value="active">Active</option>
              <option value="archived">Archived</option>
              <option value="all">All</option>
            </select>
          </div>
          <div>
            <label style={labelStyle}>Joined from</label>
            <input type="date" value={joinFrom} onChange={(e) => { setJoinFrom(e.target.value); setPage(1); }} style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Joined to</label>
            <input type="date" value={joinTo} onChange={(e) => { setJoinTo(e.target.value); setPage(1); }} style={inputStyle} />
          </div>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              style={{
                padding: "7px 14px", fontSize: "12px", fontWeight: 600,
                border: "1px solid #E5E5E5", borderRadius: "8px",
                background: "#FFFFFF", color: "#6E6E6E", cursor: "pointer",
              }}
            >
              Clear all
            </button>
          )}
        </div>
      )}

      {/* Table */}
      {pageMembers.length === 0 ? (
        <div className="card" style={{ padding: "48px 28px", textAlign: "center" }}>
          <div style={{ fontWeight: 600, fontSize: "15px", color: "#0F0F0F", marginBottom: "6px" }}>
            {hasActiveFilters ? "No members match your filters" : "No members yet"}
          </div>
          <div style={{ fontSize: "13px", color: "#6E6E6E" }}>
            {hasActiveFilters ? "Try adjusting your search or filters." : "Invite a member using the form above."}
          </div>
        </div>
      ) : (
        <div className="card" style={{ overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={{ ...thStyle, width: "40px", cursor: "default" }} />
                <th style={thStyle} onClick={() => handleSort("name")}>Name {sortIcon("name")}</th>
                <th style={thStyle} onClick={() => handleSort("email")}>Email {sortIcon("email")}</th>
                <th style={thStyle} onClick={() => handleSort("business")}>Business {sortIcon("business")}</th>
                <th style={thStyle} onClick={() => handleSort("group")}>Group {sortIcon("group")}</th>
                <th style={thStyle} onClick={() => handleSort("joined")}>Joined {sortIcon("joined")}</th>
                <th style={{ ...thStyle, width: "80px", cursor: "default" }}>Role</th>
                <th style={{ ...thStyle, width: "30px", cursor: "default" }} />
              </tr>
            </thead>
            <tbody>
              {pageMembers.map((member) => {
                const fullName = [member.first_name, member.last_name].filter(Boolean).join(" ") || "—";
                const isAdmin = adminSet.has(member.id);
                const isFacilitator = facilitatorSet.has(member.id);
                const memberGroups = userGroups[member.id] ?? [];
                const initial = (member.first_name || member.email || "?")[0].toUpperCase();
                const isArchived = !!member.archived_at;
                const location = [member.city, member.state].filter(Boolean).join(", ");

                return (
                  <tr
                    key={member.id}
                    style={{ opacity: isArchived ? 0.5 : 1, cursor: "pointer" }}
                    onClick={() => window.location.href = `/admin/members/${member.id}`}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLTableRowElement).style.background = "#FAFAF9"; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLTableRowElement).style.background = "transparent"; }}
                  >
                    <td style={tdStyle}>
                      <div style={{
                        width: "32px", height: "32px", borderRadius: "50%",
                        background: isAdmin ? "rgba(255,79,26,0.12)" : "rgba(15,15,15,0.06)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: "12px", fontWeight: 700,
                        color: isAdmin ? "#FF4F1A" : "#6E6E6E",
                      }}>
                        {initial}
                      </div>
                    </td>
                    <td style={tdStyle}>
                      <div style={{ fontWeight: 600, color: "#0F0F0F", lineHeight: 1.3 }}>{fullName}</div>
                      {location && <div style={{ fontSize: "11px", color: "#A3A3A3" }}>{location}</div>}
                    </td>
                    <td style={{ ...tdStyle, color: "#6E6E6E", fontSize: "12px" }}>{member.email}</td>
                    <td style={{ ...tdStyle, fontSize: "12px" }}>
                      {member.business_name ? (
                        <div>
                          <div style={{ color: "#0F0F0F" }}>{member.business_name}</div>
                          {member.industry && <div style={{ fontSize: "11px", color: "#A3A3A3" }}>{member.industry}</div>}
                        </div>
                      ) : (
                        <span style={{ color: "#D4D4D4" }}>—</span>
                      )}
                    </td>
                    <td style={tdStyle}>
                      <div style={{ display: "flex", gap: "4px", flexWrap: "wrap" }}>
                        {memberGroups.length === 0 ? (
                          <span style={{ ...badgeBase, background: "#F7F7F6", color: "#A3A3A3", border: "1px solid #E5E5E5" }}>None</span>
                        ) : (
                          memberGroups.map((g) => (
                            <span key={g.id} style={{ ...badgeBase, background: "#F0F0F0", color: "#6E6E6E", border: "1px solid #E5E5E5" }}>{g.name}</span>
                          ))
                        )}
                      </div>
                    </td>
                    <td style={{ ...tdStyle, fontSize: "12px", color: "#6E6E6E", whiteSpace: "nowrap" }}>
                      {new Date(member.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </td>
                    <td style={tdStyle}>
                      <div style={{ display: "flex", gap: "4px", flexWrap: "wrap" }}>
                        {isAdmin && <span style={{ ...badgeBase, background: "rgba(255,79,26,0.1)", color: "#FF4F1A" }}>Admin</span>}
                        {isFacilitator && <span style={{ ...badgeBase, background: "rgba(139,92,246,0.1)", color: "#8B5CF6" }}>Facilitator</span>}
                        {isArchived && <span style={{ ...badgeBase, background: "rgba(239,68,68,0.08)", color: "#EF4444" }}>Archived</span>}
                        {member.onboarding_path === "ds-graduate" && <span style={{ ...badgeBase, background: "rgba(59,130,246,0.08)", color: "#3B82F6" }}>DS</span>}
                      </div>
                    </td>
                    <td style={tdStyle}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#A3A3A3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="9 18 15 12 9 6" />
                      </svg>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "16px" }}>
          <div style={{ fontSize: "12px", color: "#A3A3A3" }}>
            Showing {(currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, filtered.length)} of {filtered.length}
          </div>
          <div style={{ display: "flex", gap: "4px" }}>
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              style={{
                padding: "6px 12px", fontSize: "12px", fontWeight: 600,
                border: "1px solid #E5E5E5", borderRadius: "6px",
                background: currentPage === 1 ? "#F7F7F6" : "#FFFFFF",
                color: currentPage === 1 ? "#D4D4D4" : "#6E6E6E",
                cursor: currentPage === 1 ? "default" : "pointer",
              }}
            >
              Previous
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter((p) => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 2)
              .reduce<(number | "...")[]>((acc, p, i, arr) => {
                if (i > 0 && p - (arr[i - 1] ?? 0) > 1) acc.push("...");
                acc.push(p);
                return acc;
              }, [])
              .map((p, i) =>
                p === "..." ? (
                  <span key={`e${i}`} style={{ padding: "6px 4px", fontSize: "12px", color: "#A3A3A3" }}>...</span>
                ) : (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    style={{
                      padding: "6px 10px", fontSize: "12px", fontWeight: 600,
                      border: p === currentPage ? "1.5px solid #FF4F1A" : "1px solid #E5E5E5",
                      borderRadius: "6px",
                      background: p === currentPage ? "rgba(255,79,26,0.06)" : "#FFFFFF",
                      color: p === currentPage ? "#FF4F1A" : "#6E6E6E",
                      cursor: "pointer",
                    }}
                  >
                    {p}
                  </button>
                )
              )}
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              style={{
                padding: "6px 12px", fontSize: "12px", fontWeight: 600,
                border: "1px solid #E5E5E5", borderRadius: "6px",
                background: currentPage === totalPages ? "#F7F7F6" : "#FFFFFF",
                color: currentPage === totalPages ? "#D4D4D4" : "#6E6E6E",
                cursor: currentPage === totalPages ? "default" : "pointer",
              }}
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
