"use client";

import Link from "next/link";
import { useState } from "react";

import {
  ConfirmPasswordFields,
  PasswordField,
} from "@/components/auth/password-field";
import { Button } from "@/components/ui/button";
import { Notice } from "@/components/ui/notice";
import { authClient } from "@/lib/auth/client";
import {
  authErrorInfo,
  passwordsMatch,
  passwordTooShort,
  MIN_PASSWORD_LENGTH,
} from "@/lib/auth/errors";

export function ChangePasswordForm() {
  const [error, setError] = useState<string | null>(null);
  const [matchError, setMatchError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [needsSet, setNeedsSet] = useState(false);
  const [pending, setPending] = useState(false);

  async function onChange(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setMatchError(null);
    setInfo(null);
    setPending(true);

    const form = new FormData(event.currentTarget);
    const currentPassword = String(form.get("currentPassword") ?? "");
    const password = String(form.get("password") ?? "");
    const confirm = String(form.get("confirmPassword") ?? "");

    if (passwordTooShort(password)) {
      setError(`Password must be at least ${MIN_PASSWORD_LENGTH} characters.`);
      setPending(false);
      return;
    }
    if (!passwordsMatch(password, confirm)) {
      setMatchError("Passwords do not match.");
      setPending(false);
      return;
    }

    try {
      const { error: changeError } = await authClient.changePassword({
        currentPassword,
        newPassword: password,
        revokeOtherSessions: true,
      });

      if (changeError) {
        const mapped = authErrorInfo(
          changeError,
          "Could not update your password."
        );
        setNeedsSet(mapped.action === "forgot-password");
        setError(mapped.message);
        return;
      }

      setInfo("Password updated. Other sessions were signed out.");
      event.currentTarget.reset();
    } catch (err) {
      const mapped = authErrorInfo(err, "Could not update your password.");
      setNeedsSet(mapped.action === "forgot-password");
      setError(mapped.message);
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={onChange} className="space-y-5">
      <PasswordField
        name="currentPassword"
        label="Current password"
        autoComplete="current-password"
        disabled={pending}
      />

      <ConfirmPasswordFields disabled={pending} matchError={matchError} />

      {error ? (
        <Notice variant="destructive">
          <span>{error}</span>
          {needsSet ? (
            <>
              {" "}
              <Link
                href="/auth/forgot-password"
                className="underline underline-offset-4"
              >
                Set a password
              </Link>
            </>
          ) : null}
        </Notice>
      ) : null}
      {info ? <Notice variant="muted">{info}</Notice> : null}

      <Button type="submit" disabled={pending}>
        {pending ? "Updating…" : "Update password"}
      </Button>
    </form>
  );
}
