/** Fields required before a creative can appear publicly. */

export type ProfileVisibilityFields = {
  bio: string | null;
  avatarKey: string | null;
  workPhotoKeys: string[] | null | undefined;
};

export type ProfileVisibilityRequirement = {
  id: "bio" | "avatar" | "workPhoto";
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
    { id: "avatar", label: "Profile picture", done: avatarKey.length > 0 },
    {
      id: "workPhoto",
      label: "At least one work photo",
      done: workPhotos.length > 0,
    },
  ];
}

/** Ready for the public directory and a public profile URL. */
export function isProfileReadyForPublic(profile: ProfileVisibilityFields) {
  return getProfileVisibilityChecklist(profile).every((item) => item.done);
}
