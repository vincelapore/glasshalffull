"use client";

import { ChevronLeft, ChevronRight, ImagePlus, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { discardUnusedWorkPhotosAction } from "@/app/actions/upload";
import { Button } from "@/components/ui/button";
import {
  MAX_WORK_PHOTOS,
  MAX_WORK_PHOTO_SOURCE_BYTES,
  mediaUrl,
} from "@/lib/media";
import { compressAndUploadPhoto, isAcceptedImage } from "@/lib/upload-photo";

export type WorkSlot =
  | { id: string; source: "stored"; key: string }
  | { id: string; source: "file"; file: File };

export function workSlotsFromKeys(keys: readonly string[] | undefined): WorkSlot[] {
  return (keys ?? []).map((key) => ({ id: key, source: "stored", key }));
}

type UploadWorkSlotsResult =
  | { ok: true; keys: string[]; fresh: string[] }
  | { ok: false; message: string };

/** Compress and upload new files one at a time. Stored keys are left as-is. */
export async function uploadWorkSlots(
  slots: readonly WorkSlot[]
): Promise<UploadWorkSlotsResult> {
  const keys: string[] = [];
  const fresh: string[] = [];

  for (const slot of slots) {
    if (slot.source === "stored") {
      keys.push(slot.key);
      continue;
    }

    const uploaded = await compressAndUploadPhoto(slot.file, "work");
    if (!uploaded.success) {
      if (fresh.length > 0) {
        await discardUnusedWorkPhotosAction(fresh);
      }
      return { ok: false, message: uploaded.message };
    }

    fresh.push(uploaded.key);
    keys.push(uploaded.key);
  }

  return { ok: true, keys, fresh };
}

type WorkPhotosFieldProps = {
  slots: WorkSlot[];
  onChange: (slots: WorkSlot[]) => void;
  error?: string;
  disabled?: boolean;
};

export function WorkPhotosField({
  slots,
  onChange,
  error,
  disabled,
}: WorkPhotosFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [localError, setLocalError] = useState<string | null>(null);
  const remaining = MAX_WORK_PHOTOS - slots.length;

  function addFiles(list: FileList | File[] | null | undefined) {
    if (!list || disabled || remaining <= 0) return;

    const next = [...slots];
    let rejected = false;

    for (const file of Array.from(list)) {
      if (next.length >= MAX_WORK_PHOTOS) break;
      if (!isAcceptedImage(file)) {
        rejected = true;
        continue;
      }
      if (file.size > MAX_WORK_PHOTO_SOURCE_BYTES) {
        rejected = true;
        continue;
      }
      next.push({
        id: crypto.randomUUID(),
        source: "file",
        file,
      });
    }

    if (rejected) {
      setLocalError("Try a photo (JPG, PNG, or WebP) under 12 MB.");
    } else {
      setLocalError(null);
    }

    if (next.length !== slots.length) onChange(next);
    if (inputRef.current) inputRef.current.value = "";
  }

  function move(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= slots.length) return;
    const next = [...slots];
    const [item] = next.splice(index, 1);
    next.splice(target, 0, item);
    onChange(next);
  }

  function remove(index: number) {
    onChange(slots.filter((_, slotIndex) => slotIndex !== index));
    setLocalError(null);
  }

  return (
    <fieldset className="space-y-3">
      <legend className="text-sm font-medium">Examples of your work</legend>
      <p className="text-sm text-muted-foreground">
        Up to {MAX_WORK_PHOTOS} photos.
      </p>
      <input
        id="workPhotos"
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        disabled={disabled || remaining <= 0}
        className="sr-only"
        onChange={(event) => addFiles(event.target.files)}
      />
      <ul className="grid grid-cols-3 gap-2">
        {slots.map((slot, index) => (
          <li
            key={slot.id}
            className="relative aspect-square overflow-hidden rounded-xl border border-border bg-muted"
          >
            <SlotImage slot={slot} />
            <div className="absolute inset-x-1 bottom-1 flex items-center justify-between gap-1">
              <div className="flex gap-1">
                <Button
                  type="button"
                  size="icon-xs"
                  variant="secondary"
                  disabled={disabled || index === 0}
                  aria-label="Move photo earlier"
                  onClick={() => move(index, -1)}
                >
                  <ChevronLeft />
                </Button>
                <Button
                  type="button"
                  size="icon-xs"
                  variant="secondary"
                  disabled={disabled || index === slots.length - 1}
                  aria-label="Move photo later"
                  onClick={() => move(index, 1)}
                >
                  <ChevronRight />
                </Button>
              </div>
              <Button
                type="button"
                size="icon-xs"
                variant="secondary"
                disabled={disabled}
                aria-label="Remove photo"
                onClick={() => remove(index)}
              >
                <X />
              </Button>
            </div>
          </li>
        ))}
        {remaining > 0 ? (
          <li>
            <button
              type="button"
              disabled={disabled}
              aria-label="Add work photos"
              onClick={() => inputRef.current?.click()}
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => {
                event.preventDefault();
                addFiles(event.dataTransfer.files);
              }}
              className="flex aspect-square w-full flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-border bg-muted/20 text-muted-foreground transition-colors hover:bg-muted/30 disabled:pointer-events-none disabled:opacity-50"
            >
              <ImagePlus className="size-5" />
              <span className="text-xs">
                {slots.length === 0 ? "Add photos" : "Add"}
              </span>
            </button>
          </li>
        ) : null}
      </ul>
      {localError || error ? (
        <p className="text-xs text-destructive">{localError ?? error}</p>
      ) : null}
    </fieldset>
  );
}

function SlotImage({ slot }: { slot: WorkSlot }) {
  const [objectUrl, setObjectUrl] = useState<string | null>(null);

  useEffect(() => {
    if (slot.source !== "file") return;
    const url = URL.createObjectURL(slot.file);
    setObjectUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [slot]);

  const src = slot.source === "stored" ? mediaUrl(slot.key) : objectUrl;
  if (!src) return null;

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt=""
      width={960}
      height={960}
      decoding="async"
      className="absolute inset-0 size-full object-contain"
    />
  );
}
