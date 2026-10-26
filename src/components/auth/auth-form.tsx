"use client";

import Link from "next/link";
import { useState } from "react";

import {
  ConfirmPasswordFields,
  PasswordField,
} from "@/components/auth/password-field";
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
  type AuthErrorAction,
  MIN_PASSWORD_LENGTH,
  passwordsMatch,
  passwordTooShort,
} from "@/lib/auth/errors";

type AuthFormProps =
  | { mode: "sign-in"; next?: string; notice?: string | null }
  | { mode: "sign-up"; next?: never; notice?: never };

type Step = "auth" | "verify";

const OTP_LENGTH = 6;

function isEmailNotVerifiedError(error: unknown) {
  const info = authErrorInfo(error);
  return info.action === "resend" && /verify your email/i.test(info.message);
}

function beginVerify(
  submittedEmail: string,
  setEmail: (value: string) => void,
  setOtp: (value: string) => void,
  setInfo: (value: string | null) => void,
  setStep: (value: Step) => void,
  setError: (value: string | null) => void,
  setErrorAction: (value: AuthErrorAction | null) => void
) {
  setEmail(submittedEmail);
  setOtp("");
  setError(null);
  setErrorAction(null);
  setInfo(
    "Verify your email before signing in. Enter the code we sent, or request a new one."
  );
  setStep("verify");
}

