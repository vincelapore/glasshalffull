import type { Metadata } from "next";
import Link from "next/link";

import { ProfileCallout } from "@/components/callout/profile-callout";
import { FilterChip } from "@/components/ui/filter-chip";
import {
  ChipRow,
  EmptyState,
  Page,
  PageHeader,
  Section,
  TextLink,
} from "@/components/ui/page";
import { Button } from "@/components/ui/button";
import { Notice } from "@/components/ui/notice";
import {
  calloutKindLabels,
  calloutKinds,
  type CalloutCity,
  type CalloutKind,
  type CalloutRoleChoice,
} from "@/lib/callouts";
import { exampleCallouts } from "@/lib/example-callouts";
import { cityLabels, roleLabels } from "@/lib/labels";
import { cities, creativeRoles } from "@/lib/validations";

export const metadata: Metadata = {
  title: "Callouts",
  robots: { index: false, follow: false },
};

type SearchParams = Promise<{
  city?: string;
  role?: string;
  kind?: string;
}>;

function buildHref(options: {
  city?: CalloutCity | "all" | null;
  role?: CalloutRoleChoice | null;
  kind?: CalloutKind | null;
}) {
  const params = new URLSearchParams();

  if (options.city && options.city !== "all") {
    params.set("city", options.city);
  }
  if (options.role) params.set("role", options.role);
  if (options.kind) params.set("kind", options.kind);

  const query = params.toString();
  return query ? `/callouts?${query}` : "/callouts";
}

export default async function CalloutsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { city, role, kind } = await searchParams;
  const activeCity =
    city && cities.includes(city as CalloutCity) ? (city as CalloutCity) : "all";
  const activeRole =
    role && creativeRoles.includes(role as CalloutRoleChoice)
      ? (role as CalloutRoleChoice)
      : null;
  const activeKind =
    kind && calloutKinds.includes(kind as CalloutKind)
      ? (kind as CalloutKind)
      : null;

  const rolesInUse = creativeRoles.filter((item) =>
    exampleCallouts.some((callout) =>
      callout.roles.some((slot) => slot.role === item),
    ),
  );

  const callouts = exampleCallouts.filter((callout) => {
    if (activeCity !== "all" && callout.poster.city !== activeCity) return false;
    if (activeRole && !callout.roles.some((slot) => slot.role === activeRole)) {
      return false;
    }
    if (activeKind && !callout.roles.some((slot) => slot.kind === activeKind)) {
      return false;
    }
    return true;
  });

  return (
    <Page width="narrow">
      <PageHeader
        title="Callouts"
        description="What people need this week. Each one lasts seven days."
        actions={
          <Button
            variant="outline"
            size="sm"
            render={<Link href="/callouts/yours" />}
          >
            Your callout
          </Button>
        }
      />

      <Notice className="mb-8">
        Sample callouts, so you can click through. Raising a hand is kept in
        this browser only.{" "}
        <TextLink href="/creatives/example" variant="hover">
          Riley’s profile
        </TextLink>{" "}
        shows the same callout at the top of the page.{" "}
        <TextLink href="/callouts/yours" variant="hover">
          Your callout
        </TextLink>{" "}
        is the poster’s list of people.
      </Notice>

      <Section label="City">
        <ChipRow>
          <FilterChip
            href={buildHref({ city: "all", role: activeRole, kind: activeKind })}
            active={activeCity === "all"}
          >
            All
          </FilterChip>
          {cities.map((cityOption) => (
            <FilterChip
              key={cityOption}
              href={buildHref({
                city: cityOption,
                role: activeRole,
                kind: activeKind,
              })}
              active={activeCity === cityOption}
            >
              {cityLabels[cityOption]}
            </FilterChip>
          ))}
        </ChipRow>
      </Section>

      <Section label="Role">
        <ChipRow>
          <FilterChip
            href={buildHref({ city: activeCity, role: null, kind: activeKind })}
            active={!activeRole}
          >
            All
          </FilterChip>
          {rolesInUse.map((item) => (
            <FilterChip
              key={item}
              href={buildHref({
                city: activeCity,
                role: item,
                kind: activeKind,
              })}
              active={activeRole === item}
            >
              {roleLabels[item]}
            </FilterChip>
          ))}
        </ChipRow>
      </Section>

      <Section label="Terms" className="mb-8">
        <ChipRow>
          <FilterChip
            href={buildHref({ city: activeCity, role: activeRole, kind: null })}
            active={!activeKind}
          >
            All
          </FilterChip>
          {calloutKinds.map((item) => (
            <FilterChip
              key={item}
              href={buildHref({
                city: activeCity,
                role: activeRole,
                kind: item,
              })}
              active={activeKind === item}
            >
              {calloutKindLabels[item]}
            </FilterChip>
          ))}
        </ChipRow>
      </Section>

      {callouts.length === 0 ? (
        <EmptyState>
          Nothing live for that. Callouts drop off after a week, so the list
          stays short.
        </EmptyState>
      ) : (
        <ul className="divide-y divide-border">
          {callouts.map((callout) => (
            <li key={callout.id} className="py-8 first:pt-0">
              <ProfileCallout callout={callout} showPoster />
            </li>
          ))}
        </ul>
      )}
    </Page>
  );
}
