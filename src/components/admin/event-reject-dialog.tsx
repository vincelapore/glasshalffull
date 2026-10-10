"use client";

import { useEffect, useId, useState } from "react";

import {
  Dialog,
  DialogClose,
  DialogDescription,
  DialogPopup,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Choice, ChoiceControl } from "@/components/ui/choice";
import { Field, FieldError, Fieldset } from "@/components/ui/field";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { eventRejectionReasonLabels } from "@/lib/labels";
import {
  eventRejectionReasons,
  profileRejectionReasons,
  type EventRejectionInput,
} from "@/lib/validations";

const copy = {
  event: {
    description:
      "Organisers will see this on their event. Tick what’s wrong, or add a note.",
    confirm: "Reject event",
    reasons: eventRejectionReasons,
  },
  profile: {
    description:
      "They’ll see this on their account. Tick what’s wrong, or add a note.",
    confirm: "Reject profile",
    reasons: profileRejectionReasons,
  },
} as const;

export function EventRejectDialog({
  kind,
  open,
  onOpenChange,
  pending,
  onConfirm,
}: {
  kind: "event" | "profile";
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pending: boolean;
  onConfirm: (input: EventRejectionInput) => void;
}) {
  const extraId = useId();
  const [reasons, setReasons] = useState<EventRejectionInput["reasons"]>([]);
  const [extra, setExtra] = useState("");
  const [error, setError] = useState<string | null>(null);
  const dialogCopy = copy[kind];

  function reset() {
    setReasons([]);
    setExtra("");
    setError(null);
  }

  useEffect(() => {
    if (open) return;
    setReasons([]);
    setExtra("");
    setError(null);
  }, [open]);

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
      <DialogPopup className="max-h-[calc(100dvh-2rem)] overflow-y-auto">
        <DialogTitle>Why is this being rejected?</DialogTitle>
        <DialogDescription className="mt-1">
          {dialogCopy.description}
        </DialogDescription>

        <Fieldset className="mt-5 space-y-2" legend="Reasons" legendClassName="sr-only">
          {dialogCopy.reasons.map((reason) => {
            const checked = reasons.includes(reason);

            return (
              <Choice key={reason}>
                <ChoiceControl
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
              </Choice>
            );
          })}
        </Fieldset>

        <Field className="mt-4">
          <Label htmlFor={extraId}>Anything else? (optional)</Label>
          <Textarea
            id={extraId}
            rows={3}
            value={extra}
            disabled={pending}
            placeholder="A short note the organiser can act on."
            onChange={(event) => {
              setError(null);
              setExtra(event.target.value);
            }}
          />
        </Field>

        <FieldError className="mt-3">{error}</FieldError>

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
            {pending ? "Rejecting…" : dialogCopy.confirm}
          </Button>
        </div>
      </DialogPopup>
    </Dialog>
  );
}
