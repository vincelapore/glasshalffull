import {
  isReachSocialProvider,
  socialProviderLabels,
  socialsFromLegacy,
  type CreativeSocial,
  type SocialProvider,
} from "@/lib/creative-socials";

export const publicEmailModes = ["hidden", "account", "custom"] as const;

export type PublicEmailMode = (typeof publicEmailModes)[number];

export type PublicContactFields = {
  socials?: CreativeSocial[] | null;
  instagramHandle?: string | null;
  portfolioUrl?: string | null;
  publicEmailMode?: PublicEmailMode | null;
  publicEmail?: string | null;
  /** Claimed profile with a login email available for `account` mode. */
  hasAccountEmail?: boolean;
  userId?: string | null;
};

/** Instagram, website, or an opted-in public email. */
export function hasReachContact(profile: PublicContactFields) {
  const links = socialsFromLegacy({
    socials: profile.socials ? [...profile.socials] : null,
    instagramHandle: profile.instagramHandle,
    portfolioUrl: profile.portfolioUrl,
  });
  if (links.some((social) => isReachSocialProvider(social.provider))) {
    return true;
  }

  const mode = profile.publicEmailMode ?? "hidden";
  if (mode === "custom") {
    return Boolean(profile.publicEmail?.trim());
  }
  if (mode === "account") {
    if (typeof profile.hasAccountEmail === "boolean") {
      return profile.hasAccountEmail;
    }
    return Boolean(profile.userId);
  }
  return false;
}

/** Address shown on the public profile, if any. */
export function resolveDisplayedContactEmail(
  mode: PublicEmailMode | null | undefined,
  publicEmail: string | null | undefined,
  accountEmail: string | null | undefined
) {
  if (mode === "custom") {
    const value = publicEmail?.trim().toLowerCase() ?? "";
    return value || null;
  }
  if (mode === "account") {
    const value = accountEmail?.trim().toLowerCase() ?? "";
    return value || null;
  }
  return null;
}

export type ResolvedPublicContact =
  | {
      type: "social";
      provider: SocialProvider;
      href: string;
      label: string;
    }
  | {
      type: "email";
      email: string;
      href: string;
      label: "Email";
    };

const socialContactPriority = ["instagram", "website"] as const;

/** Best outbound CTA: Instagram, then website, then email. */
export function resolvePrimaryContact(
  socials: readonly CreativeSocial[],
  contactEmail: string | null | undefined
): ResolvedPublicContact | null {
  for (const provider of socialContactPriority) {
    const match = socials.find((social) => social.provider === provider);
    if (match) {
      return {
        type: "social",
        provider: match.provider,
        href: match.url,
        label: socialProviderLabels[match.provider],
      };
    }
  }

  const email = contactEmail?.trim().toLowerCase() ?? "";
  if (email) {
    return {
      type: "email",
      email,
      href: `mailto:${email}`,
      label: "Email",
    };
  }

  return null;
}
