

## Improve Ask BuyWise Chatbot — Phased Implementation

### Phase 1: New Tools — Affordability Calculator + Rental Yield (Backend)
Add two new tools to the edge function that the AI can call inline during conversation.

**`calculate_affordability` tool**
- Accepts: monthly income, existing debts, down payment, currency, buyer type
- Uses DB `calculator_constants` for LTV/PTI limits (same logic as `useAffordability` hook)
- Returns: max property price range, max mortgage range (4.5-6% rate spread), monthly payment estimate, down payment required, and a comfort level tag
- Links to `/tools?tool=affordability`

**`calculate_rental_yield` tool**
- Accepts: property price, city, bedrooms (optional)
- Pulls rental ranges from `cities` table (`rental_3_room_min/max`, `rental_4_room_min/max`)
- Returns: gross yield %, net yield estimate, monthly rental range, comparison to city average
- Labels estimates as "BuyWise Estimate"

**Files changed:**
- `supabase/functions/ask-buywise/index.ts` — add tool definitions + executors + router entries

---

### Phase 2: New Tool — Compare Listings (Backend)
Add a `compare_listings` tool for side-by-side property comparison.

- Accepts: array of 2-3 property IDs
- Fetches full details for each, builds a structured comparison (price, size, price/sqm, bedrooms, floor, condition, neighborhood, features)
- Returns a formatted comparison object the AI renders as a markdown table
- Links to `/compare?ids=x,y&category=resale`

**Files changed:**
- `supabase/functions/ask-buywise/index.ts` — add tool definition + executor

---

### Phase 3: Context-Aware Starter Prompts (Frontend)
Improve `usePageContext` to generate smarter, more specific suggestions based on page data.

- **Property page**: Use actual price, city, bedrooms to generate "Is ₪X.XM fair for a YBR in Z?" instead of generic text. Add "Compare with similar listings" and "What's my total cost at ₪X.XM?"
- **Area page**: Pull city name from URL slug, add "What neighborhoods should I consider in [City]?" and "Show me listings under ₪X in [City]"
- **Tools page**: After calculator use, suggest "Ask BuyWise to explain these results"
- **Project page**: Add "What guarantees should I get?" and "Compare this with resale options in [City]"

**Files changed:**
- `src/hooks/usePageContext.ts` — enrich suggestion builders with more specific, data-driven prompts

---

### Phase 4: UX Polish — Response Length Awareness + Save Answer (Frontend)
Small but impactful UX improvements to the chat panel.

**Typing indicator improvement**: Show "Searching listings..." or "Calculating..." text during tool execution instead of generic dots (requires a small SSE metadata change or a pre-message insertion).

**"Copy Answer" button**: Add a small copy icon on assistant messages so users can save useful answers (clipboard copy).

**Disclaimer footer**: Add a subtle "Always verify with a professional" one-liner below the input, replacing the header subtitle to declutter.

**Files changed:**
- `src/components/shared/AskBuyWise.tsx` — add copy button to ChatBubble, update disclaimer placement

---

### Phase 5: Hebrew Glossary Inline Tool (Backend)
Add a `explain_term` tool so the AI can pull exact definitions from the `glossary_terms` table on demand.

- Accepts: term (English or Hebrew)
- Searches `glossary_terms` by `english_term`, `hebrew_term`, or `transliteration` (ilike)
- Returns: hebrew, transliteration, simple explanation, detailed explanation, category
- More reliable than the system prompt glossary dump (which is truncated at 50 terms)

**Files changed:**
- `supabase/functions/ask-buywise/index.ts` — add tool definition + executor

---

### Implementation Order
1. **Phase 1** (affordability + yield tools) — highest user impact
2. **Phase 3** (context-aware prompts) — quick frontend win
3. **Phase 2** (compare listings tool)
4. **Phase 4** (UX polish)
5. **Phase 5** (glossary tool)

Each phase is independently deployable and testable.

