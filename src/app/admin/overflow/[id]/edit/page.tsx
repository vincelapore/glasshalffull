import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import {
  DeleteOverflowEpisodeButton,
  OverflowEpisodeForm,
} from "@/components/forms/overflow-episode-form";
import { Button } from "@/components/ui/button";
import { Page, PageHeader } from "@/components/ui/page";
import { requireAdmin } from "@/lib/admin";
import { getOverflowEpisodeById } from "@/lib/queries";

export const metadata: Metadata = {
  title: "Edit episode",
};

export const dynamic = "force-dynamic";

type EditOverflowPageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditOverflowEpisodePage({
  params,
}: EditOverflowPageProps) {
  await requireAdmin();
  const { id } = await params;
  const episode = await getOverflowEpisodeById(id);

  if (!episode) notFound();

  return (
    <Page width="narrow">
      <PageHeader
        title={episode.title}
        description={`the overflow #${episode.number}`}
        actions={
          <>
            <DeleteOverflowEpisodeButton id={episode.id} label={episode.title} />
            <Button
              size="sm"
              variant="outline"
              render={<Link href="/admin/overflow" />}
            >
              Back
            </Button>
          </>
        }
      />
      <OverflowEpisodeForm
        mode="edit"
        episodeId={episode.id}
        eventTitle={episode.event?.title ?? null}
        featureNames={Object.fromEntries(
          episode.features.map((feature) => [feature.creativeId, feature.name])
        )}
        defaultValues={{
          title: episode.title,
          number: episode.number,
          city: episode.city,
          coverKey: episode.coverKey,
          body: episode.body,
          eventId: episode.event?.id ?? "",
          features: episode.features.map((feature) => ({
            creativeId: feature.creativeId,
            role: feature.role,
            note: feature.note ?? "",
          })),
        }}
      />
    </Page>
  );
}
