"use client";

import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import { ChevronLeft, ChevronRight, RefreshCw } from "lucide-react";
import Link from "next/link";
import {
  useEffect,
  useEffectEvent,
  useRef,
  useState,
  type CSSProperties,
} from "react";

import { PersonName } from "@/components/discipline-tag";
import { ExternalImage } from "@/components/media/external-image";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogBackdrop,
  DialogClose,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { resolveCardIcon } from "@/lib/labels";
import { mediaUrl } from "@/lib/media";
import { creativePath } from "@/lib/paths";
import type { WorkMosaicItem } from "@/lib/queries";
import { cn } from "@/lib/utils";

const MAX_SLOTS = 48;
/** Sparse: one random tile swaps occasionally. */
const ROTATE_MS = 14000;
const CROSSFADE_MS = 900;
/** Keep in sync with `.work-wall-reveal` / `.work-wall-conceal` in globals.css. */
const REFRESH_FADE_MS = 480;
/** Ripple step. The wave starts beside the refresh control. */
const REFRESH_STAGGER_MS = 40;
const WAVE_TIMER = -1;

function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function hasFineHover() {
  return window.matchMedia("(hover: hover) and (pointer: fine)").matches;
}

/**
 * Full rectangle only — slot count divisible by every column breakpoint in use.
 * 6 / 8 / 12 → step 24; smaller pools fall back to coarser grids.
 */
function mosaicGeometry(available: number) {
  const n = Math.min(MAX_SLOTS, available);
  if (n >= 24) {
    return {
      count: Math.floor(n / 24) * 24,
      colsClass: "grid-cols-6 sm:grid-cols-8 lg:grid-cols-12",
      colsAt: { base: 6, sm: 8, lg: 12 } as const,
    };
  }
  if (n >= 12) {
    return {
      count: Math.floor(n / 12) * 12,
      colsClass: "grid-cols-6 lg:grid-cols-12",
      colsAt: { base: 6, sm: 6, lg: 12 } as const,
    };
  }
  if (n >= 6) {
    return {
      count: Math.floor(n / 6) * 6,
      colsClass: "grid-cols-6",
      colsAt: { base: 6, sm: 6, lg: 6 } as const,
    };
  }
  return null;
}

function readColumnCount(colsAt: { base: number; sm: number; lg: number }) {
  if (window.matchMedia("(min-width: 1024px)").matches) return colsAt.lg;
  if (window.matchMedia("(min-width: 640px)").matches) return colsAt.sm;
  return colsAt.base;
}

function originFor(index: number, cols: number, total: number) {
  const rows = Math.ceil(total / cols);
  const col = index % cols;
  const row = Math.floor(index / cols);
  const x = col === 0 ? "0%" : col === cols - 1 ? "100%" : "50%";
  const y = row === 0 ? "0%" : row === rows - 1 ? "100%" : "50%";
  return `${x} ${y}`;
}

function waveDelay(index: number, cols: number, total: number) {
  const rows = Math.ceil(total / cols);
  const col = index % cols;
  const row = Math.floor(index / cols);
  return (cols - 1 - col + (rows - 1 - row)) * REFRESH_STAGGER_MS;
}

function shuffleCopy<T>(items: readonly T[]) {
  const next = [...items];
  for (let i = next.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = next[i]!;
    next[i] = next[j]!;
    next[j] = tmp;
  }
  return next;
}

/** Prefer unique creatives for the first visible grid, then fill from the pool. */
function pickSlots(pool: WorkMosaicItem[], count: number) {
  const slots: WorkMosaicItem[] = [];
  const usedSlugs = new Set<string>();

  for (const item of pool) {
    if (slots.length >= count) break;
    if (usedSlugs.has(item.slug)) continue;
    slots.push(item);
    usedSlugs.add(item.slug);
  }

  if (slots.length < count) {
    for (const item of pool) {
      if (slots.length >= count) break;
      if (slots.some((slot) => slot.photoKey === item.photoKey)) continue;
      slots.push(item);
    }
  }

  return slots;
}

