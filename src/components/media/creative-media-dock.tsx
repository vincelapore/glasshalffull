"use client";

import { ChevronUp, Pause, Play, X } from "lucide-react";
import { useEffect, useId, useState } from "react";

import {
  AppleMusicIcon,
  BandcampIcon,
  SoundCloudIcon,
  SpotifyIcon,
  VimeoIcon,
  YouTubeIcon,
} from "@/components/icons/brand-icons";
import { Button } from "@/components/ui/button";
import { ExternalImage } from "@/components/media/external-image";
import {
  withEmbedAutoplay,
  type AudioEmbed,
  type VideoEmbed,
} from "@/lib/creative-media";
import { cn } from "@/lib/utils";

type DockMode = "idle" | "audio" | "video";

function ProviderGlyph({
  provider,
}: {
  provider: AudioEmbed["provider"] | VideoEmbed["provider"];
}) {
  switch (provider) {
    case "youtube":
      return <YouTubeIcon className="size-4" />;
    case "vimeo":
      return <VimeoIcon className="size-4" />;
    case "spotify":
      return <SpotifyIcon className="size-4" />;
    case "apple_music":
      return <AppleMusicIcon className="size-4" />;
    case "soundcloud":
      return <SoundCloudIcon className="size-4" />;
    case "bandcamp":
      return <BandcampIcon className="size-4" />;
  }
}

