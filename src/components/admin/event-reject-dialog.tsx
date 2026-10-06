"use client";

import { useState } from "react";

import {
  Dialog,
  DialogClose,
  DialogDescription,
  DialogPopup,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { eventRejectionReasonLabels } from "@/lib/labels";
import {
  eventRejectionReasons,
  type EventRejectionInput,
} from "@/lib/validations";

export function EventRejectDialog({
  open,
  onOpenChange,
  pending,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pending: boolean;
  onConfirm: (input: EventRejectionInput) => void;
}) {
  const [reasons, setReasons] = useState<EventRejectionInput["reasons"]>([]);
  const [extra, setExtra] = useState("");
  const [error, setError] = useState<string | null>(null);

  function reset() {
    setReasons([]);
    setExtra("");
    setError(null);
  }

  function handleOpenChange(next: boolean) {
    if (!next) reset();
    onOpenChange(next);
  }

  function submit() {
    const extraValue = extra.trim();
    if (reasons.length === 0 && extraValue.length === 0) {
      setError("Pick a reason or add a note.");
      return;
    }

    setError(null);
    onConfirm({ reasons, extra: extraValue });
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogPopup>
        <DialogTitle>Why is this being rejected?</DialogTitle>
        <DialogDescription className="mt-1">
          Organisers will see this on their event. Tick what’s wrong, or add a
          note.
        </DialogDescription>

        <fieldset className="mt-5 space-y-2">
          <legend className="sr-only">Reasons</legend>
          {eventRejectionReasons.map((reason) => {
            const checked = reasons.includes(reason);

            return (
              <label
                key={reason}
                className="flex items-start gap-3 rounded-lg border border-border/70 px-3 py-2.5 transition-colors has-[:checked]:border-foreground/40 has-[:checked]:bg-muted/30"
              >
                <input
                  type="checkbox"
                  className="mt-0.5 size-4 rounded border-border accent-foreground"
                  checked={checked}
                  disabled={pending}
                  onChange={(event) => {
                    setError(null);
                    setReasons(
                      event.target.checked
                        ? [...reasons, reason]
                        : reasons.filter((value) => value !== reason)
                    );
                  }}
                />
                <span className="text-sm">
                  {eventRejectionReasonLabels[reason]}
                </span>
              </label>
            );
          })}
        </fieldset>

        <div className="mt-4 space-y-2">
          <Label htmlFor="rejection-extra">Anything else? (optional)</Label>
          <Textarea
            id="rejection-extra"
            rows={3}
            value={extra}
            disabled={pending}
            placeholder="A short note the organiser can act on."
            onChange={(event) => {
              setError(null);
              setExtra(event.target.value);
            }}
          />
        </div>

        {error ? (
          <p className="mt-3 text-xs text-destructive">{error}</p>
        ) : null}

        <div className="mt-6 flex flex-wrap justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            disabled={pending}
            render={<DialogClose />}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            disabled={pending}
            onClick={submit}
          >
            {pending ? "Rejecting…" : "Reject event"}
          </Button>
        </div>
      </DialogPopup>
    </Dialog>
  );
}
