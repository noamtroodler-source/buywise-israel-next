

# Phase 1: "Ask BuyWise" AI Assistant

## Overview
Replace the floating WhatsApp button with a branded, context-aware AI chat assistant. It streams responses via Lovable AI (Gemini 3 Flash), knows what page the user is on, and speaks in the BuyWise "trusted friend" tone. Grounded in platform knowledge (guides, glossary, tools, tax brackets) — not generic chat.

## What Gets Built

### 1. Edge Function: `ask-buywise`
- Accepts `{ messages, pageContext }` from the client
- Builds a rich system prompt with:
  - BuyWise brand voice instructions ("warm professional, like a knowledgeable friend")
  - Knowledge base: guide summaries, tool descriptions, glossary terms (fetched from DB on each request for freshness)
  - Calculator constants (tax brackets, exchange rates) fetched from `calculator_constants` table
  - Page context injected (e.g., "User is viewing a property in Haifa, 3BR, ₪1.8M")
  - Guardrails: "If unsure, say so and link to relevant guide. Never invent tax rates or legal advice."
- Streams response via SSE using Lovable AI gateway (`google/gemini-3-flash-preview`)
- Handles 429/402 errors gracefully
- Rate limiting: simple per-session throttle (max 5 messages/minute via in-memory tracking)

### 2. Frontend: Chat Drawer Component
- **`AskBuyWiseButton`** — replaces `FloatingWhatsApp`, branded bubble with BuyWise logo/icon, "Ask BuyWise" tooltip
- **`AskBuyWiseDrawer`** — uses existing vaul `Drawer` component (mobile) / side sheet (desktop)
  - Header: "Ask BuyWise" with close button and disclaimer
  - Message list with markdown rendering (`react-markdown`)
  - Contextual starter suggestions based on current page (2-3 chips)
  - Input bar with send button
  - Streaming token-by-token rendering
  - Session-scoped conversation (no persistence needed for Phase 1)
  - Max 20 messages per session with friendly limit message

### 3. Page Context Hook
- **`usePageContext`** — reads current route + any loaded property/project/area data from the page
  - On `/property/:id` → extracts property details from existing query cache
  - On `/tools?tool=mortgage` → "User is using the mortgage calculator"
  - On `/guides/purchase-tax` → "User is reading the Purchase Tax Guide"
  - On `/areas` → "User is browsing market areas"
  - On homepage → generic "browsing the platform"

### 4. Contextual Suggestions
Based on route, show smart starter prompts:
- **Property page**: "Is this fairly priced?" / "What costs am I missing?" / "What should I ask the agent?"
- **Area page**: "Is this a good area for investment?" / "What's the rental yield here?"
- **Guide page**: "Summarize the key takeaways" / "What should I do next?"
- **Calculator page**: "What do these numbers mean?" / "Am I missing any costs?"
- **Homepage/general**: "Where do I start?" / "What taxes will I pay?" / "How do mortgages work for foreigners?"

## Files Created/Modified

| File | Action |
|---|---|
| `supabase/functions/ask-buywise/index.ts` | Create — edge function with streaming |
| `supabase/config.toml` | Add `[functions.ask-buywise]` entry |
| `src/components/shared/AskBuyWise.tsx` | Create — button + drawer + chat UI |
| `src/hooks/useAskBuyWise.ts` | Create — streaming chat logic + message state |
| `src/hooks/usePageContext.ts` | Create — route-aware context extraction |
| `src/components/shared/FloatingWhatsApp.tsx` | Delete (replaced) |
| `src/components/layout/Layout.tsx` | Swap `FloatingWhatsApp` → `AskBuyWiseButton` |

## System Prompt Strategy (Edge Function)

The system prompt will be structured in sections:
1. **Identity & tone** — "You are BuyWise, a knowledgeable friend helping people buy property in Israel..."
2. **Knowledge base** — Guide titles + summaries, glossary terms, tool descriptions (fetched from DB)
3. **Live data** — Current exchange rate, tax brackets from `calculator_constants`
4. **Page context** — Injected per-request based on what the user is viewing
5. **Guardrails** — "Never fabricate numbers. Link to guides. Suggest professional consultation for legal/tax specifics. Keep answers concise (2-4 paragraphs max)."

## What This Does NOT Include (Phase 2+)
- Property-specific price data injection (comps, price history)
- Conversation persistence for logged-in users
- Analytics logging of questions
- Lead conversion flows
- Cached FAQ responses

