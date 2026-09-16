"use client";

import Image from "next/image";
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
    <Image
      src={src}
      alt={alt}
      unoptimized
      width={1080}
      height={1080}
      className={cn(className)}
      onError={() => setBroken(true)}
    />
  );
}