function nextUnusedItem(
  pool: WorkMosaicItem[],
  shown: WorkMosaicItem[],
  cursor: number,
) {
  if (pool.length === 0) return { item: null as WorkMosaicItem | null, cursor };
  const shownKeys = new Set(shown.map((item) => item.photoKey));
  for (let i = 0; i < pool.length; i += 1) {
    const index = (cursor + i) % pool.length;
    const candidate = pool[index]!;
    if (!shownKeys.has(candidate.photoKey)) {
      return { item: candidate, cursor: (index + 1) % pool.length };
    }
  }
  const index = cursor % pool.length;
  return { item: pool[index]!, cursor: (index + 1) % pool.length };
}

type SlotState = {
  current: WorkMosaicItem;
  incoming: WorkMosaicItem | null;
  fading: boolean;
  delayMs: number;
  /** Nonzero while this tile is in a refresh wave. */
  waveId: number;
};

function idleSlot(current: WorkMosaicItem): SlotState {
  return { current, incoming: null, fading: false, delayMs: 0, waveId: 0 };
}

function toSlotStates(items: WorkMosaicItem[]): SlotState[] {
  return items.map((current) => idleSlot(current));
}

function WorkMosaicTile({
  slot,
  origin,
  allowScale,
  onOpen,
  onHoverPause,
}: {
  slot: SlotState;
  origin: string;
  allowScale: boolean;
  onOpen: () => void;
  onHoverPause: (paused: boolean) => void;
}) {
  const item = slot.incoming ?? slot.current;
  const [scaled, setScaled] = useState(false);
  const ambientFade = slot.waveId === 0;
  const waveStyle: CSSProperties | undefined = ambientFade
    ? undefined
    : { animationDelay: `${slot.delayMs}ms` };

  const expanded = scaled && allowScale;

  const motionStyle: CSSProperties = {
    transformOrigin: origin,
    transition:
      "transform 520ms var(--ease-out), box-shadow 520ms var(--ease-out), border-radius 520ms var(--ease-out)",
    transform: expanded ? "scale(2.05)" : "scale(1)",
    zIndex: expanded ? 30 : undefined,
  };

  return (
    <button
      type="button"
      onClick={onOpen}
      onMouseEnter={() => {
        onHoverPause(true);
        if (hasFineHover()) setScaled(true);
      }}
      onMouseLeave={() => {
        onHoverPause(false);
        setScaled(false);
      }}
      onFocus={() => {
        onHoverPause(true);
        if (hasFineHover()) setScaled(true);
      }}
      onBlur={() => {
        onHoverPause(false);
        setScaled(false);
      }}
      aria-label={`${item.name}: view profile`}
      style={motionStyle}
      className={cn(
        "relative block aspect-square overflow-hidden bg-muted",
        "ring-1 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
        expanded
          ? "rounded-lg ring-black/10 shadow-xl shadow-black/20 dark:ring-white/15"
          : "rounded-[2px] ring-black/8 dark:ring-white/10",
      )}
    >
      <span
        key={slot.current.photoKey}
        className={cn("absolute inset-0", !ambientFade && "work-wall-conceal")}
        style={waveStyle}
      >
        <ExternalImage
          src={mediaUrl(slot.current.photoKey)}
          alt=""
          className={cn(
            "absolute inset-0 size-full object-cover",
            ambientFade && "transition-opacity duration-[900ms] ease-in-out",
            ambientFade && (slot.fading ? "opacity-0" : "opacity-100"),
          )}
          fallback={<span className="absolute inset-0 bg-muted" />}
        />
      </span>
      {slot.incoming ? (
        <span
          key={slot.incoming.photoKey}
          className={cn(
            "absolute inset-0",
            ambientFade ? undefined : "work-wall-reveal opacity-0",
          )}
          style={waveStyle}
        >
          <ExternalImage
            src={mediaUrl(slot.incoming.photoKey)}
            alt=""
            className={cn(
              "absolute inset-0 size-full object-cover",
              ambientFade && "transition-opacity duration-[900ms] ease-in-out",
              ambientFade && (slot.fading ? "opacity-100" : "opacity-0"),
            )}
            fallback={<span className="absolute inset-0 bg-muted" />}
          />
        </span>
      ) : null}
    </button>
  );
}

