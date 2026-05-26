// Shared AI enrichment helpers for BuyWise Intel.
// All calls route through Lovable AI Gateway using LOVABLE_API_KEY.

const GATEWAY = "https://ai.gateway.lovable.dev/v1/chat/completions";
const MODEL = "google/gemini-3-flash-preview";

export type IntelCategory =
  | "property-market"
  | "mortgage-rates"
  | "tax-legal"
  | "city-spotlight"
  | "new-developments"
  | "macro-economy"
  | "aliyah-immigration"
  | "policy-regulation"
  | "general";

const CATEGORIES: IntelCategory[] = [
  "property-market",
  "mortgage-rates",
  "tax-legal",
  "city-spotlight",
  "new-developments",
  "macro-economy",
  "aliyah-immigration",
  "policy-regulation",
  "general",
];

export interface EnrichmentInput {
  headline: string;
  excerpt?: string | null;
  language: "en" | "he";
}

export interface EnrichmentResult {
  headline_en: string;
  excerpt_en: string | null;
  category: IntelCategory;
  category_confidence: number; // 0..1
  relevance_score: number; // 1..5
}

const SYSTEM = `You are the editorial AI for BuyWise Intel, an Israeli real-estate news desk for international (mostly English-speaking) buyers.

SCOPE — what we cover:
- Israeli residential property markets (prices, transactions, supply, demand, neighborhoods, projects)
- Mortgages, interest rates, Bank of Israel decisions affecting housing
- Real-estate taxes (purchase tax, capital gains, betterment, Olim benefits)
- Israeli housing policy & regulation (planning, TAMA, rent law, foreign-buyer rules)
- Aliyah / immigration as it touches buying property
- Macro-economy ONLY when it directly moves housing (CPI, shekel, BoI rate)
- City and neighborhood spotlights inside Israel

OUT OF SCOPE — score these 1:
- War, military operations, hostages, geopolitics, Iran, Hamas, Hezbollah, US politics, Trump
- Tech / startup / unicorn news unrelated to real estate
- Sports, entertainment, celebrities, opinion columns
- Crime, courts, scandals unless directly about real-estate fraud or major housing policy
- Foreign real-estate markets (NY, London, Dubai, etc.) unless the angle is Israelis investing abroad

For every article return:
- headline_en: Clear, neutral English headline in the BuyWise "trusted friend" voice. If English, lightly normalize (fix caps, remove clickbait, preserve numbers and proper nouns). If Hebrew, translate naturally; keep numbers, ₪/NIS, Israeli place + agency names. Never invent facts.
- excerpt_en: 1-2 plain-English sentences faithful to the original. If empty, return null. Literal translation, not stylized.
- category: pick ONE of: property-market, mortgage-rates, tax-legal, city-spotlight, new-developments, macro-economy, aliyah-immigration, policy-regulation, general. Only use "general" when nothing else fits.
- category_confidence: 0.0 to 1.0.
- relevance_score: 1 (out of scope / not useful to a buyer) … 3 (background context) … 5 (must-read: rate change, tax shift, major price move, new policy). BE STRICT — most off-topic Israeli news is 1.

Never include opinions or buyer advice — opinion belongs in the human-written BuyWise Take, not here.`;

const TOOL = {
  type: "function" as const,
  function: {
    name: "enrich_intel_article",
    description: "Return enriched fields for a BuyWise Intel article.",
    parameters: {
      type: "object",
      properties: {
        headline_en: { type: "string" },
        excerpt_en: { type: ["string", "null"] },
        category: { type: "string", enum: CATEGORIES },
        category_confidence: { type: "number" },
        relevance_score: { type: "integer", minimum: 1, maximum: 5 },
      },
      required: ["headline_en", "category", "category_confidence", "relevance_score"],
      additionalProperties: false,
    },
  },
};

