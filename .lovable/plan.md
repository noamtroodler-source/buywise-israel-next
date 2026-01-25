
# Fix Double Bullet Points in Blog Preview

## Problem Identified

When using the "AI Format & Polish" feature, bullet points appear **doubled** in the Review step. 

**Why it happens:**
1. AI returns markdown with `- ` bullet syntax
2. The `renderContent()` function in `StepReview.tsx` converts `- Item` to `<li class="ml-4">• Item</li>` (adds a literal `•` character)
3. The content is rendered inside a `<div className="prose prose-sm">` container
4. Tailwind's prose styling automatically adds CSS bullets (`::marker`) to all `<li>` elements
5. Result: Two bullets appear - one from the HTML `•` character, one from the CSS

```text
Before (current):  • • Research neighborhoods
After (fixed):     • Research neighborhoods
```

---

## Solution

Remove the explicit `•` character from the regex replacement and instead wrap list items in proper `<ul>` tags so the prose styling handles bullet display consistently.

---

## Technical Changes

### File: `src/components/blog/wizard/StepReview.tsx`

**Current code (line 30):**
```tsx
.replace(/^- (.*$)/gm, '<li class="ml-4">• $1</li>')
```

**Fixed code:**
```tsx
.replace(/^- (.*$)/gm, '<li>$1</li>')
```

Additionally, we need to wrap consecutive `<li>` elements in `<ul>` tags so they render correctly. This requires a more robust approach:

**Improved `renderContent` function:**
```tsx
const renderContent = (content: string) => {
  // First, handle block-level elements
  let html = content
    // Headers
    .replace(/^### (.*$)/gm, '</p><h3 class="text-lg font-semibold mt-6 mb-2">$1</h3><p class="mb-4">')
    .replace(/^## (.*$)/gm, '</p><h2 class="text-xl font-bold mt-8 mb-3">$1</h2><p class="mb-4">')
    .replace(/^# (.*$)/gm, '</p><h1 class="text-2xl font-bold mt-8 mb-4">$1</h1><p class="mb-4">')
    // Bold and italic
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    // Lists - just mark them, we'll wrap in <ul> next
    .replace(/^- (.*$)/gm, '<li>$1</li>')
    .replace(/^\d+\. (.*$)/gm, '<li class="list-decimal">$1</li>')
    // Paragraphs
    .replace(/\n\n/g, '</p><p class="mb-4">')
    .replace(/\n/g, '<br/>');

  // Wrap consecutive <li> elements in <ul>
  html = html.replace(/(<li[^>]*>.*?<\/li>\s*)+/g, '<ul class="list-disc ml-6 mb-4 space-y-1">$&</ul>');
  
  // Clean up empty paragraphs
  html = `<p class="mb-4">${html}</p>`;
  html = html.replace(/<p class="mb-4"><\/p>/g, '');
  
  return DOMPurify.sanitize(html);
};
```

This ensures:
- No duplicate bullet characters
- Proper `<ul>` wrapper for semantic HTML
- Consistent styling with the public blog page (which uses prose)

---

## Files to Modify

| File | Change |
|------|--------|
| `src/components/blog/wizard/StepReview.tsx` | Fix `renderContent()` function to remove explicit `•` and wrap lists in `<ul>` |

---

## Why This Fixes It

| Before | After |
|--------|-------|
| `<li class="ml-4">• Item</li>` (no wrapper) | `<ul class="list-disc ml-6"><li>Item</li></ul>` |
| Prose CSS adds ANOTHER bullet via `::marker` | Prose CSS adds ONE bullet via `list-disc` |
| Result: `• • Item` | Result: `• Item` |

The fix aligns the wizard preview with how the public blog page renders content - using proper semantic HTML and letting the Tailwind prose plugin handle bullet styling.
