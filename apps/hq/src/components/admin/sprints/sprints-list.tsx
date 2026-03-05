"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Badge } from "@/components/ui/badge";
import {
  MoreHorizontal,
  Pencil,
  ExternalLink,
  Copy,
  Archive,
  Trash2,
  Files,
} from "lucide-react";

interface SprintRow {
  id: string;
  title: string;
  slug: string;
  start_date: string;
  timezone: string;
  session_time: string;
  status: string;
  template_id: string | null;
  created_at: string;
}

interface SprintsListProps {
  sprints: SprintRow[];
  templateNames: Record<string, string>;
}

type Tab = "current" | "past";

export function SprintsList({ sprints, templateNames }: SprintsListProps) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("current");
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const today = new Date().toISOString().split("T")[0];

  const currentSprints = sprints.filter(
    (s) => s.start_date >= today || s.status === "published"
  );
  const pastSprints = sprints.filter(
    (s) => s.start_date < today && s.status !== "published"
  );

  const displayed = tab === "current" ? currentSprints : pastSprints;

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr + "T00:00:00");
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const copyUrl = async (slug: string, sprintId: string) => {
    const url = `${window.location.origin}/${slug}`;
    await navigator.clipboard.writeText(url);
    setCopiedId(sprintId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const duplicateSprint = async (sprint: SprintRow) => {
    const supabase = createClient();
    const { error } = await supabase.from("sprints").insert({
      title: `${sprint.title} (Copy)`,
      slug: `${sprint.slug}-copy`,
      start_date: sprint.start_date,
      timezone: sprint.timezone,
      session_time: sprint.session_time,
      status: "draft",
      template_id: sprint.template_id,
    });
    if (!error) {
      router.refresh();
    }
    setOpenMenu(null);
  };

  const archiveSprint = async (id: string) => {
    const supabase = createClient();
    await supabase.from("sprints").update({ status: "archived" }).eq("id", id);
    router.refresh();
    setOpenMenu(null);
  };

  const deleteSprint = async (id: string) => {
    if (!confirm("Are you sure you want to delete this sprint?")) return;
    const supabase = createClient();
    await supabase.from("sprints").delete().eq("id", id);
    router.refresh();
    setOpenMenu(null);
  };

  const statusBadge = (status: string) => {
    switch (status) {
      case "published":
        return <Badge variant="success">Published</Badge>;
      case "draft":
        return <Badge variant="outline">Draft</Badge>;
      case "archived":
        return <Badge>Archived</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        <button
          onClick={() => setTab("current")}
          className={`px-5 py-3 text-sm font-medium transition-colors cursor-pointer ${
            tab === "current"
              ? "text-gray-900 border-b-2 border-gray-900"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Current & Upcoming ({currentSprints.length})
        </button>
        <button
          onClick={() => setTab("past")}
          className={`px-5 py-3 text-sm font-medium transition-colors cursor-pointer ${
            tab === "past"
              ? "text-gray-900 border-b-2 border-gray-900"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Past ({pastSprints.length})
        </button>
      </div>

      {/* Table */}
      {displayed.length === 0 ? (
        <div className="p-12 text-center text-gray-400">
          No {tab === "current" ? "current or upcoming" : "past"} sprints.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 text-left">
                <th className="px-5 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Sprint
                </th>
                <th className="px-5 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-5 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Time
                </th>
                <th className="px-5 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Template
                </th>
                <th className="px-5 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-5 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider w-12">
                  &nbsp;
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {displayed.map((sprint) => (
                <tr
                  key={sprint.id}
                  className="hover:bg-gray-50/50 transition-colors"
                >
                  <td className="px-5 py-3.5">
                    <Link
                      href={`/admin/sprints/${sprint.id}`}
                      className="text-sm font-medium text-gray-900 hover:text-primary transition-colors"
                    >
                      {sprint.title}
                    </Link>
                    <p className="text-xs text-gray-400 mt-0.5">
                      /{sprint.slug}
                    </p>
                  </td>
                  <td className="px-5 py-3.5 text-sm text-gray-600">
                    {formatDate(sprint.start_date)}
                  </td>
                  <td className="px-5 py-3.5 text-sm text-gray-600">
                    {sprint.session_time || "—"}
                  </td>
                  <td className="px-5 py-3.5 text-sm text-gray-600">
                    {sprint.template_id
                      ? templateNames[sprint.template_id] || "Unknown"
                      : "—"}
                  </td>
                  <td className="px-5 py-3.5">{statusBadge(sprint.status)}</td>
                  <td className="px-5 py-3.5 relative">
                    <button
                      onClick={() =>
                        setOpenMenu(openMenu === sprint.id ? null : sprint.id)
                      }
                      className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer"
                    >
                      <MoreHorizontal size={16} />
                    </button>

                    {openMenu === sprint.id && (
                      <>
                        <div
                          className="fixed inset-0 z-40"
                          onClick={() => setOpenMenu(null)}
                        />
                        <div className="absolute right-5 top-full mt-1 w-48 bg-white rounded-lg border border-gray-200 shadow-lg z-50 py-1">
                          <Link
                            href={`/admin/sprints/${sprint.id}`}
                            className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                            onClick={() => setOpenMenu(null)}
                          >
                            <Pencil size={14} />
                            Edit
                          </Link>
                          <a
                            href={`/${sprint.slug}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                            onClick={() => setOpenMenu(null)}
                          >
                            <ExternalLink size={14} />
                            View Page
                          </a>
                          <button
                            onClick={() => copyUrl(sprint.slug, sprint.id)}
                            className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer"
                          >
                            <Copy size={14} />
                            {copiedId === sprint.id ? "Copied!" : "Copy URL"}
                          </button>
                          <button
                            onClick={() => duplicateSprint(sprint)}
                            className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer"
                          >
                            <Files size={14} />
                            Duplicate
                          </button>
                          <hr className="my-1 border-gray-100" />
                          <button
                            onClick={() => archiveSprint(sprint.id)}
                            className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer"
                          >
                            <Archive size={14} />
                            Archive
                          </button>
                          <button
                            onClick={() => deleteSprint(sprint.id)}
                            className="flex items-center gap-2 w-full px-3 py-2 text-sm text-danger hover:bg-danger-light cursor-pointer"
                          >
                            <Trash2 size={14} />
                            Delete
                          </button>
                        </div>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
