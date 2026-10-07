import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { CreativeSubmissionForm } from "@/components/forms/creative-submission-form";
import { InviteEmailForm } from "@/components/invite-email-form";
import { Button } from "@/components/ui/button";
import { Notice } from "@/components/ui/notice";
import { Page, PageHeader } from "@/components/ui/page";
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
    <Page width="narrow">
      <PageHeader
        title="Edit creative"
        description="Update profile details. Status is managed from the submissions queue."
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
      {creative.userId ? (
        <Notice className="mb-8">This profile is linked to an account.</Notice>
      ) : (
        <div className="mb-8">
          <InviteEmailForm
            creativeId={creative.id}
            inviteEmail={creative.inviteEmail}
          />
        </div>
      )}
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
          workPhotoKeys: creative.workPhotoKeys,
          openToPaidWork: creative.openToPaidWork,
          openToTrade: creative.openToTrade,
          buildingPortfolio: creative.buildingPortfolio,
        }}
      />
    </Page>
  );
}
