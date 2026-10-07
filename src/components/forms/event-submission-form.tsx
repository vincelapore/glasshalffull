"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Controller, useForm } from "react-hook-form";

import {
  submitEventAction,
  updateEventAction,
} from "@/app/actions/submissions";
import { AccordionReveal } from "@/components/accordion-reveal";
import { PhotoUploadField } from "@/components/forms/photo-upload-field";
import { SubmissionSuccess } from "@/components/forms/submission-success";
import { Button } from "@/components/ui/button";
import { Choice, ChoiceControl } from "@/components/ui/choice";
import { Field, FieldError, Fieldset } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Notice } from "@/components/ui/notice";
import { eyebrowVariants } from "@/components/ui/page";
import { Textarea } from "@/components/ui/textarea";
import { cityLabels, eventCategoryLabels, musicGenreLabels } from "@/lib/labels";
import { compressAndUploadPhoto } from "@/lib/upload-photo";
import {
  cities,
  eventCategories,
  eventSubmissionSchema,
  musicGenres,
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
            city: "meanjin",
            location: "",
            categories: [],
            musicGenres: [],
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
        title="Thanks for pouring back in!"
        description="We’ll review it before it goes live on the directory."
        primaryHref="/account"
        primaryLabel="Back to account"
        onSubmitAnother={resetToForm}
        submitAnotherLabel="Submit another event"
      />
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <Field>
        <Label htmlFor="title">Event title</Label>
        <Input
          id="title"
          {...form.register("title")}
          aria-invalid={Boolean(form.formState.errors.title)}
        />
        <FieldError>{form.formState.errors.title?.message}</FieldError>
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field>
          <Label htmlFor="dateTime">Date & time</Label>
          <Input
            id="dateTime"
            type="datetime-local"
            {...form.register("dateTime")}
            aria-invalid={Boolean(form.formState.errors.dateTime)}
          />
          <FieldError>{form.formState.errors.dateTime?.message}</FieldError>
        </Field>
      </div>

      <Controller
        control={form.control}
        name="city"
        render={({ field, fieldState }) => (
          <Fieldset legend="City">
            <div className="grid gap-2 sm:grid-cols-2">
              {cities.map((city) => (
                <Choice key={city}>
                  <ChoiceControl
                    type="radio"
                    name={field.name}
                    value={city}
                    checked={field.value === city}
                    onChange={() => field.onChange(city)}
                    onBlur={field.onBlur}
                    ref={field.ref}
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
        name="categories"
        render={({ field, fieldState }) => {
          const musicChecked = field.value?.includes("music") ?? false;

          return (
            <Fieldset legend="Categories">
              <div className="grid gap-2 sm:grid-cols-2">
                {eventCategories.map((category) => {
                  const checked = field.value?.includes(category) ?? false;

                  return (
                    <Choice key={category}>
                      <ChoiceControl
                        checked={checked}
                        onChange={(event) => {
                          const next = event.target.checked
                            ? [...(field.value ?? []), category]
                            : (field.value ?? []).filter(
                                (value) => value !== category
                              );
                          field.onChange(next);
                          if (!next.includes("music")) {
                            form.setValue("musicGenres", []);
                          }
                        }}
                      />
                      <span className="text-sm">
                        {eventCategoryLabels[category]}
                      </span>
                    </Choice>
                  );
                })}
              </div>
              <FieldError>{fieldState.error?.message}</FieldError>
              <AccordionReveal open={musicChecked}>
                <Controller
                  control={form.control}
                  name="musicGenres"
                  render={({ field: genreField, fieldState: genreState }) => (
                    <Fieldset
                      className="space-y-2 pt-1"
                      legend="Music genre"
                      legendClassName={eyebrowVariants()}
                    >
                      <div className="grid gap-2 sm:grid-cols-2">
                        {musicGenres.map((genre) => {
                          const checked =
                            genreField.value?.includes(genre) ?? false;

                          return (
                            <Choice key={genre}>
                              <ChoiceControl
                                checked={checked}
                                onChange={(event) => {
                                  const next = event.target.checked
                                    ? [...(genreField.value ?? []), genre]
                                    : (genreField.value ?? []).filter(
                                        (value) => value !== genre
                                      );
                                  genreField.onChange(next);
                                }}
                              />
                              <span className="text-sm">
                                {musicGenreLabels[genre]}
                              </span>
                            </Choice>
                          );
                        })}
                      </div>
                      <FieldError>{genreState.error?.message}</FieldError>
                    </Fieldset>
                  )}
                />
              </AccordionReveal>
            </Fieldset>
          );
        }}
      />

      <Field>
        <Label htmlFor="location">Location</Label>
        <Input
          id="location"
          placeholder="Venue or neighbourhood"
          {...form.register("location")}
          aria-invalid={Boolean(form.formState.errors.location)}
        />
        <FieldError>{form.formState.errors.location?.message}</FieldError>
      </Field>

      <Field>
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          rows={5}
          placeholder="What&apos;s the vibe, who&apos;s involved, why it matters."
          {...form.register("description")}
        />
      </Field>

      <Field>
        <Label htmlFor="ticketLink">Ticket / RSVP link</Label>
        <Input
          id="ticketLink"
          type="url"
          placeholder="https://"
          {...form.register("ticketLink")}
          aria-invalid={Boolean(form.formState.errors.ticketLink)}
        />
        <FieldError>{form.formState.errors.ticketLink?.message}</FieldError>
      </Field>

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

      {formError ? <Notice variant="destructive">{formError}</Notice> : null}

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
