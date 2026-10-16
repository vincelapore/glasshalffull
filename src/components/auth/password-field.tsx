"use client";

import { Eye, EyeOff } from "lucide-react";
import { useId, useState } from "react";

import { Field, FieldError } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MIN_PASSWORD_LENGTH } from "@/lib/auth/errors";
import { cn } from "@/lib/utils";

type PasswordFieldProps = {
  id?: string;
  name: string;
  label: string;
  autoComplete: "current-password" | "new-password";
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  minLength?: number;
  /** Helper under the field (e.g. length hint on create). */
  hint?: string;
  error?: string | null;
  defaultValue?: string;
  className?: string;
};

export function PasswordField({
  id: idProp,
  name,
  label,
  autoComplete,
  placeholder,
  required = true,
  disabled,
  minLength,
  hint,
  error,
  defaultValue,
  className,
}: PasswordFieldProps) {
  const reactId = useId();
  const id = idProp ?? `${name}-${reactId}`;
  const [visible, setVisible] = useState(false);

  return (
    <Field className={className}>
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        <Input
          id={id}
          name={name}
          type={visible ? "text" : "password"}
          required={required}
          disabled={disabled}
          autoComplete={autoComplete}
          placeholder={placeholder}
          minLength={minLength}
          defaultValue={defaultValue}
          aria-invalid={Boolean(error)}
          aria-describedby={
            error ? `${id}-error` : hint ? `${id}-hint` : undefined
          }
          className="pr-10"
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          disabled={disabled}
          className={cn(
            "absolute top-1/2 right-1.5 flex size-6 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground transition-colors hover:text-foreground disabled:opacity-50"
          )}
          aria-label={visible ? "Hide password" : "Show password"}
          aria-pressed={visible}
        >
          {visible ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
        </button>
      </div>
      {hint && !error ? (
        <p id={`${id}-hint`} className="text-xs text-muted-foreground">
          {hint}
        </p>
      ) : null}
      <FieldError id={`${id}-error`}>{error}</FieldError>
    </Field>
  );
}

type ConfirmPasswordFieldsProps = {
  passwordName?: string;
  confirmName?: string;
  passwordLabel?: string;
  confirmLabel?: string;
  disabled?: boolean;
  error?: string | null;
  matchError?: string | null;
};

/** New password + confirm pair for reset / change / set. */
export function ConfirmPasswordFields({
  passwordName = "password",
  confirmName = "confirmPassword",
  passwordLabel = "New password",
  confirmLabel = "Confirm password",
  disabled,
  error,
  matchError,
}: ConfirmPasswordFieldsProps) {
  return (
    <div className="space-y-5">
      <PasswordField
        name={passwordName}
        label={passwordLabel}
        autoComplete="new-password"
        minLength={MIN_PASSWORD_LENGTH}
        hint={`At least ${MIN_PASSWORD_LENGTH} characters`}
        disabled={disabled}
        error={error}
      />
      <PasswordField
        name={confirmName}
        label={confirmLabel}
        autoComplete="new-password"
        minLength={MIN_PASSWORD_LENGTH}
        disabled={disabled}
        error={matchError}
      />
    </div>
  );
}
