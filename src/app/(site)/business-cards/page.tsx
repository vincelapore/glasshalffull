import type { Metadata } from "next";

import {
  BusinessCardMock,
  BusinessCardStaticPair,
} from "@/components/business-card-mock";
import { Eyebrow, Page, PageHeader } from "@/components/ui/page";

export const metadata: Metadata = {
  title: "Business cards",
  description:
    "Print mock for Glass Half Full business cards — dark stock, liquid amber, BioRhyme + Syne Mono.",
  robots: { index: false, follow: false },
};

export default function BusinessCardsPage() {
  return (
    <Page width="wide" className="pb-20">
      <PageHeader
        eyebrow="print mock"
        eyebrowSize="brand"
        title="Business cards"
        description="Nighttime stock, liquid amber, one job per side. Front is the brand; back is the person."
        descriptionClassName="max-w-xl"
      />

      <section className="flex min-h-[min(70vh,36rem)] flex-col justify-center py-6 sm:py-10">
        <BusinessCardMock />
      </section>

      <section className="mt-8 space-y-6 border-t border-border pt-12">
        <div className="space-y-2">
          <Eyebrow tone="liquid">flat views</Eyebrow>
          <h2 className="font-heading text-2xl font-normal tracking-tight">
            Front and back
          </h2>
          <p className="max-w-xl text-sm text-muted-foreground">
            90×55mm proportion. Soft-touch charcoal with amber foil on the
            liquid fill if you print. No QR wall, no feature list.
          </p>
        </div>
        <BusinessCardStaticPair />
      </section>

      <section className="mt-14 grid gap-8 border-t border-border pt-12 sm:grid-cols-3">
        {[
          {
            k: "type",
            v: "BioRhyme wordmark · Syne Mono for contacts & roles",
          },
          {
            k: "colour",
            v: "Charcoal #141418 · warm ivory type · liquid amber only",
          },
          {
            k: "finish",
            v: "Matte soft-touch · optional spot gloss / amber foil on liquid",
          },
        ].map((row) => (
          <div key={row.k} className="space-y-2">
            <Eyebrow>{row.k}</Eyebrow>
            <p className="text-sm leading-relaxed text-foreground/85">{row.v}</p>
          </div>
        ))}
      </section>
    </Page>
  );
}
