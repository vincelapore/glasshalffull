import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";

import { CreativeCraftTags } from "@/components/creative-craft-tags";
import { EventModerationNote } from "@/components/event-moderation-note";
import { CreativeWorkTags } from "@/components/creative-work-tags";
import {
  EventListingCard,
  eventListingGridClassName,
} from "@/components/event-listing";
import { CreativeMediaEmbeds } from "@/components/media/creative-media-embeds";
import { ExternalImage } from "@/components/media/external-image";
import { WorkPhotoGrid } from "@/components/media/work-photo-grid";
import { Notice } from "@/components/ui/notice";
import { Page, PageTitle } from "@/components/ui/page";
import { getAccountVisibility } from "@/lib/accounts";
import { getSessionUser, isAdminEmail } from "@/lib/admin";
import {
  resolveAudioEmbed,
  resolveVideoEmbed,
} from "@/lib/creative-media";
import {
  cityLabels,
  formatInstagramHandle,
  instagramProfileHref,
  lineupRoleLabels,
} from "@/lib/labels";
import { mediaUrl } from "@/lib/media";
import { creativePath } from "@/lib/paths";
import { isProfileReadyForPublic } from "@/lib/profile-visibility";
import {
  getCreativeByParam,
  getCreativeModerationNote,
  getCreativeUpcomingEvents,
  getOrganisersByEventIds,
} from "@/lib/queries";

type CreativePageProps = {
  params: Promise<{ slug: string }>;
};

async function canViewCreativeProfile(creative: {
  userId: string | null;
  bio: string | null;
  avatarKey: string | null;
  workPhotoKeys: string[];
}) {
  const accountPublic = creative.userId
    ? await getAccountVisibility(creative.userId)
    : true;
  if (accountPublic && isProfileReadyForPublic(creative)) return true;

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

export default async function CreativeDetailPage({ params }: CreativePageProps) {
  const { slug } = await params;
  const creative = await getCreativeByParam(slug);

  if (!creative || !(await canViewCreativeProfile(creative))) {
    notFound();
  }

  const optedPrivate = creative.userId
    ? !(await getAccountVisibility(creative.userId))
    : false;
  const incomplete = !isProfileReadyForPublic(creative);

  if (slug !== creative.slug) {
    permanentRedirect(creativePath(creative.slug));
  }

  const upcoming = await getCreativeUpcomingEvents(creative.id);
  const organisersByEvent = await getOrganisersByEventIds(
    upcoming.map(({ event }) => event.id)
  );
  const isApproved = creative.status === "approved";
  const viewer = await getSessionUser();
  const showModerationNote = Boolean(
    viewer &&
      (viewer.id === creative.userId || (await isAdminEmail(viewer.email)))
  );
  const moderationNote = showModerationNote
    ? await getCreativeModerationNote(creative.id)
    : null;
  const video = creative.videoUrl
    ? resolveVideoEmbed(creative.videoUrl)
    : null;
  const audio = creative.audioUrl
    ? resolveAudioEmbed(creative.audioUrl)
    : null;

  return (
    <Page>
      {!isApproved ? (
        <Notice className="mb-6">
          This profile is <strong>{creative.status}</strong> and not listed
          publicly yet.
        </Notice>
      ) : optedPrivate ? (
        <Notice className="mb-6">
          This profile is private and isn’t in the directory.
        </Notice>
      ) : incomplete ? (
        <Notice className="mb-6">
          This profile isn’t public yet. Add a bio, a profile picture, and at
          least one work photo to appear in the directory.
        </Notice>
      ) : null}
      {showModerationNote ? (
        <EventModerationNote note={moderationNote} className="mb-6" />
      ) : null}

      <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="space-y-6">
          <div className="flex items-start gap-4">
            <ExternalImage
              src={mediaUrl(creative.avatarKey)}
              alt={creative.name}
              className="size-20 shrink-0 rounded-2xl object-cover sm:size-28"
              fallback={
                <div className="flex size-20 shrink-0 items-center justify-center rounded-2xl bg-muted text-2xl font-medium sm:size-28 sm:text-3xl">
                  {creative.name.slice(0, 1).toUpperCase()}
                </div>
              }
            />
            <div className="min-w-0 space-y-3">
              <div className="flex flex-wrap gap-1.5">
                <CreativeCraftTags creative={creative} />
                <CreativeWorkTags creative={creative} />
              </div>
              <PageTitle className="break-words sm:text-4xl">
                {creative.name}
              </PageTitle>
              {creative.pronouns ? (
                <p className="text-sm text-muted-foreground">
                  {creative.pronouns}
                </p>
              ) : null}
              {creative.city ? (
                <p className="text-muted-foreground">
                  {cityLabels[creative.city]}
                </p>
              ) : null}
            </div>
          </div>

          {creative.bio ? (
            <p className="max-w-2xl whitespace-pre-wrap text-base leading-relaxed">
              {creative.bio}
            </p>
          ) : null}

          <div className="flex flex-wrap gap-4 text-sm">
            {creative.instagramHandle ? (
              <a
                href={instagramProfileHref(creative.instagramHandle)}
                target="_blank"
                rel="noreferrer"
                className="underline underline-offset-4 transition-colors hover:text-primary"
              >
                {formatInstagramHandle(creative.instagramHandle)}
              </a>
            ) : null}
            {creative.portfolioUrl ? (
              <a
                href={creative.portfolioUrl}
                target="_blank"
                rel="noreferrer"
                className="underline underline-offset-4 transition-colors hover:text-primary"
              >
                Portfolio
              </a>
            ) : null}
            {video ? (
              <a
                href={video.href}
                target="_blank"
                rel="noreferrer"
                className="underline underline-offset-4 transition-colors hover:text-primary"
              >
                {video.label}
              </a>
            ) : null}
            {audio ? (
              <a
                href={audio.href}
                target="_blank"
                rel="noreferrer"
                className="underline underline-offset-4 transition-colors hover:text-primary"
              >
                {audio.label}
              </a>
            ) : null}
          </div>
        </div>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold tracking-tight">
            Upcoming events
          </h2>
          {upcoming.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No upcoming events yet.
            </p>
          ) : (
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
          )}
        </section>
      </div>

      <WorkPhotoGrid name={creative.name} keys={creative.workPhotoKeys} />
      <CreativeMediaEmbeds
        videoUrl={creative.videoUrl}
        audioUrl={creative.audioUrl}
      />
    </Page>
  );
}
