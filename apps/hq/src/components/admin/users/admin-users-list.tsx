"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  addAdminByEmail,
  removeAdmin,
  removePendingAdmin,
} from "@/lib/actions";
import type { AdminUser, PendingAdmin } from "@/lib/actions";
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
  Clock,
} from "lucide-react";

interface AdminUsersListProps {
  admins: AdminUser[];
  pendingAdmins: PendingAdmin[];
}

export function AdminUsersList({
  admins,
  pendingAdmins,
}: AdminUsersListProps) {
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
      const message = result.pending
        ? "Admin pre-approved — they'll get access on first sign-in"
        : "Admin added successfully";
      setStatus({ type: "success", message });
      setTimeout(() => setStatus(null), 5000);
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

  const handleRemovePending = async (id: string, email: string) => {
    if (!confirm(`Remove pending admin invite for ${email}?`)) return;

    const result = await removePendingAdmin(id);

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
              {pendingAdmins.length > 0 && (
                <span className="text-gray-400 font-normal">
                  {" "}
                  · {pendingAdmins.length} pending
                </span>
              )}
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
              Enter any email — if they haven&apos;t signed in yet,
              they&apos;ll be pre-approved and get admin access on their first
              sign-in.
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
                Status
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
            {pendingAdmins.map((pending) => (
              <tr
                key={pending.id}
                className="hover:bg-gray-50/50 transition-colors bg-amber-50/30"
              >
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center">
                      <Mail size={14} className="text-amber-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {pending.email}
                      </p>
                      <p className="text-xs text-gray-400">
                        Hasn&apos;t signed in yet
                      </p>
                    </div>
                  </div>
                </td>
                <td className="px-5 py-3.5">
                  <Badge variant="outline" className="text-amber-700 border-amber-300 bg-amber-50">
                    <Clock size={10} className="mr-1" />
                    Pending
                  </Badge>
                </td>
                <td className="px-5 py-3.5 text-sm text-gray-500">
                  {formatDate(pending.created_at)}
                </td>
                <td className="px-5 py-3.5">
                  <button
                    onClick={() =>
                      handleRemovePending(pending.id, pending.email)
                    }
                    className="p-1.5 rounded-lg text-gray-400 hover:text-danger hover:bg-danger-light transition-colors cursor-pointer"
                    title="Remove pending admin"
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
                1. Enter the new admin&apos;s email address above.
              </li>
              <li>
                2. If they&apos;ve already signed in, they get access
                immediately.
              </li>
              <li>
                3. If not, they&apos;ll be pre-approved and get admin access
                automatically when they first sign in with Google.
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
