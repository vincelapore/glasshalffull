import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";

import { CreativeProfile } from "@/components/creative-profile";
import { EventModerationNote } from "@/components/event-moderation-note";
import {
  EventListingCard,
  eventListingGridClassName,
} from "@/components/event-listing";
import { Notice } from "@/components/ui/notice";
import { getPublicAccountContact, getPublicAccountVisibility } from "@/lib/accounts";
import { getSessionUser, isAdminEmail } from "@/lib/admin";
import { hasAuthSessionCookie } from "@/lib/auth/session-cookie";
import { resolveDisplayedContactEmail } from "@/lib/creative-contact";
import { lineupRoleLabels } from "@/lib/labels";
import { mediaUrl } from "@/lib/media";
import { creativePath } from "@/lib/paths";
import {
  isProfileReadyForPublic,
  type ProfileVisibilityFields,
} from "@/lib/profile-visibility";
import {
  getCreativeByParam,
  getCreativeModerationNote,
  getCreativeUpcomingEvents,
  getOrganisersByEventIds,
} from "@/lib/queries";

type CreativePageProps = {
  params: Promise<{ slug: string }>;
};

async function canViewCreativeProfile(
  creative: ProfileVisibilityFields & { userId: string | null },
) {
  const accountPublic = creative.userId
    ? await getPublicAccountVisibility(creative.userId)
    : true;
  if (accountPublic && isProfileReadyForPublic(creative)) return true;
  if (!(await hasAuthSessionCookie())) return false;

  const user = await getSessionUser();
  if (!user) return false;
  if (creative.userId && user.id === creative.userId) return true;
  return isAdminEmail(user.email);
}

export async function generateMetadata({
  params,
}: CreativePageProps): Promise<Metadata> {
  const { slug } = await params;
  const creative = await getCreativeByParam(slug);
  if (!creative || !(await canViewCreativeProfile(creative))) {
    return { title: "Creative" };
  }
  return { title: creative.name };
}

export default async function CreativeDetailPage({
  params,
}: CreativePageProps) {
  const { slug } = await params;
  const creative = await getCreativeByParam(slug);

  if (!creative || !(await canViewCreativeProfile(creative))) {
    notFound();
  }

  const optedPrivate = creative.userId
    ? !(await getPublicAccountVisibility(creative.userId))
    : false;
  const incomplete = !isProfileReadyForPublic(creative);

  if (slug !== creative.slug) {
    permanentRedirect(creativePath(creative.slug));
  }

  const upcoming = await getCreativeUpcomingEvents(creative.id);
  const organisersByEvent = await getOrganisersByEventIds(
    upcoming.map(({ event }) => event.id),
  );
  const isApproved = creative.status === "approved";
  const viewer = (await hasAuthSessionCookie()) ? await getSessionUser() : null;
  const showModerationNote = Boolean(
    viewer &&
    (viewer.id === creative.userId || (await isAdminEmail(viewer.email))),
  );
  const moderationNote = showModerationNote
    ? await getCreativeModerationNote(creative.id)
    : null;
  const linkedAccount =
    creative.publicEmailMode === "account" && creative.userId
      ? await getPublicAccountContact(creative.userId)
      : null;
  const contactEmail = resolveDisplayedContactEmail(
    creative.publicEmailMode,
    creative.publicEmail,
    linkedAccount?.email,
  );

  return (
    <CreativeProfile
      creative={creative}
      avatarSrc={mediaUrl(creative.avatarKey)}
      socials={creative.socials}
      instagramHandle={creative.instagramHandle}
      portfolioUrl={creative.portfolioUrl}
      contactEmail={contactEmail}
      workPhotoKeys={creative.workPhotoKeys}
      videoUrls={creative.videoUrls}
      audioUrls={creative.audioUrls}
      notices={
        <>
          {!isApproved ? (
            <Notice className="mb-6">
              This profile isn’t listed publicly.
            </Notice>
          ) : optedPrivate ? (
            <Notice className="mb-6">
              This profile is private and isn’t in the directory.
            </Notice>
          ) : incomplete ? (
            <Notice className="mb-6">
              This profile isn’t public yet. Finish the directory essentials to
              appear.
            </Notice>
          ) : null}
          {showModerationNote ? (
            <EventModerationNote note={moderationNote} className="mb-6" />
          ) : null}
        </>
      }
      upcoming={
        upcoming.length > 0 ? (
          <section className="space-y-4">
            <h2 className="text-xl font-semibold tracking-tight">
              Upcoming events
            </h2>
            <div className={eventListingGridClassName}>
              {upcoming.map(({ event, role }) => (
                <EventListingCard
                  key={event.id}
                  event={event}
                  organisers={organisersByEvent.get(event.id)}
                  note={lineupRoleLabels[role]}
                />
              ))}
            </div>
          </section>
        ) : null
      }
    />
  );
}
