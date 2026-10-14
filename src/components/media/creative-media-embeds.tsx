import type { ReactNode } from "react";

import {
  resolveAudioEmbed,
  resolveVideoEmbed,
  type AudioEmbed,
  type VideoEmbed,
} from "@/lib/creative-media";

function MediaLink({
  href,
  children,
}: {
  href: string;
  children: ReactNode;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="text-sm underline underline-offset-4 transition-colors hover:text-primary"
    >
      {children}
    </a>
  );
}

function VideoPlayer({ video }: { video: VideoEmbed }) {
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="text-sm font-medium text-muted-foreground">
          {video.label}
        </h3>
        <MediaLink href={video.href}>Open on {video.label}</MediaLink>
      </div>
      {video.embedSrc ? (
        <div className="relative aspect-video overflow-hidden rounded-xl bg-muted">
          <iframe
            src={video.embedSrc}
            title={`${video.label} video`}
            className="absolute inset-0 size-full border-0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            loading="lazy"
            referrerPolicy="strict-origin-when-cross-origin"
          />
        </div>
      ) : (
        <a
          href={video.href}
          target="_blank"
          rel="noreferrer"
          className="flex items-center justify-between gap-4 rounded-xl bg-muted px-4 py-3 text-sm transition-colors hover:bg-muted/80"
        >
          <span>Watch on {video.label}</span>
          <span className="text-muted-foreground" aria-hidden>
            →
          </span>
        </a>
      )}
    </div>
  );
}

function AudioPlayer({ audio }: { audio: AudioEmbed }) {
  if (audio.embedSrc) {
    return (
      <div className="space-y-3">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h3 className="text-sm font-medium text-muted-foreground">
            {audio.label}
          </h3>
          <MediaLink href={audio.href}>Open on {audio.label}</MediaLink>
        </div>
        <div className="overflow-hidden rounded-xl bg-muted">
          <iframe
            src={audio.embedSrc}
            title={`${audio.label} player`}
            className="block w-full border-0"
            style={{ height: audio.embedHeight }}
            allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
            loading="lazy"
            referrerPolicy="strict-origin-when-cross-origin"
            {...(audio.provider === "apple_music"
              ? {
                  sandbox:
                    "allow-forms allow-popups allow-same-origin allow-scripts allow-storage-access-by-user-activation allow-top-navigation-by-user-activation",
                }
              : {})}
          />
        </div>
      </div>
    );
  }

  // Bandcamp (and any other link-only provider): prominent listen card.
  return (
    <a
      href={audio.href}
      target="_blank"
      rel="noreferrer"
      className="flex items-center justify-between gap-4 rounded-xl border border-border bg-muted/40 px-4 py-4 transition-colors hover:bg-muted"
    >
      <div className="min-w-0 space-y-1">
        <p className="text-sm font-medium">Listen on {audio.label}</p>
        <p className="truncate text-sm text-muted-foreground">{audio.href}</p>
      </div>
      <span className="shrink-0 text-muted-foreground" aria-hidden>
        →
      </span>
    </a>
  );
}

export function CreativeMediaEmbeds({
  videoUrls,
  audioUrls,
}: {
  videoUrls?: readonly string[] | null;
  audioUrls?: readonly string[] | null;
}) {
  const videos = (videoUrls ?? [])
    .map((value) => resolveVideoEmbed(value))
    .filter((value): value is VideoEmbed => Boolean(value));
  const audios = (audioUrls ?? [])
    .map((value) => resolveAudioEmbed(value))
    .filter((value): value is AudioEmbed => Boolean(value));

  if (videos.length === 0 && audios.length === 0) return null;

  return (
    <section className="mt-14 space-y-10">
      {videos.length > 0 ? (
        <div className="space-y-6">
          <h2 className="text-xl font-semibold tracking-tight">Watch</h2>
          <div className="space-y-8">
            {videos.map((video) => (
              <VideoPlayer key={video.href} video={video} />
            ))}
          </div>
        </div>
      ) : null}

      {audios.length > 0 ? (
        <div className="space-y-6">
          <h2 className="text-xl font-semibold tracking-tight">Listen</h2>
          <div className="space-y-6">
            {audios.map((audio) => (
              <AudioPlayer key={audio.href} audio={audio} />
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );
}