export function AuthForm(props: AuthFormProps) {
  const [step, setStep] = useState<Step>("auth");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [matchError, setMatchError] = useState<string | null>(null);
  const [errorAction, setErrorAction] = useState<AuthErrorAction | null>(null);
  const [info, setInfo] = useState<string | null>(props.notice ?? null);
  const [pending, setPending] = useState(false);

  const redirectTo =
    props.mode === "sign-in" && props.next ? props.next : "/account";

  function showMappedError(
    err: unknown,
    fallback: string,
    submittedEmail?: string
  ) {
    if (submittedEmail && isEmailNotVerifiedError(err)) {
      beginVerify(
        submittedEmail,
        setEmail,
        setOtp,
        setInfo,
        setStep,
        setError,
        setErrorAction
      );
      return;
    }
    const mapped = authErrorInfo(err, fallback);
    setError(mapped.message);
    setErrorAction(mapped.action ?? null);
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setMatchError(null);
    setErrorAction(null);
    setInfo(null);
    setPending(true);

    const form = new FormData(event.currentTarget);
    const submittedEmail = String(form.get("email") ?? "").trim();
    const password = String(form.get("password") ?? "");
    const confirmPassword = String(form.get("confirmPassword") ?? "");
    const name = String(form.get("name") ?? "").trim();

    try {
      if (props.mode === "sign-up") {
        if (!name || !submittedEmail || !password) {
          setError("Name, email, and password are required.");
          return;
        }
        if (passwordTooShort(password)) {
          setError(
            `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`
          );
          return;
        }
        if (!passwordsMatch(password, confirmPassword)) {
          setMatchError("Passwords do not match.");
          return;
        }

        const { data, error: signUpError } = await authClient.signUp.email({
          name,
          email: submittedEmail,
          password,
        });

        if (signUpError) {
          showMappedError(signUpError, "Could not create your account.");
          return;
        }

        // Neon Verify-at-sign-up (verification code): OTP emailed, no session yet.
        if (data?.user && !data.user.emailVerified) {
          setEmail(submittedEmail);
          setOtp("");
          setInfo("Check your email for a verification code.");
          setStep("verify");
          return;
        }
      } else {
        if (!submittedEmail || !password) {
          setError("Email and password are required.");
          return;
        }

        const { error: signInError } = await authClient.signIn.email({
          email: submittedEmail,
          password,
        });

        if (signInError) {
          showMappedError(
            signInError,
            "Could not sign in. Try again.",
            submittedEmail
          );
          return;
        }
      }

      window.location.assign(redirectTo);
    } catch (err) {
      // Neon Auth throws AuthApiError (e.g. invalid_credentials) instead of
      // always returning { error }. Map it; do not console.error (Next overlay).
      showMappedError(
        err,
        props.mode === "sign-up"
          ? "Could not create your account."
          : "Could not sign in. Try again.",
        submittedEmail
      );
    } finally {
      setPending(false);
    }
  }

  async function verifyOtp(code: string) {
    if (!email || code.length !== OTP_LENGTH) {
      setError("Enter the 6-digit verification code from your email.");
      return;
    }

    setError(null);
    setErrorAction(null);
    setInfo(null);
    setPending(true);

    try {
      const { data, error: verifyError } = await authClient.emailOtp.verifyEmail({
        email,
        otp: code,
      });

      if (verifyError) {
        showMappedError(verifyError, "Could not verify that code.");
        setOtp("");
        return;
      }

      // token is set when Neon auto-signs-in after verification
      if (data?.token) {
        window.location.assign(redirectTo);
        return;
      }

      setInfo("Email verified. You can sign in now.");
      setStep("auth");
      setOtp("");
    } catch (err) {
      showMappedError(err, "Could not verify that code.");
      setOtp("");
    } finally {
      setPending(false);
    }
  }

  async function onVerify(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await verifyOtp(otp);
  }

  async function onResend() {
    if (!email) return;
    setError(null);
    setErrorAction(null);
    setInfo(null);
    setPending(true);

    try {
      const { error: resendError } = await authClient.emailOtp.sendVerificationOtp(
        {
          email,
          type: "email-verification",
        }
      );

      if (resendError) {
        showMappedError(resendError, "Could not resend the code.");
        return;
      }

      setOtp("");
      setInfo("New verification code sent. Check your inbox.");
    } catch (err) {
      showMappedError(err, "Could not resend the code.");
    } finally {
      setPending(false);
    }
  }

  if (step === "verify") {
    return (
      <form onSubmit={onVerify} className="space-y-5">
        <div className="space-y-2">
          <h2 className="text-lg font-medium tracking-tight">
            Verify your email
          </h2>
          <p className="text-sm text-muted-foreground">
            Enter the code sent to{" "}
            <span className="text-foreground">{email}</span>. Codes expire in
            15 minutes.
          </p>
        </div>

        <Field>
          <Label htmlFor="otp">Verification code</Label>
          <InputOTP
            id="otp"
            maxLength={OTP_LENGTH}
            value={otp}
            onChange={(value) => {
              setOtp(value);
              setError(null);
              if (value.length === OTP_LENGTH && !pending) {
                void verifyOtp(value);
              }
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

        {error ? <Notice variant="destructive">{error}</Notice> : null}
        {info ? <Notice variant="muted">{info}</Notice> : null}

        <Button
          type="submit"
          disabled={pending || otp.length !== OTP_LENGTH}
          className="w-full"
        >
          {pending ? "Verifying…" : "Verify email"}
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
              setStep("auth");
              setOtp("");
              setError(null);
              setErrorAction(null);
              setInfo(null);
            }}
            className="underline-offset-4 hover:underline"
          >
            Back
          </button>
        </div>
      </form>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      {props.mode === "sign-up" ? (
        <Field>
          <Label htmlFor="name">Name</Label>
          <Input
            id="name"
            name="name"
            type="text"
            required
            autoComplete="name"
            placeholder="Your name or moniker"
          />
        </Field>
      ) : null}

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
        />
      </Field>

      {props.mode === "sign-up" ? (
        <ConfirmPasswordFields
          passwordLabel="Password"
          confirmLabel="Confirm password"
          disabled={pending}
          matchError={matchError}
        />
      ) : (
        <PasswordField
          name="password"
          label="Password"
          autoComplete="current-password"
          placeholder="Your password"
          disabled={pending}
        />
      )}

      {props.mode === "sign-in" ? (
        <p className="-mt-2 text-right text-sm">
          <Link
            href="/auth/forgot-password"
            className="text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
          >
            Forgot password?
          </Link>
        </p>
      ) : null}

      {error ? (
        <Notice variant="destructive">
          <span>{error}</span>
          {errorAction === "forgot-password" ? (
            <>
              {" "}
              <Link
                href="/auth/forgot-password"
                className="underline underline-offset-4"
              >
                Reset password
              </Link>
            </>
          ) : null}
          {errorAction === "sign-in" ? (
            <>
              {" "}
              <Link
                href="/auth/sign-in"
                className="underline underline-offset-4"
              >
                Sign in
              </Link>
            </>
          ) : null}
          {errorAction === "sign-up" ? (
            <>
              {" "}
              <Link
                href="/auth/sign-up"
                className="underline underline-offset-4"
              >
                Create an account
              </Link>
            </>
          ) : null}
        </Notice>
      ) : null}
      {info ? <Notice variant="muted">{info}</Notice> : null}

      <Button type="submit" disabled={pending} className="w-full">
        {pending
          ? props.mode === "sign-up"
            ? "Creating account…"
            : "Signing in…"
          : props.mode === "sign-up"
            ? "Create account"
            : "Sign in"}
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        {props.mode === "sign-up" ? (
          <>
            Already have an account?{" "}
            <Link
              href="/auth/sign-in"
              className="text-foreground underline-offset-4 hover:underline"
            >
              Sign in
            </Link>
          </>
        ) : (
          <>
            New here?{" "}
            <Link
              href="/auth/sign-up"
              className="text-foreground underline-offset-4 hover:underline"
            >
              Create an account
            </Link>
          </>
        )}
      </p>
    </form>
  );
}
