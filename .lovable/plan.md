

## Fix: Chatbot Giving Wrong Agent Registration Info

### Problem
The chatbot tells users that individual agents can sign up independently. This is **wrong** — the platform uses an agency-first model where agencies register first, then invite agents via unique invite links. The chatbot has no guidance about this in its system prompt.

### Root Cause
The `SYSTEM_PROMPT_IDENTITY` in `supabase/functions/ask-buywise/index.ts` has zero information about:
1. The agency-first registration model
2. How agents join (invite links only)
3. The `/for-agents` and `/advertise` pages
4. What to say when someone asks about becoming an agent

Additionally, `src/hooks/usePageContext.ts` has no context entries for `/for-agents` or `/advertise` pages, so when a user opens the chatbot on those pages, it gets no relevant context.

### Changes

**1. Add registration rules to system prompt** (`supabase/functions/ask-buywise/index.ts`)

Add a new section to `SYSTEM_PROMPT_IDENTITY` after the Guardrails section:

```
## CRITICAL: Agent & Agency Registration Rules (NEVER get this wrong)
- Agencies register first at /advertise. Individual agents CANNOT register independently.
- Agents join ONLY via a unique invite link provided by their agency.
- If someone asks about becoming an agent: tell them their agency needs to sign up first at [Advertise with BuyWise](/advertise), then the agency admin will send them an invite link.
- If someone says they ARE an agency or want to list properties as a company: direct them to [Advertise with BuyWise](/advertise).
- NEVER say agents can "create their own accounts" or "sign up independently."
- NEVER link to /agent/register directly — that page requires an invite code.
```

**2. Add page context for /for-agents and /advertise** (`src/hooks/usePageContext.ts`)

Add two new route handlers so the chatbot knows what page the user is on:

- `/for-agents`: Description "Viewing the For Agents page", suggestions like "How do I join as an agent?", "What features do agents get?", "How does my agency sign up?"
- `/advertise`: Description "Viewing the Advertise page", suggestions like "How do I register my agency?", "What does BuyWise offer agencies?", "How do I invite my agents?"

### Files Modified
1. `supabase/functions/ask-buywise/index.ts` — add registration rules section to system prompt
2. `src/hooks/usePageContext.ts` — add `/for-agents` and `/advertise` page contexts

