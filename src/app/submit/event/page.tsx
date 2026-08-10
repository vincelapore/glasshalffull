import type { Metadata } from "next";

import { EventSubmissionForm } from "@/components/forms/event-submission-form";

export const metadata: Metadata = {
  title: "Submit Event",
};

export default function SubmitEventPage() {
  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-12 sm:px-6">
      <div className="mb-8 space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">Submit an Event</h1>
        <p className="text-muted-foreground">
          Share a gig, show, or gathering. Submissions land in review before going
          live on the directory.
        </p>
      </div>
      <EventSubmissionForm />
    </div>
  );
}