function floatingNavButtonClassName() {
  return cn(
    "inline-flex size-11 items-center justify-center rounded-full",
    "border border-border bg-popover text-foreground shadow-lg",
    "transition-[background-color,transform] duration-200",
    "hover:bg-muted active:scale-95",
    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
  );
}

function WorkMosaicPopup({
  item,
  open,
  onOpenChange,
  onBack,
  onForward,
  onRandom,
  canGoBack,
  canGoForward,
  canRandom,
}: {
  item: WorkMosaicItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onBack: () => void;
  onForward: () => void;
  onRandom: () => void;
  canGoBack: boolean;
  canGoForward: boolean;
  canRandom: boolean;
}) {
  useEffect(() => {
    if (!open) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "ArrowLeft" && canGoBack) {
        event.preventDefault();
        onBack();
      }
      if (event.key === "ArrowRight" && canGoForward) {
        event.preventDefault();
        onForward();
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, canGoBack, canGoForward, onBack, onForward]);

  if (!item) return null;

  const icon = resolveCardIcon(item);
  const initial = item.name.slice(0, 1).toUpperCase();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogBackdrop />
        <DialogPrimitive.Popup
          data-slot="dialog-content"
          className={cn(
            "fixed top-1/2 left-1/2 z-50 flex w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-4 border-0 bg-transparent p-0 shadow-none outline-none",
            "transition-[opacity,transform] duration-[250ms] [transition-timing-function:var(--ease-out)]",
            "data-ending-style:scale-[0.96] data-ending-style:opacity-0 data-starting-style:scale-[0.96] data-starting-style:opacity-0",
            "motion-reduce:transition-none motion-reduce:data-ending-style:scale-100 motion-reduce:data-starting-style:scale-100",
          )}
        >
          <div className="w-full overflow-hidden rounded-xl border border-border bg-popover p-5 text-popover-foreground shadow-lg sm:p-6">
            <DialogDescription className="sr-only">
              Profile card for {item.name}. Use arrow keys to browse.
            </DialogDescription>

            <div className="relative">
              <div className="overflow-hidden rounded-lg bg-muted ring-1 ring-black/10 dark:ring-white/15">
                <ExternalImage
                  src={mediaUrl(item.photoKey)}
                  alt=""
                  className="aspect-square w-full object-cover"
                  fallback={<div className="aspect-square w-full bg-muted" />}
                />
              </div>

              <span className="absolute bottom-0 left-1/2 z-10 block size-14 -translate-x-1/2 translate-y-1/2 overflow-hidden rounded-full ring-2 ring-background sm:size-16">
                <ExternalImage
                  src={mediaUrl(item.avatarKey)}
                  alt=""
                  className="size-full object-cover"
                  fallback={
                    <span className="flex size-full items-center justify-center bg-neutral-800 text-sm font-medium text-white">
                      {initial}
                    </span>
                  }
                />
              </span>
            </div>

            <div className="mt-9 text-center sm:mt-10">
              <DialogTitle className="text-center text-xl font-medium tracking-tight sm:text-2xl">
                <PersonName name={item.name} icon={icon} />
              </DialogTitle>
            </div>

            <div className="mt-5 flex gap-2">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                nativeButton
                render={<DialogClose />}
              >
                Close
              </Button>
              <Button
                className="flex-1"
                nativeButton={false}
                render={
                  <Link href={creativePath(item.slug)} prefetch={false} />
                }
              >
                View profile
              </Button>
            </div>
          </div>

          {canGoBack || canGoForward || canRandom ? (
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onBack}
                disabled={!canGoBack}
                aria-label="Back to previous profile"
                className={cn(
                  floatingNavButtonClassName(),
                  !canGoBack && "pointer-events-none opacity-40",
                )}
              >
                <ChevronLeft className="size-5" aria-hidden />
              </button>
              <button
                type="button"
                onClick={onRandom}
                disabled={!canRandom}
                aria-label="Random profile"
                className={cn(
                  floatingNavButtonClassName(),
                  !canRandom && "pointer-events-none opacity-40",
                )}
              >
                <RefreshCw className="size-4" aria-hidden />
              </button>
              <button
                type="button"
                onClick={onForward}
                disabled={!canGoForward}
                aria-label="Forward to next profile"
                className={cn(
                  floatingNavButtonClassName(),
                  !canGoForward && "pointer-events-none opacity-40",
                )}
              >
                <ChevronRight className="size-5" aria-hidden />
              </button>
            </div>
          ) : null}
        </DialogPrimitive.Popup>
      </DialogPrimitive.Portal>
    </Dialog>
  );
}

