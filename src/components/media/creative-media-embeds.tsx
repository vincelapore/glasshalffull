import type { ReactNode } from "react";

import {
  resolveAudioEmbed,
  resolveVideoEmbed,
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

export function CreativeMediaEmbeds({
  videoUrl,
  audioUrl,
}: {
  videoUrl?: string | null;
  audioUrl?: string | null;
}) {
  const video = videoUrl ? resolveVideoEmbed(videoUrl) : null;
  const audio = audioUrl ? resolveAudioEmbed(audioUrl) : null;

  if (!video && !audio) return null;

  return (
    <section className="mt-14 space-y-10">
      {video ? (
        <div className="space-y-3">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="text-xl font-semibold tracking-tight">Watch</h2>
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
          ) : null}
        </div>
      ) : null}

      {audio ? (
        <div className="space-y-3">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="text-xl font-semibold tracking-tight">Listen</h2>
            <MediaLink href={audio.href}>Open on {audio.label}</MediaLink>
          </div>
          {audio.embedSrc ? (
            <div className="overflow-hidden rounded-xl bg-muted">
              <iframe
                src={audio.embedSrc}
                title={`${audio.label} player`}
                className="block h-[166px] w-full border-0"
                allow="autoplay"
                loading="lazy"
                referrerPolicy="strict-origin-when-cross-origin"
              />
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
