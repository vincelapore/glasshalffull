import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { CreativeSubmissionForm } from "@/components/forms/creative-submission-form";
import { Button } from "@/components/ui/button";
import { requireAdmin } from "@/lib/admin";
import { getCreativeById } from "@/lib/queries";

export const metadata: Metadata = {
  title: "Edit Creative",
};

export const dynamic = "force-dynamic";

export default async function EditCreativePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();

  const { id } = await params;
  const creative = await getCreativeById(id);

  if (!creative) {
    notFound();
  }

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-12 sm:px-6">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight">
            Edit creative
          </h1>
          <p className="text-muted-foreground">
            Update profile details. Status is managed from the submissions queue.
          </p>
        </div>
        <Button
          size="sm"
          variant="outline"
          render={<Link href="/admin/submissions" />}
        >
          Back to queue
        </Button>
      </div>
      <CreativeSubmissionForm
        mode="admin"
        creativeId={creative.id}
        defaultValues={{
          name: creative.name,
          craftCategories: creative.craftCategories,
          city: creative.city ?? "",
          bio: creative.bio ?? "",
          instagramHandle: creative.instagramHandle ?? "",
          portfolioUrl: creative.portfolioUrl ?? "",
          avatarKey: creative.avatarKey ?? "",
          openToPaidWork: creative.openToPaidWork,
          openToTrade: creative.openToTrade,
          buildingPortfolio: creative.buildingPortfolio,
        }}
      />
    </div>
  );
}
