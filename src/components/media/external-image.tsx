"use client";

import { useState, type ReactNode } from "react";

import { cn } from "@/lib/utils";

type ExternalImageProps = {
  src?: string | null;
  alt: string;
  className?: string;
  fallback?: ReactNode;
};

export function ExternalImage({
  src,
  alt,
  className,
  fallback,
}: ExternalImageProps) {
  const [broken, setBroken] = useState(false);

  if (!src || broken) {
    return fallback ? <>{fallback}</> : null;
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      className={cn(className)}
      onError={() => setBroken(true)}
    />
  );
}
