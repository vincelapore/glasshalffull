"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";

import {
  createAdminCreativeAction,
  saveMyProfileAction,
  updateCreativeAction,
} from "@/app/actions/submissions";
import { discardUnusedWorkPhotosAction } from "@/app/actions/upload";
import { PhotoUploadField } from "@/components/forms/photo-upload-field";
import { MediaUrlsField } from "@/components/forms/media-urls-field";
import { PublicEmailField } from "@/components/forms/public-email-field";
import { SocialsField } from "@/components/forms/socials-field";
import {
  uploadWorkSlots,
  WorkPhotosField,
  workSlotsFromKeys,
  type WorkSlot,
} from "@/components/forms/work-photos-field";
import { ProfileDirectoryEssentials } from "@/components/profile-visibility-checklist";
import { Button } from "@/components/ui/button";
import { Choice, ChoiceControl } from "@/components/ui/choice";
import { Field, FieldError, Fieldset } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Notice } from "@/components/ui/notice";
import { OptionPill } from "@/components/ui/option-pill";
import { Textarea } from "@/components/ui/textarea";
import {
  MAX_CREATIVE_AUDIO_URLS,
  MAX_CREATIVE_VIDEO_URLS,
} from "@/lib/creative-media";
import {
  cityLabels,
  disciplineLabels,
  parsePronounSelection,
  roleLabels,
  serializePronounSelection,
  workOpportunityTagLabels,
} from "@/lib/labels";
import { MAX_WORK_PHOTOS } from "@/lib/media";
import {
  getProfileVisibilityChecklist,
  isProfileReadyForPublic,
} from "@/lib/profile-visibility";
import { compressAndUploadPhoto } from "@/lib/upload-photo";
import {
  cities,
  creativeRoles,
  creativeSubmissionSchema,
  disciplines,
  pronounPresets,
  workOpportunityTags,
  type CreativeSubmissionInput,
} from "@/lib/validations";

const emptyProfileValues: CreativeSubmissionInput = {
  name: "",
  disciplines: [],
  roles: [],
  specialty: "",
  isQueer: false,
  city: "",
  pronouns: "",
  bio: "",
  socials: [],
  publicEmailMode: "hidden",
  publicEmail: "",
  videoUrls: [""],
  audioUrls: [""],
  avatarKey: "",
  workPhotoKeys: [],
  openToPaidWork: false,
  openToTrade: false,
  buildingPortfolio: false,
};

type CreativeSubmissionFormProps =
  | {
      mode: "profile";
      defaultValues?: CreativeSubmissionInput;
      accountEmail: string;
    }
  | {
      mode: "admin";
      creativeId: string;
      defaultValues: CreativeSubmissionInput;
      /** Login email when the profile is claimed. Enables “use account email”. */
      accountEmail?: string | null;
    }
  | {
      mode: "admin-create";
    };

