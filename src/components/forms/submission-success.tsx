import Link from "next/link";
import { CheckCircle2 } from "lucide-react";

import { Button } from "@/components/ui/button";

type SubmissionSuccessProps = {
  title: string;
  description: string;
  primaryHref: string;
  primaryLabel: string;
  onSubmitAnother: () => void;
  submitAnotherLabel: string;
};

export function SubmissionSuccess({
  title,
  description,
  primaryHref,
  primaryLabel,
  onSubmitAnother,
  submitAnotherLabel,
}: SubmissionSuccessProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="glass-panel flex flex-col items-start gap-5 rounded-xl px-6 py-8 sm:px-8"
    >
      <div className="flex size-11 items-center justify-center rounded-full bg-liquid/15 text-liquid">
        <CheckCircle2 className="size-6" aria-hidden />
      </div>
      <div className="space-y-2">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-liquid">
          Submitted
        </p>
        <h2 className="font-heading text-2xl tracking-tight sm:text-3xl">
          {title}
        </h2>
        <p className="max-w-md text-muted-foreground">{description}</p>
      </div>
      <div className="flex flex-wrap gap-3 pt-1">
        <Button render={<Link href={primaryHref} />}>{primaryLabel}</Button>
        <Button variant="outline" onClick={onSubmitAnother}>
          {submitAnotherLabel}
        </Button>
      </div>
    </div>
  );
}
