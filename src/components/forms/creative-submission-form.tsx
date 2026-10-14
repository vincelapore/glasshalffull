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
import { isProfileReadyForPublic } from "@/lib/profile-visibility";
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
    }
  | {
      mode: "admin";
      creativeId: string;
      defaultValues: CreativeSubmissionInput;
    }
  | {
      mode: "admin-create";
    };

export function CreativeSubmissionForm(props: CreativeSubmissionFormProps) {
  const mode = props.mode;
  const creativeId = mode === "admin" ? props.creativeId : null;
  const defaults = mode === "admin-create" ? undefined : props.defaultValues;
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
  const essentialsProfile =
    mode === "profile"
      ? {
          bio: watchedBio ?? "",
          avatarKey: pendingPhoto ? "pending" : (watchedAvatarKey ?? ""),
          workPhotoKeys: workSlots.map((slot) =>
            slot.source === "stored" ? slot.key : slot.id
          ),
        }
      : null;
  const essentialsReady = essentialsProfile
    ? isProfileReadyForPublic(essentialsProfile)
    : false;

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
          <p className="text-sm text-muted-foreground">
            They claim this profile by signing up or signing in with this
            email.
          </p>
        </Field>
      ) : null}

      <Field>
        <Label htmlFor="name">Name / moniker</Label>
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
            <Fieldset legend="Pronouns (optional)">
              <div className="grid gap-2 sm:grid-cols-3">
                {pronounPresets.map((preset) => {
                  const checked = selected.includes(preset);

                  return (
                    <Choice key={preset}>
                      <ChoiceControl
                        checked={checked}
                        onChange={(event) => {
                          const nextSelected = event.target.checked
                            ? [...selected, preset]
                            : selected.filter((value) => value !== preset);
                          field.onChange(
                            serializePronounSelection(nextSelected, custom)
                          );
                        }}
                        onBlur={field.onBlur}
                      />
                      <span className="text-sm">{preset}</span>
                    </Choice>
                  );
                })}
              </div>
              <Field>
                <Label htmlFor="pronouns-custom">Self-describe</Label>
                <Input
                  id="pronouns-custom"
                  placeholder="e.g. xe/xem, she/they"
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
              </Field>
              <FieldError>{fieldState.error?.message}</FieldError>
            </Fieldset>
          );
        }}
      />

      <Controller
        control={form.control}
        name="city"
        render={({ field, fieldState }) => (
          <Fieldset legend="City (optional)">
            <div className="grid gap-2 sm:grid-cols-3">
              <Choice>
                <ChoiceControl
                  type="radio"
                  name={field.name}
                  value=""
                  checked={field.value === ""}
                  onChange={() => field.onChange("")}
                  onBlur={field.onBlur}
                  ref={field.ref}
                />
                <span className="text-sm">Not specified</span>
              </Choice>
              {cities.map((city) => (
                <Choice key={city}>
                  <ChoiceControl
                    type="radio"
                    name={field.name}
                    value={city}
                    checked={field.value === city}
                    onChange={() => field.onChange(city)}
                    onBlur={field.onBlur}
                  />
                  <span className="text-sm">{cityLabels[city]}</span>
                </Choice>
              ))}
            </div>
            <FieldError>{fieldState.error?.message}</FieldError>
          </Fieldset>
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
          <Fieldset legend="Role (optional)">
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
          </Fieldset>
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
          <Choice>
            <ChoiceControl
              checked={field.value}
              onChange={(event) => field.onChange(event.target.checked)}
              onBlur={field.onBlur}
              ref={field.ref}
            />
            <span className="text-sm">Queer community</span>
          </Choice>
        )}
      />

      <Field>
        <Label htmlFor="bio">Bio</Label>
        {mode === "profile" ? (
          <p className="text-sm text-muted-foreground">
            Needed to appear in the directory.
          </p>
        ) : null}
        <Textarea
          id="bio"
          rows={5}
          placeholder="Who you are, what you make, where people find you."
          {...form.register("bio")}
        />
        <FieldError>{form.formState.errors.bio?.message}</FieldError>
      </Field>

      <Fieldset legend="Open to">
        <div className="space-y-2">
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
                  <Choice>
                    <ChoiceControl
                      checked={field.value}
                      onChange={(event) => field.onChange(event.target.checked)}
                    />
                    <span className="text-sm">{workOpportunityTagLabels[tag]}</span>
                  </Choice>
                )}
              />
            );
          })}
        </div>
      </Fieldset>

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

      <div className="space-y-4">
        <MediaUrlsField
          control={form.control}
          register={form.register}
          setValue={form.setValue}
          name="videoUrls"
          label="Videos"
          placeholder="youtube.com/… or vimeo.com/…"
          help="YouTube or Vimeo links play on your public profile."
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
          placeholder="spotify.com/…, music.apple.com/…, soundcloud.com/…, or bandcamp.com/…"
          help="Spotify, Apple Music, and SoundCloud embed players. Bandcamp opens in a listen card."
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

      <Controller
        control={form.control}
        name="avatarKey"
        render={({ field, fieldState }) => (
          <PhotoUploadField
            id="avatarKey"
            label="Profile Picture"
            description={
              mode === "profile"
                ? "Needed to appear in the directory."
                : undefined
            }
            storedKey={field.value}
            file={pendingPhoto}
            onFileChange={setPendingPhoto}
            error={fieldState.error?.message}
            disabled={pending}
            crop
          />
        )}
      />

      <WorkPhotosField
        slots={workSlots}
        onChange={setWorkSlots}
        description={
          mode === "profile"
            ? `At least one photo is needed to appear in the directory. Up to ${MAX_WORK_PHOTOS} photos.`
            : undefined
        }
        error={form.formState.errors.workPhotoKeys?.message}
        disabled={pending}
      />

      {formError ? <Notice variant="destructive">{formError}</Notice> : null}

      <div className="space-y-3 border-t border-border pt-6">
        {savedMessage ? (
          essentialsProfile ? (
            <Notice>
              <p className="font-medium">Profile saved.</p>
              <p className="mt-1 text-muted-foreground">
                {essentialsReady
                  ? "Essentials are done. You’ll appear in the directory once approved and set to Public."
                  : "Finish the essentials above to appear in the directory."}
              </p>
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
