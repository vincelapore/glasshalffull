import type { Metadata } from "next";

import { EmptyState, Page, PageHeader } from "@/components/ui/page";

export const metadata: Metadata = {
  title: "Blog",
};

export default function BlogPage() {
  return (
    <Page width="narrow">
      <PageHeader
        title="Blog"
        description="Notes from the scene."
      />
      <EmptyState>Nothing published yet.</EmptyState>
    </Page>
  );
}
