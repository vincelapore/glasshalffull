import { mediaUrl } from "@/lib/media";

export function WorkPhotoGrid({
  name,
  keys,
}: {
  name: string;
  keys: readonly string[];
}) {
  const photos = keys.flatMap((key) => {
    const src = mediaUrl(key);
    return src ? [{ key, src }] : [];
  });

  if (photos.length === 0) return null;

  return (
    <section className="mt-14 space-y-4">
      <h2 className="text-xl font-semibold tracking-tight">Work</h2>
      <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3">
        {photos.map((photo, index) => (
          <li
            key={photo.key}
            className="relative aspect-square overflow-hidden rounded-xl bg-muted"
          >
            {/* Plain img, one stored size, lazy. Keeps the gallery off Vercel image optimization. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={photo.src}
              alt={`${name}, work example ${index + 1}`}
              width={1200}
              height={1200}
              loading="lazy"
              decoding="async"
              fetchPriority="low"
              className="absolute inset-0 size-full object-contain"
            />
          </li>
        ))}
      </ul>
    </section>
  );
}
