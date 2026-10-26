import type { CityFilter } from "@/lib/labels";

const closing =
  "We pay our respects to the original owners of this land and their legacy.";

/** Footer acknowledgement for the city in `?city=`. `all` stays general. */
export const footerAcknowledgements: Record<CityFilter, string> = {
  meanjin: `Glass Half Full operates on the unceded lands of the Yugera and Turrbal peoples of Meanjin. ${closing}`,
  naarm: `Glass Half Full operates on the unceded lands of the Wurundjeri and Boon Wurrung peoples of the Kulin Nation in Naarm. ${closing}`,
  tarntanya: `Glass Half Full operates on the unceded lands of the Kaurna people of Tarntanya. ${closing}`,
  boorloo: `Glass Half Full operates on the unceded lands of the Whadjuk Noongar people of Boorloo. ${closing}`,
  all: "Glass Half Full works on unceded Aboriginal lands. Wherever we gather, we pay our respects to the Traditional Custodians of that Country, to Elders past and present, and to their continuing connection to land, waters, and community.",
};
