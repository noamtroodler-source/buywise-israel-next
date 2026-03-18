/**
 * Personalized "What this means" insight templates for apartment size pricing.
 * Each function receives live room-size metrics and returns a conversational narrative.
 */

export interface RoomSizeInsightMetrics {
  room3Price: number | null;
  room4Price: number | null;
  room5Price: number | null;
  room3YoY: number | null;
  room4YoY: number | null;
  room5YoY: number | null;
  gapSmallToLarge: number | null; // ₪ difference between cheapest and priciest available
}

function fmt(value: number): string {
  if (value >= 1_000_000) return `₪${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `₪${(value / 1_000).toFixed(0)}K`;
  return `₪${value.toLocaleString()}`;
}

function fmtGap(value: number): string {
  if (value >= 1_000_000) return `₪${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 100_000) return `₪${(value / 1_000).toFixed(0)}K`;
  return `₪${value.toLocaleString()}`;
}

type RoomInsightFn = (m: RoomSizeInsightMetrics) => string;

const CITY_ROOM_SIZE_INSIGHTS: Record<string, RoomInsightFn> = {
  'tel-aviv': (m) =>
    `The jump from a 3-room to a 5-room in Tel Aviv is roughly ${m.gapSmallToLarge ? fmtGap(m.gapSmallToLarge) : 'significant'} — one of the steepest size premiums in Israel. ` +
    (m.room3Price ? `If you're flexible on size, a 3-room at around ${fmt(m.room3Price)} is the most realistic entry point. ` : '') +
    `Upsizing later through TAMA 38 or renovation is a strategy many buyers here use.`,

  'jerusalem': (m) =>
    `Jerusalem's apartment sizes tell a story of demand segmentation. ` +
    (m.room4Price ? `The 4-room at ${fmt(m.room4Price)} is the workhorse of the market — it's what most families target. ` : '') +
    (m.gapSmallToLarge ? `The ${fmtGap(m.gapSmallToLarge)} gap between smallest and largest reflects just how much space costs in a land-constrained city. ` : '') +
    `In established neighborhoods, even small units carry serious premiums.`,

  'haifa': (m) =>
    `Haifa's room-size pricing is remarkably accessible across the board. ` +
    (m.room4Price ? `A 4-room at around ${fmt(m.room4Price)} is roughly what you'd pay for a 3-room in Tel Aviv. ` : '') +
    `If space matters to you, this is one of the few major cities where you can realistically get it. ` +
    (m.gapSmallToLarge ? `The ${fmtGap(m.gapSmallToLarge)} gap between sizes means upgrading is actually within reach here.` : ''),

  'herzliya': (m) =>
    (m.room3Price ? `Even Herzliya's 3-room apartments command serious prices at ${fmt(m.room3Price)}. ` : '') +
    (m.gapSmallToLarge ? `The gap to a 5-room is around ${fmtGap(m.gapSmallToLarge)} — comparable to buying an entire apartment in some southern cities. ` : '') +
    `Size upgrades here are a long-term play. Most buyers start with what they can afford and leverage TAMA 38 or neighborhood renewal later.`,

  'raanana': (m) =>
    `Ra'anana is a family-first market, and that shows in the room-size data. ` +
    (m.room4Price ? `The 4-room sweet spot sits at ${fmt(m.room4Price)}, reflecting heavy Anglo and tech-professional demand. ` : '') +
    (m.room5Price ? `5-room units at ${fmt(m.room5Price)} attract established families who've outgrown their first purchase. ` : '') +
    (m.gapSmallToLarge ? `The ${fmtGap(m.gapSmallToLarge)} size premium is steep but predictable — Ra'anana buyers know what they're paying for.` : ''),

  'netanya': (m) =>
    `Netanya gives you more space for your money than most coastal cities. ` +
    (m.room3Price && m.room4Price
      ? `Moving from a 3-room (${fmt(m.room3Price)}) to a 4-room (${fmt(m.room4Price)}) costs roughly ${fmtGap((m.room4Price - m.room3Price))} — a realistic step-up for most buyers. `
      : '') +
    (m.room5Price ? `Even a 5-room at ${fmt(m.room5Price)} is attainable compared to what you'd pay in the Sharon region. ` : '') +
    `This is one of the few beachfront cities where upgrading apartment size doesn't require doubling your budget.`,

  'beer-sheva': (m) =>
    `One of Beer Sheva's biggest advantages is how narrow the gap between apartment sizes is. ` +
    (m.room3Price && m.room4Price
      ? `Moving from 3 rooms (${fmt(m.room3Price)}) to 4 rooms (${fmt(m.room4Price)}) costs roughly ${fmtGap(m.room4Price - m.room3Price)} — making the family upgrade far more realistic here than in most cities. `
      : '') +
    (m.room5Price ? `Even a 5-room at ${fmt(m.room5Price)} is within reach, which is almost unheard of in central Israel.` : ''),

  'ashdod': (m) =>
    `Ashdod's pricing across apartment sizes offers solid middle-ground value. ` +
    (m.room3Price ? `A 3-room entry at ${fmt(m.room3Price)} is competitive for a growing port city. ` : '') +
    (m.room4Price ? `The 4-room at ${fmt(m.room4Price)} is where most families land — close to the beach and new rail stations. ` : '') +
    (m.gapSmallToLarge ? `The ${fmtGap(m.gapSmallToLarge)} spread between sizes is manageable, making Ashdod a realistic city for upsizing over time.` : ''),

  'ashkelon': (m) =>
    `Ashkelon remains one of Israel's most affordable coastal markets across all apartment sizes. ` +
    (m.room3Price ? `A 3-room at ${fmt(m.room3Price)} is an entry point that simply doesn't exist on the coast further north. ` : '') +
    (m.room4Price && m.room5Price
      ? `The step from 4-room (${fmt(m.room4Price)}) to 5-room (${fmt(m.room5Price)}) is only ${fmtGap(m.room5Price - m.room4Price)}, making it one of the few places where a large family apartment is genuinely within reach.`
      : ''),

  'modiin': (m) =>
    `Modi'in is a 4-room market — that's the sweet spot for the young families driving demand here. ` +
    (m.room4Price ? `At ${fmt(m.room4Price)} for a 4-room, it sits between the 3-room entry point and the 5-room premium. ` : '') +
    `If you're buying for a family, that's where the competition is. ` +
    (m.room5Price ? `5-room units at ${fmt(m.room5Price)} are available but less common — most of Modi'in's housing stock was built for the 4-room demographic.` : ''),

  'ramat-gan': (m) =>
    `Ramat Gan's room-size pricing reflects its position as Tel Aviv's most popular alternative. ` +
    (m.room3Price ? `3-room units at ${fmt(m.room3Price)} are the entry play — mostly in older buildings with TAMA 38 potential. ` : '') +
    (m.gapSmallToLarge ? `The ${fmtGap(m.gapSmallToLarge)} gap to the top end is significant, but urban renewal is creating new inventory across all sizes.` : ''),

  'petah-tikva': (m) =>
    `Petah Tikva offers meaningful size variety at accessible price points. ` +
    (m.room3Price && m.room4Price
      ? `The jump from 3-room (${fmt(m.room3Price)}) to 4-room (${fmt(m.room4Price)}) is roughly ${fmtGap(m.room4Price - m.room3Price)}, which is manageable for the Tel Aviv metro. `
      : '') +
    (m.room5Price ? `5-room units at ${fmt(m.room5Price)} give you space that would cost nearly double in neighboring Ramat Gan or Givatayim.` : ''),

  'kfar-saba': (m) =>
    `Kfar Saba's room-size pricing reflects its status as a premium family suburb. ` +
    (m.room4Price ? `The 4-room at ${fmt(m.room4Price)} is the core of this market — schools and parks drive families here. ` : '') +
    (m.room3Price && m.room4Price
      ? `The ${fmtGap(m.room4Price - m.room3Price)} step from 3 to 4 rooms is the upgrade most buyers are planning for. `
      : '') +
    `Limited new construction means resale competition stays tight across all sizes.`,

  'hod-hasharon': (m) =>
    `Hod HaSharon's newer housing stock means relatively uniform pricing per room count. ` +
    (m.room4Price ? `4-room apartments at ${fmt(m.room4Price)} are the market standard — newer builds with modern layouts. ` : '') +
    (m.room3Price ? `3-room units at ${fmt(m.room3Price)} offer a more accessible entry into the Sharon region. ` : '') +
    `This is a market where you're paying for construction quality as much as location.`,

  'givat-shmuel': (m) =>
    `Givat Shmuel's tower boom has changed the room-size equation. ` +
    (m.room3Price ? `New 3-room units at ${fmt(m.room3Price)} are popular with young couples entering the market. ` : '') +
    (m.room4Price ? `4-room apartments at ${fmt(m.room4Price)} are the family staple in the newer towers. ` : '') +
    (m.gapSmallToLarge ? `The ${fmtGap(m.gapSmallToLarge)} spread reflects the premium for space in a city that's built up, not out.` : ''),

  'eilat': (m) =>
    `Eilat's apartment sizing follows resort-city logic — smaller units dominate for investment buyers. ` +
    (m.room3Price ? `3-room units at ${fmt(m.room3Price)} are the rental-income sweet spot, driven by tourism. ` : '') +
    (m.room5Price ? `Larger 5-room apartments at ${fmt(m.room5Price)} are rarer and target permanent residents rather than investors. ` : '') +
    `Remember: no VAT on Eilat purchases, which effectively lowers all these prices by 17%.`,

  'caesarea': (m) =>
    `Caesarea's room-count data reflects a luxury market — most properties here are large by default. ` +
    (m.room5Price ? `5-room homes at ${fmt(m.room5Price)} are the entry point for this exclusive community. ` : '') +
    (m.room4Price ? `4-room units at ${fmt(m.room4Price)} are less common — Caesarea buyers typically want space. ` : '') +
    `This isn't a market where you compare room counts; you compare plots and finishes.`,

  'zichron-yaakov': (m) =>
    `Zichron Ya'akov's room-size pricing reflects its wine-country premium. ` +
    (m.room4Price ? `A 4-room at ${fmt(m.room4Price)} gets you into one of the Carmel's most desirable towns. ` : '') +
    (m.room3Price ? `3-room units at ${fmt(m.room3Price)} are a solid entry for downsizers or quality-of-life buyers. ` : '') +
    `This is a lifestyle market — buyers prioritize views and character over pure value per room.`,

  'pardes-hanna': (m) =>
    `Pardes Hanna is where room-count value really shines. ` +
    (m.room3Price && m.room4Price
      ? `A 3-to-4-room upgrade costs roughly ${fmtGap(m.room4Price - m.room3Price)} — from ${fmt(m.room3Price)} to ${fmt(m.room4Price)}. `
      : '') +
    `That's a fraction of what the same upgrade costs in the Sharon or Gush Dan. ` +
    (m.room5Price ? `Even 5-room units at ${fmt(m.room5Price)} feel like a steal compared to the national average.` : ''),

  'kiryat-tivon': (m) =>
    `Kiryat Tivon's family-oriented market is reflected in room-size demand. ` +
    (m.room4Price ? `4-room apartments at ${fmt(m.room4Price)} are the sweet spot for university families and professionals. ` : '') +
    (m.gapSmallToLarge ? `The ${fmtGap(m.gapSmallToLarge)} spread between sizes is reasonable for a premium Haifa suburb. ` : '') +
    `Limited construction keeps competition steady, especially for larger units.`,

  'yokneam': (m) =>
    `Yokne'am's tech-park proximity drives demand across all apartment sizes. ` +
    (m.room3Price ? `3-room units at ${fmt(m.room3Price)} attract young tech workers. ` : '') +
    (m.room4Price ? `4-room apartments at ${fmt(m.room4Price)} serve growing families. ` : '') +
    `The pricing here is still central-Israel affordable, but with tech-corridor demand — that combination doesn't usually last.`,

  'hadera': (m) =>
    `Hadera's pricing across sizes is a study in accessibility. ` +
    (m.room3Price ? `3-room apartments at ${fmt(m.room3Price)} are among the most affordable rail-connected options in central Israel. ` : '') +
    (m.room4Price && m.room5Price
      ? `Upgrading from 4-room (${fmt(m.room4Price)}) to 5-room (${fmt(m.room5Price)}) costs just ${fmtGap(m.room5Price - m.room4Price)} — a rare luxury in this market. `
      : '') +
    `For buyers who need space and can commute, Hadera's value proposition is hard to beat.`,

  'nahariya': (m) =>
    `Nahariya offers beachfront living at prices that challenge belief. ` +
    (m.room3Price ? `A 3-room at ${fmt(m.room3Price)} with coastal proximity is among the cheapest in Israel. ` : '') +
    (m.room4Price ? `4-room units at ${fmt(m.room4Price)} give families real space near the sea. ` : '') +
    `If you're looking at Nahariya, you're prioritizing lifestyle and value — the room-size premiums here are minimal compared to anywhere else on the coast.`,

  'beit-shemesh': (m) =>
    `Beit Shemesh's rapid population growth means strong demand across all apartment sizes. ` +
    (m.room4Price ? `The 4-room at ${fmt(m.room4Price)} is the community workhorse — most families start and settle here. ` : '') +
    (m.room3Price ? `3-room units at ${fmt(m.room3Price)} serve as entry points, especially in newer neighborhoods. ` : '') +
    `New construction in Ramat Beit Shemesh is adding inventory, but demand from Anglo and religious communities keeps pace.`,

  'mevaseret-zion': (m) =>
    `Mevaseret Zion's room-size premiums reflect its exclusivity — there's only so much of this town to go around. ` +
    (m.room4Price ? `4-room apartments at ${fmt(m.room4Price)} are the standard for families commuting into Jerusalem. ` : '') +
    (m.gapSmallToLarge ? `The ${fmtGap(m.gapSmallToLarge)} gap from smallest to largest is significant in a town this small — space is the scarcest resource here.` : ''),

  'efrat': (m) =>
    `Efrat's community-driven market means apartment sizes serve specific demographics. ` +
    (m.room5Price ? `5-room units at ${fmt(m.room5Price)} dominate — large families are the norm, not the exception. ` : '') +
    (m.room4Price ? `4-room apartments at ${fmt(m.room4Price)} serve young families getting established. ` : '') +
    `When homes turn over here, they sell within the community network first. Size preferences track closely to family stage.`,

  'gush-etzion': (m) =>
    `Gush Etzion's pricing across sizes reflects a community-focused market. ` +
    (m.room4Price ? `4-room apartments at ${fmt(m.room4Price)} are the family standard in most settlements. ` : '') +
    (m.gapSmallToLarge ? `The ${fmtGap(m.gapSmallToLarge)} spread between sizes is modest — affordability is consistent across the bloc. ` : '') +
    `Values here are driven as much by community fit as by apartment specifications.`,

  'maale-adumim': (m) =>
    `Ma'ale Adumim offers some of the best size-per-shekel in the Jerusalem area. ` +
    (m.room3Price && m.room4Price
      ? `The step from 3-room (${fmt(m.room3Price)}) to 4-room (${fmt(m.room4Price)}) costs roughly ${fmtGap(m.room4Price - m.room3Price)} — very manageable for Jerusalem proximity. `
      : '') +
    (m.room5Price ? `5-room units at ${fmt(m.room5Price)} give you genuine family space at a fraction of Jerusalem prices.` : ''),

  'givat-zeev': (m) =>
    `Givat Ze'ev's value proposition is clearest when you look at room sizes. ` +
    (m.room4Price ? `A 4-room at ${fmt(m.room4Price)} gets you family space that would cost significantly more inside Jerusalem. ` : '') +
    (m.room3Price ? `3-room entry points at ${fmt(m.room3Price)} make this one of the most accessible gateways to the Jerusalem area. ` : '') +
    `Growing connectivity is gradually closing the price gap with the city, but there's still meaningful value here.`,
};