export function CreativeMediaDock({
  name,
  avatarSrc,
  videos,
  audios,
}: {
  name: string;
  avatarSrc?: string | null;
  videos: readonly VideoEmbed[];
  audios: readonly AudioEmbed[];
}) {
  const titleId = useId();
  const playableVideos = videos.filter((video) => video.embedSrc);
  const playableAudios = audios.filter(
    (audio) => audio.embedSrc || audio.provider === "bandcamp"
  );

  const [mode, setMode] = useState<DockMode>("idle");
  const [videoIndex, setVideoIndex] = useState(0);
  const [audioIndex, setAudioIndex] = useState(0);

  const activeVideo = playableVideos[videoIndex] ?? playableVideos[0] ?? null;
  const activeAudio = playableAudios[audioIndex] ?? playableAudios[0] ?? null;

  useEffect(() => {
    if (mode !== "video") return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setMode("idle");
    }
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [mode]);

  if (!activeVideo && !activeAudio) return null;

  const audioExpanded = mode === "audio";
  const videoExpanded = mode === "video";

  return (
    <>
      <div
        className="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-center px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]"
        aria-hidden={videoExpanded}
      >
        <div
          className={cn(
            "pointer-events-auto w-full max-w-xl overflow-hidden rounded-2xl border border-border/80",
            "bg-background/90 shadow-lg shadow-black/10 backdrop-blur-xl",
            "dark:bg-background/85 dark:shadow-black/40",
            videoExpanded && "invisible"
          )}
        >
          {audioExpanded && activeAudio ? (
            <div
              id={titleId}
              className="border-b border-border/70 px-3 pt-3 pb-2"
            >
              <div className="mb-2 flex items-center justify-between gap-2">
                <p className="flex items-center gap-2 text-sm font-medium">
                  <ProviderGlyph provider={activeAudio.provider} />
                  {activeAudio.label}
                </p>
                {playableAudios.length > 1 ? (
                  <div className="flex gap-1">
                    {playableAudios.map((audio, index) => (
                      <button
                        key={audio.href}
                        type="button"
                        onClick={() => setAudioIndex(index)}
                        className={cn(
                          "rounded-full px-2 py-0.5 text-xs transition-colors",
                          index === audioIndex
                            ? "bg-foreground text-background"
                            : "bg-muted text-muted-foreground hover:text-foreground"
                        )}
                      >
                        {index + 1}
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>
              {activeAudio.embedSrc ? (
                <div className="overflow-hidden rounded-xl bg-muted">
                  <iframe
                    key={activeAudio.embedSrc}
                    src={withEmbedAutoplay(activeAudio.embedSrc)}
                    title={`${activeAudio.label} player`}
                    className="block w-full border-0"
                    style={{ height: Math.min(activeAudio.embedHeight, 152) }}
                    allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                    {...(activeAudio.provider === "apple_music"
                      ? {
                          sandbox:
                            "allow-forms allow-popups allow-same-origin allow-scripts allow-storage-access-by-user-activation allow-top-navigation-by-user-activation",
                        }
                      : {})}
                  />
                </div>
              ) : (
                <a
                  href={activeAudio.href}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-between gap-3 rounded-xl bg-muted px-3 py-3 text-sm transition-colors hover:bg-muted/80"
                >
                  <span>Open on {activeAudio.label}</span>
                  <span aria-hidden>→</span>
                </a>
              )}
            </div>
          ) : null}

          <div className="flex items-center gap-3 px-3 py-2.5">
            <ExternalImage
              src={avatarSrc}
              alt=""
              className="size-10 shrink-0 rounded-lg object-cover"
              fallback={
                <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted text-sm font-medium">
                  {name.slice(0, 1).toUpperCase()}
                </div>
              }
            />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{name}</p>
              <p className="truncate text-xs text-muted-foreground">
                {audioExpanded && activeAudio
                  ? `Listening on ${activeAudio.label}`
                  : activeAudio
                    ? "Play a track while you browse"
                    : "Watch a featured video"}
              </p>
            </div>

            {activeAudio ? (
              <Button
                type="button"
                size="icon"
                variant={audioExpanded ? "secondary" : "default"}
                aria-expanded={audioExpanded}
                aria-controls={audioExpanded ? titleId : undefined}
                aria-label={
                  audioExpanded ? "Hide music player" : "Play music"
                }
                onClick={() =>
                  setMode((current) =>
                    current === "audio" ? "idle" : "audio"
                  )
                }
              >
                {audioExpanded ? (
                  <Pause className="size-4" />
                ) : (
                  <Play className="size-4 fill-current" />
                )}
              </Button>
            ) : null}

            {activeVideo ? (
              <Button
                type="button"
                size="icon"
                variant="outline"
                aria-label={`Watch on ${activeVideo.label}`}
                onClick={() => {
                  setMode("video");
                }}
              >
                <ProviderGlyph provider={activeVideo.provider} />
              </Button>
            ) : null}

            {audioExpanded ? (
              <Button
                type="button"
                size="icon"
                variant="ghost"
                aria-label="Collapse player"
                onClick={() => setMode("idle")}
              >
                <ChevronUp className="size-4 rotate-180" />
              </Button>
            ) : null}
          </div>
        </div>
      </div>

      {/* Reserve space so page content isn’t hidden behind the dock */}
      <div className="h-24" aria-hidden />

      {videoExpanded && activeVideo?.embedSrc ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          className="fixed inset-0 z-50 flex flex-col bg-black"
        >
          <div className="flex items-center justify-between gap-3 px-4 py-3 text-white">
            <div className="min-w-0">
              <p id={titleId} className="truncate text-sm font-medium">
                {name}
              </p>
              <p className="truncate text-xs text-white/60">
                {activeVideo.label}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {playableVideos.length > 1 ? (
                <div className="flex gap-1">
                  {playableVideos.map((video, index) => (
                    <button
                      key={video.href}
                      type="button"
                      onClick={() => setVideoIndex(index)}
                      className={cn(
                        "rounded-full px-2 py-0.5 text-xs transition-colors",
                        index === videoIndex
                          ? "bg-white text-black"
                          : "bg-white/15 text-white hover:bg-white/25"
                      )}
                    >
                      {index + 1}
                    </button>
                  ))}
                </div>
              ) : null}
              <Button
                type="button"
                size="icon"
                variant="ghost"
                aria-label="Close video"
                className="text-white hover:bg-white/10 hover:text-white"
                onClick={() => setMode("idle")}
              >
                <X className="size-5" />
              </Button>
            </div>
          </div>
          <div className="relative min-h-0 flex-1 px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] sm:px-6 sm:pb-6">
            <div className="relative mx-auto h-full max-w-5xl overflow-hidden rounded-xl bg-black">
              <iframe
                key={`${activeVideo.embedSrc}-autoplay`}
                src={withEmbedAutoplay(activeVideo.embedSrc)}
                title={`${activeVideo.label} video`}
                className="absolute inset-0 size-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                referrerPolicy="strict-origin-when-cross-origin"
              />
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
