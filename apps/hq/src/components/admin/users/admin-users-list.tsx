"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { addAdminByEmail, removeAdmin } from "@/lib/actions";
import type { AdminUser } from "@/lib/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  Trash2,
  Shield,
  Info,
  ShieldCheck,
  AlertCircle,
  Mail,
} from "lucide-react";

interface AdminUsersListProps {
  admins: AdminUser[];
}

export function AdminUsersList({ admins }: AdminUsersListProps) {
  const router = useRouter();
  const [showAddForm, setShowAddForm] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [adding, setAdding] = useState(false);
  const [status, setStatus] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const handleAddAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail.trim()) return;
    setAdding(true);
    setStatus(null);

    const result = await addAdminByEmail(newEmail.trim());

    if ("error" in result) {
      setStatus({ type: "error", message: result.error });
      setTimeout(() => setStatus(null), 5000);
    } else {
      setNewEmail("");
      setShowAddForm(false);
      setStatus({ type: "success", message: "Admin added successfully" });
      setTimeout(() => setStatus(null), 3000);
      router.refresh();
    }
    setAdding(false);
  };

  const handleRemoveAdmin = async (roleId: string, name: string | null) => {
    const displayName = name || "this user";
    if (
      !confirm(
        `Remove admin access for ${displayName}? They won't be able to access the admin panel.`
      )
    )
      return;

    const result = await removeAdmin(roleId);

    if ("error" in result) {
      setStatus({ type: "error", message: result.error });
      setTimeout(() => setStatus(null), 5000);
    } else {
      router.refresh();
    }
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
              <span className="flex items-center gap-1.5 text-sm text-success font-medium animate-fade-in">
                <ShieldCheck size={16} />
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
            onClick={() => {
              setShowAddForm(!showAddForm);
              setStatus(null);
            }}
          >
            <Plus size={14} />
            Add Admin
          </Button>
        </div>

        {/* Add form */}
        {showAddForm && (
          <form
            onSubmit={handleAddAdmin}
            className="px-5 py-4 border-b border-gray-100 bg-gray-50"
          >
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Email Address
            </label>
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Mail
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <Input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="colleague@company.com"
                  className="pl-9"
                  required
                />
              </div>
              <Button type="submit" size="sm" disabled={adding}>
                {adding ? "Adding..." : "Add"}
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => {
                  setShowAddForm(false);
                  setStatus(null);
                }}
              >
                Cancel
              </Button>
            </div>
            <p className="text-xs text-gray-400 mt-2">
              The person must have signed in with Google at least once before
              they can be added as an admin.
            </p>
          </form>
        )}

        {/* Table */}
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100 text-left">
              <th className="px-5 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">
                User
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
                key={admin.role_id}
                className="hover:bg-gray-50/50 transition-colors"
              >
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-3">
                    {admin.avatar_url ? (
                      <img
                        src={admin.avatar_url}
                        alt=""
                        className="w-8 h-8 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                        <span className="text-xs font-medium text-gray-500">
                          {(admin.full_name || admin.email || "?")
                            .charAt(0)
                            .toUpperCase()}
                        </span>
                      </div>
                    )}
                    <div>
                      {admin.full_name && (
                        <p className="text-sm font-medium text-gray-900">
                          {admin.full_name}
                        </p>
                      )}
                      <p className="text-xs text-gray-500">
                        {admin.email || admin.user_id.slice(0, 12) + "..."}
                      </p>
                    </div>
                  </div>
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
                    onClick={() =>
                      handleRemoveAdmin(admin.role_id, admin.full_name)
                    }
                    className="p-1.5 rounded-lg text-gray-400 hover:text-danger hover:bg-danger-light transition-colors cursor-pointer"
                    title="Remove admin access"
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
                1. Have the new admin sign in at{" "}
                <code className="bg-blue-100 px-1.5 py-0.5 rounded text-xs">
                  /login
                </code>{" "}
                using their Google account.
              </li>
              <li>
                2. Come back here and enter their email address above.
              </li>
              <li>
                3. On their next visit, they&apos;ll have full access to the
                admin panel.
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
