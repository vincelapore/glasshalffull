"use client";

import { useState, useTransition } from "react";

import { setAccountVisibilityAction } from "@/app/actions/visibility";
import { OptionPill } from "@/components/ui/option-pill";

export function AccountVisibilityToggle({
  isPublic,
  profileReady,
}: {
  isPublic: boolean;
  profileReady: boolean;
}) {
  const [value, setValue] = useState(isPublic);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function choose(next: boolean) {
    if (next === value || pending) return;
    const previous = value;
    setValue(next);
    setError(null);
    startTransition(async () => {
      const result = await setAccountVisibilityAction(next);
      if (!result.success) {
        setValue(previous);
        setError(result.message);
      }
    });
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="Visibility">
        <OptionPill
          active={value}
          onClick={() => {
            if (!pending) choose(true);
          }}
        >
          Public
        </OptionPill>
        <OptionPill
          active={!value}
          onClick={() => {
            if (!pending) choose(false);
          }}
        >
          Private
        </OptionPill>
      </div>
      <p className="text-xs text-muted-foreground">
        {value
          ? profileReady
            ? "You’re listed in the directory."
            : "Listed once essentials are done."
          : "Hidden from the directory and public profile."}
      </p>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </div>
  );
}
