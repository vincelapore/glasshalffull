"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogDescription,
  DialogPopup,
  DialogTitle,
} from "@/components/ui/dialog";
import { exportAvatarCrop } from "@/lib/upload-photo";
import { cn } from "@/lib/utils";

const MIN_ZOOM = 1;
const MAX_ZOOM = 3;

type AvatarCropDialogProps = {
  open: boolean;
  src: string | null;
  onCancel: () => void;
  onConfirm: (file: File) => void;
  title?: string;
  description?: string;
  popupClassName?: string;
  exportCrop?: (
    image: CanvasImageSource,
    source: { sx: number; sy: number; size: number }
  ) => Promise<File>;
};

type Point = { x: number; y: number };

function clampZoom(zoom: number) {
  return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, zoom));
}

function coverLayout(
  imageWidth: number,
  imageHeight: number,
  frame: number,
  zoom: number,
  pan: Point
) {
  const displayWidth = imageWidth * (frame / Math.min(imageWidth, imageHeight)) * zoom;
  const displayHeight =
    imageHeight * (frame / Math.min(imageWidth, imageHeight)) * zoom;
  const x = Math.min(0, Math.max(frame - displayWidth, (frame - displayWidth) / 2 + pan.x));
  const y = Math.min(
    0,
    Math.max(frame - displayHeight, (frame - displayHeight) / 2 + pan.y)
  );
  return { displayWidth, displayHeight, x, y };
}

