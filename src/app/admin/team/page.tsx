import type { Metadata } from "next";

import {
  AddAdminForm,
  AdminList,
} from "@/components/admin/admin-team-form";
import { EmptyState, Page, PageHeader, SectionHeader } from "@/components/ui/page";
import { listStaff, requireOwner } from "@/lib/admin";

export const metadata: Metadata = {
  title: "Team",
};

export const dynamic = "force-dynamic";

export default async function AdminTeamPage() {
  const user = await requireOwner();
  const staff = await listStaff();

  return (
    <Page width="narrow">
      <PageHeader
        title="Team"
        description="Admins can moderate submissions. Only owners can add or remove admins."
      />

      <section className="mb-10 space-y-4">
        <SectionHeader title="People" titleClassName="text-lg" />
        {staff.length === 0 ? (
          <EmptyState>No staff yet.</EmptyState>
        ) : (
          <AdminList staff={staff} currentEmail={user.email} />
        )}
      </section>

      <section className="space-y-4">
        <SectionHeader title="Add admin" titleClassName="text-lg" />
        <AddAdminForm />
      </section>
    </Page>
  );
}
