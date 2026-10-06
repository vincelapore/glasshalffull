import type { Metadata } from "next";
import Link from "next/link";

import {
  AddAdminForm,
  AdminList,
} from "@/components/admin/admin-team-form";
import { Button } from "@/components/ui/button";
import { listStaff, requireOwner } from "@/lib/admin";

export const metadata: Metadata = {
  title: "Team",
};

export const dynamic = "force-dynamic";

export default async function AdminTeamPage() {
  const user = await requireOwner();
  const staff = await listStaff();

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-12 sm:px-6">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          <h1 className="font-heading text-3xl font-semibold tracking-tight">
            Team
          </h1>
          <p className="text-muted-foreground">
            Admins can moderate submissions. Only owners can add or remove
            admins.
          </p>
        </div>
        <Button
          size="sm"
          variant="outline"
          render={<Link href="/admin/submissions" />}
        >
          Moderation
        </Button>
      </div>

      <section className="mb-10 space-y-4">
        <h2 className="text-lg font-semibold tracking-tight">People</h2>
        {staff.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border px-4 py-8 text-sm text-muted-foreground">
            No staff yet.
          </p>
        ) : (
          <AdminList staff={staff} currentEmail={user.email} />
        )}
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold tracking-tight">Add admin</h2>
        <AddAdminForm />
      </section>
    </div>
  );
}
