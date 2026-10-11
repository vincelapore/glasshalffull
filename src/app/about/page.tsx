import type { Metadata } from "next";

import { Page, PageHeader, TextLink } from "@/components/ui/page";

export const metadata: Metadata = {
  title: "About",
  description:
    "Humanising Brisbane's events, spotlighting local talent, and building one place to find what's on. Help us fill the glass.",
};

const whatWeDo = [
  {
    title: "Humanise the experience.",
    body: (
      <>
        A name on a flyer doesn&apos;t tell you much on its own, so we
        humanise the experience by showing you the faces behind your beloved
        event during the{" "}
        <TextLink href="/" variant="inline">
          overflow episodes
        </TextLink>
        . During these episodes, we sit down with the organisers, the hosts,
        and the creators of the events you love, to hear why they started,
        what keeps them going, and what actually goes into making the magic
        happen.
      </>
    ),
  },
  {
    title: "Spotlighting local talent.",
    body: (
      <>
        Every episode features artwork and music from{" "}
        <TextLink href="/creatives" variant="inline">
          Brisbane creatives
        </TextLink>
        , because the people that make this city look and sound as good as it
        does should get their moment too!
      </>
    ),
  },
  {
    title: "Centralised database.",
    body: (
      <>
        We&apos;re building one place to find{" "}
        <TextLink href="/events" variant="inline">
          what&apos;s happening in Brisbane
        </TextLink>
        , rather than relying on Instagram&apos;s algorithm to tell you about
        the event of your dream three days after it happened.
      </>
    ),
  },
] as const;

export default function AboutPage() {
  return (
    <Page width="narrow">
      <PageHeader title="About" />
      <div className="max-w-xl space-y-12 text-base leading-relaxed sm:space-y-14">
        <p className="text-foreground/90">
          Brisbane has no shortage of events worth going to, but like your
          least favourite ex, we have commitment issues. We buy the ticket, we
          double-book, and we turn up 2 hours after it started. Organisers are
          left with empty seats, lost deposits, and broken hearts.
        </p>

        <section className="space-y-6 border-t border-border pt-10">
          <h2 className="font-heading text-2xl font-normal tracking-tight">
            What do we do?
          </h2>
          <ol className="space-y-7">
            {whatWeDo.map((item, index) => (
              <li
                key={item.title}
                className="grid grid-cols-[2.5rem_minmax(0,1fr)] gap-x-3 gap-y-1"
              >
                <span
                  aria-hidden
                  className="font-mono text-sm tracking-[0.15em] text-liquid"
                >
                  {String(index + 1).padStart(2, "0")}
                </span>
                <div className="min-w-0 space-y-1.5">
                  <p className="font-medium tracking-tight">{item.title}</p>
                  <p className="text-foreground/85">{item.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <section className="space-y-5 border-t border-border pt-10">
          <h2 className="font-heading text-2xl font-normal tracking-tight">
            So why does this matter?
          </h2>
          <p className="text-foreground/85">
            Well, behind every great night is a team that has poured thousands
            of dollars, hundreds of hours, and an immeasurable amount of love
            into making it happen. But they can only pour so much. The onus is
            on you, the audience: if you want great events, you&apos;ve got to
            be a great participant. By showing up and committing, you&apos;re
            not just another face in the crowd; you&apos;re an active part of
            the scenes you love. It&apos;s time we all pour back in and let
            this glass overflow.
          </p>
        </section>

        <section className="space-y-5 border-t border-border pt-10">
          <h2 className="font-heading text-2xl font-normal tracking-tight">
            Help us fill the glass.
          </h2>
          <p className="text-foreground/85">
            We&apos;re so excited to build this platform, but we can&apos;t
            fill this glass all on our own. Share this website with your
            groupchat, your mum, your situationship, or anyone who&apos;d be
            interested, and help us spread the word!
          </p>
        </section>
      </div>
    </Page>
  );
}
