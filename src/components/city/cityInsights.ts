/**
 * Personalized "What this means" insight templates for each city.
 * Each function receives live metrics and returns a conversational narrative.
 */

export interface InsightMetrics {
  totalAppreciation: number;
  cagr: number;
  latestYoY: number | null;
  years: number;
  nationalCagr: number | null;
  deltaVsNational: number | null;
  peakYear: number;
  peakPrice: number;
  currentPrice: number;
}

function fmt(value: number): string {
  if (value >= 1_000_000) return `₪${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `₪${(value / 1_000).toFixed(0)}K`;
  return `₪${value.toLocaleString()}`;
}

function yoyPhrase(yoy: number | null): string {
  if (yoy == null) return '';
  if (yoy > 5) return `The market is currently accelerating at +${yoy.toFixed(1)}% year-over-year.`;
  if (yoy > 0) return `Recent growth is steady at +${yoy.toFixed(1)}% year-over-year.`;
  if (yoy < -3) return `Prices have pulled back ${Math.abs(yoy).toFixed(1)}% in the last year — worth watching.`;
  if (yoy < 0) return `Prices have softened slightly, down ${Math.abs(yoy).toFixed(1)}% from the previous year.`;
  return '';
}

type InsightFn = (m: InsightMetrics) => string;

const CITY_INSIGHTS: Record<string, InsightFn> = {
  'tel-aviv': (m) =>
    `Tel Aviv commands a major premium — currently about ${Math.abs(m.deltaVsNational ?? 0)}% above the national average. ` +
    (m.latestYoY != null && m.latestYoY < 0
      ? `Prices have dipped about ${Math.abs(m.latestYoY).toFixed(1)}% from their ${m.peakYear} peak, which is rare here. If you've been watching this market, this is one of the more buyer-friendly moments you'll get. `
      : `Prices grew ${(m.latestYoY ?? 0).toFixed(1)}% in the past year, continuing the upward trend. `) +
    `At around ${fmt(m.currentPrice)} average, ` +
    (m.latestYoY != null && m.latestYoY < 0
      ? `there's a bit more room to negotiate than there was 18 months ago.`
      : `expect competition — demand here doesn't let up.`),

  'jerusalem': (m) =>
    `Jerusalem's market moves to its own rhythm — driven by religious demand, limited land, and a unique buyer mix. ` +
    `Prices are up ${m.totalAppreciation.toFixed(0)}% over ${m.years} years (${m.cagr}% annually), ` +
    `and at ${fmt(m.currentPrice)} average, it remains one of Israel's priciest markets. ` +
    (m.latestYoY != null && m.latestYoY > 0
      ? `With ${m.latestYoY.toFixed(1)}% growth last year, demand isn't slowing — especially in established neighborhoods.`
      : `The market has cooled slightly, which could open doors in neighborhoods that were previously out of reach.`),

  'haifa': (m) =>
    `Haifa offers something rare in Israel: a major city where your money still goes far. ` +
    `Average prices sit around ${fmt(m.currentPrice)} — roughly ${Math.abs(m.deltaVsNational ?? 0)}% below the national average. ` +
    `With ${m.totalAppreciation.toFixed(0)}% total appreciation over ${m.years} years, the trajectory is upward. ` +
    `Tech expansion and infrastructure improvements are making Haifa increasingly attractive. This is a market where early movers tend to be rewarded.`,

  'herzliya': (m) =>
    `Herzliya sits just below Tel Aviv in pricing, and for good reason — tech jobs, beaches, and top schools. ` +
    `At roughly ${fmt(m.currentPrice)} average and growing ${m.cagr}% annually, this isn't a speculative play — ` +
    `it's a market that rewards patience. ${m.totalAppreciation.toFixed(0)}% appreciation over ${m.years} years tells you demand here isn't going anywhere.`,

  'raanana': (m) =>
    `Ra'anana is where Anglo families and tech professionals have settled in force, and prices reflect that stability. ` +
    `At ${fmt(m.currentPrice)} average with ${m.cagr}% annual growth, it's a premium suburb that keeps appreciating. ` +
    (m.deltaVsNational != null && m.deltaVsNational > 0
      ? `Prices are ${m.deltaVsNational}% above national average — you're paying for the schools, community, and Hi-Tech Park access.`
      : `Strong fundamentals keep this market resilient even when others wobble.`),

  'netanya': (m) =>
    `Netanya has seen steady ${m.cagr}% annual growth, driven by consistent Anglo demand and coastal living at a fraction of Tel Aviv prices. ` +
    `At around ${fmt(m.currentPrice)} average, it's one of the few beachfront cities where entry is still realistic. ` +
    `${m.totalAppreciation.toFixed(0)}% total appreciation over ${m.years} years — the pricing gap with Herzliya and Tel Aviv means there's still room to run.`,

  'beer-sheva': (m) =>
    `Beer Sheva has quietly been one of Israel's fastest-growing markets — up ${m.totalAppreciation.toFixed(0)}% over the last ${m.years} years. ` +
    `It's still well below the national average, but that gap is narrowing as demand picks up from the tech park and university expansion. ` +
    `At around ${fmt(m.currentPrice)} for an average apartment, you're getting in while it's still undervalued relative to where it's heading.`,

  'ashdod': (m) =>
    `Ashdod combines port-city economics with growing residential demand. ` +
    `Up ${m.totalAppreciation.toFixed(0)}% over ${m.years} years at ${m.cagr}% annually, prices have been climbing steadily. ` +
    `At ${fmt(m.currentPrice)} average, it's still accessible compared to the Gush Dan cities — and the new rail connections are only adding momentum.`,

  'ashkelon': (m) =>
    `Ashkelon remains one of Israel's most affordable coastal cities at ${fmt(m.currentPrice)} average. ` +
    `With ${m.totalAppreciation.toFixed(0)}% growth over ${m.years} years, it's been quietly catching up to its northern neighbors. ` +
    `Security concerns have historically kept prices lower, but infrastructure investment and population growth are changing the equation.`,

  'modiin': (m) =>
    `Modi'in was planned as a family city, and its market reflects exactly that — steady, predictable growth. ` +
    `At ${fmt(m.currentPrice)} with ${m.cagr}% annual appreciation, it's priced between the Jerusalem and Tel Aviv corridors it connects. ` +
    `${m.totalAppreciation.toFixed(0)}% total growth over ${m.years} years shows this market doesn't do surprises — in a good way.`,

  'ramat-gan': (m) =>
    `Ramat Gan has become the affordable alternative to Tel Aviv — same metro access, lower price tag. ` +
    `At ${fmt(m.currentPrice)} average, it's ${Math.abs(m.deltaVsNational ?? 0)}% ${(m.deltaVsNational ?? 0) > 0 ? 'above' : 'below'} national average. ` +
    `The Diamond Exchange area redevelopment and new towers are reshaping the skyline — and ${m.cagr}% annual growth shows the market is paying attention.`,

  'givatayim': (m) =>
    `Givatayim punches well above its size — this tiny city next to Tel Aviv has some of the highest per-sqm prices outside TLV itself. ` +
    `At ${fmt(m.currentPrice)} average with ${m.totalAppreciation.toFixed(0)}% appreciation over ${m.years} years, ` +
    `demand consistently outstrips supply here. The urban renewal pipeline may add inventory, but don't expect prices to soften.`,

  'petah-tikva': (m) =>
    `Petah Tikva has transformed from a sleepy suburb into a major residential hub, riding the Gush Dan spillover effect. ` +
    `${m.totalAppreciation.toFixed(0)}% growth over ${m.years} years at ${m.cagr}% annually — ` +
    `at ${fmt(m.currentPrice)} average, it remains one of the more accessible entry points into the greater Tel Aviv area.`,

  'holon': (m) =>
    `Holon offers genuine value in the Tel Aviv metro — families priced out of TLV and Ramat Gan are increasingly looking here. ` +
    `At ${fmt(m.currentPrice)} average, prices are up ${m.totalAppreciation.toFixed(0)}% over ${m.years} years. ` +
    `The city's cultural investments and urban renewal projects are starting to show up in the numbers.`,

  'bat-yam': (m) =>
    `Bat Yam is Israel's most underestimated beachfront city. Directly south of Tel Aviv with seafront access, ` +
    `yet prices average just ${fmt(m.currentPrice)} — ${Math.abs(m.deltaVsNational ?? 0)}% ${(m.deltaVsNational ?? 0) > 0 ? 'above' : 'below'} national. ` +
    `${m.totalAppreciation.toFixed(0)}% growth over ${m.years} years, and the Red Line light rail is set to transform accessibility. Keep watching.`,

  'kfar-saba': (m) =>
    `Kfar Saba has the suburban-premium DNA — good schools, green spaces, and a loyal community that rarely lets homes sit on the market. ` +
    `At ${fmt(m.currentPrice)} with ${m.cagr}% annual growth, ` +
    `the ${m.totalAppreciation.toFixed(0)}% total appreciation over ${m.years} years reflects consistent demand from young families.`,

  'hod-hasharon': (m) =>
    `Hod HaSharon is the Sharon region's rising star — newer construction, younger demographics, and strong demand. ` +
    `Prices have climbed ${m.totalAppreciation.toFixed(0)}% over ${m.years} years to ${fmt(m.currentPrice)} average. ` +
    `At ${m.cagr}% annual growth, it's tracking close to its neighbor Ra'anana but at a more accessible price point.`,

  'rosh-haayin': (m) =>
    `Rosh Ha'ayin blends suburban quiet with real connectivity — the train gets you to Tel Aviv fast. ` +
    `At ${fmt(m.currentPrice)} average, it's up ${m.totalAppreciation.toFixed(0)}% over ${m.years} years. ` +
    `It's found its niche as an affordable family alternative to the Sharon-region premium cities.`,

  'shoham': (m) =>
    `Shoham is a small, affluent community town — think cul-de-sacs, gardens, and some of the best schools in the region. ` +
    `At ${fmt(m.currentPrice)} average, it commands a premium for good reason. ` +
    `${m.totalAppreciation.toFixed(0)}% growth over ${m.years} years at ${m.cagr}% annually — limited supply keeps this market tight.`,

  'givat-shmuel': (m) =>
    `Givat Shmuel has been one of the biggest success stories in Israeli real estate — massive new construction transformed this once-sleepy town. ` +
    `At ${fmt(m.currentPrice)} with ${m.totalAppreciation.toFixed(0)}% appreciation over ${m.years} years, ` +
    `the growth has been exceptional. The question now is whether it can maintain that pace as the building boom matures.`,

  'eilat': (m) =>
    `Eilat operates on different rules — VAT-exempt, tourism-driven, and heavily seasonal. ` +
    `At ${fmt(m.currentPrice)} average, prices are ${Math.abs(m.deltaVsNational ?? 0)}% ${(m.deltaVsNational ?? 0) > 0 ? 'above' : 'below'} national. ` +
    `${m.totalAppreciation.toFixed(0)}% total change over ${m.years} years — this is more of a lifestyle or rental-income play than a pure appreciation bet.`,

  'caesarea': (m) =>
    `Caesarea is Israel's most exclusive address — gated, manicured, and priced accordingly. ` +
    `At ${fmt(m.currentPrice)} average with ${m.totalAppreciation.toFixed(0)}% growth over ${m.years} years, ` +
    `this is a trophy-asset market. Transactions are rare and buyers are patient — if you're looking here, you already know what you want.`,

  'zichron-yaakov': (m) =>
    `Zichron Ya'akov is the Carmel region's hidden gem — wine country charm with growing residential demand. ` +
    `Prices are at ${fmt(m.currentPrice)} average, up ${m.totalAppreciation.toFixed(0)}% over ${m.years} years. ` +
    `At ${m.cagr}% annual growth, it's a quieter market that tends to attract quality-of-life buyers rather than speculators.`,

  'pardes-hanna': (m) =>
    `Pardes Hanna has become the go-to for buyers seeking value in the northern Sharon region. ` +
    `At ${fmt(m.currentPrice)} average — still well below its flashier neighbors — prices are up ${m.totalAppreciation.toFixed(0)}% over ${m.years} years. ` +
    `The train connection and growing community make this a smart entry point for patient buyers.`,

  'kiryat-tivon': (m) =>
    `Kiryat Tivon is Haifa's premium suburb — green, quiet, and popular with university families. ` +
    `At ${fmt(m.currentPrice)} with ${m.cagr}% annual growth, it's the kind of market where properties don't sit long. ` +
    `${m.totalAppreciation.toFixed(0)}% appreciation over ${m.years} years reflects steady demand in a supply-limited town.`,

  'yokneam': (m) =>
    `Yokne'am sits at the intersection of tech and nature — the Yokne'am-Megiddo tech park has put this small city on the map. ` +
    `At ${fmt(m.currentPrice)} average with ${m.totalAppreciation.toFixed(0)}% growth over ${m.years} years, ` +
    `it's still affordable by central Israel standards, and the tech jobs keep demand steady.`,

  'hadera': (m) =>
    `Hadera is mid-transformation — once overlooked, now increasingly on buyers' radars thanks to rail connectivity and affordability. ` +
    `At ${fmt(m.currentPrice)} average, prices are up ${m.totalAppreciation.toFixed(0)}% over ${m.years} years. ` +
    `At ${m.cagr}% annual growth, it's one of the more accessible markets with real upside potential.`,

  'nahariya': (m) =>
    `Nahariya is Israel's northernmost coastal city, and its prices reflect both the appeal and the remoteness. ` +
    `At ${fmt(m.currentPrice)} average — ${Math.abs(m.deltaVsNational ?? 0)}% ${(m.deltaVsNational ?? 0) > 0 ? 'above' : 'below'} national — ` +
    `it offers beachfront living at prices you won't find anywhere else on the coast. ${m.totalAppreciation.toFixed(0)}% growth over ${m.years} years shows gradual upward momentum.`,

  'beit-shemesh': (m) =>
    `Beit Shemesh has been one of Israel's fastest-growing cities by population, and prices have followed. ` +
    `Up ${m.totalAppreciation.toFixed(0)}% over ${m.years} years to ${fmt(m.currentPrice)} average, ` +
    `the Anglo and religious communities have driven consistent demand. New neighborhoods keep expanding, but so does the buyer pool.`,

  'mevaseret-zion': (m) =>
    `Mevaseret Zion is Jerusalem's premium gateway suburb — 10 minutes to the city, but a completely different lifestyle. ` +
    `At ${fmt(m.currentPrice)} average with ${m.cagr}% annual growth, it attracts families who want Jerusalem access without Jerusalem density. ` +
    `${m.totalAppreciation.toFixed(0)}% growth over ${m.years} years in a supply-constrained town means competition stays fierce.`,

  'efrat': (m) =>
    `Efrat is a tightly-knit Anglo community in Gush Etzion — and prices reflect that social premium. ` +
    `At ${fmt(m.currentPrice)} average with ${m.totalAppreciation.toFixed(0)}% growth over ${m.years} years, ` +
    `demand is driven by community loyalty and limited turnover. When homes come to market here, they move quickly.`,

  'gush-etzion': (m) =>
    `The Gush Etzion bloc offers a range of community-driven towns south of Jerusalem. ` +
    `At ${fmt(m.currentPrice)} average, prices are up ${m.totalAppreciation.toFixed(0)}% over ${m.years} years. ` +
    `The combination of ideological commitment and growing infrastructure keeps demand stable, but resale liquidity varies by settlement.`,

  'maale-adumim': (m) =>
    `Ma'ale Adumim is one of the larger cities east of Jerusalem — established infrastructure, suburban feel, and competitive pricing. ` +
    `At ${fmt(m.currentPrice)} average, it's ${Math.abs(m.deltaVsNational ?? 0)}% ${(m.deltaVsNational ?? 0) > 0 ? 'above' : 'below'} national. ` +
    `${m.totalAppreciation.toFixed(0)}% growth over ${m.years} years — a pragmatic choice for Jerusalem-area buyers watching their budget.`,

  'givat-zeev': (m) =>
    `Givat Ze'ev has grown rapidly as a Jerusalem satellite town — more affordable, family-oriented, and increasingly connected. ` +
    `At ${fmt(m.currentPrice)} average with ${m.totalAppreciation.toFixed(0)}% appreciation over ${m.years} years, ` +
    `it fills a clear gap for buyers who need Jerusalem proximity without Jerusalem prices.`,
};

