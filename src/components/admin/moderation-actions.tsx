"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";

import {
  updateCreativeStatusAction,
  updateEventStatusAction,
} from "@/app/actions/submissions";
import { Button } from "@/components/ui/button";

type ModerationActionsProps = {
  kind: "event" | "creative";
  id: string;
  status: "pending" | "approved" | "rejected";
};

export function ModerationActions({ kind, id, status }: ModerationActionsProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function run(next: "approved" | "rejected" | "pending") {
    startTransition(async () => {
      const result =
        kind === "event"
          ? await updateEventStatusAction(id, next)
          : await updateCreativeStatusAction(id, next);

      if (!result.success) {
        window.alert(result.message);
        return;
      }

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
          onClick={() => run("rejected")}
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
    </div>
  );
}
