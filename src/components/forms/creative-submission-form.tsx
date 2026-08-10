"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Controller, useForm } from "react-hook-form";

import {
  submitCreativeAction,
  updateCreativeAction,
} from "@/app/actions/submissions";
import { ExternalImageUrlField } from "@/components/forms/external-image-url-field";
import { SubmissionSuccess } from "@/components/forms/submission-success";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { craftCategoryLabels } from "@/lib/labels";
import {
  craftCategories,
  creativeSubmissionSchema,
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

  const form = useForm<CreativeSubmissionInput>({
    resolver: zodResolver(creativeSubmissionSchema),
    defaultValues:
      mode === "edit"
        ? props.defaultValues
        : {
            name: "",
            craftCategory: undefined,
            bio: "",
            instagramUrl: "",
            portfolioUrl: "",
            avatarUrl: "",
          },
  });

  const resetToForm = () => {
    setSubmitted(false);
    setFormError(null);
    form.reset();
  };

  const onSubmit = form.handleSubmit((values) => {
    setFormError(null);

    startTransition(async () => {
      const result =
        mode === "edit" && creativeId
          ? await updateCreativeAction(creativeId, values)
          : await submitCreativeAction(values);

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
        name="craftCategory"
        render={({ field, fieldState }) => (
          <div className="space-y-2">
            <Label>Craft category</Label>
            <Select
              value={field.value}
              onValueChange={(value) => {
                if (value) field.onChange(value);
              }}
            >
              <SelectTrigger
                className="w-full"
                aria-invalid={Boolean(fieldState.error)}
              >
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {craftCategories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {craftCategoryLabels[category]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {fieldState.error ? (
              <p className="text-xs text-destructive">
                {fieldState.error.message}
              </p>
            ) : null}
          </div>
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

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="instagramUrl">Instagram URL</Label>
          <Input
            id="instagramUrl"
            type="url"
            placeholder="https://instagram.com/..."
            {...form.register("instagramUrl")}
            aria-invalid={Boolean(form.formState.errors.instagramUrl)}
          />
          {form.formState.errors.instagramUrl ? (
            <p className="text-xs text-destructive">
              {form.formState.errors.instagramUrl.message}
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
        name="avatarUrl"
        render={({ field, fieldState }) => (
          <ExternalImageUrlField
            id="avatarUrl"
            label="Photo URL (optional)"
            value={field.value}
            onChange={field.onChange}
            error={fieldState.error?.message}
            placeholder="https://…/your-photo.jpg"
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
            ? mode === "edit"
              ? "Saving…"
              : "Submitting…"
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
