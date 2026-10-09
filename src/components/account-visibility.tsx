"use client";

import { useState, useTransition } from "react";

import { setAccountVisibilityAction } from "@/app/actions/visibility";
import { Choice, ChoiceControl } from "@/components/ui/choice";

export function AccountVisibilityToggle({ isPublic }: { isPublic: boolean }) {
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
    <fieldset className="space-y-2" disabled={pending}>
      <legend className="sr-only">Who can find you</legend>
      <Choice>
        <ChoiceControl
          type="radio"
          name="visibility"
          checked={value}
          onChange={() => choose(true)}
        />
        <span>
          <span className="block text-sm font-medium">Public</span>
          <span className="block text-xs text-muted-foreground">
            People can find you in the directory once your profile is approved.
          </span>
        </span>
      </Choice>
      <Choice>
        <ChoiceControl
          type="radio"
          name="visibility"
          checked={!value}
          onChange={() => choose(false)}
        />
        <span>
          <span className="block text-sm font-medium">Private</span>
          <span className="block text-xs text-muted-foreground">
            You stay out of the directory. Your profile page isn’t public.
          </span>
        </span>
      </Choice>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </fieldset>
  );
}
