import type { Metadata } from "next";

type CreativePageProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({
  params,
}: CreativePageProps): Promise<Metadata> {
  const { id } = await params;
  return { title: `Creative ${id}` };
}

export default async function CreativeDetailPage({ params }: CreativePageProps) {
  const { id } = await params;

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6">
      <h1 className="text-3xl font-semibold tracking-tight">Creative Profile</h1>
      <p className="mt-2 text-muted-foreground">
        Profile view for creative <code className="text-foreground">{id}</code> —
        bio, links, and upcoming events coming next.
      </p>
    </div>
  );
}
