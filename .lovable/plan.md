

# Ask BuyWise — Phase 2

Phase 1 delivered: AI chat via edge function, streaming responses, context-aware suggestions, responsive popover/drawer UI.

Phase 2 focuses on **persistence, personalization, and polish**.

---

## 1. Chat History Persistence (Database)

Currently, chat state is in-memory only — lost on page refresh. Store conversations so users can resume.

- Create `chat_conversations` table (id, user_id nullable, guest_id, page_context, created_at, updated_at)
- Create `chat_messages` table (id, conversation_id FK, role, content, created_at)
- RLS: authenticated users see their own; guests matched by guest_id via edge function
- On send, persist each user message and completed assistant response
- On load, restore the latest active conversation

## 2. Buyer Profile Context Injection

Logged-in users have profiles with buyer preferences (budget, cities of interest, buyer status like oleh/foreign/resident). Inject this into the system prompt so the AI gives personalized answers without the user repeating themselves.

- Read profile data in the edge function (pass user auth token)
- Append a `## Your Buyer Profile` section to the system prompt with budget range, preferred cities, buyer type, etc.

## 3. Conversation Starters Per Page

Enhance the current static suggestion chips with smarter, more dynamic starters:

- On property/project detail pages, include the listing price, city, and type in context so suggestions like "Is ₪2.1M fair for a 3BR in Ra'anana?" become possible
- Pass structured page data (not just a description string) to the edge function

## 4. Link Handling in Chat

AI responses contain markdown links to guides and tools (e.g., `[Purchase Tax Guide](/guides/purchase-tax)`). Currently these render as `<a>` tags that do full page navigations.

- Use `react-markdown` components override to render internal links with `react-router` `Link` or `useNavigate`, keeping SPA navigation
- External links open in new tab

## 5. Feedback & Rating

Let users rate AI responses so you can monitor quality:

- Add thumbs up/down buttons on each assistant message
- Create `chat_feedback` table (id, message_id FK, rating `good`/`bad`, created_at)
- No RLS needed — insert-only, no user FK required (anonymous feedback ok)

## 6. Analytics Integration

Track chat usage in the existing analytics system:

- Fire events: `chat_opened`, `chat_message_sent`, `chat_feedback_given`
- Use existing `trackEvent` from `@/lib/analytics`

---

## Database Changes

```sql
-- Chat conversations
CREATE TABLE public.chat_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  guest_id TEXT,
  page_context TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES public.chat_conversations(id) ON DELETE CASCADE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.chat_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID REFERENCES public.chat_messages(id) ON DELETE CASCADE NOT NULL,
  rating TEXT NOT NULL CHECK (rating IN ('good', 'bad')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS
ALTER TABLE public.chat_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_feedback ENABLE ROW LEVEL SECURITY;

-- Conversations: users see own, guests handled server-side
CREATE POLICY "Users read own conversations"
  ON public.chat_conversations FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users insert own conversations"
  ON public.chat_conversations FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Messages: via conversation ownership
CREATE POLICY "Users read own messages"
  ON public.chat_messages FOR SELECT TO authenticated
  USING (conversation_id IN (
    SELECT id FROM public.chat_conversations WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users insert own messages"
  ON public.chat_messages FOR INSERT TO authenticated
  WITH CHECK (conversation_id IN (
    SELECT id FROM public.chat_conversations WHERE user_id = auth.uid()
  ));

-- Feedback: anyone can insert
CREATE POLICY "Anyone can leave feedback"
  ON public.chat_feedback FOR INSERT TO anon, authenticated
  WITH CHECK (true);
```

## Files Changed

| File | Change |
|------|--------|
| `supabase/migrations/new` | Tables + RLS above |
| `src/hooks/useAskBuyWise.ts` | Add persistence (save/load conversations), return message IDs for feedback |
| `src/components/shared/AskBuyWise.tsx` | Add feedback buttons on assistant bubbles, SPA link handling, analytics events |
| `supabase/functions/ask-buywise/index.ts` | Accept auth token, fetch buyer profile, inject into system prompt |
| `src/hooks/usePageContext.ts` | Return structured data (price, city, type) alongside description |

## Implementation Order

1. Database migration (tables + RLS)
2. Conversation persistence in hook
3. Buyer profile injection in edge function
4. Feedback UI + table writes
5. SPA link handling in markdown
6. Analytics event tracking

