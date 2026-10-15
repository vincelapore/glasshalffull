import type { ReactNode } from "react";

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
import {
  socialProviderLabels,
  socialsFromLegacy,
  type CreativeSocial,
  type SocialProvider,
} from "@/lib/creative-socials";
import { withOutboundUtm } from "@/lib/urls";
import { cn } from "@/lib/utils";

function SocialIconLink({
  href,
  label,
  children,
}: {
  href: string;
  label: string;
  children: ReactNode;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      aria-label={label}
      title={label}
      className={cn(
        "inline-flex size-10 items-center justify-center rounded-full",
        "text-foreground/80 transition-colors",
        "hover:bg-muted hover:text-foreground",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
      )}
    >
      {children}
    </a>
  );
}

function socialIcon(provider: SocialProvider) {
  switch (provider) {
    case "website":
      return <GlobeIcon />;
    case "instagram":
      return <InstagramIcon />;
    case "youtube":
      return <YouTubeIcon />;
    case "vimeo":
      return <VimeoIcon />;
    case "spotify":
      return <SpotifyIcon />;
    case "apple_music":
      return <AppleMusicIcon />;
    case "soundcloud":
      return <SoundCloudIcon />;
    case "bandcamp":
      return <BandcampIcon />;
  }
}

export function CreativeSocialLinks({
  socials,
  /** @deprecated use socials */
  instagramHandle,
  /** @deprecated use socials */
  portfolioUrl,
  className,
}: {
  socials?: readonly CreativeSocial[] | null;
  instagramHandle?: string | null;
  portfolioUrl?: string | null;
  className?: string;
}) {
  const links = socialsFromLegacy({
    socials: socials ? [...socials] : null,
    instagramHandle,
    portfolioUrl,
  });

  if (links.length === 0) return null;

  return (
    <div className={cn("flex flex-wrap items-center gap-1", className)}>
      {links.map((social) => (
        <SocialIconLink
          key={social.provider}
          href={withOutboundUtm(social.url, {
            campaign: "artist_profile",
            content: social.provider,
          })}
          label={socialProviderLabels[social.provider]}
        >
          {socialIcon(social.provider)}
        </SocialIconLink>
      ))}
    </div>
  );
}
