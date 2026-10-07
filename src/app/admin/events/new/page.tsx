import type { Metadata } from "next";
import Link from "next/link";

import { EventSubmissionForm } from "@/components/forms/event-submission-form";
import { Button } from "@/components/ui/button";
import { Page, PageHeader } from "@/components/ui/page";
import { requireAdmin } from "@/lib/admin";

export const metadata: Metadata = {
  title: "New event",
};

export const dynamic = "force-dynamic";

export default async function NewAdminEventPage() {
  await requireAdmin();

  return (
    <Page width="narrow">
      <PageHeader
        title="New event"
        description="Published straight away. Organisers are optional — add them on the next screen if you want."
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
      <EventSubmissionForm mode="admin-create" />
    </Page>
  );
}
