import { PageHeader } from "@/components/admin/page-header";
import { AdminUsersList } from "@/components/admin/users/admin-users-list";
import { listAdminUsers, listPendingAdmins } from "@/lib/actions";

export default async function AdminUsersPage() {
  const [admins, pendingAdmins] = await Promise.all([
    listAdminUsers(),
    listPendingAdmins(),
  ]);

  return (
    <>
      <PageHeader
        title="Admins"
        description="Manage who has access to the Sprint Admin panel."
      />

      <AdminUsersList admins={admins} pendingAdmins={pendingAdmins} />
    </>
  );
}
