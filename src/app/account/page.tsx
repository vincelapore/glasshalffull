import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { AccountShell } from "@/components/account-shell";
import { AccountVisibilityToggle } from "@/components/account-visibility";
import { CreativeSubmissionForm } from "@/components/forms/creative-submission-form";
import { Notice } from "@/components/ui/notice";
import { SectionHeader, TextLink } from "@/components/ui/page";
import { getAccountVisibility } from "@/lib/accounts";
import { getSessionUser } from "@/lib/admin";
import { claimInvitedProfile } from "@/lib/claim-profile";
import { statusLabels } from "@/lib/labels";
import { creativePath } from "@/lib/paths";
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

  return (
    <AccountShell user={user}>
      <section className="mb-10 space-y-4">
        <SectionHeader
          title="Visibility"
          description="Choose whether people can find you in the public directory."
        />
        <AccountVisibilityToggle isPublic={isPublic} />
      </section>
      <section className="space-y-4">
        <SectionHeader
          title="Profile"
          description={profile ? undefined : "So people can find you."}
          action={
            profile ? (
              <p className="text-sm text-muted-foreground">
                {statusLabels[profile.status]}
                {profile.status === "approved" ? (
                  <>
                    {" "}
                    ·{" "}
                    <TextLink href={creativePath(profile.slug)} variant="hover">
                      View public page
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
        <CreativeSubmissionForm
          mode="profile"
          defaultValues={
            profile
              ? {
                  name: profile.name,
                  craftCategories: profile.craftCategories,
                  city: profile.city ?? "",
                  bio: profile.bio ?? "",
                  instagramHandle: profile.instagramHandle ?? "",
                  portfolioUrl: profile.portfolioUrl ?? "",
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
