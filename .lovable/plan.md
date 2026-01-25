

# AI Format & Polish Feature for Blog Content Step

## Overview

Add an "AI Format & Polish" button to the blog wizard's content step that:
1. Takes raw/unstructured text and converts it to well-formatted Markdown
2. Adds proper headers (`## Heading`), bullet points, and paragraph breaks
3. Fixes grammar, spelling, and clarity issues
4. Provides a one-click "Apply" to replace the draft with the polished version

This feature will be available to **all professional authors** (Agents, Agencies, Developers) on the same shared `StepContent.tsx` component.

---

## How It Works

```text
User writes raw text:
"I wanted to share some tips about buying your first home. First you need to get pre-approved for a mortgage. This helps you know your budget. Then you should find a good agent who knows the local market. They can help you find homes in your price range. Make sure to get a home inspection before closing. This protects you from hidden problems..."

    ↓ Click "AI Format & Polish" ↓

AI returns structured Markdown:
"## Getting Started with Your First Home Purchase

Buying your first home is an exciting milestone. Here's what you need to know to make the process smooth and successful.

### Step 1: Get Pre-Approved for a Mortgage

Before you start looking at homes, get pre-approved for a mortgage. This:
- Helps you understand your budget
- Shows sellers you're a serious buyer
- Speeds up the closing process

### Step 2: Find the Right Agent
..."
```

---

## Implementation

### 1. New Edge Function: `format-blog-content`

Create a new edge function specifically for blog formatting with a tailored prompt:

**File:** `supabase/functions/format-blog-content/index.ts`

**Purpose:**
- Accept raw article text
- Return professionally formatted Markdown with:
  - Clear section headers (`## ` and `### `)
  - Bullet points for lists
  - Proper paragraph breaks
  - Grammar and clarity improvements
  - Professional tone

**AI Prompt Focus:**
- Structure content with logical sections
- Use headers to break up topics (but don't over-header)
- Convert run-on lists to bullet points
- Maintain the author's voice while improving clarity
- Target reading level: accessible to general audience

---

### 2. Update `StepContent.tsx`

Add the AI formatting UI following the existing pattern from `StepDescription.tsx`:

**New Imports:**
- `useState` from React
- `supabase` from integrations
- `toast` from sonner
- Icons: `Wand2`, `Loader2`, `CheckCircle2`, `AlertTriangle`, `Sparkles`

**New State:**
```tsx
const [isFormatting, setIsFormatting] = useState(false);
const [formattedContent, setFormattedContent] = useState<string | null>(null);
const [showFormatted, setShowFormatted] = useState(false);
```

**New Handler:**
```tsx
const formatWithAI = async () => {
  if (wordCount < 50) {
    toast.error('Please write at least 50 words before formatting');
    return;
  }
  
  setIsFormatting(true);
  setShowFormatted(true);
  
  try {
    const { data: result, error } = await supabase.functions.invoke('format-blog-content', {
      body: { content: data.content }
    });
    
    if (error) throw error;
    setFormattedContent(result.formattedContent);
  } catch (error) {
    toast.error('Failed to format content. Please try again.');
    setShowFormatted(false);
  } finally {
    setIsFormatting(false);
  }
};

const applyFormatted = () => {
  if (formattedContent) {
    updateData({ content: formattedContent });
    setFormattedContent(null);
    setShowFormatted(false);
    toast.success('Formatted content applied!');
  }
};
```

**New UI Elements (below the textarea):**

```text
┌─────────────────────────────────────────────────────────────┐
│  [✨ AI Format & Polish]  <-- Button                        │
│                                                             │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  Formatted Preview:                                   │  │
│  │                                                       │  │
│  │  ## Introduction                                      │  │
│  │                                                       │  │
│  │  Your opening paragraph here, now with better...     │  │
│  │                                                       │  │
│  │  ### Key Points                                       │  │
│  │  - First bullet point                                 │  │
│  │  - Second bullet point                                │  │
│  │  ...                                                  │  │
│  │                                                       │  │
│  │  [Apply] [Dismiss]                                    │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

### 3. Edge Function Details

**File:** `supabase/functions/format-blog-content/index.ts`

**Request/Response:**
```typescript
// Request
{ content: string }

// Response
{ 
  formattedContent: string,
  changes: string[]  // List of what was improved
}
```

**AI System Prompt:**
```
You are a professional blog editor. Take the raw article text and format it into clean, professional Markdown:

1. Add section headers (## for main sections, ### for subsections)
2. Convert lists into bullet points (- ) or numbered lists (1. 2. 3.)
3. Break up long paragraphs into digestible chunks
4. Fix grammar, spelling, and punctuation errors
5. Improve sentence clarity without changing the author's meaning
6. Maintain the author's voice and expertise

Do NOT:
- Add content that wasn't in the original
- Change factual claims or statistics
- Over-format with too many headers
- Remove important information

Return the formatted Markdown content.
```

---

## File Changes Summary

| File | Action |
|------|--------|
| `supabase/functions/format-blog-content/index.ts` | Create new edge function |
| `supabase/config.toml` | Add function config (auto-handled) |
| `src/components/blog/wizard/StepContent.tsx` | Add AI formatting button and preview UI |

---

## User Experience Flow

1. Author writes raw content in the textarea
2. Clicks "✨ AI Format & Polish" button
3. Loading state shows "Formatting your article..."
4. Preview panel appears below showing the formatted version
5. Author can:
   - **Apply** - Replaces their content with the formatted version
   - **Dismiss** - Closes preview and keeps original
6. If they edit content after applying, the preview clears

---

## Why a Separate Edge Function?

The existing `check-description` function is tailored for **short property descriptions** (100-2000 chars). Blog articles are:
- Much longer (500-5000+ words)
- Need structural formatting, not just grammar fixes
- Require Markdown output, not plain text
- Have different quality expectations

A dedicated `format-blog-content` function allows for:
- Optimized prompts for article formatting
- Different length limits
- Markdown-specific output handling

