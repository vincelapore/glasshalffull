/** Fields required before a creative can appear publicly. */

import {
  hasReachContact,
  type PublicContactFields,
  type PublicEmailMode,
} from "@/lib/creative-contact";
import type { CreativeSocial } from "@/lib/creative-socials";

export type ProfileVisibilityFields = PublicContactFields & {
  bio: string | null;
  avatarKey: string | null;
  workPhotoKeys: string[] | null | undefined;
  socials?: CreativeSocial[] | null;
  publicEmailMode?: PublicEmailMode | null;
  publicEmail?: string | null;
};

export type ProfileVisibilityRequirement = {
  id: "bio" | "avatar" | "workPhoto" | "contact";
  label: string;
  done: boolean;
};

export function getProfileVisibilityChecklist(
  profile: ProfileVisibilityFields
): ProfileVisibilityRequirement[] {
  const bio = profile.bio?.trim() ?? "";
  const avatarKey = profile.avatarKey?.trim() ?? "";
  const workPhotos = profile.workPhotoKeys ?? [];

  return [
    { id: "bio", label: "Bio", done: bio.length > 0 },
    { id: "avatar", label: "Photo", done: avatarKey.length > 0 },
    {
      id: "workPhoto",
      label: "Work",
      done: workPhotos.length > 0,
    },
    {
      id: "contact",
      label: "Contact",
      done: hasReachContact(profile),
    },
  ];
}

/** Ready for the public directory and a public profile URL. */
export function isProfileReadyForPublic(profile: ProfileVisibilityFields) {
  return getProfileVisibilityChecklist(profile).every((item) => item.done);
}
