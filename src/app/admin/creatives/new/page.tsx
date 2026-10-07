import type { Metadata } from "next";
import Link from "next/link";

import { CreativeSubmissionForm } from "@/components/forms/creative-submission-form";
import { Button } from "@/components/ui/button";
import { Page, PageHeader } from "@/components/ui/page";
import { requireAdmin } from "@/lib/admin";

export const metadata: Metadata = {
  title: "New profile",
};

export const dynamic = "force-dynamic";

export default async function NewAdminCreativePage() {
  await requireAdmin();

  return (
    <Page width="narrow">
      <PageHeader
        title="New profile"
        description="Published straight away. Add an email if someone should claim it by signing up."
        actions={
          <Button
            size="sm"
            variant="outline"
            render={<Link href="/admin/submissions" />}
          >
            Back to queue
          </Button>
        }
      />
      <CreativeSubmissionForm mode="admin-create" />
    </Page>
  );
}
