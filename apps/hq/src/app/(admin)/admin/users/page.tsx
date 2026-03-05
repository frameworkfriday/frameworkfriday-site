import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/admin/page-header";
import { AdminUsersList } from "@/components/admin/users/admin-users-list";

export default async function AdminUsersPage() {
  const supabase = await createClient();

  const { data: adminRoles } = await supabase
    .from("user_roles")
    .select("id, user_id, role, created_at")
    .eq("role", "admin")
    .order("created_at", { ascending: true });

  return (
    <>
      <PageHeader
        title="Admins"
        description="Manage who has access to the Sprint Admin panel."
      />

      <AdminUsersList admins={adminRoles ?? []} />
    </>
  );
}
