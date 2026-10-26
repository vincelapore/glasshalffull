"use client";

import { useSearchParams } from "next/navigation";

import { footerAcknowledgements } from "@/lib/acknowledgement";
import { parseCityFilter } from "@/lib/labels";

export function FooterAcknowledgement() {
  const city = parseCityFilter(useSearchParams().get("city"));

  return (
    <p className="text-xs leading-snug text-white/85">
      {footerAcknowledgements[city]}
    </p>
  );
}
