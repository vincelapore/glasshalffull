"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";

import {
  createOverflowEpisodeAction,
  deleteOverflowEpisodeAction,
  searchOverflowCreativesAction,
  searchOverflowEventsAction,
  updateOverflowEpisodeAction,
} from "@/app/actions/overflow";
import { PhotoUploadField } from "@/components/forms/photo-upload-field";
import { Button } from "@/components/ui/button";
import { Choice, ChoiceControl } from "@/components/ui/choice";
import { Field, FieldError, Fieldset } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Notice } from "@/components/ui/notice";
import { Textarea } from "@/components/ui/textarea";
import {
  cityLabels,
  overflowFeatureRoleLabels,
} from "@/lib/labels";
import { compressAndUploadPhoto } from "@/lib/upload-photo";
import {
  cities,
  overflowEpisodeSchema,
  overflowFeatureRoles,
  type OverflowEpisodeInput,
} from "@/lib/validations";

type FeatureName = Record<string, string>;

type OverflowEpisodeFormProps =
  | {
      mode: "create";
      defaultNumber: number;
    }
  | {
      mode: "edit";
      episodeId: string;
      defaultValues: OverflowEpisodeInput;
      featureNames: FeatureName;
      eventTitle: string | null;
    };

export function OverflowEpisodeForm(props: OverflowEpisodeFormProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [formError, setFormError] = useState<string | null>(null);
  const [pendingCover, setPendingCoverState] = useState<File | null>(null);
  const pendingCoverRef = useRef<File | null>(null);
  const [names, setNames] = useState<FeatureName>(
    props.mode === "edit" ? props.featureNames : {}
  );
  const [eventTitle, setEventTitle] = useState(
    props.mode === "edit" ? (props.eventTitle ?? "") : ""
  );

  const setPendingCover = (file: File | null) => {
    pendingCoverRef.current = file;
    setPendingCoverState(file);
  };

  const form = useForm<OverflowEpisodeInput>({
    resolver: (values, context, options) => {
      const schema = pendingCoverRef.current
        ? overflowEpisodeSchema.extend({ coverKey: z.string() })
        : overflowEpisodeSchema;
      return zodResolver(schema)(values, context, options);
    },
    defaultValues:
      props.mode === "edit"
        ? props.defaultValues
        : {
            title: "",
            number: props.defaultNumber,
            city: "meanjin",
            coverKey: "",
            body: "",
            eventId: "",
            features: [],
          },
  });

  const features = form.watch("features");
  const eventId = form.watch("eventId");

  const onSubmit = form.handleSubmit((values) => {
    setFormError(null);

    startTransition(async () => {
      let coverKey = values.coverKey;

      if (pendingCover) {
        const uploaded = await compressAndUploadPhoto(pendingCover, "overflow");
        if (!uploaded.success) {
          setFormError(uploaded.message);
          return;
        }
        coverKey = uploaded.key;
        setPendingCover(null);
        form.setValue("coverKey", coverKey);
      }

      const payload = { ...values, coverKey };
      const result =
        props.mode === "edit"
          ? await updateOverflowEpisodeAction(props.episodeId, payload)
          : await createOverflowEpisodeAction(payload);

      if (!result.success) {
        setFormError(result.message);
        if (result.fieldErrors) {
          for (const [field, messages] of Object.entries(result.fieldErrors)) {
            const message = messages?.[0];
            if (!message) continue;
            if (field === "features") {
              setFormError(message);
              continue;
            }
            form.setError(field as keyof OverflowEpisodeInput, { message });
          }
        }
        return;
      }

      router.push("/admin/overflow");
      router.refresh();
    });
  });

  function addFeature(creativeId: string, name: string) {
    if (features.some((feature) => feature.creativeId === creativeId)) return;
    setNames((current) => ({ ...current, [creativeId]: name }));
    form.setValue(
      "features",
      [...features, { creativeId, role: "organiser", note: "" }],
      { shouldDirty: true }
    );
  }

  function updateFeature(
    index: number,
    patch: Partial<OverflowEpisodeInput["features"][number]>
  ) {
    form.setValue(
      "features",
      features.map((feature, featureIndex) =>
        featureIndex === index ? { ...feature, ...patch } : feature
      ),
      { shouldDirty: true }
    );
  }

  function moveFeature(index: number, direction: -1 | 1) {
    const next = index + direction;
    if (next < 0 || next >= features.length) return;
    const copy = [...features];
    const [row] = copy.splice(index, 1);
    if (!row) return;
    copy.splice(next, 0, row);
    form.setValue("features", copy, { shouldDirty: true });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      {formError ? <Notice variant="destructive">{formError}</Notice> : null}

      <div className="grid gap-4 sm:grid-cols-[1fr_7rem]">
        <Field>
          <Label htmlFor="title">Name</Label>
          <Input
            id="title"
            {...form.register("title")}
            aria-invalid={Boolean(form.formState.errors.title)}
          />
          <FieldError>{form.formState.errors.title?.message}</FieldError>
        </Field>
        <Field>
          <Label htmlFor="number">Number</Label>
          <Input
            id="number"
            type="number"
            min={1}
            {...form.register("number", { valueAsNumber: true })}
            aria-invalid={Boolean(form.formState.errors.number)}
          />
          <FieldError>{form.formState.errors.number?.message}</FieldError>
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
        name="coverKey"
        render={({ fieldState }) => (
          <PhotoUploadField
            id="coverKey"
            label="Poster"
            kind="overflow"
            storedKey={form.watch("coverKey")}
            file={pendingCover}
            error={fieldState.error?.message}
            disabled={pending}
            onFileChange={(file) => {
              setPendingCover(file);
              if (file) form.clearErrors("coverKey");
            }}
          />
        )}
      />

      <Field>
        <Label htmlFor="body">Writeup</Label>
        <Textarea
          id="body"
          className="min-h-32"
          {...form.register("body")}
          aria-invalid={Boolean(form.formState.errors.body)}
        />
        <p className="text-xs text-muted-foreground">
          Paste the Instagram reel link in the writeup.
        </p>
        <FieldError>{form.formState.errors.body?.message}</FieldError>
      </Field>

      <EventPicker
        eventId={eventId}
        eventTitle={eventTitle}
        disabled={pending}
        onSelect={(event) => {
          form.setValue("eventId", event.id, { shouldDirty: true });
          setEventTitle(event.title);
        }}
        onClear={() => {
          form.setValue("eventId", "", { shouldDirty: true });
          setEventTitle("");
        }}
      />

      <Fieldset legend="Featured">
        <CreativePicker
          disabled={pending}
          takenIds={new Set(features.map((feature) => feature.creativeId))}
          onAdd={addFeature}
        />
        {features.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No one featured yet. Search for a profile to add them.
          </p>
        ) : (
          <ul className="space-y-3">
            {features.map((feature, index) => (
              <li
                key={feature.creativeId}
                className="space-y-2 rounded-lg border border-border/70 p-3"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <p className="mr-auto text-sm font-medium">
                    {names[feature.creativeId] ?? "Profile"}
                  </p>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={pending || index === 0}
                    onClick={() => moveFeature(index, -1)}
                  >
                    Up
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={pending || index === features.length - 1}
                    onClick={() => moveFeature(index, 1)}
                  >
                    Down
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    disabled={pending}
                    onClick={() =>
                      form.setValue(
                        "features",
                        features.filter(
                          (row) => row.creativeId !== feature.creativeId
                        ),
                        { shouldDirty: true }
                      )
                    }
                  >
                    Remove
                  </Button>
                </div>
                <label className="block space-y-1">
                  <span className="text-xs text-muted-foreground">Role</span>
                  <select
                    value={feature.role}
                    disabled={pending}
                    onChange={(event) =>
                      updateFeature(index, {
                        role: event.target
                          .value as OverflowEpisodeInput["features"][number]["role"],
                      })
                    }
                    className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
                  >
                    {overflowFeatureRoles.map((role) => (
                      <option key={role} value={role}>
                        {overflowFeatureRoleLabels[role]}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block space-y-1">
                  <span className="text-xs text-muted-foreground">
                    Note for this episode
                  </span>
                  <Textarea
                    value={feature.note}
                    disabled={pending}
                    onChange={(event) =>
                      updateFeature(index, { note: event.target.value })
                    }
                  />
                </label>
              </li>
            ))}
          </ul>
        )}
      </Fieldset>

      <Button type="submit" disabled={pending}>
        {pending ? "Saving…" : props.mode === "edit" ? "Save" : "Publish"}
      </Button>
    </form>
  );
}

function CreativePicker({
  disabled,
  takenIds,
  onAdd,
}: {
  disabled: boolean;
  takenIds: Set<string>;
  onAdd: (id: string, name: string) => void;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<
    { id: string; name: string; city: string | null }[]
  >([]);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function onSearch(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    startTransition(async () => {
      const result = await searchOverflowCreativesAction(query);
      if (!result.success) {
        setResults([]);
        setMessage(result.message);
        return;
      }
      setResults(result.results);
      if (result.results.length === 0) setMessage("No profiles match that name.");
    });
  }

  return (
    <div className="space-y-2">
      <form onSubmit={onSearch} className="flex gap-2">
        <Input
          value={query}
          disabled={disabled || pending}
          placeholder="Search creatives"
          onChange={(event) => setQuery(event.target.value)}
        />
        <Button type="submit" variant="outline" disabled={disabled || pending}>
          Search
        </Button>
      </form>
      {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}
      {results.length > 0 ? (
        <ul className="overflow-hidden rounded-lg border border-border/70">
          {results.map((creative) => (
            <li key={creative.id} className="border-b border-border/70 last:border-b-0">
              <button
                type="button"
                disabled={disabled || takenIds.has(creative.id)}
                className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-muted/40 disabled:opacity-50"
                onClick={() => onAdd(creative.id, creative.name)}
              >
                <span>{creative.name}</span>
                <span className="text-muted-foreground">
                  {takenIds.has(creative.id) ? "Added" : "Add"}
                </span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

function EventPicker({
  eventId,
  eventTitle,
  disabled,
  onSelect,
  onClear,
}: {
  eventId: string;
  eventTitle: string;
  disabled: boolean;
  onSelect: (event: { id: string; title: string }) => void;
  onClear: () => void;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<
    { id: string; title: string; city: string }[]
  >([]);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function onSearch(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    startTransition(async () => {
      const result = await searchOverflowEventsAction(query);
      if (!result.success) {
        setResults([]);
        setMessage(result.message);
        return;
      }
      setResults(result.results);
      if (result.results.length === 0) setMessage("No events match that name.");
    });
  }

  return (
    <Fieldset legend="The night">
      {eventId ? (
        <div className="flex items-center justify-between gap-3 rounded-lg border border-border/70 px-3 py-2">
          <p className="text-sm">{eventTitle || "Linked event"}</p>
          <Button type="button" size="sm" variant="ghost" disabled={disabled} onClick={onClear}>
            Remove
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          <form onSubmit={onSearch} className="flex gap-2">
            <Input
              value={query}
              disabled={disabled || pending}
              placeholder="Search events"
              onChange={(event) => setQuery(event.target.value)}
            />
            <Button type="submit" variant="outline" disabled={disabled || pending}>
              Search
            </Button>
          </form>
          {message ? (
            <p className="text-sm text-muted-foreground">{message}</p>
          ) : null}
          {results.length > 0 ? (
            <ul className="overflow-hidden rounded-lg border border-border/70">
              {results.map((event) => (
                <li key={event.id} className="border-b border-border/70 last:border-b-0">
                  <button
                    type="button"
                    disabled={disabled}
                    className="flex w-full px-3 py-2 text-left text-sm hover:bg-muted/40"
                    onClick={() => {
                      onSelect(event);
                      setResults([]);
                      setQuery("");
                    }}
                  >
                    {event.title}
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      )}
    </Fieldset>
  );
}

export function DeleteOverflowEpisodeButton({
  id,
  label,
}: {
  id: string;
  label: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function onDelete() {
    const confirmed = window.confirm(
      `Delete “${label}”? This cannot be undone.`
    );
    if (!confirmed) return;

    startTransition(async () => {
      const result = await deleteOverflowEpisodeAction(id);
      if (!result.success) {
        window.alert(result.message);
        return;
      }
      router.push("/admin/overflow");
      router.refresh();
    });
  }

  return (
    <Button
      type="button"
      size="sm"
      variant="destructive"
      disabled={pending}
      onClick={onDelete}
    >
      {pending ? "Deleting…" : "Delete episode"}
    </Button>
  );
}
