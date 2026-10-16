import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ModerationActivityLog } from "@/components/admin/moderation-activity-log";
import { CreativeSubmissionForm } from "@/components/forms/creative-submission-form";
import { InviteEmailForm } from "@/components/invite-email-form";
import { Button } from "@/components/ui/button";
import { Notice } from "@/components/ui/notice";
import { Page, PageHeader } from "@/components/ui/page";
import { isOwnerEmail, requireAdmin } from "@/lib/admin";
import { socialsFromLegacy } from "@/lib/creative-socials";
import { getModerationActivity } from "@/lib/moderation-activity";
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
  const user = await requireAdmin();

  const { id } = await params;
  const creative = await getCreativeById(id);

  if (!creative) {
    notFound();
  }

  const showActivity = await isOwnerEmail(user.email);
  const activity = showActivity
    ? await getModerationActivity("creative", creative.id)
    : [];

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
          disciplines: creative.disciplines,
          roles: creative.roles,
          specialty: creative.specialty ?? "",
          isQueer: creative.isQueer,
          city: creative.city ?? "",
          pronouns: creative.pronouns ?? "",
          bio: creative.bio ?? "",
          socials: socialsFromLegacy(creative),
          videoUrls: creative.videoUrls.length ? creative.videoUrls : [""],
          audioUrls: creative.audioUrls.length ? creative.audioUrls : [""],
          avatarKey: creative.avatarKey ?? "",
          workPhotoKeys: creative.workPhotoKeys,
          openToPaidWork: creative.openToPaidWork,
          openToTrade: creative.openToTrade,
          buildingPortfolio: creative.buildingPortfolio,
        }}
      />
      {showActivity ? (
        <ModerationActivityLog entries={activity} viewerEmail={user.email} />
      ) : null}
    </Page>
  );
}
