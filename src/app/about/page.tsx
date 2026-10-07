import type { Metadata } from "next";

import { Page, PageHeader, TextLink } from "@/components/ui/page";

export const metadata: Metadata = {
  title: "About",
  description:
    "Pouring back into Brisbane's creative scene. Stories from the people putting the nights on, and a place to find what's happening.",
};

export default function AboutPage() {
  return (
    <Page width="narrow">
      <PageHeader
        title="About"
        description="Pouring back into Brisbane's creative scene."
      />
      <div className="max-w-xl space-y-5 text-base leading-relaxed">
        <p>
          Brisbane has no shortage of events worth going to, but like your
          least favourite ex, we have commitment issues. We buy the ticket, we
          double-book, and we turn up 2 hours after it started. Organisers are
          left with empty seats, lost deposits, and broken hearts.
        </p>
        <p>
          Glass Half Full is a movement to change that. We show the people
          behind Brisbane&apos;s Black, queer, alt, art, fashion, and music
          scenes, and we sit down with the{" "}
          <TextLink href="/creatives" variant="inline">
            organisers, the hosts, and the creators
          </TextLink>{" "}
          so they can talk about how the night came together, what they&apos;ve
          had to get through, and why they still want to do it.
        </p>
        <p>
          A name on a flyer doesn&apos;t tell you much on its own. We put a
          face to it, so you feel more connected to the event before you even
          walk in.           The interviews and the bits from backstage are on{" "}
          <TextLink href="/" variant="inline">the overflow</TextLink>, and
          that&apos;s how these events get the hype they deserve.
        </p>
        <p>
          We&apos;re also building one place to find{" "}
          <TextLink href="/events" variant="inline">
            what&apos;s happening in Brisbane
          </TextLink>{" "}
          from what you&apos;re into, so you can sort your Friday night in one
          go. Melbourne / Naarm is in those listings too.
        </p>
        <p>
          Behind every great night is a team that has poured thousands of
          dollars, hours, and love into making it happen. Turn up and commit,
          and you&apos;re not just a ticket holder. You&apos;re part of this
          community. It&apos;s time we all pour back in and let this glass
          overflow.
        </p>
      </div>
    </Page>
  );
}