export function CreativeSubmissionForm(props: CreativeSubmissionFormProps) {
  const mode = props.mode;
  const creativeId = mode === "admin" ? props.creativeId : null;
  const accountEmail =
    mode === "profile"
      ? props.accountEmail
      : mode === "admin"
        ? props.accountEmail
        : null;
  const rawDefaults = mode === "admin-create" ? undefined : props.defaultValues;
  const defaults: CreativeSubmissionInput | undefined = rawDefaults
    ? {
        ...emptyProfileValues,
        ...rawDefaults,
        publicEmailMode:
          rawDefaults.publicEmailMode === "account" && !accountEmail?.trim()
            ? "hidden"
            : (rawDefaults.publicEmailMode ?? "hidden"),
        publicEmail: rawDefaults.publicEmail ?? "",
      }
    : undefined;
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [savedMessage, setSavedMessage] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [pendingPhoto, setPendingPhoto] = useState<File | null>(null);
  const [inviteEmail, setInviteEmail] = useState("");
  const [workSlots, setWorkSlots] = useState<WorkSlot[]>(() =>
    workSlotsFromKeys(defaults?.workPhotoKeys)
  );

  const form = useForm<CreativeSubmissionInput>({
    resolver: zodResolver(creativeSubmissionSchema),
    defaultValues: defaults ?? emptyProfileValues,
  });

  const onSubmit = form.handleSubmit((values) => {
    setFormError(null);
    setSavedMessage(null);

    startTransition(async () => {
      let avatarKey = values.avatarKey;

      if (pendingPhoto) {
        const uploaded = await compressAndUploadPhoto(pendingPhoto, "avatar");
        if (!uploaded.success) {
          setFormError(uploaded.message);
          return;
        }
        avatarKey = uploaded.key;
      }

      const workPhotos = await uploadWorkSlots(workSlots);
      if (!workPhotos.ok) {
        setFormError(workPhotos.message);
        return;
      }

      const payload = {
        ...values,
        avatarKey,
        workPhotoKeys: workPhotos.keys,
      };
      const result =
        mode === "admin" && creativeId
          ? await updateCreativeAction(creativeId, payload)
          : mode === "admin-create"
            ? await createAdminCreativeAction(payload, inviteEmail)
            : await saveMyProfileAction(payload);

      if (!result.success) {
        if (workPhotos.fresh.length > 0) {
          await discardUnusedWorkPhotosAction(workPhotos.fresh);
        }
        setFormError(result.message);
        if (result.fieldErrors) {
          for (const [field, messages] of Object.entries(result.fieldErrors)) {
            form.setError(field as keyof CreativeSubmissionInput, {
              message: messages?.[0],
            });
          }
        }
        return;
      }

      if (mode === "admin-create") {
        router.push(`/admin/creatives/${result.id}/edit`);
        router.refresh();
        return;
      }

      if (mode === "admin") {
        router.push("/admin/submissions");
        router.refresh();
        return;
      }

      setPendingPhoto(null);
      form.setValue("avatarKey", avatarKey);
      form.setValue("workPhotoKeys", workPhotos.keys);
      setWorkSlots(workSlotsFromKeys(workPhotos.keys));
      setSavedMessage(result.message);
      router.refresh();
    });
  });

  const watchedBio = useWatch({ control: form.control, name: "bio" });
  const watchedAvatarKey = useWatch({
    control: form.control,
    name: "avatarKey",
  });
  const watchedSocials = useWatch({ control: form.control, name: "socials" });
  const watchedPublicEmailMode = useWatch({
    control: form.control,
    name: "publicEmailMode",
  });
  const watchedPublicEmail = useWatch({
    control: form.control,
    name: "publicEmail",
  });
  const essentialsProfile =
    mode === "profile"
      ? {
          bio: watchedBio ?? "",
          avatarKey: pendingPhoto ? "pending" : (watchedAvatarKey ?? ""),
          workPhotoKeys: workSlots.map((slot) =>
            slot.source === "stored" ? slot.key : slot.id
          ),
          socials: watchedSocials ?? [],
          publicEmailMode: watchedPublicEmailMode ?? "hidden",
          publicEmail: watchedPublicEmail ?? "",
          hasAccountEmail: Boolean(accountEmail?.trim()),
        }
      : null;
  const essentialsReady = essentialsProfile
    ? isProfileReadyForPublic(essentialsProfile)
    : false;
  const essentialsChecklist = essentialsProfile
    ? getProfileVisibilityChecklist(essentialsProfile)
    : null;
  const needsBio = essentialsChecklist?.some(
    (item) => item.id === "bio" && !item.done
  );
  const needsAvatar = essentialsChecklist?.some(
    (item) => item.id === "avatar" && !item.done
  );
  const needsWorkPhoto = essentialsChecklist?.some(
    (item) => item.id === "workPhoto" && !item.done
  );
  const needsContact = essentialsChecklist?.some(
    (item) => item.id === "contact" && !item.done
  );

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      {essentialsProfile ? (
        <ProfileDirectoryEssentials profile={essentialsProfile} />
      ) : null}

      {mode === "admin-create" ? (
        <Field>
          <Label htmlFor="inviteEmail">Invite email (optional)</Label>
          <Input
            id="inviteEmail"
            type="email"
            autoComplete="off"
            value={inviteEmail}
            onChange={(event) => setInviteEmail(event.target.value)}
            placeholder="name@example.com"
          />
        </Field>
      ) : null}

      <Field>
        <Label htmlFor="name">Name</Label>
        <Input
          id="name"
          {...form.register("name")}
          aria-invalid={Boolean(form.formState.errors.name)}
        />
        <FieldError>{form.formState.errors.name?.message}</FieldError>
      </Field>

      <Controller
        control={form.control}
        name="pronouns"
        render={({ field, fieldState }) => {
          const { selected, custom } = parsePronounSelection(field.value);

          return (
            <Field>
              <Label>Pronouns (optional)</Label>
              <div className="flex flex-wrap gap-1.5">
                {pronounPresets.map((preset) => {
                  const checked = selected.includes(preset);
                  return (
                    <OptionPill
                      key={preset}
                      active={checked}
                      onClick={() => {
                        const nextSelected = checked
                          ? selected.filter((value) => value !== preset)
                          : [...selected, preset];
                        field.onChange(
                          serializePronounSelection(nextSelected, custom)
                        );
                      }}
                    >
                      {preset}
                    </OptionPill>
                  );
                })}
              </div>
              <Input
                id="pronouns-custom"
                placeholder="Or self-describe"
                autoComplete="off"
                value={custom}
                onChange={(event) => {
                  field.onChange(
                    serializePronounSelection(selected, event.target.value)
                  );
                }}
                onBlur={field.onBlur}
                aria-invalid={Boolean(fieldState.error)}
              />
              <FieldError>{fieldState.error?.message}</FieldError>
            </Field>
          );
        }}
      />

      <Controller
        control={form.control}
        name="city"
        render={({ field, fieldState }) => (
          <Field>
            <Label>City (optional)</Label>
            <div className="flex flex-wrap gap-1.5">
              <OptionPill
                active={field.value === ""}
                onClick={() => field.onChange("")}
              >
                None
              </OptionPill>
              {cities.map((city) => (
                <OptionPill
                  key={city}
                  active={field.value === city}
                  onClick={() => field.onChange(city)}
                >
                  {cityLabels[city]}
                </OptionPill>
              ))}
            </div>
            <FieldError>{fieldState.error?.message}</FieldError>
          </Field>
        )}
      />

      <Controller
        control={form.control}
        name="disciplines"
        render={({ field, fieldState }) => (
          <Fieldset legend="Discipline">
            <div className="grid gap-2 sm:grid-cols-2">
              {disciplines.map((discipline) => {
                const checked = field.value?.includes(discipline) ?? false;

                return (
                  <Choice key={discipline}>
                    <ChoiceControl
                      checked={checked}
                      onChange={(event) => {
                        const next = event.target.checked
                          ? [...(field.value ?? []), discipline]
                          : (field.value ?? []).filter(
                              (value) => value !== discipline
                            );
                        field.onChange(next);
                      }}
                    />
                    <span className="text-sm">
                      {disciplineLabels[discipline]}
                    </span>
                  </Choice>
                );
              })}
            </div>
            <FieldError>{fieldState.error?.message}</FieldError>
          </Fieldset>
        )}
      />

      <Controller
        control={form.control}
        name="roles"
        render={({ field, fieldState }) => (
          <Field>
            <Label>Role (optional)</Label>
            <div className="grid gap-2 sm:grid-cols-2">
              {creativeRoles.map((role) => {
                const checked = field.value?.includes(role) ?? false;

                return (
                  <Choice key={role}>
                    <ChoiceControl
                      checked={checked}
                      onChange={(event) => {
                        const next = event.target.checked
                          ? [...(field.value ?? []), role]
                          : (field.value ?? []).filter(
                              (value) => value !== role
                            );
                        field.onChange(next);
                      }}
                    />
                    <span className="text-sm">{roleLabels[role]}</span>
                  </Choice>
                );
              })}
            </div>
            <FieldError>{fieldState.error?.message}</FieldError>
          </Field>
        )}
      />

      <Field>
        <Label htmlFor="specialty">Specialty (optional)</Label>
        <Input
          id="specialty"
          placeholder="e.g. drag king, lighting"
          autoComplete="off"
          {...form.register("specialty")}
          aria-invalid={Boolean(form.formState.errors.specialty)}
        />
        <FieldError>{form.formState.errors.specialty?.message}</FieldError>
      </Field>

      <Controller
        control={form.control}
        name="isQueer"
        render={({ field }) => (
          <div className="flex flex-wrap gap-1.5">
            <OptionPill
              active={field.value}
              onClick={() => field.onChange(!field.value)}
            >
              Queer community
            </OptionPill>
          </div>
        )}
      />

      <Field
        className={
          needsBio
            ? "rounded-xl border border-destructive/35 bg-destructive/5 p-3"
            : undefined
        }
      >
        <Label
          htmlFor="bio"
          className={needsBio ? "text-destructive" : undefined}
        >
          Bio
        </Label>
        <Textarea
          id="bio"
          rows={4}
          placeholder="Who you are and what you make."
          aria-invalid={needsBio || Boolean(form.formState.errors.bio)}
          {...form.register("bio")}
        />
        <FieldError>{form.formState.errors.bio?.message}</FieldError>
      </Field>

      <div className="space-y-4">
        <Controller
          control={form.control}
          name="avatarKey"
          render={({ field, fieldState }) => (
            <PhotoUploadField
              id="avatarKey"
              label="Profile picture"
              storedKey={field.value}
              file={pendingPhoto}
              onFileChange={setPendingPhoto}
              error={fieldState.error?.message}
              disabled={pending}
              attention={Boolean(needsAvatar)}
              crop
            />
          )}
        />

        <WorkPhotosField
          slots={workSlots}
          onChange={setWorkSlots}
          description={
            mode === "profile" ? undefined : `Up to ${MAX_WORK_PHOTOS}`
          }
          error={form.formState.errors.workPhotoKeys?.message}
          disabled={pending}
          attention={Boolean(needsWorkPhoto)}
        />
      </div>

      <div
        className={
          needsContact
            ? "space-y-4 rounded-xl border border-destructive/40 bg-destructive/8 p-3"
            : "space-y-4"
        }
      >
        {needsContact ? (
          <p className="text-sm font-medium text-destructive">
            Add Instagram, a website, or email.
          </p>
        ) : null}
        <SocialsField
          control={form.control}
          setValue={form.setValue}
          name="socials"
          errorMessage={
            typeof form.formState.errors.socials?.message === "string"
              ? form.formState.errors.socials.message
              : undefined
          }
        />
        <PublicEmailField
          control={form.control}
          register={form.register}
          setValue={form.setValue}
          accountEmail={accountEmail}
          errors={form.formState.errors}
        />
      </div>

      <div className="space-y-4">
        <MediaUrlsField
          control={form.control}
          register={form.register}
          setValue={form.setValue}
          name="videoUrls"
          label="Videos"
          placeholder="youtube.com/… or vimeo.com/…"
          hint={`Up to ${MAX_CREATIVE_VIDEO_URLS}`}
          max={MAX_CREATIVE_VIDEO_URLS}
          errors={
            form.formState.errors.videoUrls as
              | Array<{ message?: string } | undefined>
              | undefined
          }
          rootError={
            typeof form.formState.errors.videoUrls?.message === "string"
              ? form.formState.errors.videoUrls.message
              : undefined
          }
        />
        <MediaUrlsField
          control={form.control}
          register={form.register}
          setValue={form.setValue}
          name="audioUrls"
          label="Listen"
          placeholder="Spotify, Apple Music, SoundCloud, or Bandcamp"
          hint={`Up to ${MAX_CREATIVE_AUDIO_URLS}`}
          max={MAX_CREATIVE_AUDIO_URLS}
          errors={
            form.formState.errors.audioUrls as
              | Array<{ message?: string } | undefined>
              | undefined
          }
          rootError={
            typeof form.formState.errors.audioUrls?.message === "string"
              ? form.formState.errors.audioUrls.message
              : undefined
          }
        />
      </div>

      <Field>
        <Label>Open to</Label>
        <div className="flex flex-wrap gap-1.5">
          {workOpportunityTags.map((tag) => {
            const fieldName =
              tag === "paid_work"
                ? "openToPaidWork"
                : tag === "trade"
                  ? "openToTrade"
                  : "buildingPortfolio";

            return (
              <Controller
                key={tag}
                control={form.control}
                name={fieldName}
                render={({ field }) => (
                  <OptionPill
                    active={field.value}
                    onClick={() => field.onChange(!field.value)}
                  >
                    {workOpportunityTagLabels[tag]}
                  </OptionPill>
                )}
              />
            );
          })}
        </div>
      </Field>

      {formError ? <Notice variant="destructive">{formError}</Notice> : null}

      <div className="space-y-3 border-t border-border pt-6">
        {savedMessage ? (
          essentialsProfile ? (
            <Notice>
              {essentialsReady
                ? "Saved. You’re live if set to Public."
                : "Saved. Finish the essentials above to appear in the directory."}
            </Notice>
          ) : (
            <Notice variant="muted">{savedMessage}</Notice>
          )
        ) : null}

        <div className="flex flex-wrap gap-3">
          <Button type="submit" disabled={pending} className="w-full sm:w-auto">
            {pending
              ? mode === "admin-create"
                ? "Creating…"
                : "Saving…"
              : mode === "admin-create"
                ? "Create profile"
                : "Save profile"}
          </Button>
          {mode === "admin" || mode === "admin-create" ? (
            <Button
              type="button"
              variant="outline"
              disabled={pending}
              onClick={() => router.push("/admin/submissions")}
            >
              Cancel
            </Button>
          ) : null}
        </div>
      </div>
    </form>
  );
}
