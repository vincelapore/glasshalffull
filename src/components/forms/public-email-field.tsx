"use client";

import {
  useWatch,
  type Control,
  type FieldErrors,
  type UseFormRegister,
  type UseFormSetValue,
} from "react-hook-form";

import { Field, FieldError } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { OptionPill } from "@/components/ui/option-pill";
import type { PublicEmailMode } from "@/lib/creative-contact";
import type { CreativeSubmissionInput } from "@/lib/validations";

export function PublicEmailField({
  control,
  register,
  setValue,
  accountEmail,
  errors,
}: {
  control: Control<CreativeSubmissionInput>;
  register: UseFormRegister<CreativeSubmissionInput>;
  setValue: UseFormSetValue<CreativeSubmissionInput>;
  /** Login email for “use my account email”. Omit when unavailable (admin stubs). */
  accountEmail?: string | null;
  errors: FieldErrors<CreativeSubmissionInput>;
}) {
  const mode = useWatch({ control, name: "publicEmailMode" }) as PublicEmailMode;
  const canUseAccount = Boolean(accountEmail?.trim());

  function choose(next: PublicEmailMode) {
    if (next === "account" && !canUseAccount) return;
    setValue("publicEmailMode", next, { shouldDirty: true, shouldValidate: true });
    if (next !== "custom") {
      setValue("publicEmail", "", { shouldDirty: true, shouldValidate: true });
    }
  }

  return (
    <Field>
      <div className="flex items-baseline justify-between gap-2">
        <Label>Email</Label>
        <span className="text-xs text-muted-foreground">On your profile</span>
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        <OptionPill active={mode === "hidden"} onClick={() => choose("hidden")}>
          Hidden
        </OptionPill>
        {canUseAccount ? (
          <OptionPill
            active={mode === "account"}
            onClick={() => choose("account")}
          >
            {accountEmail}
          </OptionPill>
        ) : null}
        <OptionPill active={mode === "custom"} onClick={() => choose("custom")}>
          Other
        </OptionPill>
      </div>

      {mode === "custom" ? (
        <div className="space-y-2">
          <Input
            id="publicEmail"
            type="email"
            autoComplete="email"
            placeholder="bookings@example.com"
            aria-label="Public email"
            aria-invalid={Boolean(errors.publicEmail)}
            {...register("publicEmail")}
          />
          <FieldError>{errors.publicEmail?.message}</FieldError>
        </div>
      ) : null}

      {typeof errors.publicEmailMode?.message === "string" ? (
        <FieldError>{errors.publicEmailMode.message}</FieldError>
      ) : null}
    </Field>
  );
}
