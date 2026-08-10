"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";

import {
  deleteCreativeAction,
  deleteEventAction,
} from "@/app/actions/submissions";
import { Button } from "@/components/ui/button";

type DeleteSubmissionButtonProps = {
  kind: "event" | "creative";
  id: string;
  label: string;
};

export function DeleteSubmissionButton({
  kind,
  id,
  label,
}: DeleteSubmissionButtonProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function onDelete() {
    const confirmed = window.confirm(
      `Delete “${label}”? This cannot be undone.`
    );
    if (!confirmed) return;

    startTransition(async () => {
      const result =
        kind === "event"
          ? await deleteEventAction(id)
          : await deleteCreativeAction(id);

      if (!result.success) {
        window.alert(result.message);
        return;
      }

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
      aria-label={`Delete ${kind === "event" ? "event" : "creative"}`}
    >
      {pending ? "Deleting…" : "Delete"}
    </Button>
  );
}
