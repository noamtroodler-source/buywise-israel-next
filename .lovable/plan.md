
# AI-Generated Cover Image Feature for Blog Wizard

## Overview

Add the ability for Agents, Agencies, and Developers to generate an AI cover image based on their article's title and content. The feature will:
1. Generate **one** AI image initially (to conserve credits and speed)
2. Provide a **"Regenerate"** button if the user wants a different option
3. Auto-upload the generated image to storage and set it as the cover

This uses the existing `generate-hero-image` edge function - no new backend code needed.

---

## User Experience Flow

```text
Step 3: Cover Image
┌─────────────────────────────────────────────────────────────┐
│  Cover Image                                                 │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐    │
│  │                                                     │    │
│  │  [Currently empty or showing generated/uploaded]    │    │
│  │                                                     │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  [✨ Generate AI Cover Image]  [📤 Upload Your Own] │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                              │
│  If image is shown:                                          │
│  [🔄 Regenerate]  [❌ Remove]                                │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  💡 Pro Tip                                         │    │
│  │  AI-generated images are created based on your      │    │
│  │  article title and content. No attribution needed!  │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                              │
│  Image Guidelines                                            │
│  • Use high-quality images (minimum 1200px wide)            │
│  • Avoid images with too much text                          │
│  • Choose images relevant to your article topic             │
│  • Ensure you have rights to use the image                  │
│  • ✨ Or use AI-generated images - no licensing worries!    │
└─────────────────────────────────────────────────────────────┘
```

---

## Implementation Details

### File to Modify: `src/components/blog/wizard/StepCoverImage.tsx`

#### New State Variables
```tsx
const [isGeneratingAI, setIsGeneratingAI] = useState(false);
```

#### New Handler: `generateAIImage`
```tsx
const generateAIImage = async () => {
  if (!data.title) {
    toast.error('Please add an article title first');
    return;
  }

  setIsGeneratingAI(true);

  try {
    // Build prompt from article title and content excerpt
    const contentPreview = data.content?.slice(0, 500) || '';
    const prompt = `Create a professional, high-quality blog cover image for an article titled "${data.title}". ${contentPreview ? `The article is about: ${contentPreview.slice(0, 200)}...` : ''} Style: Modern, clean, professional real estate or lifestyle photography. Aspect ratio 16:9, ultra high resolution. No text overlays on the image.`;

    const { data: result, error } = await supabase.functions.invoke('generate-hero-image', {
      body: { prompt }
    });

    if (error) throw error;
    if (result.error) throw new Error(result.error);

    // The result contains a base64 image URL - upload it to storage
    const base64Data = result.imageUrl;
    
    // Convert base64 to blob for upload
    const response = await fetch(base64Data);
    const blob = await response.blob();
    
    const fileName = `blog-ai-${Date.now()}.png`;
    const filePath = `blog-covers/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('property-images')
      .upload(filePath, blob, { contentType: 'image/png' });

    if (uploadError) throw uploadError;

    const { data: urlData } = supabase.storage
      .from('property-images')
      .getPublicUrl(filePath);

    updateData({ coverImage: urlData.publicUrl });
    toast.success('AI cover image generated!');
  } catch (error) {
    console.error('AI generation error:', error);
    if (error instanceof Error && error.message.includes('Rate limit')) {
      toast.error('Rate limit exceeded. Please try again in a moment.');
    } else if (error instanceof Error && error.message.includes('Payment')) {
      toast.error('AI credits exhausted. Please upload an image manually.');
    } else {
      toast.error('Failed to generate image. Please try again or upload manually.');
    }
  } finally {
    setIsGeneratingAI(false);
  }
};
```

#### Updated UI Structure

**New imports:**
```tsx
import { Sparkles, RefreshCw } from 'lucide-react';
```

**Replace the empty state upload area with two options:**

1. AI Generate button (prominent, with sparkle icon)
2. Manual upload button (secondary option)

**When image exists, show:**
- The image preview
- Regenerate button (for AI)
- Remove button
- Upload different button

#### Updated Image Guidelines Section
Add a new tip about AI-generated images having no licensing concerns.

---

## Technical Notes

### Prompt Engineering
The prompt is constructed dynamically from:
- **Title** (required) - e.g., "First-Time Buyer's Guide to Tel Aviv"
- **Content excerpt** (first 200 chars) - provides context about the article topic

Example generated prompt:
```
Create a professional, high-quality blog cover image for an article titled "First-Time Buyer's Guide to Tel Aviv". The article is about: Buying your first home in Tel Aviv can feel overwhelming, but with the right preparation and guidance, it's an achievable dream. This guide covers... Style: Modern, clean, professional real estate or lifestyle photography. Aspect ratio 16:9, ultra high resolution. No text overlays on the image.
```

### Base64 to Storage Upload
The `generate-hero-image` function returns a base64-encoded image. We:
1. Fetch it as a blob
2. Upload to Supabase storage (`property-images/blog-covers/`)
3. Get the public URL
4. Set it as the cover image

This ensures the image is permanently stored (base64 data URLs are too large for database storage).

### Error Handling
- **Rate limit (429)**: Show friendly message, suggest waiting
- **Payment required (402)**: Suggest manual upload
- **No title**: Prevent generation, show error
- **General errors**: Fallback message with manual upload suggestion

---

## File Changes Summary

| File | Action |
|------|--------|
| `src/components/blog/wizard/StepCoverImage.tsx` | Add AI generation button, handler, and updated UI |

No edge function changes needed - we reuse the existing `generate-hero-image` function.

---

## Cost & Performance

- **1 image per generation** (not 3) - balances cost and user experience
- **Regenerate available** - if user doesn't like the result
- **~5-10 seconds** generation time (shown with loading state)
- Uses `google/gemini-2.5-flash-image-preview` model (existing function)

---

## Visual Design

The UI will have:
1. **Primary action**: "✨ Generate AI Cover" button (gradient/accent styling)
2. **Secondary action**: "Upload Your Own" button (outline styling)
3. **Pro tip callout**: Explains AI images have no licensing worries
4. **Loading state**: Spinner with "Generating your cover image..." text
5. **Success state**: Image preview with Regenerate and Remove buttons
