"use client";

import Image from "next/image";
import { useState, type ReactNode } from "react";

import { cn } from "@/lib/utils";

type Side = "front" | "back";

const CONTACTS = [
  { label: "web", value: "glasshalffull.space" },
  { label: "ig", value: "@glasshalffull_brisbane" },
  { label: "mail", value: "hello.glasshalffull@gmail.com" },
] as const;

function CardFace({
  side,
  className,
  children,
}: {
  side: Side;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      className={cn(
        "absolute inset-0 overflow-hidden rounded-[1.15rem] border border-white/10",
        "bg-[#141418] text-[#f4f1e8]",
        "shadow-[0_24px_64px_-12px_rgba(0,0,0,0.55),0_0_48px_-8px_oklch(0.78_0.15_70_/_0.28)]",
        "backface-hidden",
        side === "back" && "[transform:rotateY(180deg)]",
        className
      )}
    >
      {/* Soft liquid wash — print-safe, no purple glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_55%_at_12%_110%,oklch(0.78_0.15_70_/_0.22),transparent_58%),radial-gradient(ellipse_50%_40%_at_90%_-10%,oklch(0.78_0.15_70_/_0.08),transparent_50%)]"
      />
      <div className="relative flex h-full flex-col p-6 sm:p-7">{children}</div>
    </div>
  );
}

function HalfGlassMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 48 64"
      fill="none"
      aria-hidden
      className={cn("text-[#f4f1e8]", className)}
    >
      <path
        d="M10 6h28l-3.2 44.5c-.3 4.2-3.8 7.5-8 7.5h-5.6c-4.2 0-7.7-3.3-8-7.5L10 6Z"
        stroke="currentColor"
        strokeWidth="2.25"
        strokeLinejoin="round"
      />
      <path
        d="M13.2 34h21.6l-1.5 20.2c-.15 2.1-1.9 3.8-4 3.8h-10.6c-2.1 0-3.85-1.7-4-3.8L13.2 34Z"
        className="fill-liquid business-card-liquid"
      />
      <path
        d="M14 18h20"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity="0.35"
      />
    </svg>
  );
}

export function BusinessCardMock() {
  const [side, setSide] = useState<Side>("front");
  const flipped = side === "back";

  return (
    <div className="business-card-stage mx-auto w-full max-w-[26rem]">
      <button
        type="button"
        onClick={() => setSide((s) => (s === "front" ? "back" : "front"))}
        aria-pressed={flipped}
        aria-label={
          flipped
            ? "Show front of business card"
            : "Show back of business card"
        }
        className={cn(
          "group relative mx-auto block w-full cursor-pointer perspective-[1200px]",
          "rounded-[1.15rem] outline-none",
          "focus-visible:ring-2 focus-visible:ring-liquid focus-visible:ring-offset-2 focus-visible:ring-offset-background",
          "motion-safe:transition-transform motion-safe:duration-300 motion-safe:[transition-timing-function:var(--ease-out)]",
          "motion-safe:hover:-translate-y-1 active:translate-y-0"
        )}
      >
        <div
          className={cn(
            "relative aspect-[90/55] w-full preserve-3d",
            "motion-safe:transition-transform motion-safe:duration-500 motion-safe:[transition-timing-function:var(--ease-out)]",
            flipped && "[transform:rotateY(180deg)]"
          )}
        >
          <CardFace side="front">
            <div className="flex items-start justify-between gap-4">
              <HalfGlassMark className="h-14 w-auto sm:h-16" />
              <Image
                src="/mark.png"
                alt=""
                width={487}
                height={542}
                className="h-9 w-auto invert opacity-90 sm:h-10"
              />
            </div>
            <div className="mt-auto space-y-2">
              <p className="font-heading text-[1.65rem] leading-none tracking-tight sm:text-[1.85rem]">
                Glass Half Full
              </p>
              <p className="font-mono text-[0.65rem] tracking-[0.18em] text-liquid uppercase sm:text-xs">
                meanjin · creatives · events
              </p>
            </div>
          </CardFace>

          <CardFace side="back">
            <div className="space-y-1">
              <p className="font-heading text-2xl leading-none tracking-tight sm:text-[1.7rem]">
                Vince Lapore
              </p>
              <p className="font-mono text-[0.65rem] tracking-[0.18em] text-liquid uppercase sm:text-xs">
                founder
              </p>
            </div>

            <ul className="mt-auto space-y-1.5 font-mono text-[0.7rem] tracking-wide text-[#f4f1e8]/80 sm:text-xs">
              {CONTACTS.map((row) => (
                <li key={row.label} className="flex gap-3">
                  <span className="w-8 shrink-0 text-liquid/80">{row.label}</span>
                  <span className="min-w-0 truncate">{row.value}</span>
                </li>
              ))}
            </ul>

            <p className="mt-5 font-heading text-sm tracking-tight text-[#f4f1e8]/70 sm:text-[0.95rem]">
              Help us fill the glass.
            </p>
          </CardFace>
        </div>
      </button>

      <p className="mt-5 text-center font-mono text-xs tracking-[0.15em] text-muted-foreground uppercase">
        tap to flip · {flipped ? "back" : "front"}
      </p>
    </div>
  );
}

export function BusinessCardStaticPair() {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <StaticCard label="01 · front">
        <div className="flex items-start justify-between gap-4">
          <HalfGlassMark className="h-12 w-auto" />
          <Image
            src="/mark.png"
            alt=""
            width={487}
            height={542}
            className="h-8 w-auto invert opacity-90"
          />
        </div>
        <div className="mt-auto space-y-2">
          <p className="font-heading text-2xl leading-none tracking-tight">
            Glass Half Full
          </p>
          <p className="font-mono text-[0.65rem] tracking-[0.18em] text-liquid uppercase">
            meanjin · creatives · events
          </p>
        </div>
      </StaticCard>

      <StaticCard label="02 · back">
        <div className="space-y-1">
          <p className="font-heading text-xl leading-none tracking-tight sm:text-2xl">
            Vince Lapore
          </p>
          <p className="font-mono text-[0.65rem] tracking-[0.18em] text-liquid uppercase">
            founder
          </p>
        </div>
        <ul className="mt-auto space-y-1.5 font-mono text-[0.7rem] tracking-wide text-[#f4f1e8]/80">
          {CONTACTS.map((row) => (
            <li key={row.label} className="flex gap-3">
              <span className="w-8 shrink-0 text-liquid/80">{row.label}</span>
              <span className="min-w-0 truncate">{row.value}</span>
            </li>
          ))}
        </ul>
        <p className="mt-4 font-heading text-sm tracking-tight text-[#f4f1e8]/70">
          Help us fill the glass.
        </p>
      </StaticCard>
    </div>
  );
}

function StaticCard({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <figure className="space-y-3">
      <figcaption className="font-mono text-xs tracking-[0.15em] text-muted-foreground uppercase">
        {label}
      </figcaption>
      <div className="relative aspect-[90/55] overflow-hidden rounded-[1.15rem] border border-white/10 bg-[#141418] text-[#f4f1e8] shadow-[0_20px_48px_-16px_rgba(0,0,0,0.45)]">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_55%_at_12%_110%,oklch(0.78_0.15_70_/_0.22),transparent_58%)]"
        />
        <div className="relative flex h-full flex-col p-6">{children}</div>
      </div>
    </figure>
  );
}
