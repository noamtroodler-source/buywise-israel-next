// Shared AI enrichment helpers for BuyWise Intel.
// All calls route through Lovable AI Gateway using LOVABLE_API_KEY.

import { VOICE_GUIDANCE } from "./voice-rules.ts";

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
  category_confidence: number;
  relevance_score: number;
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
- headline_en: Clear, neutral English headline in the BuyWise "trusted friend" voice.
- excerpt_en: 1-2 plain-English sentences faithful to the original. Literal translation.
- category: pick ONE of: property-market, mortgage-rates, tax-legal, city-spotlight, new-developments, macro-economy, aliyah-immigration, policy-regulation, general.
- category_confidence: 0.0 to 1.0.
- relevance_score: 1 (out of scope) … 3 (background context) … 5 (must-read). BE STRICT.

Never include opinions or buyer advice — opinion belongs in the BuyWise Take, not here.`;

const ENRICH_TOOL = {
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

async function callGateway(body: unknown): Promise<any | null> {
  const key = Deno.env.get("LOVABLE_API_KEY");
  if (!key) {
    console.error("[intel-ai] LOVABLE_API_KEY missing");
    return null;
  }
  try {
    const res = await fetch(GATEWAY, {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      console.error(`[intel-ai] gateway ${res.status}`);
      return null;
    }
    return await res.json();
  } catch (e) {
    console.error("[intel-ai] gateway threw:", e instanceof Error ? e.message : e);
    return null;
  }
}

export async function enrichArticle(input: EnrichmentInput): Promise<EnrichmentResult | null> {
  const userPayload = {
    language: input.language,
    headline: input.headline,
    excerpt: input.excerpt ?? "",
  };
  const data = await callGateway({
    model: MODEL,
    messages: [
      { role: "system", content: SYSTEM },
      { role: "user", content: JSON.stringify(userPayload) },
    ],
    tools: [ENRICH_TOOL],
    tool_choice: { type: "function", function: { name: "enrich_intel_article" } },
  });
  const args = data?.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
  if (!args) return null;
  try {
    const parsed = JSON.parse(args);
    return {
      headline_en: String(parsed.headline_en ?? input.headline),
      excerpt_en: parsed.excerpt_en ? String(parsed.excerpt_en) : null,
      category: (CATEGORIES.includes(parsed.category) ? parsed.category : "general") as IntelCategory,
      category_confidence: Number(parsed.category_confidence ?? 0.5),
      relevance_score: Math.max(1, Math.min(5, Math.round(Number(parsed.relevance_score ?? 3)))),
    };
  } catch {
    return null;
  }
}

// ============================================================================
// Breakdown — 3-beat editorial reaction, auto-published
// ============================================================================

export const BREAKDOWN_LABELS = [
  "What This Means",
  "Buyer Impact",
  "Watch List",
  "Reality Check",
  "BuyWise View",
] as const;

const BREAKDOWN_SYSTEM = `You write BuyWise Breakdowns — a 3-beat editorial reaction below an Israeli real-estate news item, aimed at international buyers.

Structure: three short beats, each its own short paragraph.

1. SIGNAL — the one thing that actually moved. 1–2 sentences. Use a number from the source if there is one. State the change in plain terms.

2. WHY YOU CARE — the buyer-facing consequence. 1–2 sentences. Monthly payment, tax owed, timeline, neighborhood-level shift, financing risk. Concrete, not abstract.

3. OUR MOVE — what we are watching next. 1 sentence. NOT advice. NOT "you should…". This is what the BuyWise desk is tracking — a follow-up data point, a deadline, a confirming signal.

Hard limits:
- Total across all three beats: maximum 90 words. Aim for 75.
- Each beat: 1–2 sentences. Never 3.
- Never repeat the headline.
- If the article gives you nothing concrete (rumor, vague column), say so plainly in the SIGNAL beat and keep the Take short. Never invent numbers.

${VOICE_GUIDANCE}

Pick ONE take_label from: ${BREAKDOWN_LABELS.join(", ")} — the one that best fits the angle.`;

const BREAKDOWN_TOOL = {
  type: "function" as const,
  function: {
    name: "draft_buywise_breakdown",
    description: "Draft a 3-beat BuyWise Breakdown.",
    parameters: {
      type: "object",
      properties: {
        take_label: { type: "string", enum: BREAKDOWN_LABELS as unknown as string[] },
        signal: { type: "string" },
        why_you_care: { type: "string" },
        our_move: { type: "string" },
      },
      required: ["take_label", "signal", "why_you_care", "our_move"],
      additionalProperties: false,
    },
  },
};

export interface BreakdownInput {
  headline: string;
  excerpt?: string | null;
  category: string;
  source_name: string;
}

export interface BreakdownResult {
  take_label: string;
  signal: string;
  why_you_care: string;
  our_move: string;
}

export async function draftBreakdown(input: BreakdownInput): Promise<BreakdownResult | null> {
  const userPrompt = `Article (${input.category}, source: ${input.source_name}):
