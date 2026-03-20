import { createAdminClient } from "@/lib/supabase/admin";

export type AuditAction =
  | "member_joined"
  | "profile_updated"
  | "group_assigned"
  | "group_removed"
  | "group_transferred"
  | "role_changed"
  | "facilitator_added"
  | "facilitator_removed"
  | "admin_added"
  | "admin_removed"
  | "member_archived"
  | "member_restored"
  | "invite_sent"
  | "milestone";

export async function logAudit(
  memberId: string,
  action: AuditAction,
  details: Record<string, unknown> = {},
  performedBy = "admin"
) {
  const admin = createAdminClient();
  await admin.from("member_audit_log").insert({
    member_id: memberId,
    action,
    details,
    performed_by: performedBy,
  });
}
