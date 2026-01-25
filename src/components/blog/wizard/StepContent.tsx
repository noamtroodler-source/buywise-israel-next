import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useBlogWizard } from './BlogWizardContext';

export function StepContent() {
  const { data, updateData } = useBlogWizard();

  // Calculate word count and reading time
  const wordCount = data.content.trim().split(/\s+/).filter(Boolean).length;
  const readingTime = Math.max(1, Math.ceil(wordCount / 200));

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="excerpt">Article Summary</Label>
        <Textarea
          id="excerpt"
          placeholder="A brief summary of your article (1-2 sentences). This appears in search results and social shares."
          value={data.excerpt}
          onChange={(e) => updateData({ excerpt: e.target.value })}
          rows={3}
          className="resize-none"
        />
        <p className="text-xs text-muted-foreground">
          {data.excerpt.length}/300 characters (recommended max)
        </p>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="content">Article Content *</Label>
          <div className="text-xs text-muted-foreground">
            {wordCount} words · {readingTime} min read
          </div>
        </div>
        <Textarea
          id="content"
          placeholder="Write your article here...

You can use markdown formatting:
# Heading 1
## Heading 2
**Bold text**
*Italic text*
- Bullet points
1. Numbered lists

Share your expertise, insights, and practical advice for your readers."
          value={data.content}
          onChange={(e) => updateData({ content: e.target.value })}
          rows={20}
          className="font-mono text-sm resize-y min-h-[400px]"
        />
        <p className="text-xs text-muted-foreground">
          Minimum 100 characters required. Markdown formatting is supported.
        </p>
      </div>

      <div className="rounded-xl bg-primary/5 border border-primary/20 p-4">
        <h4 className="font-medium text-primary mb-2">Writing Tips</h4>
        <ul className="text-sm text-muted-foreground space-y-1">
          <li>• Start with a hook that captures attention</li>
          <li>• Use clear headings to break up content</li>
          <li>• Include practical, actionable advice</li>
          <li>• Back up claims with specific examples or data</li>
          <li>• End with a clear takeaway or call-to-action</li>
        </ul>
      </div>
    </div>
  );
}
