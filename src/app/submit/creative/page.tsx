import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Submit Profile",
};

export default function SubmitCreativePage() {
  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-12 sm:px-6">
      <h1 className="text-3xl font-semibold tracking-tight">
        Submit a Creative Profile
      </h1>
      <p className="mt-2 text-muted-foreground">
        Creative profile form with Uploadthing avatar dropzone — coming next.
      </p>
    </div>
  );
}
