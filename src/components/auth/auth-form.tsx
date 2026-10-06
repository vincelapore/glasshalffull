"use client";

import Link from "next/link";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { Label } from "@/components/ui/label";
import { authClient } from "@/lib/auth/client";

type AuthFormProps =
  | { mode: "sign-in"; next?: string }
  | { mode: "sign-up"; next?: never };

type Step = "auth" | "verify";

const OTP_LENGTH = 6;

function isEmailNotVerifiedError(message?: string | null) {
  if (!message) return false;
  return /email not verified/i.test(message);
}

export function AuthForm(props: AuthFormProps) {
  const [step, setStep] = useState<Step>("auth");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const redirectTo =
    props.mode === "sign-in" && props.next ? props.next : "/account";

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setInfo(null);
    setPending(true);

    const form = new FormData(event.currentTarget);
    const submittedEmail = String(form.get("email") ?? "").trim();
    const password = String(form.get("password") ?? "");
    const name = String(form.get("name") ?? "").trim();

    try {
      if (props.mode === "sign-up") {
        if (!name || !submittedEmail || !password) {
          setError("Name, email, and password are required.");
          return;
        }
        if (password.length < 8) {
          setError("Password must be at least 8 characters.");
          return;
        }

        const { data, error: signUpError } = await authClient.signUp.email({
          name,
          email: submittedEmail,
          password,
        });

        if (signUpError) {
          setError(signUpError.message || "Could not create your account.");
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
          if (isEmailNotVerifiedError(signInError.message)) {
            setEmail(submittedEmail);
            setOtp("");
            setInfo(
              "Verify your email before signing in. Enter the code we sent, or request a new one."
            );
            setStep("verify");
            return;
          }
          setError(signInError.message || "Could not sign in. Try again.");
          return;
        }
      }

      window.location.assign(redirectTo);
    } catch (err) {
      console.error("AuthForm", err);
      setError("Something went wrong. Please try again.");
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
    setInfo(null);
    setPending(true);

    try {
      const { data, error: verifyError } = await authClient.emailOtp.verifyEmail({
        email,
        otp: code,
      });

      if (verifyError) {
        setError(verifyError.message || "Could not verify that code.");
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
      console.error("AuthForm verify", err);
      setError("Something went wrong. Please try again.");
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
    setInfo(null);
    setPending(true);

    try {
      const { error: resendError } = await authClient.sendVerificationEmail({
        email,
        callbackURL: window.location.origin + "/account",
      });

      if (resendError) {
        setError(resendError.message || "Could not resend the code.");
        return;
      }

      setOtp("");
      setInfo("New verification code sent. Check your inbox.");
    } catch (err) {
      console.error("AuthForm resend", err);
      setError("Could not resend the code. Please try again.");
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

        <div className="space-y-2">
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
        </div>

        {error ? (
          <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </p>
        ) : null}
        {info ? (
          <p className="rounded-lg border border-border bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
            {info}
          </p>
        ) : null}

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
        <div className="space-y-2">
          <Label htmlFor="name">Name</Label>
          <Input
            id="name"
            name="name"
            type="text"
            required
            autoComplete="name"
            placeholder="Your name or moniker"
          />
        </div>
      ) : null}

      <div className="space-y-2">
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
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          name="password"
          type="password"
          required
          autoComplete={
            props.mode === "sign-up" ? "new-password" : "current-password"
          }
          placeholder="At least 8 characters"
          minLength={8}
        />
      </div>

      {error ? (
        <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      ) : null}
      {info ? (
        <p className="rounded-lg border border-border bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
          {info}
        </p>
      ) : null}

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
