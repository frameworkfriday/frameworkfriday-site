"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Shield, Info, Check, AlertCircle } from "lucide-react";

interface AdminRole {
  id: string;
  user_id: string;
  role: string;
  created_at: string;
}

interface AdminUsersListProps {
  admins: AdminRole[];
}

export function AdminUsersList({ admins }: AdminUsersListProps) {
  const router = useRouter();
  const [showAddForm, setShowAddForm] = useState(false);
  const [newUserId, setNewUserId] = useState("");
  const [adding, setAdding] = useState(false);
  const [status, setStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const addAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserId.trim()) return;
    setAdding(true);

    const supabase = createClient();
    const { error } = await supabase.from("user_roles").insert({
      user_id: newUserId.trim(),
      role: "admin",
    });

    if (error) {
      setStatus({ type: "error", message: `Failed to add admin: ${error.message}` });
      setTimeout(() => setStatus(null), 5000);
    } else {
      setNewUserId("");
      setShowAddForm(false);
      setStatus({ type: "success", message: "Admin added" });
      setTimeout(() => setStatus(null), 3000);
      router.refresh();
    }
    setAdding(false);
  };

  const removeAdmin = async (id: string, userId: string) => {
    if (
      !confirm(
        `Remove admin access for user ${userId.slice(0, 8)}...? They won't be able to access the admin panel.`
      )
    )
      return;

    const supabase = createClient();
    await supabase.from("user_roles").delete().eq("id", id);
    router.refresh();
  };

  return (
    <div className="space-y-6">
      {/* Admin list */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <p className="text-sm font-medium text-gray-700">
              {admins.length} admin{admins.length !== 1 ? "s" : ""}
            </p>
            {status?.type === "success" && (
              <span className="flex items-center gap-1.5 text-sm text-success font-medium">
                <Check size={16} />
                {status.message}
              </span>
            )}
            {status?.type === "error" && (
              <span className="flex items-center gap-1.5 text-sm text-danger font-medium">
                <AlertCircle size={16} />
                {status.message}
              </span>
            )}
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowAddForm(!showAddForm)}
          >
            <Plus size={14} />
            Add Admin
          </Button>
        </div>

        {/* Add form */}
        {showAddForm && (
          <form
            onSubmit={addAdmin}
            className="px-5 py-4 border-b border-gray-100 bg-gray-50"
          >
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              User ID (from Supabase Auth)
            </label>
            <div className="flex items-center gap-2">
              <Input
                value={newUserId}
                onChange={(e) => setNewUserId(e.target.value)}
                placeholder="Enter user UUID..."
                className="flex-1"
                required
              />
              <Button type="submit" size="sm" disabled={adding}>
                {adding ? "Adding..." : "Add"}
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => setShowAddForm(false)}
              >
                Cancel
              </Button>
            </div>
            <p className="text-xs text-gray-400 mt-2">
              The user must first sign in with Google to create their account.
              Then add their user ID here.
            </p>
          </form>
        )}

        {/* Table */}
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100 text-left">
              <th className="px-5 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">
                User ID
              </th>
              <th className="px-5 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">
                Role
              </th>
              <th className="px-5 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">
                Added
              </th>
              <th className="px-5 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider w-12">
                &nbsp;
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {admins.map((admin) => (
              <tr
                key={admin.id}
                className="hover:bg-gray-50/50 transition-colors"
              >
                <td className="px-5 py-3.5">
                  <code className="text-xs text-gray-600 bg-gray-100 px-2 py-0.5 rounded">
                    {admin.user_id}
                  </code>
                </td>
                <td className="px-5 py-3.5">
                  <Badge variant="default">
                    <Shield size={10} className="mr-1" />
                    Admin
                  </Badge>
                </td>
                <td className="px-5 py-3.5 text-sm text-gray-500">
                  {formatDate(admin.created_at)}
                </td>
                <td className="px-5 py-3.5">
                  <button
                    onClick={() => removeAdmin(admin.id, admin.user_id)}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-danger hover:bg-danger-light transition-colors cursor-pointer"
                  >
                    <Trash2 size={14} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* How admin access works */}
      <div className="bg-blue-50 rounded-xl border border-blue-100 p-5">
        <div className="flex items-start gap-3">
          <Info size={18} className="text-blue-500 mt-0.5 flex-shrink-0" />
          <div>
            <h3 className="text-sm font-semibold text-blue-900">
              How Admin Access Works
            </h3>
            <ul className="text-sm text-blue-700 mt-2 space-y-1.5">
              <li>
                1. A new admin signs in at{" "}
                <code className="bg-blue-100 px-1.5 py-0.5 rounded text-xs">
                  /login
                </code>{" "}
                using Google OAuth.
              </li>
              <li>
                2. Their Supabase user ID is created automatically on first
                sign-in.
              </li>
              <li>
                3. An existing admin adds their user ID to the{" "}
                <code className="bg-blue-100 px-1.5 py-0.5 rounded text-xs">
                  user_roles
                </code>{" "}
                table above.
              </li>
              <li>
                4. On next login, they&apos;ll have full access to the admin panel.
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
