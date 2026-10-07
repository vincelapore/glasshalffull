"use client";

import { ImageIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { AvatarCropDialog } from "@/components/forms/avatar-crop-dialog";
import { FieldError } from "@/components/ui/field";
import { Label } from "@/components/ui/label";
import { mediaUrl } from "@/lib/media";
import {
  ACCEPTED_IMAGE_TYPES,
  compressPhoto,
  isAcceptedImage,
  prepareAvatarCropSource,
} from "@/lib/upload-photo";
import { cn } from "@/lib/utils";

type PhotoUploadFieldProps = {
  id: string;
  label: string;
  storedKey?: string;
  file: File | null;
  onFileChange: (file: File | null) => void;
  error?: string;
  disabled?: boolean;
  /** Profile photos: frame a square crop before the file is kept. */
  crop?: boolean;
  /** Flyers are shrunk in the browser as soon as they are chosen. */
  kind?: "flyer";
};

export function PhotoUploadField({
  id,
  label,
  storedKey = "",
  file,
  onFileChange,
  error,
  disabled,
  crop = false,
  kind,
}: PhotoUploadFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [objectUrl, setObjectUrl] = useState<string | null>(null);
  const [preparing, setPreparing] = useState(false);
  const [cropOpen, setCropOpen] = useState(false);
  const [cropUrl, setCropUrl] = useState<string | null>(null);

  const previewUrl = objectUrl ?? (storedKey ? mediaUrl(storedKey) : undefined);
  const busy = disabled || preparing;

  useEffect(() => {
    if (!file) {
      setObjectUrl(null);
      return;
    }

    const url = URL.createObjectURL(file);
    setObjectUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  useEffect(() => {
    if (cropOpen || !cropUrl) return;
    const url = cropUrl;
    const timer = window.setTimeout(() => {
      URL.revokeObjectURL(url);
      setCropUrl((current) => (current === url ? null : current));
    }, 300);
    return () => window.clearTimeout(timer);
  }, [cropOpen, cropUrl]);

  async function takeFile(next: File | undefined) {
    if (!next || busy) return;
    if (!isAcceptedImage(next)) {
      setLocalError("Try a photo (JPG, PNG, or WebP).");
      if (inputRef.current) inputRef.current.value = "";
      return;
    }

    setLocalError(null);
    setPreparing(true);
    try {
      if (crop) {
        const source = await prepareAvatarCropSource(next);
        const url = URL.createObjectURL(source);
        setCropUrl((current) => {
          if (current) URL.revokeObjectURL(current);
          return url;
        });
        setCropOpen(true);
        return;
      }

      const prepared = kind ? await compressPhoto(next, kind) : next;
      onFileChange(prepared);
    } catch (prepareError) {
      console.error(prepareError);
      setLocalError("Could not process that image. Try another file.");
    } finally {
      setPreparing(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <input
        id={id}
        ref={inputRef}
        type="file"
        accept={ACCEPTED_IMAGE_TYPES.join(",")}
        disabled={busy}
        className="sr-only"
        onChange={(event) => takeFile(event.target.files?.[0])}
      />
      <button
        type="button"
        disabled={busy}
        onClick={() => inputRef.current?.click()}
        onDragEnter={(event) => {
          event.preventDefault();
          if (!busy) setDragging(true);
        }}
        onDragOver={(event) => {
          event.preventDefault();
          if (!busy) setDragging(true);
        }}
        onDragLeave={(event) => {
          event.preventDefault();
          setDragging(false);
        }}
        onDrop={(event) => {
          event.preventDefault();
          setDragging(false);
          takeFile(event.dataTransfer.files[0]);
        }}
        className={cn(
          "relative flex overflow-hidden border border-dashed text-left transition-colors",
          crop ? "aspect-square w-full max-w-48 rounded-2xl" : "min-h-40 w-full rounded-xl",
          dragging
            ? "border-foreground/50 bg-muted/40"
            : "border-border bg-muted/20 hover:bg-muted/30",
          busy && "pointer-events-none opacity-50"
        )}
      >
        {previewUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={previewUrl}
            alt={`${label} preview`}
            className="size-full object-cover"
          />
        ) : (
          <span className="m-auto flex flex-col items-center gap-1 px-4 text-center text-muted-foreground">
            <ImageIcon className="size-5" />
            <span className="text-sm">
              {preparing ? "Preparing photo…" : "Drop an image, or click to upload."}
            </span>
          </span>
        )}
        {preparing && previewUrl ? (
          <span className="absolute inset-0 flex items-center justify-center bg-background/70 text-sm">
            Preparing photo…
          </span>
        ) : null}
      </button>
      <FieldError>{localError ?? error}</FieldError>
      {crop ? (
        <AvatarCropDialog
          open={cropOpen && Boolean(cropUrl)}
          src={cropUrl}
          onCancel={() => setCropOpen(false)}
          onConfirm={(cropped) => {
            onFileChange(cropped);
            setCropOpen(false);
          }}
        />
      ) : null}
    </div>
  );
}
