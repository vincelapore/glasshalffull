"use client";

import { Plus, X } from "lucide-react";
import { useMemo, useState } from "react";
import {
  useWatch,
  type Control,
  type FieldPath,
  type FieldValues,
  type UseFormSetValue,
} from "react-hook-form";

import {
  AppleMusicIcon,
  BandcampIcon,
  GlobeIcon,
  InstagramIcon,
  SoundCloudIcon,
  SpotifyIcon,
  VimeoIcon,
  YouTubeIcon,
} from "@/components/icons/brand-icons";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogDescription,
  DialogPopup,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldError } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  normalizeSocial,
  socialDisplayHandle,
  socialProviderHints,
  socialProviderLabels,
  socialProviderPlaceholders,
  socialProviders,
  type CreativeSocial,
  type SocialProvider,
} from "@/lib/creative-socials";
import { cn } from "@/lib/utils";

function SocialGlyph({
  provider,
  className,
}: {
  provider: SocialProvider;
  className?: string;
}) {
  switch (provider) {
    case "website":
      return <GlobeIcon className={className} />;
    case "instagram":
      return <InstagramIcon className={className} />;
    case "youtube":
      return <YouTubeIcon className={className} />;
    case "vimeo":
      return <VimeoIcon className={className} />;
    case "spotify":
      return <SpotifyIcon className={className} />;
    case "apple_music":
      return <AppleMusicIcon className={className} />;
    case "soundcloud":
      return <SoundCloudIcon className={className} />;
    case "bandcamp":
      return <BandcampIcon className={className} />;
  }
}

type SocialsFieldProps<T extends FieldValues> = {
  control: Control<T>;
  setValue: UseFormSetValue<T>;
  name: FieldPath<T>;
  errorMessage?: string;
};

export function SocialsField<T extends FieldValues>({
  control,
  setValue,
  name,
  errorMessage,
}: SocialsFieldProps<T>) {
  const watched = useWatch({ control, name }) as CreativeSocial[] | undefined;
  const socials = watched ?? [];

  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<"pick" | "url">("pick");
  const [provider, setProvider] = useState<SocialProvider | null>(null);
  const [draftUrl, setDraftUrl] = useState("");
  const [draftError, setDraftError] = useState<string | null>(null);

  const available = useMemo(
    () =>
      socialProviders.filter(
        (item) => !socials.some((social) => social.provider === item),
      ),
    [socials],
  );

  function resetDialog() {
    setStep("pick");
    setProvider(null);
    setDraftUrl("");
    setDraftError(null);
  }

  function update(next: CreativeSocial[]) {
    setValue(name, next as T[typeof name], {
      shouldDirty: true,
      shouldValidate: true,
    });
  }

  function selectProvider(next: SocialProvider) {
    setProvider(next);
    setDraftUrl("");
    setDraftError(null);
    setStep("url");
  }

  function addSocial() {
    if (!provider) return;
    const normalized = normalizeSocial(provider, draftUrl);
    if (!normalized) {
      setDraftError(
        `Enter a valid ${socialProviderLabels[provider]} profile link`,
      );
      return;
    }
    update([...socials.filter((s) => s.provider !== provider), normalized]);
    setOpen(false);
    resetDialog();
  }

  return (
    <Field>
      <div className="flex items-baseline justify-between gap-2">
        <Label>Socials</Label>
        <span className="text-xs text-muted-foreground">Links</span>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {socials.map((social) => {
          const handle = socialDisplayHandle(social);

          return (
            <div
              key={social.provider}
              className="inline-flex max-w-full items-center gap-0.5 rounded-full border border-border bg-muted/40 pr-1"
            >
              <a
                href={social.url}
                target="_blank"
                rel="noreferrer"
                title={social.url}
                className="inline-flex min-w-0 items-center gap-1.5 rounded-full py-1 pl-2.5 pr-1 text-foreground transition-colors hover:text-foreground/80"
              >
                <SocialGlyph
                  provider={social.provider}
                  className="size-4 shrink-0"
                />
                <span className="max-w-[12rem] truncate text-xs font-medium">
                  {handle}
                </span>
              </a>
              <button
                type="button"
                aria-label={`Remove ${handle}`}
                className="inline-flex size-7 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-background hover:text-foreground"
                onClick={() =>
                  update(
                    socials.filter((item) => item.provider !== social.provider),
                  )
                }
              >
                <X className="size-3.5" />
              </button>
            </div>
          );
        })}

        {available.length > 0 ? (
          <Button
            type="button"
            size="icon"
            variant="outline"
            aria-label="Add social"
            onClick={() => {
              resetDialog();
              setOpen(true);
            }}
          >
            <Plus className="size-4" />
          </Button>
        ) : null}
      </div>

      {errorMessage ? <FieldError>{errorMessage}</FieldError> : null}

      <Dialog
        open={open}
        onOpenChange={(next) => {
          setOpen(next);
          if (!next) resetDialog();
        }}
      >
        <DialogPopup className="max-w-md">
          {step === "pick" ? (
            <>
              <DialogTitle>Add a social</DialogTitle>
              <DialogDescription>
                Choose an account to link. Each platform can only be added once.
              </DialogDescription>
              <ul className="mt-4 grid grid-cols-2 gap-2">
                {available.map((item) => (
                  <li key={item}>
                    <button
                      type="button"
                      onClick={() => selectProvider(item)}
                      className={cn(
                        "flex w-full items-center gap-3 rounded-xl border border-border px-3 py-3 text-left",
                        "transition-colors hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
                      )}
                    >
                      <SocialGlyph provider={item} />
                      <span className="text-sm font-medium">
                        {socialProviderLabels[item]}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
              <div className="mt-4 flex justify-end">
                <Button
                  type="button"
                  variant="ghost"
                  nativeButton
                  render={<DialogClose />}
                >
                  Cancel
                </Button>
              </div>
            </>
          ) : provider ? (
            <>
              <DialogTitle>Add {socialProviderLabels[provider]}</DialogTitle>
              <DialogDescription>
                {socialProviderHints[provider]}
              </DialogDescription>
              <div className="mt-4 space-y-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <SocialGlyph provider={provider} className="size-4" />
                  {socialProviderLabels[provider]}
                </div>
                <Input
                  type="text"
                  inputMode="url"
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                  autoFocus
                  placeholder={socialProviderPlaceholders[provider]}
                  value={draftUrl}
                  onChange={(event) => {
                    setDraftUrl(event.target.value);
                    setDraftError(null);
                  }}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      addSocial();
                    }
                  }}
                  aria-invalid={Boolean(draftError)}
                />
                {draftError ? <FieldError>{draftError}</FieldError> : null}
              </div>
              <div className="mt-4 flex justify-between gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    setStep("pick");
                    setProvider(null);
                    setDraftUrl("");
                    setDraftError(null);
                  }}
                >
                  Back
                </Button>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    nativeButton
                    render={<DialogClose />}
                  >
                    Cancel
                  </Button>
                  <Button type="button" onClick={addSocial}>
                    Add
                  </Button>
                </div>
              </div>
            </>
          ) : null}
        </DialogPopup>
      </Dialog>
    </Field>
  );
}
