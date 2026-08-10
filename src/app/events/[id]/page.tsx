import type { Metadata } from "next";

type EventPageProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({
  params,
}: EventPageProps): Promise<Metadata> {
  const { id } = await params;
  return { title: `Event ${id}` };
}

export default async function EventDetailPage({ params }: EventPageProps) {
  const { id } = await params;

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6">
      <h1 className="text-3xl font-semibold tracking-tight">Event Details</h1>
      <p className="mt-2 text-muted-foreground">
        Detail view for event <code className="text-foreground">{id}</code> —
        flyer, description, and linked creatives coming next.
      </p>
    </div>
  );
}
