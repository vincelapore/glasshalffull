"use client";

import { useState } from "react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type ExternalImageUrlFieldProps = {
  id: string;
  label: string;
  value?: string;
  onChange: (url: string) => void;
  placeholder?: string;
  hint?: string;
  error?: string;
};

export function ExternalImageUrlField({
  id,
  label,
  value = "",
  onChange,
  placeholder = "https://…",
  hint = "Paste a direct image link (ends in .jpg/.png/.webp, or a CDN image URL). Instagram/Facebook page links won’t display as photos — use those in the social fields instead.",
  error,
}: ExternalImageUrlFieldProps) {
  const [broken, setBroken] = useState(false);
  const showPreview = Boolean(value) && !broken;

  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        type="url"
        placeholder={placeholder}
        value={value}
        onChange={(event) => {
          setBroken(false);
          onChange(event.target.value);
        }}
        aria-invalid={Boolean(error)}
      />
      {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
      {error ? <p className="text-xs text-destructive">{error}</p> : null}

      {value ? (
        showPreview ? (
          <div className="overflow-hidden rounded-xl border border-border/70 bg-muted/20">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={value}
              alt={`${label} preview`}
              className="aspect-video w-full object-cover"
              onError={() => setBroken(true)}
              onLoad={() => setBroken(false)}
            />
          </div>
        ) : (
          <p className="rounded-lg border border-dashed border-border px-3 py-2 text-xs text-muted-foreground">
            That link doesn’t look like a loadable image. Try a direct file URL
            instead of a social profile page.
          </p>
        )
      ) : null}
    </div>
  );
}
