import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { X, Clock, Eye, MapPin, User } from 'lucide-react';
import { BlogPostForReview } from '@/hooks/useBlogReview';
import { markdownToHtml } from '@/utils/markdownToHtml';
import { format } from 'date-fns';

interface BlogPreviewModalProps {
  post: BlogPostForReview;
  open: boolean;
  onClose: () => void;
}

export function BlogPreviewModal({ post, open, onClose }: BlogPreviewModalProps) {
  const getAuthorTypeBadge = (type: string | null) => {
    switch (type) {
      case 'agent':
        return <Badge variant="outline" className="text-primary border-primary/20 bg-primary/5">Agent</Badge>;
      case 'agency':
        return <Badge variant="outline" className="text-secondary-foreground border-secondary bg-secondary">Agency</Badge>;
      case 'developer':
        return <Badge variant="outline" className="text-accent-foreground border-accent bg-accent">Developer</Badge>;
      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] p-0 overflow-hidden">
        <DialogHeader className="p-4 border-b flex flex-row items-center justify-between">
          <DialogTitle className="text-lg font-semibold">Blog Preview</DialogTitle>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </DialogHeader>
        
        <ScrollArea className="h-[calc(90vh-80px)]">
          <article className="pb-8">
            {/* Cover Image */}
            {post.cover_image && (
              <div className="w-full h-64 md:h-80 overflow-hidden">
                <img
                  src={post.cover_image}
                  alt={post.title}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            
            <div className="px-6 md:px-12 pt-6">
              {/* Categories */}
              {post.categories && post.categories.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {post.categories.map((cat) => (
                    <Badge key={cat.id} variant="secondary" className="text-xs">
                      {cat.name}
                    </Badge>
                  ))}
                </div>
              )}
              
              {/* Title */}
              <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                {post.title}
              </h1>
              
              {/* Meta info */}
              <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-6 pb-6 border-b">
                {post.author && (
                  <div className="flex items-center gap-2">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={post.author.avatar || undefined} />
                      <AvatarFallback>
                        <User className="h-4 w-4" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-foreground">{post.author.name}</span>
                      {getAuthorTypeBadge(post.author.type)}
                    </div>
                  </div>
                )}
                
                {post.submitted_at && (
                  <span>{format(new Date(post.submitted_at), 'MMM d, yyyy')}</span>
                )}
                
                {post.reading_time_minutes && (
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    <span>{post.reading_time_minutes} min read</span>
                  </div>
                )}
                
                {post.city && (
                  <div className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    <span>{post.city}</span>
                  </div>
                )}
                
                {post.views_count !== null && post.views_count > 0 && (
                  <div className="flex items-center gap-1">
                    <Eye className="h-4 w-4" />
                    <span>{post.views_count} views</span>
                  </div>
                )}
              </div>
              
              {/* Excerpt */}
              {post.excerpt && (
                <p className="text-lg text-muted-foreground mb-6 italic">
                  {post.excerpt}
                </p>
              )}
              
              {/* Content */}
              <div 
                className="prose prose-sm md:prose-base max-w-none"
                dangerouslySetInnerHTML={{ __html: markdownToHtml(post.content) }}
              />
              
              {/* Audiences */}
              {post.audiences && post.audiences.length > 0 && (
                <div className="mt-8 pt-6 border-t">
                  <p className="text-sm text-muted-foreground mb-2">Written for:</p>
                  <div className="flex flex-wrap gap-2">
                    {post.audiences.map((audience) => (
                      <Badge key={audience} variant="outline" className="capitalize">
                        {audience.replace('-', ' ')}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </article>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
