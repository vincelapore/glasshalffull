import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { AccountShell } from "@/components/account-shell";
import { AccountVisibilityToggle } from "@/components/account-visibility";
import { CreativeSubmissionForm } from "@/components/forms/creative-submission-form";
import { EventModerationNote } from "@/components/event-moderation-note";
import { Notice } from "@/components/ui/notice";
import { SectionHeader, TextLink } from "@/components/ui/page";
import { getAccountVisibility } from "@/lib/accounts";
import { getSessionUser } from "@/lib/admin";
import { claimInvitedProfile } from "@/lib/claim-profile";
import { statusLabels } from "@/lib/labels";
import { creativePath } from "@/lib/paths";
import { isProfileReadyForPublic } from "@/lib/profile-visibility";
import { getCreativeByUserId } from "@/lib/queries";

export const metadata: Metadata = {
  title: "Account",
};

export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const user = await getSessionUser();
  if (!user) {
    redirect("/auth/sign-in?next=/account");
  }

  const claim = await claimInvitedProfile(user);
  const [profile, isPublic] = await Promise.all([
    getCreativeByUserId(user.id),
    getAccountVisibility(user.id),
  ]);
  const profileReady = profile ? isProfileReadyForPublic(profile) : false;
  const canViewPublicPage =
    profile?.status === "approved" && profileReady && isPublic;

  return (
    <AccountShell user={user}>
      <section className="mb-10 space-y-4">
        <SectionHeader
          title="Visibility"
          description="Public only lists you once your profile is approved and the essentials below are done."
        />
        <AccountVisibilityToggle
          isPublic={isPublic}
          profileReady={profileReady}
        />
      </section>
      <section className="space-y-4">
        <SectionHeader
          title="Profile"
          description="Directory essentials are listed at the top of the form."
          action={
            profile ? (
              <p className="text-sm text-muted-foreground">
                {statusLabels[profile.status]}
                {canViewPublicPage ? (
                  <>
                    {" "}
                    ·{" "}
                    <TextLink href={creativePath(profile.slug)} variant="hover">
                      View public page
                    </TextLink>
                  </>
                ) : profile.status === "approved" ? (
                  <>
                    {" "}
                    ·{" "}
                    <TextLink href={creativePath(profile.slug)} variant="hover">
                      Preview page
                    </TextLink>
                  </>
                ) : null}
              </p>
            ) : null
          }
        />
        {claim.status === "conflict" ? (
          <Notice>
            A profile is waiting for this email, and this account already has
            one. An admin needs to sort that out.
          </Notice>
        ) : null}
        {profile ? <EventModerationNote note={profile.moderationNote} /> : null}
        <CreativeSubmissionForm
          mode="profile"
          defaultValues={
            profile
              ? {
                  name: profile.name,
                  disciplines: profile.disciplines,
                  roles: profile.roles,
                  specialty: profile.specialty ?? "",
                  isQueer: profile.isQueer,
                  city: profile.city ?? "",
                  pronouns: profile.pronouns ?? "",
                  bio: profile.bio ?? "",
                  instagramHandle: profile.instagramHandle ?? "",
                  portfolioUrl: profile.portfolioUrl ?? "",
                  videoUrl: profile.videoUrl ?? "",
                  audioUrl: profile.audioUrl ?? "",
                  avatarKey: profile.avatarKey ?? "",
                  workPhotoKeys: profile.workPhotoKeys,
                  openToPaidWork: profile.openToPaidWork,
                  openToTrade: profile.openToTrade,
                  buildingPortfolio: profile.buildingPortfolio,
                }
              : undefined
          }
        />
      </section>
    </AccountShell>
  );
}
