import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Calendar, Clock, Bookmark, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BlogPost } from '@/types/content';
import { cn } from '@/lib/utils';

interface FeaturedArticleProps {
  post: BlogPost;
  isSaved: boolean;
  onToggleSave: (postId: string) => void;
}

export function FeaturedArticle({ post, isSaved, onToggleSave }: FeaturedArticleProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Link to={`/blog/${post.slug}`} className="block group">
        <div className="relative overflow-hidden rounded-2xl bg-muted/30 border border-border/50">
          <div className="grid md:grid-cols-2 gap-0">
            {/* Image Side */}
            <div className="aspect-[16/10] md:aspect-auto overflow-hidden relative">
              <img
                src={post.cover_image || 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800'}
                alt={post.title}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
            </div>

            {/* Content Side */}
            <div className="p-6 md:p-8 lg:p-10 flex flex-col justify-center space-y-4">
              <div className="flex items-center gap-3">
                <Badge className="bg-primary/10 text-primary border-0 rounded-full px-3 py-1 text-xs font-medium gap-1.5">
                  <Sparkles className="h-3 w-3" />
                  Featured
                </Badge>
                {post.category && (
                  <Badge variant="outline" className="rounded-full px-3 text-xs">
                    {post.category.name}
                  </Badge>
                )}
              </div>

              <h2 className="text-2xl md:text-3xl font-bold text-foreground leading-tight group-hover:text-primary transition-colors">
                {post.title}
              </h2>

              {post.excerpt && (
                <p className="text-muted-foreground line-clamp-2">
                  {post.excerpt}
                </p>
              )}

              <div className="flex items-center gap-4 text-sm text-muted-foreground pt-2">
                <div className="flex items-center gap-1.5">
                  <Calendar className="h-4 w-4" />
                  {post.published_at
                    ? new Date(post.published_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                    : new Date(post.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </div>
                {post.reading_time_minutes && (
                  <div className="flex items-center gap-1.5">
                    <Clock className="h-4 w-4" />
                    {post.reading_time_minutes} min read
                  </div>
                )}
              </div>

              <div className="flex items-center gap-3 pt-2">
                <Button className="rounded-full px-5 gap-2">
                  Read Article
                  <ArrowRight className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className={cn(
                    "rounded-full h-10 w-10",
                    isSaved && "bg-primary/10 border-primary/50"
                  )}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onToggleSave(post.id);
                  }}
                >
                  <Bookmark 
                    className={cn(
                      "h-4 w-4",
                      isSaved ? "fill-primary text-primary" : "text-muted-foreground"
                    )} 
                  />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
