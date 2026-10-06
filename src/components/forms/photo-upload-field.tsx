"use client";

import { ImageIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { Label } from "@/components/ui/label";
import { mediaUrl } from "@/lib/media";
import { ACCEPTED_IMAGE_TYPES, isAcceptedImage } from "@/lib/upload-photo";
import { cn } from "@/lib/utils";

type PhotoUploadFieldProps = {
  id: string;
  label: string;
  storedKey?: string;
  file: File | null;
  onFileChange: (file: File | null) => void;
  error?: string;
  disabled?: boolean;
};

export function PhotoUploadField({
  id,
  label,
  storedKey = "",
  file,
  onFileChange,
  error,
  disabled,
}: PhotoUploadFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [objectUrl, setObjectUrl] = useState<string | null>(null);

  const previewUrl = objectUrl ?? (storedKey ? mediaUrl(storedKey) : undefined);

  useEffect(() => {
    if (!file) {
      setObjectUrl(null);
      return;
    }

    const url = URL.createObjectURL(file);
    setObjectUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  function takeFile(next: File | undefined) {
    if (!next || disabled) return;
    if (!isAcceptedImage(next)) {
      setLocalError("Try a photo (JPG, PNG, or WebP).");
      return;
    }
    setLocalError(null);
    onFileChange(next);
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <input
        id={id}
        ref={inputRef}
        type="file"
        accept={ACCEPTED_IMAGE_TYPES.join(",")}
        disabled={disabled}
        className="sr-only"
        onChange={(event) => takeFile(event.target.files?.[0])}
      />
      <button
        type="button"
        disabled={disabled}
        onClick={() => inputRef.current?.click()}
        onDragEnter={(event) => {
          event.preventDefault();
          if (!disabled) setDragging(true);
        }}
        onDragOver={(event) => {
          event.preventDefault();
          if (!disabled) setDragging(true);
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
          "relative flex min-h-40 w-full overflow-hidden rounded-xl border border-dashed text-left transition-colors",
          dragging
            ? "border-foreground/50 bg-muted/40"
            : "border-border bg-muted/20 hover:bg-muted/30",
          disabled && "pointer-events-none opacity-50"
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
            <span className="text-sm">Drop an image, or click to upload.</span>
          </span>
        )}
      </button>
      {localError || error ? (
        <p className="text-xs text-destructive">{localError ?? error}</p>
      ) : null}
    </div>
  );
}
