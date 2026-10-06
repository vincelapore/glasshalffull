"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Controller, useForm } from "react-hook-form";

import {
  submitEventAction,
  updateEventAction,
} from "@/app/actions/submissions";
import { PhotoUploadField } from "@/components/forms/photo-upload-field";
import { SubmissionSuccess } from "@/components/forms/submission-success";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cityLabels, eventCategoryLabels } from "@/lib/labels";
import { compressAndUploadPhoto } from "@/lib/upload-photo";
import {
  cities,
  eventCategories,
  eventSubmissionSchema,
  type EventSubmissionInput,
} from "@/lib/validations";

type EventSubmissionFormProps =
  | { mode?: "create"; eventId?: never; defaultValues?: never }
  | {
      mode: "edit";
      eventId: string;
      defaultValues: EventSubmissionInput;
    };

export function EventSubmissionForm(props: EventSubmissionFormProps) {
  const mode = props.mode ?? "create";
  const eventId = mode === "edit" ? props.eventId : null;
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [submitted, setSubmitted] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [pendingFlyer, setPendingFlyer] = useState<File | null>(null);

  const form = useForm<EventSubmissionInput>({
    resolver: zodResolver(eventSubmissionSchema),
    defaultValues:
      mode === "edit"
        ? props.defaultValues
        : {
            title: "",
            dateTime: "",
            city: undefined,
            location: "",
            categories: [],
            description: "",
            ticketLink: "",
            flyerKey: "",
          },
  });

  const resetToForm = () => {
    setSubmitted(false);
    setFormError(null);
    setPendingFlyer(null);
    form.reset();
  };

  const onSubmit = form.handleSubmit((values) => {
    setFormError(null);

    startTransition(async () => {
      let flyerKey = values.flyerKey;

      if (pendingFlyer) {
        const uploaded = await compressAndUploadPhoto(pendingFlyer, "flyer");
        if (!uploaded.success) {
          setFormError(uploaded.message);
          return;
        }
        flyerKey = uploaded.key;
      }

      const payload = { ...values, flyerKey };
      const result =
        mode === "edit" && eventId
          ? await updateEventAction(eventId, payload)
          : await submitEventAction(payload);

      if (!result.success) {
        setFormError(result.message);
        if (result.fieldErrors) {
          for (const [field, messages] of Object.entries(result.fieldErrors)) {
            form.setError(field as keyof EventSubmissionInput, {
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
      setPendingFlyer(null);
      setSubmitted(true);
      router.refresh();
    });
  });

  if (mode === "create" && submitted) {
    return (
      <SubmissionSuccess
        title="Your event is in the queue."
        description="Thanks for pouring back in. We’ll review it before it goes live on the directory."
        primaryHref="/account"
        primaryLabel="Back to account"
        onSubmitAnother={resetToForm}
        submitAnotherLabel="Submit another event"
      />
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="title">Event title</Label>
        <Input
          id="title"
          {...form.register("title")}
          aria-invalid={Boolean(form.formState.errors.title)}
        />
        {form.formState.errors.title ? (
          <p className="text-xs text-destructive">
            {form.formState.errors.title.message}
          </p>
        ) : null}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="dateTime">Date & time</Label>
          <Input
            id="dateTime"
            type="datetime-local"
            {...form.register("dateTime")}
            aria-invalid={Boolean(form.formState.errors.dateTime)}
          />
          {form.formState.errors.dateTime ? (
            <p className="text-xs text-destructive">
              {form.formState.errors.dateTime.message}
            </p>
          ) : null}
        </div>
      </div>

      <Controller
        control={form.control}
        name="city"
        render={({ field, fieldState }) => (
          <fieldset className="space-y-3">
            <legend className="text-sm font-medium">City</legend>
            <p className="text-sm text-muted-foreground">
              Where is this event happening?
            </p>
            <div className="grid gap-2 sm:grid-cols-2">
              {cities.map((city) => (
                <label
                  key={city}
                  className="flex items-start gap-3 rounded-lg border border-border/70 px-3 py-2.5 transition-colors has-[:checked]:border-foreground/40 has-[:checked]:bg-muted/30"
                >
                  <input
                    type="radio"
                    className="mt-0.5 size-4 border-border accent-foreground"
                    name={field.name}
                    value={city}
                    checked={field.value === city}
                    onChange={() => field.onChange(city)}
                    onBlur={field.onBlur}
                    ref={field.ref}
                  />
                  <span className="text-sm">{cityLabels[city]}</span>
                </label>
              ))}
            </div>
            {fieldState.error ? (
              <p className="text-xs text-destructive">
                {fieldState.error.message}
              </p>
            ) : null}
          </fieldset>
        )}
      />

      <Controller
        control={form.control}
        name="categories"
        render={({ field, fieldState }) => (
          <fieldset className="space-y-3">
            <legend className="text-sm font-medium">Categories</legend>
            <p className="text-sm text-muted-foreground">
              Select every category that fits — you can pick more than one.
            </p>
            <div className="grid gap-2 sm:grid-cols-2">
              {eventCategories.map((category) => {
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
                      {eventCategoryLabels[category]}
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
        <Label htmlFor="location">Location</Label>
        <Input
          id="location"
          placeholder="Venue or neighbourhood"
          {...form.register("location")}
          aria-invalid={Boolean(form.formState.errors.location)}
        />
        {form.formState.errors.location ? (
          <p className="text-xs text-destructive">
            {form.formState.errors.location.message}
          </p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          rows={5}
          placeholder="What&apos;s the vibe, who&apos;s involved, why it matters."
          {...form.register("description")}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="ticketLink">Ticket / RSVP link</Label>
        <Input
          id="ticketLink"
          type="url"
          placeholder="https://"
          {...form.register("ticketLink")}
          aria-invalid={Boolean(form.formState.errors.ticketLink)}
        />
        {form.formState.errors.ticketLink ? (
          <p className="text-xs text-destructive">
            {form.formState.errors.ticketLink.message}
          </p>
        ) : null}
      </div>

      <Controller
        control={form.control}
        name="flyerKey"
        render={({ field, fieldState }) => (
          <PhotoUploadField
            id="flyerKey"
            label="Flyer (optional)"
            storedKey={field.value}
            file={pendingFlyer}
            onFileChange={setPendingFlyer}
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
              : "Submit event"}
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={pending}
          onClick={() =>
            router.push(mode === "edit" ? "/admin/submissions" : "/account")
          }
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
