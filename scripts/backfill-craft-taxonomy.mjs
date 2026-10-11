/**
 * Map creatives.craft_categories → disciplines / roles / is_queer.
 *
 * Normal (while craft_categories still exists):
 *   node --env-file=.env.local scripts/backfill-craft-taxonomy.mjs
 *
 * Recovery from Neon time travel (after the column was dropped):
 *   PITR_URL=... node --env-file=.env.local scripts/backfill-craft-taxonomy.mjs --from-pitr
 */
import { neon } from "@neondatabase/serverless";

const map = {
  dj: { disciplines: ["music"], roles: ["dj"] },
  musician: { disciplines: ["music"], roles: ["musician"] },
  producer: { disciplines: ["music"], roles: ["producer"] },
  tattoo: { disciplines: ["tattoo"], roles: ["tattoo_artist"] },
  visual_art: { disciplines: ["visual_art"], roles: [] },
  photography: { disciplines: ["photography"], roles: ["photographer"] },
  fashion: { disciplines: ["fashion"], roles: [] },
  stylist: { disciplines: ["fashion"], roles: ["stylist"] },
  makeup: { disciplines: ["fashion"], roles: ["makeup"] },
  model: { disciplines: ["fashion"], roles: ["model"] },
  dance: { disciplines: ["performance"], roles: ["dancer"] },
  film: { disciplines: ["film"], roles: ["filmmaker"] },
  actor: { disciplines: ["performance"], roles: ["actor"] },
  poetry: { disciplines: ["writing"], roles: ["poet"] },
  writer: { disciplines: ["writing"], roles: ["writer"] },
  design: { disciplines: ["design"], roles: ["designer"] },
  creative_director: { disciplines: ["design"], roles: ["creative_director"] },
  organiser: { disciplines: ["community"], roles: ["organiser"] },
  queer: { disciplines: [], roles: [], isQueer: true },
  other: { disciplines: [], roles: [] },
};

/** Neon HTTP may return enum[] as a JS array or as `{a,b}` text. */
function asList(value) {
  if (Array.isArray(value)) return value;
  if (typeof value !== "string") return [];
  const trimmed = value.trim();
  if (!trimmed || trimmed === "{}") return [];
  if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
    return trimmed
      .slice(1, -1)
      .split(",")
      .map((part) => part.trim().replace(/^"|"$/g, ""))
      .filter(Boolean);
  }
  return [trimmed];
}

function mapped(crafts) {
  const disciplines = new Set();
  const roles = new Set();
  let isQueer = false;

  for (const craft of crafts) {
    const entry = map[craft];
    if (!entry) continue;
    for (const d of entry.disciplines) disciplines.add(d);
    for (const r of entry.roles) roles.add(r);
    if (entry.isQueer) isQueer = true;
  }

  if (disciplines.size === 0) disciplines.add("community");

  return {
    disciplines: [...disciplines],
    roles: [...roles],
    isQueer,
  };
}

const liveUrl = process.env.DATABASE_URL;
if (!liveUrl) {
  console.error("DATABASE_URL is not set");
  process.exit(1);
}

const fromPitr = process.argv.includes("--from-pitr");
const sourceUrl = fromPitr ? process.env.PITR_URL : liveUrl;
if (fromPitr && !sourceUrl) {
  console.error("PITR_URL is required with --from-pitr");
  process.exit(1);
}

const source = neon(sourceUrl);
const live = neon(liveUrl);

const rows = fromPitr
  ? await source`select id, craft_categories from creatives`
  : await source`select id, craft_categories from creatives`;

let updated = 0;
for (const row of rows) {
  const { disciplines, roles, isQueer } = mapped(asList(row.craft_categories));

  await live`
    update creatives
    set
      disciplines = ${disciplines}::discipline[],
      roles = ${roles}::creative_role[],
      is_queer = ${isQueer}
    where id = ${row.id}
  `;
  updated += 1;
}

console.log(
  `Backfilled ${updated} creatives${fromPitr ? " (from PITR craft_categories)" : ""}`
);
