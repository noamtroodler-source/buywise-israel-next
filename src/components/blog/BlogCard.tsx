import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Calendar, Eye, Clock, Bookmark, ArrowUpRight } from 'lucide-react';
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
      transition={{ delay: index * 0.05, duration: 0.4 }}
      className="h-full"
    >
      <Card className="h-full overflow-hidden rounded-2xl border-0 bg-card shadow-md hover:shadow-2xl transition-all duration-500 group relative">
        {/* Image Container */}
        <Link to={`/blog/${post.slug}`} className="block">
          <div className="aspect-[4/3] overflow-hidden relative">
            <img
              src={post.cover_image || 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=400'}
              alt={post.title}
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
            />
            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-60 group-hover:opacity-80 transition-opacity duration-300" />
            
            {/* Category Badge */}
            {post.category && (
              <Badge 
                className="absolute top-4 left-4 bg-white/95 text-foreground backdrop-blur-sm shadow-lg rounded-full px-3 py-1 text-xs font-semibold"
              >
                {post.category.name}
              </Badge>
            )}

            {/* Save Button */}
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "absolute top-4 right-4 h-9 w-9 rounded-full bg-white/90 backdrop-blur-sm shadow-lg hover:bg-white transition-all",
                isSaved && "bg-primary/90 hover:bg-primary"
              )}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onToggleSave(post.id);
              }}
            >
              <Bookmark 
                className={cn(
                  "h-4 w-4 transition-colors",
                  isSaved ? "fill-white text-white" : "text-foreground"
                )} 
              />
            </Button>

            {/* Read More Arrow - appears on hover */}
            <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0">
              <div className="h-10 w-10 rounded-full bg-white flex items-center justify-center shadow-lg">
                <ArrowUpRight className="h-5 w-5 text-foreground" />
              </div>
            </div>

            {/* Reading Time Badge */}
            {post.reading_time_minutes && (
              <div className="absolute bottom-4 left-4 flex items-center gap-1.5 text-white/90 text-xs font-medium">
                <Clock className="h-3.5 w-3.5" />
                {post.reading_time_minutes} min
              </div>
            )}
          </div>
        </Link>

        {/* Content */}
        <div className="p-5 space-y-3">
          <Link to={`/blog/${post.slug}`}>
            <h3 className="font-bold text-lg text-foreground line-clamp-2 group-hover:text-primary transition-colors leading-snug">
              {post.title}
            </h3>
          </Link>
          
          {post.excerpt && (
            <p className="text-muted-foreground text-sm line-clamp-2 leading-relaxed">
              {post.excerpt}
            </p>
          )}

          {/* Footer Meta */}
          <div className="flex items-center justify-between pt-3 border-t border-border/30">
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
            </div>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}
