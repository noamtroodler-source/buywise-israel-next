

# Ask BuyWise — Phase 3: Smart Context, Lead Conversion & Conversation Management

Phase 1 delivered the AI chat engine. Phase 2 added persistence, profile injection, feedback, and SPA links. Phase 3 focuses on making the assistant **smarter per page**, **conversion-ready**, and **multi-conversation aware**.

---

## 1. Structured Page Context (Property/Project Data Injection)

Currently `usePageContext` returns generic descriptions like "Viewing a property listing." The AI has no idea *which* property or its price/city/type.

**Change:** On property and project detail pages, pass structured data (price, city, bedrooms, property type, project name) into the context so the AI can give specific advice like "₪2.1M for a 3BR in Ra'anana is slightly above median."

- Update `usePageContext` to accept optional structured data (price, city, type, bedrooms, name)
- On property detail pages, the parent component passes listing data into context
- On project detail pages, pass project name, city, price range
- Edge function already receives `pageContext` — just make it richer
- Dynamic suggestion chips: "Is ₪X fair for [city]?", "What are the hidden costs on a ₪X purchase?"

**Files:** `src/hooks/usePageContext.ts`, property/project detail pages (to pass data)

## 2. Conversation List & Management

Currently, only the latest conversation loads. Users can't browse past chats or start a new one while keeping history.

- Add a "History" button in the chat header (for authenticated users)
- Show a simple list of past conversations (date + first user message preview)
- Clicking a conversation loads it; "New Chat" creates a fresh one
- Add a `title` column to `chat_conversations` (auto-set from first user message, truncated)

**Files:** `src/components/shared/AskBuyWise.tsx` (history panel), `src/hooks/useAskBuyWise.ts` (list/load conversations), migration for `title` column

## 3. Lead Conversion CTAs in Chat

When the AI discusses a specific property or suggests next steps, surface actionable buttons inline:

- After property-specific answers: "Book a viewing" / "Ask the agent" button linking to the inquiry flow
- After calculator-related answers: "Try the calculator" button
- After guide references: "Read the full guide" button
- Implemented as a post-processing step: detect patterns in AI responses and append CTA buttons below the message

**Files:** `src/components/shared/AskBuyWise.tsx` (CTA renderer below messages)

## 4. Suggested Follow-ups

After each AI response, show 2-3 contextual follow-up suggestions (not just on empty state).

- Edge function returns suggested follow-ups by adding instructions to the system prompt: "End each response with 2-3 suggested follow-up questions in a `[SUGGESTIONS]` block"
- Parse the `[SUGGESTIONS]` block out of the displayed content and render as chips below the response
- Falls back to empty if the AI doesn't include them

**Files:** `supabase/functions/ask-buywise/index.ts` (prompt update), `src/components/shared/AskBuyWise.tsx` (follow-up chip rendering), `src/hooks/useAskBuyWise.ts` (parsing logic)

## 5. Guest-to-Auth Nudge

Guest users hit the 20-message limit with no path forward. After 5 messages (or at limit), show a soft nudge to sign up for unlimited chat + history.

- Check auth state in the hook
- After N messages for guests, render a signup nudge banner in the chat
- Link to `/signup` with return URL

**Files:** `src/components/shared/AskBuyWise.tsx` (nudge banner)

---

## Database Changes

```sql
-- Add title to conversations for history list
ALTER TABLE public.chat_conversations ADD COLUMN title TEXT;

-- Update policy to allow users to read conversation titles
-- (existing SELECT policy already covers this)
```

## Implementation Order

1. Database migration (title column)
2. Structured page context with dynamic suggestions
3. Suggested follow-ups (prompt + parsing)
4. Conversation history panel
5. Lead conversion CTAs
6. Guest signup nudge

## Files Changed Summary

| File | Change |
|------|--------|
| `supabase/migrations/new` | Add `title` column to `chat_conversations` |
| `src/hooks/usePageContext.ts` | Accept structured property/project data, dynamic suggestions |
| `src/hooks/useAskBuyWise.ts` | Parse follow-ups, list conversations, set title |
| `src/components/shared/AskBuyWise.tsx` | History panel, follow-up chips, CTA buttons, guest nudge |
| `supabase/functions/ask-buywise/index.ts` | Add follow-up instruction to system prompt |
| Property/project detail pages | Pass structured data to context |

