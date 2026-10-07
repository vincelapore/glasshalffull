import type { Metadata } from "next";

import { Page, PageHeader } from "@/components/ui/page";

export const metadata: Metadata = {
  title: "About",
};

export default function AboutPage() {
  return (
    <Page width="narrow">
      <PageHeader
        title="About"
        description="Glass Half Full is a discovery hub for the creative scenes of Meanjin and Naarm. Find the night, the people making it, and the collaborators you have been looking for."
      />
    </Page>
  );
}
