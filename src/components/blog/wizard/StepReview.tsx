import { Clock, Tag, MapPin, Users, ImageIcon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useBlogWizard } from './BlogWizardContext';
import { useBlogCategories } from '@/hooks/useProfessionalBlog';
import { AUDIENCE_OPTIONS } from '@/types/content';
import DOMPurify from 'dompurify';

export function StepReview() {
  const { data } = useBlogWizard();
  const { data: categories = [] } = useBlogCategories();

  const selectedCategories = categories.filter(c => data.categoryIds?.includes(c.id));
  const wordCount = data.content.trim().split(/\s+/).filter(Boolean).length;
  const readingTime = Math.max(1, Math.ceil(wordCount / 200));
  
  const selectedAudiences = AUDIENCE_OPTIONS.filter(
    a => data.audiences?.includes(a.value)
  );

  // Simple markdown to HTML conversion
  const renderContent = (content: string) => {
    let html = content
      .replace(/^### (.*$)/gm, '<h3 class="text-lg font-semibold mt-6 mb-2">$1</h3>')
      .replace(/^## (.*$)/gm, '<h2 class="text-xl font-bold mt-8 mb-3">$1</h2>')
      .replace(/^# (.*$)/gm, '<h1 class="text-2xl font-bold mt-8 mb-4">$1</h1>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/^- (.*$)/gm, '<li class="ml-4">• $1</li>')
      .replace(/^\d+\. (.*$)/gm, '<li class="ml-4 list-decimal">$1</li>')
      .replace(/\n\n/g, '</p><p class="mb-4">')
      .replace(/\n/g, '<br/>');
    
    html = `<p class="mb-4">${html}</p>`;
    return DOMPurify.sanitize(html);
  };

  return (
    <div className="space-y-6">
      <div className="rounded-xl bg-primary/5 border border-primary/20 p-4">
        <h3 className="font-medium text-primary mb-2">Ready to Submit?</h3>
        <p className="text-sm text-muted-foreground">
          Review your article below. Once you submit, our team will review it 
          and publish it to the blog. You'll be notified when it goes live.
        </p>
      </div>

      <Card className="overflow-hidden">
        <CardContent className="p-0">
          {/* Cover Image */}
          {data.coverImage ? (
            <img
              src={data.coverImage}
              alt="Cover"
              className="w-full aspect-[16/9] object-cover"
            />
          ) : (
            <div className="w-full aspect-[16/9] bg-muted flex items-center justify-center">
              <div className="text-center text-muted-foreground">
                <ImageIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No cover image</p>
              </div>
            </div>
          )}

          <div className="p-6">
            {/* Meta Info */}
            <div className="flex flex-wrap items-center gap-2 mb-4">
              {selectedCategories.map(cat => (
                <Badge key={cat.id} variant="secondary" className="rounded-full">
                  <Tag className="h-3 w-3 mr-1" />
                  {cat.name}
                </Badge>
              ))}
              <Badge variant="outline" className="rounded-full">
                <Clock className="h-3 w-3 mr-1" />
                {readingTime} min read
              </Badge>
              {data.city && (
                <Badge variant="outline" className="rounded-full">
                  <MapPin className="h-3 w-3 mr-1" />
                  {data.city}
                </Badge>
              )}
            </div>

            {/* Title */}
            <h1 className="text-2xl font-bold mb-3">{data.title}</h1>

            {/* Excerpt */}
            {data.excerpt && (
              <p className="text-muted-foreground mb-4 italic">
                {data.excerpt}
              </p>
            )}

            {/* Audiences */}
            {selectedAudiences.length > 0 && (
              <div className="flex items-center gap-2 mb-4">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  Written for: {selectedAudiences.map(a => a.label).join(', ')}
                </span>
              </div>
            )}

            <Separator className="my-4" />

            {/* Content Preview */}
            <div 
              className="prose prose-sm max-w-none"
              dangerouslySetInnerHTML={{ __html: renderContent(data.content) }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Checklist */}
      <div className="rounded-xl bg-muted/50 p-4">
        <h4 className="font-medium mb-3">Pre-Submit Checklist</h4>
        <ul className="space-y-2 text-sm">
          <CheckItem checked={data.title.length > 10} label="Clear, descriptive title" />
          <CheckItem checked={(data.categoryIds?.length || 0) > 0} label="At least one category selected" />
          <CheckItem checked={data.content.length >= 500} label="Article has substantial content (500+ chars)" />
          <CheckItem checked={!!data.coverImage} label="Cover image added" optional />
          <CheckItem checked={!!data.excerpt} label="Summary/excerpt provided" optional />
        </ul>
      </div>
    </div>
  );
}

function CheckItem({ 
  checked, 
  label, 
  optional 
}: { 
  checked: boolean; 
  label: string; 
  optional?: boolean;
}) {
  return (
    <li className="flex items-center gap-2">
      <div className={`h-5 w-5 rounded-full flex items-center justify-center ${
        checked ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'
      }`}>
        {checked ? '✓' : '○'}
      </div>
      <span className={checked ? 'text-foreground' : 'text-muted-foreground'}>
        {label}
        {optional && <span className="text-xs ml-1">(optional)</span>}
      </span>
    </li>
  );
}