/**
 * Returns a personalized room-size insight string for the given city, or a friendly fallback.
 */
export function getCityRoomSizeInsight(
  citySlug: string,
  cityName: string,
  m: RoomSizeInsightMetrics,
): string {
  const fn = CITY_ROOM_SIZE_INSIGHTS[citySlug];
  if (fn) return fn(m);

  // Friendly fallback
  const prices: string[] = [];
  if (m.room3Price) prices.push(`3-room at ${fmt(m.room3Price)}`);
  if (m.room4Price) prices.push(`4-room at ${fmt(m.room4Price)}`);
  if (m.room5Price) prices.push(`5-room at ${fmt(m.room5Price)}`);

  const priceList = prices.length ? prices.join(', ') : 'various sizes';

  if (m.gapSmallToLarge && m.gapSmallToLarge > 0) {
    return (
      `In ${cityName}, the spread across apartment sizes is ${fmtGap(m.gapSmallToLarge)} from smallest to largest available (${priceList}). ` +
      (m.gapSmallToLarge < 400_000
        ? `That's a relatively narrow gap — upgrading to a larger apartment is more realistic here than in many Israeli cities.`
        : m.gapSmallToLarge < 800_000
          ? `A moderate premium for extra space — typical for this part of the country.`
          : `A significant size premium — worth factoring into your long-term plans if you anticipate needing more room.`)
    );
  }

  return `${cityName} currently shows prices across apartment sizes: ${priceList}. Understanding the gap between sizes helps you plan whether to buy smaller now and upgrade later, or stretch for the size you need today.`;
}
