"use client";

import { ChevronUp, Mail, Pause, Play, X } from "lucide-react";
import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";

import {
  AppleMusicIcon,
  BandcampIcon,
  GlobeIcon,
  InstagramIcon,
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
import { resolvePrimaryContact } from "@/lib/creative-contact";
import {
  groupCreativeSocials,
  socialProviderLabels,
  type CreativeSocial,
  type SocialProvider,
} from "@/lib/creative-socials";
import { withOutboundUtm } from "@/lib/urls";
import { cn } from "@/lib/utils";

type DockMode = "idle" | "audio" | "video" | "links";

function ProviderGlyph({
  provider,
}: {
  provider:
    | AudioEmbed["provider"]
    | VideoEmbed["provider"]
    | SocialProvider
    | "email";
}) {
  if (provider === "email") {
    return <Mail className="size-4" strokeWidth={1.75} />;
  }
  switch (provider) {
    case "website":
      return <GlobeIcon className="size-4" />;
    case "instagram":
      return <InstagramIcon className="size-4" />;
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

function SocialRow({ social }: { social: CreativeSocial }) {
  return (
    <a
      href={withOutboundUtm(social.url, {
        campaign: "artist_profile",
        content: social.provider,
      })}
      target="_blank"
      rel="noreferrer"
      className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors hover:bg-muted"
    >
      <span className="flex size-8 items-center justify-center rounded-lg bg-muted text-foreground">
        <ProviderGlyph provider={social.provider} />
      </span>
      <span className="min-w-0 flex-1 font-medium">
        {socialProviderLabels[social.provider]}
      </span>
      <span className="text-muted-foreground" aria-hidden>
        →
      </span>
    </a>
  );
}

function EmailRow({ email }: { email: string }) {
  return (
    <a
      href={`mailto:${email}`}
      className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors hover:bg-muted"
    >
      <span className="flex size-8 items-center justify-center rounded-lg bg-muted text-foreground">
        <ProviderGlyph provider="email" />
      </span>
      <span className="min-w-0 flex-1 truncate font-medium">{email}</span>
      <span className="text-muted-foreground" aria-hidden>
        →
      </span>
    </a>
  );
}

function LinkGroup({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-1">
      <p className="px-3 font-mono text-[10px] font-medium tracking-[0.14em] text-muted-foreground lowercase">
        {title}
      </p>
      <div className="space-y-0.5">{children}</div>
    </div>
  );
}

export function CreativeMediaDock({
  name,
  avatarSrc,
  videos,
  audios,
  socials = [],
  contactEmail,
}: {
  name: string;
  avatarSrc?: string | null;
  videos: readonly VideoEmbed[];
  audios: readonly AudioEmbed[];
  socials?: readonly CreativeSocial[];
  contactEmail?: string | null;
}) {
  const titleId = useId();
  const linksId = useId();
  const playableVideos = videos.filter((video) => video.embedSrc);
  const playableAudios = audios.filter(
    (audio) => audio.embedSrc || audio.provider === "bandcamp",
  );

  const links = [...socials];
  const email = contactEmail?.trim().toLowerCase() || null;
  const primary = resolvePrimaryContact(links, email);
  const { reach, listenWatch } = groupCreativeSocials(links);
  const otherLinks =
    primary?.type === "social"
      ? links.filter((social) => social.provider !== primary.provider)
      : links;
  const hasEmail = Boolean(email);
  const hasLinks = links.length > 0 || hasEmail;
  const hasReachPanel = reach.length > 0 || hasEmail;
  const hasMedia = Boolean(playableVideos[0] || playableAudios[0]);

  const [mode, setMode] = useState<DockMode>("idle");
  const [videoIndex, setVideoIndex] = useState(0);
  const [audioIndex, setAudioIndex] = useState(0);
  const railRef = useRef<HTMLDivElement>(null);

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

  // Landed = sticky rail has released. Wide hysteresis avoids flicker on slow scrolls.
  useEffect(() => {
    if (!hasMedia && !hasLinks) return;
    const rail = railRef.current;
    if (!rail) return;

    let landed = false;
    let frame = 0;

    const update = () => {
      const top = rail.getBoundingClientRect().top;
      // Stuck ≈ 0. Enter landed well below stick; exit only when clearly stuck again.
      const next = landed ? top < -4 : top < -24;
      if (next === landed) return;
      landed = next;
      rail.toggleAttribute("data-landed", landed);
    };

    const onScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      rail.removeAttribute("data-landed");
    };
  }, [hasMedia, hasLinks]);

  if (!hasMedia && !hasLinks) return null;

  const audioExpanded = mode === "audio";
  const linksExpanded = mode === "links";
  const videoExpanded = mode === "video";

  const statusLine = (() => {
    if (audioExpanded && activeAudio) {
      return `Listening · ${activeAudio.label}`;
    }
    if (linksExpanded) return "Links & contact";
    if (activeAudio) return "Play while you browse";
    if (activeVideo) return "Watch a video";
    if (primary?.type === "social") {
      return socialProviderLabels[primary.provider];
    }
    if (primary?.type === "email") return "Email";
    return "Links & contact";
  })();

  const primaryButton = (placement: "dock" | "video") => {
    if (!primary) return null;
    const isEmail = primary.type === "email";
    const href = isEmail
      ? primary.href
      : withOutboundUtm(primary.href, {
          campaign: "artist_profile",
          content: `${primary.provider}_${placement}`,
        });
    const glyph =
      primary.type === "email" ? "email" : primary.provider;
    if (placement === "video") {
      return (
        <Button
          render={
            <a
              href={href}
              {...(isEmail
                ? {}
                : { target: "_blank", rel: "noreferrer" })}
            />
          }
          size="sm"
          variant="secondary"
          className="gap-1.5 bg-white/15 px-3 text-white hover:bg-white/25"
        >
          <ProviderGlyph provider={glyph} />
          {primary.label}
        </Button>
      );
    }
    return (
      <Button
        render={
          <a
            href={href}
            {...(isEmail
              ? {}
              : { target: "_blank", rel: "noreferrer" })}
          />
        }
        size="sm"
        className="size-8 gap-0 px-0 sm:h-7 sm:w-auto sm:gap-1.5 sm:px-2.5"
        aria-label={
          isEmail ? `Email ${primary.email}` : `Open ${primary.label}`
        }
      >
        <ProviderGlyph provider={glyph} />
        <span className="hidden sm:inline">{primary.label}</span>
      </Button>
    );
  };

  const videoDialog =
    videoExpanded && activeVideo?.embedSrc ? (
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
            {primaryButton("video")}
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
                        : "bg-white/15 text-white hover:bg-white/25",
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
    ) : null;

  return (
    <>
      {/*
        Viewport-tall sticky rail (same grid cell as profile content).
        Sticks while browsing; scrolls away with the page above the footer.
        Pure CSS — no scroll-linked JS (avoids backdrop-filter jank).
      */}
      <div
        ref={railRef}
        className={cn(
          "group/dock pointer-events-none sticky top-0 z-40 col-start-1 row-start-1 flex h-dvh w-full flex-col justify-end self-start",
          "px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]",
          "transition-[padding] duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] motion-reduce:transition-none",
          "data-landed:px-0 data-landed:pb-0"
        )}
        aria-hidden={videoExpanded}
      >
        <div
          className={cn(
            "pointer-events-auto mx-auto w-full max-w-xl overflow-hidden rounded-2xl border border-border/80",
            "bg-background/90 shadow-lg shadow-black/10 backdrop-blur-xl",
            "dark:bg-background/85 dark:shadow-black/40",
            "transition-[max-width,border-radius] duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] motion-reduce:transition-none",
            "group-data-[landed]/dock:max-w-none group-data-[landed]/dock:rounded-xl",
            videoExpanded && "invisible",
          )}
        >
          {audioExpanded && activeAudio ? (
            <div
              id={titleId}
              className="border-b border-border/70 px-3 pt-3 pb-2"
            >
              <div className="mb-2 flex items-center justify-between gap-2">
                <p className="flex min-w-0 items-center gap-2 text-sm font-medium">
                  <span className="shrink-0">
                    <ProviderGlyph provider={activeAudio.provider} />
                  </span>
                  <span className="truncate">{activeAudio.label}</span>
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
                            : "bg-muted text-muted-foreground hover:text-foreground",
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

          {linksExpanded && hasLinks ? (
            <div
              id={linksId}
              className="max-h-[min(50dvh,22rem)] space-y-4 overflow-y-auto border-b border-border/70 px-2 pt-3 pb-2"
            >
              {hasReachPanel ? (
                <LinkGroup title="Reach me">
                  {reach.map((social) => (
                    <SocialRow key={social.provider} social={social} />
                  ))}
                  {email ? <EmailRow email={email} /> : null}
                </LinkGroup>
              ) : null}
              {listenWatch.length > 0 ? (
                <LinkGroup title="Listen & watch">
                  {listenWatch.map((social) => (
                    <SocialRow key={social.provider} social={social} />
                  ))}
                </LinkGroup>
              ) : null}
            </div>
          ) : null}

          <div className="flex items-center gap-2 px-2.5 py-2 sm:gap-2.5 sm:px-3 sm:py-2.5">
            <ExternalImage
              src={avatarSrc}
              alt=""
              className="size-9 shrink-0 rounded-lg object-cover sm:size-10"
              fallback={
                <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-sm font-medium sm:size-10">
                  {name.slice(0, 1).toUpperCase()}
                </div>
              }
            />
            <div className="min-w-0 flex-1 overflow-hidden">
              <p className="truncate text-sm font-medium">{name}</p>
              <p className="truncate text-xs text-muted-foreground">
                {statusLine}
              </p>
            </div>

            <div className="flex shrink-0 items-center gap-1 sm:gap-1.5">
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

              {primaryButton("dock")}

              {otherLinks.length > 0 ||
              (primary?.type === "social" && hasEmail) ||
              (!primary && hasLinks) ||
              (primary?.type === "email" && links.length > 0) ? (
                <Button
                  type="button"
                  size="icon"
                  variant={linksExpanded ? "secondary" : "outline"}
                  aria-expanded={linksExpanded}
                  aria-controls={linksExpanded ? linksId : undefined}
                  aria-label={linksExpanded ? "Hide links" : "More links"}
                  onClick={() =>
                    setMode((current) =>
                      current === "links" ? "idle" : "links"
                    )
                  }
                >
                  {linksExpanded ? (
                    <ChevronUp className="size-4 rotate-180" />
                  ) : (
                    <span className="text-xs font-medium tracking-widest">
                      ···
                    </span>
                  )}
                </Button>
              ) : null}
            </div>
          </div>
        </div>
      </div>
      {videoDialog ? createPortal(videoDialog, document.body) : null}
    </>
  );
}
