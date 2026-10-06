"use client";

import { useRouter } from "next/navigation";
import { useActionState, useState, useTransition } from "react";

import {
  addAdminAction,
  removeAdminAction,
  type AdminActionResult,
} from "@/app/actions/admins";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Admin } from "@/db/schema";

export function AddAdminForm() {
  const [state, formAction, pending] = useActionState<
    AdminActionResult | null,
    FormData
  >(addAdminAction, null);

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">Admin email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          required
          placeholder="friend@example.com"
          autoComplete="email"
        />
        <p className="text-xs text-muted-foreground">
          They must sign in with this email to moderate. They can’t change who
          is an admin.
        </p>
      </div>
      {state ? (
        <p
          className={
            state.success
              ? "text-sm text-muted-foreground"
              : "text-sm text-destructive"
          }
        >
          {state.message}
        </p>
      ) : null}
      <Button type="submit" disabled={pending}>
        {pending ? "Adding…" : "Add admin"}
      </Button>
    </form>
  );
}

export function RemoveAdminButton({ email }: { email: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  return (
    <div className="flex flex-col items-end gap-1">
      <Button
        type="button"
        size="sm"
        variant="outline"
        disabled={pending}
        onClick={() => {
          startTransition(async () => {
            const result = await removeAdminAction(email);
            setMessage(result.message);
            if (result.success) {
              router.refresh();
            }
          });
        }}
      >
        {pending ? "Removing…" : "Remove"}
      </Button>
      {message ? (
        <p className="text-xs text-muted-foreground">{message}</p>
      ) : null}
    </div>
  );
}

export function AdminList({
  staff,
  currentEmail,
}: {
  staff: Admin[];
  currentEmail: string | null | undefined;
}) {
  const current = currentEmail?.toLowerCase() ?? "";

  return (
    <ul className="divide-y divide-border rounded-xl border border-border">
      {staff.map((person) => {
        const isSelf = person.email === current;
        const isOwner = person.role === "owner";
        return (
          <li
            key={person.email}
            className="flex items-center justify-between gap-4 px-4 py-3"
          >
            <div>
              <p className="font-medium">{person.email}</p>
              <p className="text-xs text-muted-foreground">
                {isOwner ? "Owner" : "Admin"}
                {isSelf ? " · you" : null}
              </p>
            </div>
            {isOwner ? (
              <span className="text-xs text-muted-foreground">Protected</span>
            ) : (
              <RemoveAdminButton email={person.email} />
            )}
          </li>
        );
      })}
    </ul>
  );
}
