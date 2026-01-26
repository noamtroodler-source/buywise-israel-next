

# Update PlatformPromise Section

## Summary

Update the quote/mission statement in the PlatformPromise section with new copy and styling.

---

## Branding Answer

**"BuyWise Israel"** (with a space) is the correct format. This is consistently used across:
- Page titles and meta tags
- Footer copyright
- Marketing content
- Hero sections

The no-space version (`BuyWiseIsrael`) only appears in technical contexts like User-Agent headers and the domain name.

---

## Text Change

**Current:**
> BuyWise isn't a brokerage. It's a starting point — designed to help you **explore with clarity**, not pressure.

**New:**
> Buying or renting in **Israel** no longer has to feel overwhelming. BuyWise Israel brings clarity and confidence to the entire journey — without pressure.

---

## Styling Change

| Element | Current | New |
|---------|---------|-----|
| Main text | `text-foreground` (dark gray) | Black (`text-foreground` works, already near-black) |
| Highlighted word | "explore with clarity" in primary (blue) | "Israel" in primary (blue) |
| Link text | "How BuyWise works" | Could update to "How BuyWise Israel works" for consistency |

---

## Implementation

**File:** `src/components/home/PlatformPromise.tsx`

### Line 22-25: Update the paragraph text

```tsx
<p className="text-xl md:text-2xl lg:text-3xl font-medium text-foreground leading-relaxed -mt-6">
  Buying or renting in <span className="text-primary">Israel</span> no longer has to feel 
  overwhelming. BuyWise Israel brings clarity and confidence to the entire journey — without pressure.
</p>
```

### Line 31: Update the link text (optional but recommended)

```tsx
How BuyWise Israel works
```

---

## Files to Modify

| File | Change |
|------|--------|
| `src/components/home/PlatformPromise.tsx` | Update quote text and highlight "Israel" instead of "explore with clarity" |

---

## Result

The PlatformPromise section will display the new messaging with consistent "BuyWise Israel" branding and "Israel" highlighted in the primary blue color.

