import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Clock, Bookmark, ArrowRight } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { BlogPost } from '@/types/content';
import { cn } from '@/lib/utils';

interface BlogCardProps {
  post: BlogPost;
  index: number;
  isSaved: boolean;
  onToggleSave: (postId: string) => void;
}

export function BlogCard({ post, index, isSaved, onToggleSave }: BlogCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03, duration: 0.3 }}
      className="h-full"
    >
      <Card className="h-full overflow-hidden rounded-xl border border-border/50 bg-card hover:border-primary/30 hover:shadow-lg transition-all duration-300 group flex flex-col">
        {/* Image */}
        <Link to={`/blog/${post.slug}`} className="block">
          <div className="aspect-[16/10] overflow-hidden relative bg-muted">
            <img
              src={post.cover_image || 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=400'}
              alt={post.title}
              loading="lazy"
              decoding="async"
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          </div>
        </Link>

        {/* Content */}
        <div className="p-4 flex flex-col flex-1">
          {/* Category & Reading Time */}
          <div className="flex items-center gap-2 mb-3">
            {post.category && (
              <Badge variant="secondary" className="text-xs rounded-full px-2.5 py-0.5 bg-primary/10 text-primary border-0">
                {post.category.name}
              </Badge>
            )}
            {post.reading_time_minutes && (
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {post.reading_time_minutes} min
              </span>
            )}
          </div>

          {/* Title */}
          <Link to={`/blog/${post.slug}`} className="block mb-2">
            <h3 className="font-semibold text-foreground line-clamp-2 group-hover:text-primary transition-colors leading-snug">
              {post.title}
            </h3>
          </Link>
          
          {/* Excerpt */}
          {post.excerpt && (
            <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed flex-1">
              {post.excerpt}
            </p>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between pt-4 mt-auto border-t border-border/30">
            <Link 
              to={`/blog/${post.slug}`}
              className="text-sm font-medium text-primary hover:text-primary/80 flex items-center gap-1 transition-colors"
            >
              Read article
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
            
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "h-8 w-8 rounded-full transition-all",
                isSaved 
                  ? "bg-primary/10 text-primary hover:bg-primary/20" 
                  : "text-muted-foreground hover:text-primary hover:bg-primary/10"
              )}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onToggleSave(post.id);
              }}
            >
              <Bookmark className={cn("h-4 w-4", isSaved && "fill-current")} />
            </Button>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}
