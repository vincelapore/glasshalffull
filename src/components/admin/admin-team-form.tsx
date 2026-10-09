"use client";

import { useRouter } from "next/navigation";
import { useActionState, useState, useTransition } from "react";

import {
  addAdminsAction,
  removeAdminAction,
  type AdminActionResult,
} from "@/app/actions/admins";
import type { AccountRecord } from "@/lib/accounts";
import { Button } from "@/components/ui/button";
import { Choice, ChoiceControl } from "@/components/ui/choice";
import type { Admin } from "@/db/schema";

export function GrantAdminForm({ accounts }: { accounts: AccountRecord[] }) {
  const [state, formAction, pending] = useActionState<
    AdminActionResult | null,
    FormData
  >(addAdminsAction, null);

  if (accounts.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Everyone with an account is already on the team. New people need to
        sign up first.
      </p>
    );
  }

  return (
    <form action={formAction} className="space-y-4">
      <fieldset className="space-y-2">
        <legend className="sr-only">Accounts</legend>
        {accounts.map((account) => (
          <Choice key={account.id}>
            <ChoiceControl type="checkbox" name="userId" value={account.id} />
            <span className="min-w-0">
              <span className="block font-medium">{account.name}</span>
              <span className="block truncate text-xs text-muted-foreground">
                {account.email}
              </span>
            </span>
          </Choice>
        ))}
      </fieldset>
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
  namesByEmail,
  currentEmail,
}: {
  staff: Admin[];
  namesByEmail: Record<string, string>;
  currentEmail: string | null | undefined;
}) {
  const current = currentEmail?.toLowerCase() ?? "";

  return (
    <ul className="divide-y divide-border rounded-xl border border-border">
      {staff.map((person) => {
        const isSelf = person.email === current;
        const isOwner = person.role === "owner";
        const name = namesByEmail[person.email.toLowerCase()];
        return (
          <li
            key={person.email}
            className="flex items-center justify-between gap-4 px-4 py-3"
          >
            <div className="min-w-0">
              <p className="truncate font-medium">{name || person.email}</p>
              {name ? (
                <p className="truncate text-xs text-muted-foreground">
                  {person.email}
                </p>
              ) : null}
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
