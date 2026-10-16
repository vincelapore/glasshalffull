import type { Metadata } from "next";

import {
  AdminList,
  GrantAdminForm,
} from "@/components/admin/admin-team-form";
import { EmptyState, Page, PageHeader, SectionHeader } from "@/components/ui/page";
import { listAccounts } from "@/lib/accounts";
import { listStaff, requireOwner } from "@/lib/admin";

export const metadata: Metadata = {
  title: "Team",
};

export const dynamic = "force-dynamic";

export default async function AdminTeamPage() {
  const user = await requireOwner();
  const [staff, accounts] = await Promise.all([listStaff(), listAccounts()]);
  const staffEmails = new Set(
    staff.map((person) => person.email.toLowerCase())
  );
  const namesByEmail = Object.fromEntries(
    accounts.map((account) => [account.email, account.name])
  );
  const available = accounts.filter(
    (account) => !staffEmails.has(account.email)
  );

  return (
    <Page width="narrow">
      <PageHeader
        title="Team"
        description="Admins can moderate submissions. They need an account first. Only owners can add or remove admins."
      />

      <section className="mb-10 space-y-4">
        <SectionHeader title="People" titleClassName="text-lg" />
        {staff.length === 0 ? (
          <EmptyState>No staff yet.</EmptyState>
        ) : (
          <AdminList
            staff={staff}
            namesByEmail={namesByEmail}
            currentEmail={user.email}
          />
        )}
      </section>

      <section className="space-y-4">
        <SectionHeader
          title="Add admin"
          description="Pick someone who already has an account."
          titleClassName="text-lg"
        />
        {accounts.length === 0 ? (
          <EmptyState>No accounts yet. People need to sign up first.</EmptyState>
        ) : (
          <GrantAdminForm accounts={available} />
        )}
      </section>
    </Page>
  );
}
