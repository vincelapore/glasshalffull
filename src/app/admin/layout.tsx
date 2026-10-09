import { AdminNav } from "@/components/admin/admin-nav";
import { getStaffRole, requireAdmin } from "@/lib/admin";

export default async function AdminLayout({
  children,
}: LayoutProps<"/admin">) {
  const user = await requireAdmin();
  const role = await getStaffRole(user.email);

  return (
    <div className="[&_[data-slot=page]]:pt-8">
      <AdminNav canManageTeam={role === "owner"} />
      {children}
    </div>
  );
}
