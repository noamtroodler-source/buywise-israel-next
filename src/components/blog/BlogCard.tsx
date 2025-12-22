import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Calendar, Eye, Clock, Bookmark } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
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
      transition={{ delay: index * 0.03, duration: 0.4 }}
    >
      <Card className="h-full overflow-hidden rounded-2xl border border-border/50 bg-card shadow-sm hover:shadow-xl hover:border-primary/20 transition-all duration-300 group">
        <Link to={`/blog/${post.slug}`}>
          <div className="aspect-[16/10] overflow-hidden relative">
            <img
              src={post.cover_image || 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=400'}
              alt={post.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            {post.category && (
              <Badge 
                variant="secondary" 
                className="absolute top-3 left-3 text-xs bg-background/95 backdrop-blur-sm shadow-sm rounded-full px-3"
              >
                {post.category.name}
              </Badge>
            )}
          </div>
        </Link>
        <CardContent className="p-4 space-y-3">
          <Link to={`/blog/${post.slug}`}>
            <h2 className="font-semibold text-base text-foreground line-clamp-2 group-hover:text-primary transition-colors leading-snug">
              {post.title}
            </h2>
          </Link>
          {post.excerpt && (
            <p className="text-muted-foreground text-sm line-clamp-2 leading-relaxed">
              {post.excerpt}
            </p>
          )}
          <div className="flex items-center justify-between pt-2 border-t border-border/50">
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                {post.published_at
                  ? new Date(post.published_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                  : new Date(post.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </div>
              <div className="flex items-center gap-1">
                <Eye className="h-3.5 w-3.5" />
                {post.views_count || 0}
              </div>
              {post.reading_time_minutes && (
                <div className="flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" />
                  {post.reading_time_minutes}m
                </div>
              )}
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-full hover:bg-primary/10"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onToggleSave(post.id);
              }}
            >
              <Bookmark 
                className={cn(
                  "h-4 w-4 transition-colors",
                  isSaved ? "fill-primary text-primary" : "text-muted-foreground hover:text-primary"
                )} 
              />
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
