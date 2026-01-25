import { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useBlogWizard } from './BlogWizardContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Sparkles, Loader2, Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export function StepContent() {
  const { data, updateData } = useBlogWizard();
  const [isFormatting, setIsFormatting] = useState(false);
  const [formattedContent, setFormattedContent] = useState<string | null>(null);
  const [showFormatted, setShowFormatted] = useState(false);

  // Calculate word count and reading time
  const wordCount = data.content.trim().split(/\s+/).filter(Boolean).length;
  const readingTime = Math.max(1, Math.ceil(wordCount / 200));

  const formatWithAI = async () => {
    if (wordCount < 50) {
      toast.error('Please write at least 50 words before formatting');
      return;
    }

    setIsFormatting(true);
    setShowFormatted(true);
    setFormattedContent(null);

    try {
      const { data: result, error } = await supabase.functions.invoke('format-blog-content', {
        body: { content: data.content }
      });

      if (error) throw error;
      if (result.error) throw new Error(result.error);
      
      setFormattedContent(result.formattedContent);
    } catch (error) {
      console.error('Format error:', error);
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

  const dismissFormatted = () => {
    setFormattedContent(null);
    setShowFormatted(false);
  };

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
          onChange={(e) => {
            updateData({ content: e.target.value });
            // Clear formatted preview if user edits content
            if (showFormatted) {
              setShowFormatted(false);
              setFormattedContent(null);
            }
          }}
          rows={20}
          className="font-mono text-sm resize-y min-h-[400px]"
        />
        <p className="text-xs text-muted-foreground">
          Minimum 100 characters required. Markdown formatting is supported.
        </p>
      </div>

      {/* AI Format & Polish Button */}
      <div className="space-y-4">
        <Button
          type="button"
          variant="outline"
          onClick={formatWithAI}
          disabled={isFormatting || wordCount < 50}
          className="gap-2"
        >
          {isFormatting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Formatting...
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4" />
              AI Format & Polish
            </>
          )}
        </Button>
        
        {wordCount < 50 && (
          <p className="text-xs text-muted-foreground">
            Write at least 50 words to use AI formatting
          </p>
        )}

        {/* Formatted Preview Panel */}
        {showFormatted && (
          <div className="rounded-xl border border-primary/20 bg-primary/5 overflow-hidden">
            <div className="px-4 py-3 border-b border-primary/20 bg-primary/10">
              <h4 className="font-medium text-primary flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                Formatted Preview
              </h4>
            </div>
            
            <div className="p-4">
              {isFormatting ? (
                <div className="flex items-center justify-center py-12 text-muted-foreground">
                  <Loader2 className="h-6 w-6 animate-spin mr-2" />
                  Formatting your article...
                </div>
              ) : formattedContent ? (
                <>
                  <div className="max-h-[400px] overflow-y-auto">
                    <pre className="whitespace-pre-wrap font-mono text-sm text-foreground bg-background/50 p-4 rounded-lg">
                      {formattedContent}
                    </pre>
                  </div>
                  <div className="flex gap-3 mt-4 pt-4 border-t border-primary/20">
                    <Button
                      type="button"
                      onClick={applyFormatted}
                      className="gap-2"
                    >
                      <Check className="h-4 w-4" />
                      Apply
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={dismissFormatted}
                      className="gap-2"
                    >
                      <X className="h-4 w-4" />
                      Dismiss
                    </Button>
                  </div>
                </>
              ) : null}
            </div>
          </div>
        )}
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
