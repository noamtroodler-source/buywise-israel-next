

## Plan: Add FAQ Accordion to Featured Listings Page

**Where:** `src/components/billing/FeaturedListingsManager.tsx`

**Placement:** After the summary card (and founding partner card if present), **before** the listings table. This ensures visibility regardless of listing count.

**Component:** Use the existing `Accordion` component from `@/components/ui/accordion` — collapsible, clean, matches branding.

**6 FAQ Items:**

1. **"How does featured placement work?"** — Featured badge + priority positioning in search, city pages, homepage carousel. Session-based rotation ensures equal exposure.

2. **"How is rotation fair across agencies?"** — Session-based rotation, no fixed top slots, every featured listing gets roughly equal screen time.

3. **"How much more visibility will my listing get?"** — Appears above standard results with visual badge. Featured listings receive significantly more views and inquiry clicks.

4. **"Is there a limit on how many listings I can feature?"** — No limit. Each costs ₪299/mo.

5. **"Can I turn it on and off anytime?"** — Yes, activate/deactivate instantly. No long-term commitment, no cancellation fees.

6. **"When does billing start?"** — Billing begins on activation, recurs monthly. Cancel anytime.

**Styling:** Wrapped in a `Card` with `rounded-2xl border-primary/10`, header with `HelpCircle` icon, accordion items with clean dividers. Matches existing card styling on the page.

