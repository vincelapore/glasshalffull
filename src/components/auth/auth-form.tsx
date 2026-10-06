"use client";

import Link from "next/link";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authClient } from "@/lib/auth/client";

type AuthFormProps =
  | { mode: "sign-in"; next?: string }
  | { mode: "sign-up"; next?: never };

export function AuthForm(props: AuthFormProps) {
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setPending(true);

    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") ?? "").trim();
    const password = String(form.get("password") ?? "");
    const name = String(form.get("name") ?? "").trim();

    try {
      if (props.mode === "sign-up") {
        if (!name || !email || !password) {
          setError("Name, email, and password are required.");
          return;
        }
        if (password.length < 8) {
          setError("Password must be at least 8 characters.");
          return;
        }

        const { error: signUpError } = await authClient.signUp.email({
          name,
          email,
          password,
        });

        if (signUpError) {
          setError(signUpError.message || "Could not create your account.");
          return;
        }
      } else {
        if (!email || !password) {
          setError("Email and password are required.");
          return;
        }

        const { error: signInError } = await authClient.signIn.email({
          email,
          password,
        });

        if (signInError) {
          setError(signInError.message || "Could not sign in. Try again.");
          return;
        }
      }

      window.location.assign(
        props.mode === "sign-in" && props.next ? props.next : "/account"
      );
    } catch (err) {
      console.error("AuthForm", err);
      setError("Something went wrong. Please try again.");
      setPending(false);
    }
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