export function WorkMosaic({ items }: { items: WorkMosaicItem[] }) {
  const geometry = mosaicGeometry(items.length);
  const rootRef = useRef<HTMLElement>(null);
  const cursorRef = useRef(0);
  const hoveredSlots = useRef(new Set<number>());
  const fadeTimers = useRef(new Map<number, number>());
  const fadeRafs = useRef(new Set<number>());
  const slotsRef = useRef<SlotState[]>([]);
  const waveSeq = useRef(0);
  const [refreshTurn, setRefreshTurn] = useState(0);
  const [inView, setInView] = useState(false);
  const [pageVisible, setPageVisible] = useState(true);
  const [reduceMotion, setReduceMotion] = useState(false);
  const [finePointer, setFinePointer] = useState(false);
  const [cols, setCols] = useState<number>(geometry?.colsAt.base ?? 6);
  /** Browser-style viewing history of pool indices. */
  const [history, setHistory] = useState<{
    stack: number[];
    index: number;
  } | null>(null);
  const [slots, setSlots] = useState<SlotState[]>(() => {
    if (!geometry) return [];
    const initial = toSlotStates(pickSlots(items, geometry.count));
    slotsRef.current = initial;
    return initial;
  });

  slotsRef.current = slots;
  const selectedPoolIndex =
    history !== null ? (history.stack[history.index] ?? null) : null;
  const selected =
    selectedPoolIndex !== null ? (items[selectedPoolIndex] ?? null) : null;
  const popupOpen = selected !== null;
  const canGoBack = history !== null && history.index > 0;
  const canGoForward =
    history !== null && history.index < history.stack.length - 1;
  const canRandom = items.length > 1;
  const allowScale = finePointer && !reduceMotion;

  function openAtPoolIndex(poolIndex: number) {
    setHistory({ stack: [poolIndex], index: 0 });
  }

  function pushPoolIndex(poolIndex: number) {
    setHistory((current) => {
      if (!current) return { stack: [poolIndex], index: 0 };
      const stack = [...current.stack.slice(0, current.index + 1), poolIndex];
      return { stack, index: stack.length - 1 };
    });
  }

  const goBack = useEffectEvent(() => {
    setHistory((current) => {
      if (!current || current.index <= 0) return current;
      return { ...current, index: current.index - 1 };
    });
  });

  const goForward = useEffectEvent(() => {
    setHistory((current) => {
      if (!current || current.index >= current.stack.length - 1) {
        return current;
      }
      return { ...current, index: current.index + 1 };
    });
  });

  const goRandom = useEffectEvent(() => {
    if (items.length === 0) return;
    if (items.length === 1) {
      openAtPoolIndex(0);
      return;
    }
    const currentIndex = history?.stack[history.index] ?? null;
    let next = Math.floor(Math.random() * items.length);
    let guard = 0;
    while (next === currentIndex && guard < 12) {
      next = Math.floor(Math.random() * items.length);
      guard += 1;
    }
    pushPoolIndex(next);
  });

  const rotateOneSlot = useEffectEvent(() => {
    if (popupOpen) return;
    if (hoveredSlots.current.size > 0) return;
    if (prefersReducedMotion()) return;
    if (fadeTimers.current.size > 0) return;

    const prev = slotsRef.current;
    if (prev.length === 0) return;

    const candidates = prev
      .map((_, index) => index)
      .filter((index) => !hoveredSlots.current.has(index));
    if (candidates.length === 0) return;

    const slotIndex =
      candidates[Math.floor(Math.random() * candidates.length)]!;
    const target = prev[slotIndex]!;
    if (target.fading || target.incoming) return;

    const shown = prev.map((slot) => slot.incoming ?? slot.current);
    const { item, cursor } = nextUnusedItem(items, shown, cursorRef.current);
    cursorRef.current = cursor;
    if (!item || item.photoKey === target.current.photoKey) return;

    const withIncoming = prev.map((slot, index) =>
      index === slotIndex
        ? {
            current: slot.current,
            incoming: item,
            fading: false,
            delayMs: 0,
            waveId: 0,
          }
        : slot,
    );
    slotsRef.current = withIncoming;
    setSlots(withIncoming);

    const rafId = window.requestAnimationFrame(() => {
      fadeRafs.current.delete(rafId);
      setSlots((current) => {
        if (!current[slotIndex]?.incoming) return current;
        if (current[slotIndex]?.waveId) return current;
        const fading = current.map((slot, index) =>
          index === slotIndex ? { ...slot, fading: true } : slot,
        );
        slotsRef.current = fading;
        return fading;
      });
    });
    fadeRafs.current.add(rafId);

    const commitId = window.setTimeout(() => {
      fadeTimers.current.delete(slotIndex);
      setSlots((current) => {
        const committed = current.map((slot, index) =>
          index === slotIndex && slot.incoming ? idleSlot(slot.incoming) : slot,
        );
        slotsRef.current = committed;
        return committed;
      });
    }, CROSSFADE_MS + 32);

    fadeTimers.current.set(slotIndex, commitId);
  });

  function refreshWall() {
    if (!geometry) return;
    for (const id of fadeTimers.current.values()) {
      window.clearTimeout(id);
    }
    fadeTimers.current.clear();
    for (const id of fadeRafs.current) {
      window.cancelAnimationFrame(id);
    }
    fadeRafs.current.clear();
    cursorRef.current = 0;

    const nextItems = pickSlots(shuffleCopy(items), geometry.count);
    if (reduceMotion || prefersReducedMotion()) {
      const next = toSlotStates(nextItems);
      slotsRef.current = next;
      setSlots(next);
      return;
    }

    setRefreshTurn((turn) => turn + 1);
    const waveId = ++waveSeq.current;
    const base = slotsRef.current.map((slot) => slot.incoming ?? slot.current);
    let maxDelay = 0;
    const primed = base.map((current, index) => {
      const next = nextItems[index] ?? current;
      if (next.photoKey === current.photoKey) return idleSlot(current);
      const delayMs = waveDelay(index, cols, base.length);
      if (delayMs > maxDelay) maxDelay = delayMs;
      return {
        current,
        incoming: next,
        fading: false,
        delayMs,
        waveId,
      };
    });
    slotsRef.current = primed;
    setSlots(primed);

    const commitId = window.setTimeout(
      () => {
        fadeTimers.current.delete(WAVE_TIMER);
        if (waveSeq.current !== waveId) return;
        setSlots((current) => {
          const committed = current.map((slot) =>
            slot.waveId === waveId && slot.incoming
              ? idleSlot(slot.incoming)
              : slot,
          );
          slotsRef.current = committed;
          return committed;
        });
      },
      maxDelay + REFRESH_FADE_MS + 48,
    );
    fadeTimers.current.set(WAVE_TIMER, commitId);
  }

  useEffect(() => {
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const pointer = window.matchMedia("(hover: hover) and (pointer: fine)");
    const updateMotion = () => setReduceMotion(motion.matches);
    const updatePointer = () => setFinePointer(pointer.matches);
    updateMotion();
    updatePointer();
    motion.addEventListener("change", updateMotion);
    pointer.addEventListener("change", updatePointer);
    return () => {
      motion.removeEventListener("change", updateMotion);
      pointer.removeEventListener("change", updatePointer);
    };
  }, []);

  useEffect(() => {
    if (!geometry) return;
    const colsAt = geometry.colsAt;
    const update = () => setCols(readColumnCount(colsAt));
    update();
    const sm = window.matchMedia("(min-width: 640px)");
    const lg = window.matchMedia("(min-width: 1024px)");
    sm.addEventListener("change", update);
    lg.addEventListener("change", update);
    return () => {
      sm.removeEventListener("change", update);
      lg.removeEventListener("change", update);
    };
  }, [geometry?.colsAt.base, geometry?.colsAt.sm, geometry?.colsAt.lg]);

  useEffect(() => {
    const node = rootRef.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      { threshold: 0.15 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const onChange = () =>
      setPageVisible(document.visibilityState === "visible");
    document.addEventListener("visibilitychange", onChange);
    return () => document.removeEventListener("visibilitychange", onChange);
  }, []);

  useEffect(() => {
    return () => {
      for (const id of fadeTimers.current.values()) {
        window.clearTimeout(id);
      }
      fadeTimers.current.clear();
      for (const id of fadeRafs.current) {
        window.cancelAnimationFrame(id);
      }
      fadeRafs.current.clear();
    };
  }, []);

  useEffect(() => {
    if (popupOpen) return;
    if (reduceMotion || !inView || !pageVisible || slots.length < 2) return;
    if (items.length <= slots.length) return;

    const intervalId = window.setInterval(rotateOneSlot, ROTATE_MS);
    return () => window.clearInterval(intervalId);
  }, [
    popupOpen,
    reduceMotion,
    inView,
    pageVisible,
    slots.length,
    items.length,
  ]);

  if (!geometry || slots.length === 0) return null;

  return (
    <section
      ref={rootRef}
      className="-my-2 overflow-visible py-2 sm:-my-4 sm:py-3"
    >
      <div className={cn("grid gap-0.5 sm:gap-1", geometry.colsClass)}>
        {slots.map((slot, index) => (
          <WorkMosaicTile
            key={index}
            slot={slot}
            origin={originFor(index, cols, slots.length)}
            allowScale={allowScale}
            onOpen={() => {
              const item = slot.incoming ?? slot.current;
              const poolIndex = items.findIndex(
                (entry) => entry.photoKey === item.photoKey,
              );
              openAtPoolIndex(poolIndex >= 0 ? poolIndex : 0);
            }}
            onHoverPause={(paused) => {
              if (paused) hoveredSlots.current.add(index);
              else hoveredSlots.current.delete(index);
            }}
          />
        ))}
      </div>

      <div className="mt-2 flex justify-end">
        <button
          type="button"
          onClick={refreshWall}
          aria-label="Refresh work wall"
          className={cn(
            "inline-flex items-center gap-1",
            "font-mono text-[10px] tracking-wide text-muted-foreground uppercase",
            "opacity-50 transition-opacity hover:opacity-100",
            "focus-visible:opacity-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
          )}
        >
          <RefreshCw
            className="size-3 motion-reduce:transition-none"
            aria-hidden
            style={
              reduceMotion
                ? undefined
                : {
                    transform: `rotate(${refreshTurn * 360}deg)`,
                    transition: "transform 240ms var(--ease-out)",
                  }
            }
          />
          Refresh
        </button>
      </div>

      <WorkMosaicPopup
        item={selected}
        open={popupOpen}
        canGoBack={canGoBack}
        canGoForward={canGoForward}
        canRandom={canRandom}
        onBack={goBack}
        onForward={goForward}
        onRandom={goRandom}
        onOpenChange={(open) => {
          if (!open) setHistory(null);
        }}
      />
    </section>
  );
}
