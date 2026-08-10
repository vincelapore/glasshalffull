import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Submit Event",
};

export default function SubmitEventPage() {
  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-12 sm:px-6">
      <h1 className="text-3xl font-semibold tracking-tight">Submit an Event</h1>
      <p className="mt-2 text-muted-foreground">
        Event submission form with Uploadthing flyer dropzone — coming next.
      </p>
    </div>
  );
}
