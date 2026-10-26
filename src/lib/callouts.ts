export const calloutKinds = ["portfolio", "trade", "paid"] as const;

export type CalloutKind = (typeof calloutKinds)[number];

export type CalloutRoleChoice =
  (typeof import("@/lib/validations").creativeRoles)[number];

export type CalloutCity = (typeof import("@/lib/validations").cities)[number];

export const MAX_CALLOUT_BODY = 280;

export const MAX_CALLOUT_ROLES = 4;

export const calloutKindLabels: Record<CalloutKind, string> = {
  portfolio: "Portfolio",
  trade: "Trade",
  paid: "Paid",
};

export function calloutDaysLeftLabel(days: number) {
  if (days <= 0) return "Ends today";
  if (days === 1) return "1 day left";
  return `${days} days left`;
}
