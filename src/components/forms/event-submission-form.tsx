"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Controller, useForm } from "react-hook-form";

import {
  submitEventAction,
  updateEventAction,
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
import { eventCategoryLabels } from "@/lib/labels";
import {
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

  const form = useForm<EventSubmissionInput>({
    resolver: zodResolver(eventSubmissionSchema),
    defaultValues:
      mode === "edit"
        ? props.defaultValues
        : {
            title: "",
            dateTime: "",
            location: "",
            category: undefined,
            description: "",
            ticketLink: "",
            flyerUrl: "",
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
        mode === "edit" && eventId
          ? await updateEventAction(eventId, values)
          : await submitEventAction(values);

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
      setSubmitted(true);
      router.refresh();
    });
  });

  if (mode === "create" && submitted) {
    return (
      <SubmissionSuccess
        title="Your event is in the queue."
        description="Thanks for pouring back in. We’ll review it before it goes live on the directory."
        primaryHref="/events"
        primaryLabel="Browse events"
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

        <Controller
          control={form.control}
          name="category"
          render={({ field, fieldState }) => (
            <div className="space-y-2">
              <Label>Category</Label>
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
                  {eventCategories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {eventCategoryLabels[category]}
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
      </div>

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
        name="flyerUrl"
        render={({ field, fieldState }) => (
          <ExternalImageUrlField
            id="flyerUrl"
            label="Flyer image URL (optional)"
            value={field.value}
            onChange={field.onChange}
            error={fieldState.error?.message}
            placeholder="https://…/flyer.jpg"
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
              : "Submit event"}
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
