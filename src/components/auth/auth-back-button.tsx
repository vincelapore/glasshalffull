"use client";

import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

/** Prefer same-origin history; otherwise go home. */
export function AuthBackButton() {
  const router = useRouter();

  return (
    <button
      type="button"
      onClick={() => {
        const referrer = document.referrer;
        if (
          referrer &&
          referrer.startsWith(window.location.origin) &&
          !referrer.includes("/auth/")
        ) {
          router.back();
          return;
        }
        router.push("/");
      }}
      className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
    >
      <ArrowLeft className="size-3.5" aria-hidden />
      Back
    </button>
  );
}
