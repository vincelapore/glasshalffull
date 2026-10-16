import type { Metadata } from "next";
import Link from "next/link";

import { OverflowEpisodeForm } from "@/components/forms/overflow-episode-form";
import { Button } from "@/components/ui/button";
import { Page, PageHeader } from "@/components/ui/page";
import { requireAdmin } from "@/lib/admin";
import { getNextOverflowNumber } from "@/lib/queries";

export const metadata: Metadata = {
  title: "New episode",
};

export const dynamic = "force-dynamic";

export default async function NewOverflowEpisodePage() {
  await requireAdmin();
  const defaultNumber = await getNextOverflowNumber();

  return (
    <Page width="narrow">
      <PageHeader
        title="New episode"
        description="Published on the home banner as soon as you save."
        actions={
          <Button
            size="sm"
            variant="outline"
            render={<Link href="/admin/overflow" />}
          >
            Back
          </Button>
        }
      />
      <OverflowEpisodeForm mode="create" defaultNumber={defaultNumber} />
    </Page>
  );
}
