"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { ConfirmPasswordFields } from "@/components/auth/password-field";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { Label } from "@/components/ui/label";
import { Notice } from "@/components/ui/notice";
import { authClient } from "@/lib/auth/client";
import {
  authErrorInfo,
  passwordsMatch,
  passwordTooShort,
  MIN_PASSWORD_LENGTH,
} from "@/lib/auth/errors";

type Step = "email" | "reset";

const OTP_LENGTH = 6;

const REQUEST_SUCCESS =
  "If an account exists for that email, we sent a code. Enter it below with your new password.";

export function ForgotPasswordForm({
  initialEmail = "",
}: {
  initialEmail?: string;
}) {
  const router = useRouter();
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState(initialEmail);
  const [otp, setOtp] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [matchError, setMatchError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function requestCode(targetEmail: string) {
    const { error: requestError } =
      await authClient.emailOtp.sendVerificationOtp({
        email: targetEmail,
        type: "forget-password",
      });

    if (requestError) {
      // Still show generic success to avoid leaking whether the email exists,
      // unless it is clearly a rate limit or network issue.
      const mapped = authErrorInfo(requestError);
      if (mapped.message.startsWith("Too many") || mapped.message.includes("connection")) {
        setError(mapped.message);
        return false;
      }
      console.warn("[auth] forgot request", requestError);
    }

    return true;
  }

  async function onRequest(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setInfo(null);
    setPending(true);

    const form = new FormData(event.currentTarget);
    const submittedEmail = String(form.get("email") ?? "").trim().toLowerCase();

    if (!submittedEmail) {
      setError("Email is required.");
      setPending(false);
      return;
    }

    try {
      const ok = await requestCode(submittedEmail);
      if (!ok) return;
      setEmail(submittedEmail);
      setOtp("");
      setInfo(REQUEST_SUCCESS);
      setStep("reset");
    } catch (err) {
      setError(authErrorInfo(err).message);
    } finally {
      setPending(false);
    }
  }

  async function onReset(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setMatchError(null);
    setInfo(null);
    setPending(true);

    const form = new FormData(event.currentTarget);
    const password = String(form.get("password") ?? "");
    const confirm = String(form.get("confirmPassword") ?? "");

    if (otp.length !== OTP_LENGTH) {
      setError("Enter the 6-digit code from your email.");
      setPending(false);
      return;
    }
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
      const { error: resetError } = await authClient.emailOtp.resetPassword({
        email,
        otp,
        password,
      });

      if (resetError) {
        setError(
          authErrorInfo(resetError, "Could not reset your password.").message
        );
        return;
      }

      router.replace(
        "/auth/sign-in?notice=" +
          encodeURIComponent("Password updated. Sign in with your new password.")
      );
    } catch (err) {
      setError(authErrorInfo(err, "Could not reset your password.").message);
    } finally {
      setPending(false);
    }
  }

  async function onResend() {
    if (!email) return;
    setError(null);
    setInfo(null);
    setPending(true);
    try {
      const ok = await requestCode(email);
      if (!ok) return;
      setOtp("");
      setInfo("New code sent. Check your inbox.");
    } catch (err) {
      setError(authErrorInfo(err, "Could not resend the code.").message);
    } finally {
      setPending(false);
    }
  }

  if (step === "reset") {
    return (
      <form onSubmit={onReset} className="space-y-5">
        <div className="space-y-2">
          <h2 className="text-lg font-medium tracking-tight">
            Choose a new password
          </h2>
          <p className="text-sm text-muted-foreground">
            Enter the code sent to{" "}
            <span className="text-foreground">{email}</span>, then your new
            password.
          </p>
        </div>

        <Field>
          <Label htmlFor="reset-otp">Reset code</Label>
          <InputOTP
            id="reset-otp"
            maxLength={OTP_LENGTH}
            value={otp}
            onChange={(value) => {
              setOtp(value);
              setError(null);
            }}
            disabled={pending}
            autoFocus
            containerClassName="justify-between gap-2 sm:justify-center sm:gap-2"
            aria-invalid={Boolean(error)}
          >
            <InputOTPGroup className="gap-2">
              {Array.from({ length: OTP_LENGTH }, (_, index) => (
                <InputOTPSlot
                  key={index}
                  index={index}
                  className="size-11 rounded-lg border text-base first:rounded-lg last:rounded-lg sm:size-12"
                />
              ))}
            </InputOTPGroup>
          </InputOTP>
        </Field>

        <ConfirmPasswordFields
          disabled={pending}
          matchError={matchError}
        />

        {error ? <Notice variant="destructive">{error}</Notice> : null}
        {info ? <Notice variant="muted">{info}</Notice> : null}

        <Button
          type="submit"
          disabled={pending || otp.length !== OTP_LENGTH}
          className="w-full"
        >
          {pending ? "Updating…" : "Update password"}
        </Button>

        <div className="flex flex-col items-center gap-2 text-center text-sm text-muted-foreground">
          <button
            type="button"
            onClick={onResend}
            disabled={pending}
            className="text-foreground underline-offset-4 hover:underline disabled:opacity-50"
          >
            Resend code
          </button>
          <button
            type="button"
            onClick={() => {
              setStep("email");
              setOtp("");
              setError(null);
              setMatchError(null);
              setInfo(null);
            }}
            className="underline-offset-4 hover:underline"
          >
            Use a different email
          </button>
        </div>
      </form>
    );
  }

  return (
    <form onSubmit={onRequest} className="space-y-5">
      <Field>
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          placeholder="you@example.com"
          defaultValue={email}
          disabled={pending}
        />
      </Field>

      {error ? <Notice variant="destructive">{error}</Notice> : null}

      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Sending…" : "Send reset code"}
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        Remembered it?{" "}
        <Link
          href="/auth/sign-in"
          className="text-foreground underline-offset-4 hover:underline"
        >
          Sign in
        </Link>
      </p>
    </form>
  );
}