export async function enrichArticle(input: EnrichmentInput): Promise<EnrichmentResult | null> {
  const key = Deno.env.get("LOVABLE_API_KEY");
  if (!key) {
    console.error("[intel-ai] LOVABLE_API_KEY missing");
    return null;
  }

  const userPayload = {
    language: input.language,
    headline: input.headline,
    excerpt: input.excerpt ?? "",
  };

  try {
    const res = await fetch(GATEWAY, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: "system", content: SYSTEM },
          { role: "user", content: JSON.stringify(userPayload) },
        ],
        tools: [TOOL],
        tool_choice: { type: "function", function: { name: "enrich_intel_article" } },
      }),
    });

    if (!res.ok) {
      const t = await res.text();
      console.error(`[intel-ai] gateway ${res.status}: ${t.slice(0, 200)}`);
      return null;
    }

    const data = await res.json();
    const call = data?.choices?.[0]?.message?.tool_calls?.[0];
    const args = call?.function?.arguments;
    if (!args) return null;
    const parsed = JSON.parse(args);

    return {
      headline_en: String(parsed.headline_en ?? input.headline),
      excerpt_en: parsed.excerpt_en ? String(parsed.excerpt_en) : null,
      category: CATEGORIES.includes(parsed.category) ? parsed.category : "general",
      category_confidence: Math.max(0, Math.min(1, Number(parsed.category_confidence ?? 0.5))),
      relevance_score: Math.max(1, Math.min(5, Number(parsed.relevance_score ?? 3))),
    };
  } catch (e) {
    console.error("[intel-ai] enrichArticle threw:", e instanceof Error ? e.message : e);
    return null;
  }
}

// ----- BuyWise Take drafting -----

const TAKE_LABELS = [
  "What This Means",
  "Buyer Impact",
  "Watch List",
  "Reality Check",
  "BuyWise View",
] as const;

const TAKE_SYSTEM = `You write BuyWise Takes — a 2-3 sentence editorial reaction below an Israeli real-estate news item, aimed at international buyers.

Voice: trusted friend. Warm but direct. No hype, no scare tactics, no buyer instructions ("you should buy now"). State what the story means in practical terms — for monthly payments, taxes, timing, neighborhoods, or risk.

Hard rules:
- 2 to 3 sentences. Maximum 75 words.
- Never repeat the headline.
- Never start with "This means…" or "In short…".
- Use ₪ for shekels. Use "international buyers" (never "Anglos").
- If you do not know enough to add value, say so plainly in one sentence rather than inventing facts.

Pick ONE label from: ${TAKE_LABELS.join(", ")} — the one that best fits the story's angle.`;

const TAKE_TOOL = {
  type: "function" as const,
  function: {
    name: "draft_buywise_take",
    description: "Draft a BuyWise Take for an Intel article.",
    parameters: {
      type: "object",
      properties: {
        take_label: { type: "string", enum: TAKE_LABELS as unknown as string[] },
        take_body: { type: "string" },
      },
      required: ["take_label", "take_body"],
      additionalProperties: false,
    },
  },
};

export interface DraftTakeInput {
  headline: string;
  excerpt?: string | null;
  category: string;
  source_name: string;
}

export interface DraftTakeResult {
  take_label: string;
  take_body: string;
}

export async function draftTake(input: DraftTakeInput): Promise<DraftTakeResult | null> {
  const key = Deno.env.get("LOVABLE_API_KEY");
  if (!key) return null;

  const userPrompt = `Article (${input.category}, ${input.source_name}):
Headline: ${input.headline}
Excerpt: ${input.excerpt ?? "(none)"}`;

  try {
    const res = await fetch(GATEWAY, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: "system", content: TAKE_SYSTEM },
          { role: "user", content: userPrompt },
        ],
        tools: [TAKE_TOOL],
        tool_choice: { type: "function", function: { name: "draft_buywise_take" } },
      }),
    });

    if (!res.ok) {
      console.error(`[intel-ai] draftTake gateway ${res.status}`);
      return null;
    }
    const data = await res.json();
    const args = data?.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
    if (!args) return null;
    const parsed = JSON.parse(args);
    return {
      take_label: String(parsed.take_label ?? "What This Means"),
      take_body: String(parsed.take_body ?? "").trim(),
    };
  } catch (e) {
    console.error("[intel-ai] draftTake threw:", e instanceof Error ? e.message : e);
    return null;
  }
}

// ----- Dedup helper: token-Jaccard on normalized title -----

function normalizeForDedup(s: string): Set<string> {
  const tokens = s
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .split(/\s+/)
    .filter((t) => t.length >= 3);
  const STOPWORDS = new Set([
    "the", "and", "for", "with", "from", "into", "that", "this", "are", "was", "were",
    "has", "have", "but", "not", "you", "say", "says", "said", "all", "new", "now",
  ]);
  return new Set(tokens.filter((t) => !STOPWORDS.has(t)));
}

export function jaccardSimilarity(a: string, b: string): number {
  const A = normalizeForDedup(a);
  const B = normalizeForDedup(b);
  if (A.size === 0 || B.size === 0) return 0;
  let inter = 0;
  for (const t of A) if (B.has(t)) inter++;
  const union = A.size + B.size - inter;
  return union === 0 ? 0 : inter / union;
}
