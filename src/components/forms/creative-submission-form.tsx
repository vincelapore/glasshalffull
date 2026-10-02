"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Controller, useForm } from "react-hook-form";

import {
  submitCreativeAction,
  updateCreativeAction,
} from "@/app/actions/submissions";
import { PhotoUploadField } from "@/components/forms/photo-upload-field";
import { SubmissionSuccess } from "@/components/forms/submission-success";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { craftCategoryLabels, workOpportunityTagLabels } from "@/lib/labels";
import { compressAndUploadPhoto } from "@/lib/upload-photo";
import {
  craftCategories,
  creativeSubmissionSchema,
  workOpportunityTags,
  type CreativeSubmissionInput,
} from "@/lib/validations";

type CreativeSubmissionFormProps =
  | { mode?: "create"; creativeId?: never; defaultValues?: never }
  | {
      mode: "edit";
      creativeId: string;
      defaultValues: CreativeSubmissionInput;
    };

export function CreativeSubmissionForm(props: CreativeSubmissionFormProps) {
  const mode = props.mode ?? "create";
  const creativeId = mode === "edit" ? props.creativeId : null;
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [submitted, setSubmitted] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [pendingPhoto, setPendingPhoto] = useState<File | null>(null);

  const form = useForm<CreativeSubmissionInput>({
    resolver: zodResolver(creativeSubmissionSchema),
    defaultValues:
      mode === "edit"
        ? props.defaultValues
        : {
            name: "",
            craftCategories: [],
            bio: "",
            instagramHandle: "",
            portfolioUrl: "",
            avatarKey: "",
            openToPaidWork: false,
            openToTrade: false,
            buildingPortfolio: false,
          },
  });

  const resetToForm = () => {
    setSubmitted(false);
    setFormError(null);
    setPendingPhoto(null);
    form.reset();
  };

  const onSubmit = form.handleSubmit((values) => {
    setFormError(null);

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

      const payload = { ...values, avatarKey };
      const result =
        mode === "edit" && creativeId
          ? await updateCreativeAction(creativeId, payload)
          : await submitCreativeAction(payload);

      if (!result.success) {
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

      if (mode === "edit") {
        router.push("/admin/submissions");
        router.refresh();
        return;
      }

      form.reset();
      setPendingPhoto(null);
      setSubmitted(true);
      router.refresh();
    });
  });

  if (mode === "create" && submitted) {
    return (
      <SubmissionSuccess
        title="Your profile is in the queue."
        description="Thanks for pouring back in. We’ll review it before it appears in the creative directory."
        primaryHref="/creatives"
        primaryLabel="Browse creatives"
        onSubmitAnother={resetToForm}
        submitAnotherLabel="Submit another profile"
      />
    );
  }

  const instagramHandleField = form.register("instagramHandle");

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="name">Name / moniker</Label>
        <Input
          id="name"
          {...form.register("name")}
          aria-invalid={Boolean(form.formState.errors.name)}
        />
        {form.formState.errors.name ? (
          <p className="text-xs text-destructive">
            {form.formState.errors.name.message}
          </p>
        ) : null}
      </div>

      <Controller
        control={form.control}
        name="craftCategories"
        render={({ field, fieldState }) => (
          <fieldset className="space-y-3">
            <legend className="text-sm font-medium">Craft categories</legend>
            <p className="text-sm text-muted-foreground">
              Select every craft that fits — you can pick more than one.
            </p>
            <div className="grid gap-2 sm:grid-cols-2">
              {craftCategories.map((category) => {
                const checked = field.value?.includes(category) ?? false;

                return (
                  <label
                    key={category}
                    className="flex items-start gap-3 rounded-lg border border-border/70 px-3 py-2.5 transition-colors has-[:checked]:border-foreground/40 has-[:checked]:bg-muted/30"
                  >
                    <input
                      type="checkbox"
                      className="mt-0.5 size-4 rounded border-border accent-foreground"
                      checked={checked}
                      onChange={(event) => {
                        const next = event.target.checked
                          ? [...(field.value ?? []), category]
                          : (field.value ?? []).filter(
                              (value) => value !== category
                            );
                        field.onChange(next);
                      }}
                    />
                    <span className="text-sm">
                      {craftCategoryLabels[category]}
                    </span>
                  </label>
                );
              })}
            </div>
            {fieldState.error ? (
              <p className="text-xs text-destructive">
                {fieldState.error.message}
              </p>
            ) : null}
          </fieldset>
        )}
      />

      <div className="space-y-2">
        <Label htmlFor="bio">Bio</Label>
        <Textarea
          id="bio"
          rows={5}
          placeholder="Who you are, what you make, where people find you."
          {...form.register("bio")}
        />
        {form.formState.errors.bio ? (
          <p className="text-xs text-destructive">
            {form.formState.errors.bio.message}
          </p>
        ) : null}
      </div>

      <fieldset className="space-y-3">
        <legend className="text-sm font-medium">Open to</legend>
        <p className="text-sm text-muted-foreground">
          Optional tags so collaborators and organisers can find you.
        </p>
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
                  <label
                    className="flex items-start gap-3 rounded-lg border border-border/70 px-3 py-2.5 transition-colors has-[:checked]:border-foreground/40 has-[:checked]:bg-muted/30"
                  >
                    <input
                      type="checkbox"
                      className="mt-0.5 size-4 rounded border-border accent-foreground"
                      checked={field.value}
                      onChange={(event) => field.onChange(event.target.checked)}
                    />
                    <span className="text-sm">{workOpportunityTagLabels[tag]}</span>
                  </label>
                )}
              />
            );
          })}
        </div>
      </fieldset>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="instagramHandle">Instagram handle</Label>
          <div className="flex h-8 items-center rounded-lg border border-input bg-transparent pl-2.5 transition-colors focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50 dark:bg-input/30 has-[[aria-invalid=true]]:border-destructive has-[[aria-invalid=true]]:ring-3 has-[[aria-invalid=true]]:ring-destructive/20 dark:has-[[aria-invalid=true]]:border-destructive/50 dark:has-[[aria-invalid=true]]:ring-destructive/40">
            <span
              aria-hidden="true"
              className="cursor-text select-none text-sm text-muted-foreground"
              onMouseDown={(event) => {
                event.preventDefault();
                document.getElementById("instagramHandle")?.focus();
              }}
            >
              @
            </span>
            <Input
              id="instagramHandle"
              className="h-full min-w-0 flex-1 border-0 bg-transparent py-1 pr-2.5 pl-0.5 shadow-none focus-visible:border-transparent focus-visible:ring-0 aria-invalid:border-0 aria-invalid:ring-0 dark:bg-transparent dark:aria-invalid:border-0 dark:aria-invalid:ring-0"
              placeholder="yourhandle"
              autoComplete="off"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              {...instagramHandleField}
              onChange={(event) => {
                event.target.value = event.target.value.replace(/^@+/, "");
                instagramHandleField.onChange(event);
              }}
              aria-invalid={Boolean(form.formState.errors.instagramHandle)}
            />
          </div>
          {form.formState.errors.instagramHandle ? (
            <p className="text-xs text-destructive">
              {form.formState.errors.instagramHandle.message}
            </p>
          ) : null}
        </div>
        <div className="space-y-2">
          <Label htmlFor="portfolioUrl">Portfolio URL</Label>
          <Input
            id="portfolioUrl"
            type="url"
            placeholder="https://"
            {...form.register("portfolioUrl")}
            aria-invalid={Boolean(form.formState.errors.portfolioUrl)}
          />
          {form.formState.errors.portfolioUrl ? (
            <p className="text-xs text-destructive">
              {form.formState.errors.portfolioUrl.message}
            </p>
          ) : null}
        </div>
      </div>

      <Controller
        control={form.control}
        name="avatarKey"
        render={({ field, fieldState }) => (
          <PhotoUploadField
            id="avatarKey"
            label="Photo (optional)"
            storedKey={field.value}
            file={pendingPhoto}
            onFileChange={setPendingPhoto}
            error={fieldState.error?.message}
            disabled={pending}
          />
        )}
      />

      {formError ? (
        <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {formError}
        </p>
      ) : null}

      <div className="flex flex-wrap gap-3">
        <Button type="submit" disabled={pending} className="w-full sm:w-auto">
          {pending
            ? "Submitting…"
            : mode === "edit"
              ? "Save changes"
              : "Submit profile"}
        </Button>
        {mode === "edit" ? (
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
    </form>
  );
}