export function AvatarCropDialog({
  open,
  src,
  onCancel,
  onConfirm,
  title = "Crop profile photo",
  description = "Drag to reposition. This square is what people see on your profile. Round avatars use the middle.",
  popupClassName,
  exportCrop = exportAvatarCrop,
}: AvatarCropDialogProps) {
  const imageRef = useRef<HTMLImageElement>(null);
  const pointers = useRef(new Map<number, Point>());
  const pinch = useRef<{ distance: number; zoom: number } | null>(null);
  const [frameNode, setFrameNode] = useState<HTMLDivElement | null>(null);
  const [frameSize, setFrameSize] = useState(0);
  const [intrinsic, setIntrinsic] = useState<{ width: number; height: number } | null>(
    null
  );
  const [zoom, setZoom] = useState(MIN_ZOOM);
  const [pan, setPan] = useState<Point>({ x: 0, y: 0 });
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const rememberImage = useCallback((node: HTMLImageElement | null) => {
    imageRef.current = node;
    if (node?.complete && node.naturalWidth > 0) {
      setIntrinsic({ width: node.naturalWidth, height: node.naturalHeight });
    }
  }, []);

  useEffect(() => {
    setZoom(MIN_ZOOM);
    setPan({ x: 0, y: 0 });
    setError(null);
    setExporting(false);
    const image = imageRef.current;
    if (image?.complete && image.naturalWidth > 0) {
      setIntrinsic({ width: image.naturalWidth, height: image.naturalHeight });
    } else {
      setIntrinsic(null);
    }
  }, [src]);

  useEffect(() => {
    if (!frameNode || !open) return;
    const update = () => setFrameSize(frameNode.clientWidth);
    update();
    const observer = new ResizeObserver(update);
    observer.observe(frameNode);
    return () => observer.disconnect();
  }, [frameNode, open]);

  useEffect(() => {
    if (!frameNode || !open) return;
    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      const delta = event.deltaY > 0 ? -0.08 : 0.08;
      setZoom((current) => clampZoom(current + delta));
    };
    frameNode.addEventListener("wheel", onWheel, { passive: false });
    return () => frameNode.removeEventListener("wheel", onWheel);
  }, [frameNode, open]);

  const layout =
    intrinsic && frameSize > 0
      ? coverLayout(intrinsic.width, intrinsic.height, frameSize, zoom, pan)
      : null;

  function handleOpenChange(next: boolean) {
    if (exporting) return;
    if (!next) onCancel();
  }

  function onPointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    try {
      event.currentTarget.setPointerCapture(event.pointerId);
    } catch {
      // Capture is skipped when the pointer is already gone. Moves still pan.
    }
    pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (pointers.current.size === 2) {
      const [first, second] = [...pointers.current.values()];
      pinch.current = {
        distance: Math.hypot(first.x - second.x, first.y - second.y),
        zoom,
      };
    }
  }

  function onPointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    const previous = pointers.current.get(event.pointerId);
    if (!previous) return;
    const next = { x: event.clientX, y: event.clientY };
    pointers.current.set(event.pointerId, next);

    if (pointers.current.size >= 2 && pinch.current && pinch.current.distance > 0) {
      const [first, second] = [...pointers.current.values()];
      const distance = Math.hypot(first.x - second.x, first.y - second.y);
      setZoom(clampZoom(pinch.current.zoom * (distance / pinch.current.distance)));
      return;
    }

    const dx = next.x - previous.x;
    const dy = next.y - previous.y;
    setPan((current) => ({ x: current.x + dx, y: current.y + dy }));
  }

  function onPointerUp(event: ReactPointerEvent<HTMLDivElement>) {
    pointers.current.delete(event.pointerId);
    pinch.current = null;
    try {
      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId);
      }
    } catch {
      // The pointer was already released.
    }
  }

  async function confirm() {
    const image = imageRef.current;
    if (!image || !layout || frameSize <= 0 || exporting) return;
    setExporting(true);
    setError(null);
    try {
      const scale = image.naturalWidth / layout.displayWidth;
      const file = await exportCrop(image, {
        sx: -layout.x * scale,
        sy: -layout.y * scale,
        size: frameSize * scale,
      });
      onConfirm(file);
    } catch (cropError) {
      console.error(cropError);
      setError("Could not crop that photo. Try another file.");
      setExporting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogPopup
        className={cn(
          "max-h-[calc(100dvh-2rem)] max-w-sm overflow-y-auto",
          popupClassName
        )}
      >
        <DialogTitle>{title}</DialogTitle>
        <DialogDescription className="mt-1">{description}</DialogDescription>

        <div
          ref={setFrameNode}
          role="application"
          aria-label="Profile photo crop. Drag to reposition."
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          className="relative mt-4 aspect-square w-full cursor-grab touch-none overflow-hidden rounded-2xl bg-muted active:cursor-grabbing"
        >
          {src ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              ref={rememberImage}
              src={src}
              alt=""
              draggable={false}
              onLoad={(event) => {
                const img = event.currentTarget;
                setIntrinsic({ width: img.naturalWidth, height: img.naturalHeight });
              }}
              className="pointer-events-none absolute max-w-none select-none"
              style={
                layout
                  ? {
                      width: layout.displayWidth,
                      height: layout.displayHeight,
                      left: layout.x,
                      top: layout.y,
                    }
                  : { visibility: "hidden" }
              }
            />
          ) : null}
        </div>

        <label className="mt-4 flex items-center gap-3 text-sm">
          <span className="shrink-0 text-muted-foreground">Zoom</span>
          <input
            type="range"
            min={MIN_ZOOM}
            max={MAX_ZOOM}
            step={0.01}
            value={zoom}
            aria-label="Zoom"
            disabled={exporting}
            onChange={(event) => setZoom(clampZoom(Number(event.target.value)))}
            className="w-full accent-foreground"
          />
        </label>

        {error ? <p className="mt-3 text-sm text-destructive">{error}</p> : null}

        <div className="mt-6 flex flex-wrap justify-end gap-2">
          <Button type="button" variant="outline" disabled={exporting} onClick={onCancel}>
            Cancel
          </Button>
          <Button type="button" disabled={!layout || exporting} onClick={confirm}>
            {exporting ? "Cropping…" : "Use photo"}
          </Button>
        </div>
      </DialogPopup>
    </Dialog>
  );
}
