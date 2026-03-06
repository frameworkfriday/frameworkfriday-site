import { PageHeader } from "@/components/admin/page-header";
import { AdminUsersList } from "@/components/admin/users/admin-users-list";
import { listAdminUsers } from "@/lib/actions";

export default async function AdminUsersPage() {
  const admins = await listAdminUsers();

  return (
    <>
      <PageHeader
        title="Admins"
        description="Manage who has access to the Sprint Admin panel."
      />

      <AdminUsersList admins={admins} />
    </>
  );
}
