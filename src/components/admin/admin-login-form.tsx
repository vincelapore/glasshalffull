"use client";

import { useActionState } from "react";

import { loginAdminAction, type LoginResult } from "@/app/actions/admin-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initialState: LoginResult | null = null;

export function AdminLoginForm() {
  const [state, formAction, pending] = useActionState(
    loginAdminAction,
    initialState
  );

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="password">Admin password</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
        />
      </div>
      {state && !state.success ? (
        <p className="text-sm text-destructive">{state.message}</p>
      ) : null}
      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Signing in…" : "Sign in"}
      </Button>
    </form>
  );
}
