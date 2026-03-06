

## Full Rewrite: Mortgages in Israel for Foreign Buyers

### Problem
The current guide (674 lines, 11 sections) is overwhelming, repetitive, and mismatched with the lean, data-driven style of other guides. Multiple sections say the same thing ("pre-approval isn't binding" appears 4 times). The "Assumptions," "Surprises," "Why Non-Committal," and "Interactions" sections all cover the same territory. No hard numbers. No mention of mortgage brokers as a practical recommendation.

### New Structure: 5 Sections

```text
┌─────────────────────────────────────┐
│ Hero (badge, title, 5 sections,     │
│ ~15 min read, Updated 2026)         │
├─────────────────────────────────────┤
│ 1. Overview                         │
│    - One-Sentence Reality callout   │
│    - 2-col stat cards:              │
│      "50-70% max LTV" | "40% DTI"  │
│    - One paragraph: reversed        │
│      sequence explained             │
├─────────────────────────────────────┤
│ 2. The Hard Numbers                 │
│    - LTV by buyer status table      │
│      (75% first-home, 70% upgrader, │
│       50% foreign, up to 70% strong │
│       foreign profiles)             │
│    - DTI: 40% net income cap        │
│    - Costs: ₪360 file fee,          │
│      ₪2,500-4,000 appraisal         │
│    - Olim Zakaut: ~3% fixed CPI,    │
│      no prepayment penalty           │
│    - Multi-track structure table:    │
│      Prime, Fixed, CPI-linked,      │
│      Foreign-currency with rate      │
│      ranges and risk levels          │
├─────────────────────────────────────┤
│ 3. The Process (vertical timeline)  │
│    5 steps: Indicative Assessment → │
│    Contract + Deposit → Appraisal + │
│    Underwriting → Final Approval +  │
│    Lien → Repayments Begin          │
│    (reuse existing timeline pattern)│
├─────────────────────────────────────┤
│ 4. What Catches Foreign Buyers      │
│    Off Guard (Accordion, 5 items)   │
│    - Pre-approval isn't binding     │
│    - No financing contingency       │
│    - Appraisals can fall short      │
│    - Banks treat each profile       │
│      differently                    │
│    - Documentation is extensive     │
│      and locally oriented           │
│    Each accordion item: 2-3 lines   │
│    of concrete explanation          │
├─────────────────────────────────────┤
│ 5. Working With a Mortgage Broker   │
│    - Why it matters for foreigners  │
│    - What they do: compare banks,   │
│      negotiate terms, handle docs   │
│    - Typical cost: 0.3-0.5% of     │
│      loan amount                    │
│    - CTA card → /professionals      │
│      (filtered to mortgage_broker)  │
├─────────────────────────────────────┤
│ Bottom CTAs (3 cards):              │
│  Mortgage Calculator | True Cost    │
│  Guide | Professionals Directory    │
└─────────────────────────────────────┘
```

### What Gets Deleted
- **"Common Assumptions" (16 cards)** — every item is addressed in "What Catches Buyers Off Guard"
- **"Buyer Status Reality Check" (4 cards)** — LTV table in "Hard Numbers" covers this with actual data
- **"What Banks Evaluate" (5 cards)** — generic ("banks look at income"); the concrete version lives in the Process and Hard Numbers sections
- **"Surprises" (10 items)** — merged into 5 accordion items
- **"Why Non-Committal" + "Interactions"** — the accordion item on "pre-approval isn't binding" + the process timeline explain this concretely
- **"How BuyWise Helps" (4 cards)** — self-promotional
- **"Calm Closing Reframe"** — filler

### Content Fixes
- **LIBOR → "benchmark rate"** in foreign-currency track description
- **DTI standardized to 40%** per Bank of Israel Directive 329
- **"Pre-approval is indicative" + "No rate locks"** merged into one accordion item
- Hero subtitle "How It Actually Works" removed (redundant with h1)
- Hero uses `Badge` component like TrueCost/PurchaseTax guides

### Design Patterns (matching other guides)
- `whileInView` animations (not just `animate`)
- `cn()` for conditional nav pill styles
- Accordion component for "What Catches Buyers Off Guard" (already installed)
- Vertical timeline with numbered circles for Process
- Stat cards with large primary-colored numbers for Hard Numbers
- `GuideCTACard`-style link to professionals page in the broker section

### Files Changed
1. **`src/pages/guides/MortgagesGuide.tsx`** — full rewrite, ~674 → ~380 lines
2. **`src/pages/Guides.tsx`** — already updated (chaptersCount: 6 → 5)

No new dependencies. No new components.