Headline: ${input.headline}
Excerpt: ${input.excerpt ?? "(none provided)"}

Write the 3-beat Breakdown.`;

  const data = await callGateway({
    model: MODEL,
    messages: [
      { role: "system", content: BREAKDOWN_SYSTEM },
      { role: "user", content: userPrompt },
    ],
    tools: [BREAKDOWN_TOOL],
    tool_choice: { type: "function", function: { name: "draft_buywise_breakdown" } },
  });
  const args = data?.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
  if (!args) return null;
  try {
    const parsed = JSON.parse(args);
    return {
      take_label: String(parsed.take_label ?? "What This Means"),
      signal: String(parsed.signal ?? "").trim(),
      why_you_care: String(parsed.why_you_care ?? "").trim(),
      our_move: String(parsed.our_move ?? "").trim(),
    };
  } catch {
    return null;
  }
}

// Legacy export — old draft-intel-take callers expect this shape.
export interface DraftTakeInput extends BreakdownInput {}
export interface DraftTakeResult { take_label: string; take_body: string }
export async function draftTake(input: DraftTakeInput): Promise<DraftTakeResult | null> {
  const b = await draftBreakdown(input);
  if (!b) return null;
  return {
    take_label: b.take_label,
    take_body: [b.signal, b.why_you_care, b.our_move].filter(Boolean).join("\n\n"),
  };
}

// ============================================================================
// Deep Read classifier — does this story deserve a long-form editorial?
// ============================================================================

const DEEP_READ_RUBRIC = [
  "regulatory_legal_change",
  "material_market_move",
  "international_buyer_impact",
  "major_project_or_policy",
  "risk_warning_signal",
] as const;

const CLASSIFY_SYSTEM = `You are the editorial gatekeeper for BuyWise Deep Reads — 250-word analytical pieces reserved for stories that materially affect international buyers in Israel.

Score the article against this rubric. Mark any that clearly apply:
- regulatory_legal_change: new tax bracket, Mas Rechisha reform, mortgage rule change, foreign-buyer law
- material_market_move: BoI rate change, national index >2% move, single-city >5% shift, major listing-volume pivot
- international_buyer_impact: Olim tax benefit change, currency control, residency requirement, FX shift big enough to change typical buying power
- major_project_or_policy: TAMA reform, large infrastructure (train, port, highway) shifting demand, ministry-level housing initiative
- risk_warning_signal: bubble warning from credible body, developer insolvency, fraud pattern, supply collapse

Disqualifiers — return deserves_deep_read=false even if a rubric item hits:
- The article is speculation, an opinion column, or a single analyst quote
- The article is older than 7 days at fetch time (the user passes published_at)
- The source excerpt is very thin (under ~30 words) — there isn't enough to analyze
- The story is one we'd struggle to verify from the excerpt alone

An article qualifies only if it hits 2+ rubric items AND has no disqualifiers AND your confidence is >= 0.80.

Be strict. Most articles should NOT qualify. The bar is "would a busy international buyer thank us for reading this?"`;

const CLASSIFY_TOOL = {
  type: "function" as const,
  function: {
    name: "classify_deep_read",
    description: "Decide if an article warrants a Deep Read.",
    parameters: {
      type: "object",
      properties: {
        deserves_deep_read: { type: "boolean" },
        rubric_hits: { type: "array", items: { type: "string", enum: DEEP_READ_RUBRIC as unknown as string[] } },
        confidence: { type: "number", minimum: 0, maximum: 1 },
        rationale: { type: "string" },
      },
      required: ["deserves_deep_read", "rubric_hits", "confidence", "rationale"],
      additionalProperties: false,
    },
  },
};

export interface ClassifyInput extends BreakdownInput {
  published_at: string;
}

export interface ClassifyResult {
  deserves_deep_read: boolean;
  rubric_hits: string[];
  confidence: number;
  rationale: string;
}

export async function classifyDeepRead(input: ClassifyInput): Promise<ClassifyResult | null> {
  const userPrompt = `Article (${input.category}, source: ${input.source_name}, published: ${input.published_at}):
