import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Creatives",
};

export default function CreativesPage() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6">
      <h1 className="text-3xl font-semibold tracking-tight">Creatives</h1>
      <p className="mt-2 text-muted-foreground">
        Filterable creative directory placeholder — UI coming next.
      </p>
    </div>
  );
}
