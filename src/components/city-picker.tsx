"use client";

import { Check, ChevronDown } from "lucide-react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cityLabels, cityShortLabels, parseCityFilter, type CityFilter } from "@/lib/labels";
import { cities } from "@/lib/validations";

const options: { city: CityFilter; label: string; short: string }[] = [
  ...cities.map((city) => ({
    city,
    label: cityLabels[city],
    short: cityShortLabels[city],
  })),
  { city: "all", label: "All cities", short: "All cities" },
];

function cityHref(pathname: string, search: string, city: CityFilter) {
  const browsing =
    pathname === "/" || pathname === "/events" || pathname === "/creatives";
  const params = new URLSearchParams(browsing ? search : "");
  params.delete("episode");
  if (city === "meanjin") params.delete("city");
  else params.set("city", city);
  const path = browsing ? pathname : "/";
  const query = params.toString();
  return query ? `${path}?${query}` : path;
}

export function CityPicker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const active = parseCityFilter(searchParams.get("city"));
  const current = options.find((option) => option.city === active) ?? options[0];
  const search = searchParams.toString();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={`Showing ${current.short}. Change city`}
        className="inline-flex items-center gap-0.5 font-mono text-xs tracking-wide text-muted-foreground [text-shadow:0_0_12px_var(--background),0_0_4px_var(--background)] outline-none hover:text-foreground focus-visible:text-foreground"
      >
        {current.short}
        <ChevronDown className="size-3 opacity-60" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-48">
        {options.map((option) => (
          <DropdownMenuItem
            key={option.city}
            render={<Link href={cityHref(pathname, search, option.city)} />}
          >
            {option.label}
            {option.city === active ? <Check className="ml-auto size-3.5" /> : null}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
