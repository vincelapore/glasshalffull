"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { EventRejectDialog } from "@/components/admin/event-reject-dialog";
import { Button } from "@/components/ui/button";
import {
  updateCreativeStatusAction,
  updateEventStatusAction,
} from "@/app/actions/submissions";
import type { EventRejectionInput } from "@/lib/validations";

type ModerationActionsProps = {
  kind: "event" | "creative";
  id: string;
  status: "pending" | "approved" | "rejected";
};

export function ModerationActions({ kind, id, status }: ModerationActionsProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [rejectOpen, setRejectOpen] = useState(false);

  function run(
    next: "approved" | "rejected" | "pending",
    rejection?: EventRejectionInput
  ) {
    startTransition(async () => {
      const result =
        kind === "event"
          ? await updateEventStatusAction(id, next, rejection)
          : await updateCreativeStatusAction(id, next, rejection);

      if (!result.success) {
        window.alert(result.message);
        return;
      }

      setRejectOpen(false);
      router.refresh();
    });
  }

  return (
    <div className="flex flex-wrap gap-2">
      {status !== "approved" ? (
        <Button
          type="button"
          size="sm"
          disabled={pending}
          onClick={() => run("approved")}
        >
          Approve
        </Button>
      ) : null}
      {status !== "rejected" ? (
        <Button
          type="button"
          size="sm"
          variant="destructive"
          disabled={pending}
          onClick={() => setRejectOpen(true)}
        >
          Reject
        </Button>
      ) : null}
      {status !== "pending" ? (
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={pending}
          onClick={() => run("pending")}
        >
          Mark pending
        </Button>
      ) : null}
      <EventRejectDialog
        kind={kind === "event" ? "event" : "profile"}
        open={rejectOpen}
        onOpenChange={setRejectOpen}
        pending={pending}
        onConfirm={(input) => run("rejected", input)}
      />
    </div>
  );
}
