import type { Metadata } from "next";

import { CreativeSubmissionForm } from "@/components/forms/creative-submission-form";

export const metadata: Metadata = {
  title: "Submit Profile",
};

export default function SubmitCreativePage() {
  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-12 sm:px-6">
      <div className="mb-8 space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">
          Submit a Creative Profile
        </h1>
        <p className="text-muted-foreground">
          Tell the scene who you are. Profiles are reviewed before they appear in
          the directory.
        </p>
      </div>
      <CreativeSubmissionForm />
    </div>
  );
}
