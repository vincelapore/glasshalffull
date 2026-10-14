"use client";

import { Plus, X } from "lucide-react";
import {
  useWatch,
  type Control,
  type FieldPath,
  type FieldValues,
  type UseFormRegister,
  type UseFormSetValue,
} from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Field, FieldError } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type MediaUrlsFieldProps<T extends FieldValues> = {
  control: Control<T>;
  register: UseFormRegister<T>;
  setValue: UseFormSetValue<T>;
  name: FieldPath<T>;
  label: string;
  placeholder: string;
  help: string;
  max: number;
  errors?: Array<{ message?: string } | undefined> | undefined;
  rootError?: string;
};

export function MediaUrlsField<T extends FieldValues>({
  control,
  register,
  setValue,
  name,
  label,
  placeholder,
  help,
  max,
  errors,
  rootError,
}: MediaUrlsFieldProps<T>) {
  const watched = useWatch({ control, name }) as string[] | undefined;
  const values = watched?.length ? watched : [""];

  function update(next: string[]) {
    const cleaned = next.length === 0 ? [""] : next;
    setValue(name, cleaned as T[typeof name], {
      shouldDirty: true,
      shouldValidate: true,
    });
  }

  return (
    <Field>
      <div className="flex items-baseline justify-between gap-2">
        <Label>{label}</Label>
        <span className="text-xs text-muted-foreground">Up to {max}</span>
      </div>
      <p className="text-sm text-muted-foreground">{help}</p>
      <div className="space-y-2">
        {values.map((_, index) => (
          <div key={`${String(name)}-${index}`} className="flex gap-2">
            <Input
              type="text"
              inputMode="url"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              placeholder={placeholder}
              {...register(`${name}.${index}` as FieldPath<T>)}
              aria-invalid={Boolean(errors?.[index]?.message)}
            />
            {values.length > 1 ? (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label={`Remove ${label.toLowerCase()} link`}
                onClick={() =>
                  update(values.filter((_, itemIndex) => itemIndex !== index))
                }
              >
                <X className="size-4" />
              </Button>
            ) : null}
          </div>
        ))}
      </div>
      {values.length < max ? (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="mt-2"
          onClick={() => update([...values, ""])}
        >
          <Plus className="size-4" />
          Add another
        </Button>
      ) : null}
      {errors?.map((error, index) =>
        error?.message ? (
          <FieldError key={index}>{error.message}</FieldError>
        ) : null
      )}
      {rootError ? <FieldError>{rootError}</FieldError> : null}
    </Field>
  );
}
