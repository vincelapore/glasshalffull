import type { Metadata } from "next";

import { CalloutComposer } from "@/components/callout/callout-composer";
import { CalloutOwner } from "@/components/callout/callout-owner";
import { Notice } from "@/components/ui/notice";
import {
  Page,
  PageHeader,
  SectionHeader,
  TextLink,
} from "@/components/ui/page";
import {
  exampleCalloutById,
  exampleCalloutInterests,
} from "@/lib/example-callouts";

export const metadata: Metadata = {
  title: "Your callout",
  robots: { index: false, follow: false },
};

export default function YourCalloutPage() {
  const callout = exampleCalloutById("riley-friday");

  if (!callout) return null;

  return (
    <Page width="narrow">
      <PageHeader
        title="Your callout"
        description="Sample inbox for Riley Chen. Open a profile to see their work."
      />

      <Notice className="mb-8">
        Nothing here is saved. Sample profiles open the example page.{" "}
        <TextLink href="/callouts" variant="hover">
          Back to callouts
        </TextLink>
        {" · "}
        <TextLink href="/creatives/example" variant="hover">
          Public page
        </TextLink>
      </Notice>

      <CalloutOwner callout={callout} interests={exampleCalloutInterests} />

      <section className="mt-14 space-y-4 border-t border-border pt-10">
        <SectionHeader
          title="Write one"
          description="One live callout at a time. Shown here as well, so you can try the form. It does not save."
        />
        <CalloutComposer />
      </section>
    </Page>
  );
}
