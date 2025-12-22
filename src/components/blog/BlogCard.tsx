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
      transition={{ delay: index * 0.05 }}
    >
      <Card className="h-full overflow-hidden hover:shadow-card-hover transition-all duration-300 group">
        <Link to={`/blog/${post.slug}`}>
          <div className="aspect-[4/3] overflow-hidden relative">
            <img
              src={post.cover_image || 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=400'}
              alt={post.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
            {post.category && (
              <Badge 
                variant="secondary" 
                className="absolute top-2 left-2 text-xs bg-background/90 backdrop-blur-sm"
              >
                {post.category.name}
              </Badge>
            )}
          </div>
        </Link>
        <CardContent className="p-3 space-y-2">
          <Link to={`/blog/${post.slug}`}>
            <h2 className="font-semibold text-sm text-foreground line-clamp-2 group-hover:text-primary transition-colors leading-tight">
              {post.title}
            </h2>
          </Link>
          {post.excerpt && (
            <p className="text-muted-foreground text-xs line-clamp-2">
              {post.excerpt}
            </p>
          )}
          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {post.published_at
                  ? new Date(post.published_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                  : new Date(post.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </div>
              <div className="flex items-center gap-1">
                <Eye className="h-3 w-3" />
                {post.views_count}
              </div>
              {post.reading_time_minutes && (
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {post.reading_time_minutes}m
                </div>
              )}
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onToggleSave(post.id);
              }}
            >
              <Bookmark 
                className={cn(
                  "h-4 w-4 transition-colors",
                  isSaved ? "fill-primary text-primary" : "text-muted-foreground"
                )} 
              />
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