/**
 * Returns a personalized insight string for the given city, or a friendly fallback.
 */
export function getCityInsight(citySlug: string, cityName: string, m: InsightMetrics): string {
  const fn = CITY_INSIGHTS[citySlug];
  if (fn) return fn(m);

  // Friendly fallback for unmapped cities
  const dir = (m.deltaVsNational ?? 0) > 0 ? 'above' : 'below';
  const deltaText = m.deltaVsNational != null ? ` — currently ${Math.abs(m.deltaVsNational)}% ${dir} the national average` : '';
  
  if (m.totalAppreciation > 0) {
    return (
      `${cityName} has appreciated ${m.totalAppreciation.toFixed(0)}% over ${m.years} years (${m.cagr}% annually)${deltaText}. ` +
      `At ${fmt(m.currentPrice)} average, ` +
      (m.latestYoY != null && m.latestYoY > 3
        ? `recent momentum is strong with ${m.latestYoY.toFixed(1)}% growth last year.`
        : m.latestYoY != null && m.latestYoY < 0
          ? `the recent softening of ${Math.abs(m.latestYoY).toFixed(1)}% could present an opportunity for patient buyers.`
          : `the market continues to move at a measured pace.`)
    );
  }
  
  return (
    `${cityName}'s market has been through a correction, with prices down ${Math.abs(m.totalAppreciation).toFixed(0)}% over ${m.years} years${deltaText}. ` +
    `At ${fmt(m.currentPrice)} average, this could represent value — but understanding the local dynamics is key before committing.`
  );
}
