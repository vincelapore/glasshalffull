"use client";

import { Popover } from "@base-ui/react/popover";
import { Check, Share } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";

import { absoluteSiteUrl } from "@/lib/urls";
import { cn } from "@/lib/utils";

export function EventShareButton({
  title,
  path,
  className,
}: {
  title: string;
  path: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [hint, setHint] = useState<string | null>(null);
  const [canNativeShare, setCanNativeShare] = useState(false);

  useEffect(() => {
    setCanNativeShare(typeof navigator.share === "function");
  }, []);

  function shareUrl() {
    // Always the public site — not localhost / preview — so shared links work for others.
    return absoluteSiteUrl(path);
  }

  function onOpenChange(next: boolean) {
    setOpen(next);
    if (!next) {
      setCopied(false);
      setHint(null);
    }
  }

  async function copyUrl() {
    const url = shareUrl();
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setHint(null);
      return true;
    } catch {
      // Fallback for browsers that block clipboard without a visible selection.
      try {
        const input = document.createElement("textarea");
        input.value = url;
        input.setAttribute("readonly", "");
        input.style.position = "fixed";
        input.style.opacity = "0";
        document.body.appendChild(input);
        input.select();
        const ok = document.execCommand("copy");
        document.body.removeChild(input);
        if (ok) {
          setCopied(true);
          setHint(null);
          return true;
        }
      } catch {
        // ignore
      }
      setHint("couldn’t copy that link");
      return false;
    }
  }

  async function onNativeShare() {
    const url = shareUrl();
    if (typeof navigator.share !== "function") return;
    try {
      await navigator.share({ title, url, text: title });
      setOpen(false);
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      setHint("couldn’t open the share sheet");
    }
  }

  function openShare(href: string) {
    // Keep this synchronous so popup blockers don’t swallow the tab.
    window.open(href, "_blank", "noopener,noreferrer");
    setOpen(false);
  }

  async function onPastePlatform(platform: "instagram" | "messenger") {
    const ok = await copyUrl();
    if (ok) {
      setHint(`link copied — paste it in ${platform}`);
    }
  }

  return (
    <Popover.Root open={open} onOpenChange={onOpenChange} modal>
      <Popover.Trigger
        aria-label={`Share ${title}`}
        onClick={(event) => event.stopPropagation()}
        onPointerDown={(event) => event.stopPropagation()}
        className={cn(
          "poster-share inline-flex size-8 items-center justify-center rounded-sm bg-[#feffec] text-neutral-950 ring-1 ring-black/10 hover:bg-neutral-950 hover:text-[#feffec] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring data-popup-open:bg-neutral-950 data-popup-open:text-[#feffec]",
          className,
        )}
      >
        <Share className="size-3.5" />
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Backdrop className="fixed inset-0 z-50 bg-neutral-950/25 transition-opacity duration-200 [transition-timing-function:var(--ease-out)] data-ending-style:opacity-0 data-starting-style:opacity-0 motion-reduce:transition-none" />
        <Popover.Positioner
          side="top"
          align="end"
          sideOffset={10}
          collisionPadding={16}
          className="z-50 outline-none"
        >
          <Popover.Popup className="w-56 origin-(--transform-origin) rounded-xl bg-background p-1.5 text-foreground shadow-glass ring-1 ring-foreground/10 outline-none transition-[opacity,transform] duration-200 [transition-timing-function:var(--ease-out)] data-ending-style:scale-[0.97] data-ending-style:opacity-0 data-starting-style:scale-[0.97] data-starting-style:opacity-0 motion-reduce:transition-none motion-reduce:data-ending-style:scale-100 motion-reduce:data-starting-style:scale-100">
            <Popover.Title className="px-2 pt-1.5 pb-1 font-mono text-[10px] font-medium tracking-[0.14em] text-muted-foreground lowercase">
              share
            </Popover.Title>
            <Popover.Close className="sr-only">Close</Popover.Close>
            <div className="flex flex-col">
              <ShareAction
                icon={copied ? <Check className="size-4" strokeWidth={2.25} /> : <CopyIcon />}
                label={copied ? "copied" : "copy link"}
                onClick={() => void copyUrl()}
              />
              {canNativeShare ? (
                <ShareAction
                  icon={<Share className="size-4" strokeWidth={1.75} />}
                  label="more…"
                  onClick={() => void onNativeShare()}
                />
              ) : null}
              <div className="mx-2 my-1 h-px bg-foreground/10" />
              <ShareAction
                icon={<WhatsAppIcon />}
                label="whatsapp"
                onClick={() => {
                  const url = shareUrl();
                  openShare(
                    `https://wa.me/?text=${encodeURIComponent(`${title}\n${url}`)}`,
                  );
                }}
              />
              <ShareAction
                icon={<FacebookIcon />}
                label="facebook"
                onClick={() => {
                  const url = shareUrl();
                  openShare(
                    `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
                  );
                }}
              />
              <ShareAction
                icon={<MessengerIcon />}
                label="messenger"
                onClick={() => void onPastePlatform("messenger")}
              />
              <ShareAction
                icon={<InstagramIcon />}
                label="instagram"
                onClick={() => void onPastePlatform("instagram")}
              />
            </div>
            {hint ? (
              <p
                className="px-2 pt-1 pb-1.5 font-mono text-[11px] text-muted-foreground lowercase"
                role="status"
              >
                {hint}
              </p>
            ) : (
              <p className="px-2 pt-1 pb-1.5 font-mono text-[10px] text-muted-foreground lowercase">
                ig &amp; messenger need a paste
              </p>
            )}
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  );
}

function ShareAction({
  icon,
  label,
  onClick,
}: {
  icon: ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-left transition-colors duration-150 [transition-timing-function:var(--ease-out)] hover:bg-foreground/8 focus-visible:bg-foreground/8 focus-visible:outline-none"
    >
      <span className="text-foreground">{icon}</span>
      <span className="font-mono text-[13px] lowercase">{label}</span>
    </button>
  );
}

function IconFrame({ children }: { children: ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden
      className="size-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {children}
    </svg>
  );
}

function CopyIcon() {
  return (
    <IconFrame>
      <rect x="8" y="8" width="11" height="11" rx="2" />
      <path d="M6 16H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </IconFrame>
  );
}

function InstagramIcon() {
  return (
    <IconFrame>
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="0.9" fill="currentColor" stroke="none" />
    </IconFrame>
  );
}

function FacebookIcon() {
  return (
    <IconFrame>
      <path d="M14 8.5V6.8A2.3 2.3 0 0 0 11.7 4.5H10" />
      <path d="M10 10.5h5" />
      <path d="M12 8.5v11" />
    </IconFrame>
  );
}

function MessengerIcon() {
  return (
    <IconFrame>
      <path d="M12 5.2c-4.2 0-7.5 3-7.5 6.7 0 2.1 1 4 2.7 5.2v2.4l2.5-1.4c.7.2 1.5.3 2.3.3 4.2 0 7.5-3 7.5-6.7S16.2 5.2 12 5.2z" />
      <path d="m8.2 13.2 2.2-2.3 1.7 1.6 2.7-2.3" />
    </IconFrame>
  );
}

function WhatsAppIcon() {
  return (
    <IconFrame>
      <path d="M12 5.4a6.4 6.4 0 0 0-5.5 9.7L5.5 19l3.4-1A6.4 6.4 0 1 0 12 5.4z" />
      <path d="M9.2 11.6c.4.9 1.1 1.6 2 2l.8-.8c.2-.2.5-.2.7 0l.8.7" />
    </IconFrame>
  );
}