Headline: ${input.headline}
Excerpt: ${input.excerpt ?? "(none provided)"}`;
  const data = await callGateway({
    model: MODEL,
    messages: [
      { role: "system", content: CLASSIFY_SYSTEM },
      { role: "user", content: userPrompt },
    ],
    tools: [CLASSIFY_TOOL],
    tool_choice: { type: "function", function: { name: "classify_deep_read" } },
  });
  const args = data?.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
  if (!args) return null;
  try {
    const p = JSON.parse(args);
    return {
      deserves_deep_read: Boolean(p.deserves_deep_read),
      rubric_hits: Array.isArray(p.rubric_hits) ? p.rubric_hits.map(String) : [],
      confidence: Number(p.confidence ?? 0),
      rationale: String(p.rationale ?? ""),
    };
  } catch {
    return null;
  }
}

// ============================================================================
// Deep Read drafter — structured long-form, queued for admin review
// ============================================================================

const DEEP_READ_SECTIONS = ["context", "what_changed", "numbers", "what_to_watch", "caveats"] as const;

const DEEP_READ_SYSTEM = `You write BuyWise Deep Reads — 250-400 word structured analyses for stories that materially affect international buyers in Israel.

Structure — five short labeled sections in order:

1. context (2-3 sentences): What's the backdrop? Why is this happening now?
2. what_changed (2-3 sentences): The concrete change. Old state → new state. Use the source's own numbers.
3. numbers (2-4 sentences): The figures that matter — rate, percentage, ₪ amount, timeline. If the article doesn't give you the number, name what we'd need to know.
4. what_to_watch (2-3 sentences): What signals tell us whether this lands or fizzles. NOT advice. NOT predictions. Forward-looking observation only.
5. caveats (1-2 sentences): What we don't yet know. What's unverified. Where international buyers should be wary. ALWAYS include caveats — every story has them.

Hard limits:
- Total across all five sections: 250-400 words.
- Each section is 1-4 sentences. No section may be empty.
- "numbers" must reference at least one specific figure from the source — if none exists, say so plainly.
- "caveats" must name a real uncertainty. Never write "no caveats". If everything were known, this wouldn't need a Deep Read.

${VOICE_GUIDANCE}`;

const DEEP_READ_TOOL = {
  type: "function" as const,
  function: {
    name: "draft_buywise_deep_read",
    description: "Draft a structured BuyWise Deep Read.",
    parameters: {
      type: "object",
      properties: {
        take_label: { type: "string", enum: BREAKDOWN_LABELS as unknown as string[] },
        sections: {
          type: "object",
          properties: {
            context: { type: "string" },
            what_changed: { type: "string" },
            numbers: { type: "string" },
            what_to_watch: { type: "string" },
            caveats: { type: "string" },
          },
          required: DEEP_READ_SECTIONS as unknown as string[],
          additionalProperties: false,
        },
      },
      required: ["take_label", "sections"],
      additionalProperties: false,
    },
  },
};

export interface DeepReadResult {
  take_label: string;
  sections: { context: string; what_changed: string; numbers: string; what_to_watch: string; caveats: string };
}

export async function draftDeepRead(input: BreakdownInput): Promise<DeepReadResult | null> {
  const userPrompt = `Article (${input.category}, source: ${input.source_name}):
Headline: ${input.headline}
Excerpt: ${input.excerpt ?? "(none provided)"}

Write the structured Deep Read.`;
  const data = await callGateway({
    model: MODEL,
    messages: [
      { role: "system", content: DEEP_READ_SYSTEM },
      { role: "user", content: userPrompt },
    ],
    tools: [DEEP_READ_TOOL],
    tool_choice: { type: "function", function: { name: "draft_buywise_deep_read" } },
  });
  const args = data?.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
  if (!args) return null;
  try {
    const p = JSON.parse(args);
    const s = p.sections ?? {};
    return {
      take_label: String(p.take_label ?? "BuyWise View"),
      sections: {
        context: String(s.context ?? "").trim(),
        what_changed: String(s.what_changed ?? "").trim(),
        numbers: String(s.numbers ?? "").trim(),
        what_to_watch: String(s.what_to_watch ?? "").trim(),
        caveats: String(s.caveats ?? "").trim(),
      },
    };
  } catch {
    return null;
  }
}

export function deepReadToBody(r: DeepReadResult): string {
  return [r.sections.context, r.sections.what_changed, r.sections.numbers, r.sections.what_to_watch, r.sections.caveats]
    .filter(Boolean)
    .join("\n\n");
}

// ============================================================================
// Dedup helper — Jaccard on normalized title tokens
// ============================================================================

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
