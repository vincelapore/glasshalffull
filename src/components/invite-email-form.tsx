"use client";

import { useState, useTransition } from "react";

import { updateCreativeInviteEmailAction } from "@/app/actions/submissions";
import { Button } from "@/components/ui/button";
import { Field, FieldError } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Notice } from "@/components/ui/notice";

export function InviteEmailForm({
  creativeId,
  inviteEmail,
}: {
  creativeId: string;
  inviteEmail: string | null;
}) {
  const [email, setEmail] = useState(inviteEmail ?? "");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    setError(null);

    startTransition(async () => {
      const result = await updateCreativeInviteEmailAction(creativeId, email);
      if (!result.success) {
        setError(result.message);
        return;
      }
      setMessage(result.message);
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3 rounded-xl border border-border p-4">
      <Field>
        <Label htmlFor="inviteEmail">Invite email</Label>
        <Input
          id="inviteEmail"
          type="email"
          autoComplete="off"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="name@example.com"
        />
        <p className="text-sm text-muted-foreground">
          They claim this profile by signing up or signing in with this email.
          Leave it blank to clear the invite.
        </p>
        {error ? <FieldError>{error}</FieldError> : null}
      </Field>
      {message ? <Notice variant="muted">{message}</Notice> : null}
      <Button type="submit" size="sm" disabled={pending}>
        {pending ? "Saving…" : "Save invite email"}
      </Button>
    </form>
  );
}
