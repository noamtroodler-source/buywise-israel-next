

# Move Article Summary Below Content + AI Generate Option

## What changes

**File: `src/components/blog/wizard/StepContent.tsx`**

1. **Move the Article Summary section** from above the content textarea to below the AI Format & Polish section and Writing Tips
2. **Add "Generate with AI" button** next to the summary label — calls the existing `format-blog-content` edge function (or a lightweight variant) with a prompt to produce a 1-2 sentence summary from the article content
3. Button disabled when content has < 50 words (same threshold as format)

**File: `supabase/functions/format-blog-content/index.ts`**

4. Add a `mode` parameter to the existing edge function: when `mode === 'summary'`, use a prompt that returns just a 1-2 sentence excerpt instead of full formatting. This avoids creating a separate edge function.

## Layout order (after change)

1. Article Content textarea + word count
2. AI Format & Polish button + preview panel
3. Writing Tips card
4. **Article Summary** — textarea with "Generate with AI" sparkle button inline in the label row, character counter below

## AI summary UX
- Small outline button with Sparkles icon: "Generate Summary"
- On click: calls edge function with `mode: 'summary'`, shows loader in the button
- Result auto-fills the excerpt textarea (user can edit after)
- If excerpt already has text, shows a confirm toast or just replaces (keeps it simple)

