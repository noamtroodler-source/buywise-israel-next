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
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="relative overflow-hidden rounded-3xl group"
    >
      {/* Background Image */}
      <div className="absolute inset-0">
        <img
          src={post.cover_image || 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=1200'}
          alt={post.title}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
        />
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-black/20" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/40 to-transparent" />
      </div>

      {/* Content */}
      <div className="relative z-10 p-8 md:p-12 lg:p-16 min-h-[400px] md:min-h-[500px] flex flex-col justify-end">
        {/* Featured Badge */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-6"
        >
          <Badge className="bg-primary/90 text-primary-foreground backdrop-blur-sm px-4 py-1.5 text-sm font-medium rounded-full gap-2 shadow-lg">
            <Sparkles className="h-3.5 w-3.5" />
            Featured Article
          </Badge>
        </motion.div>

        {/* Category */}
        {post.category && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Badge 
              variant="outline" 
              className="mb-4 bg-white/10 border-white/20 text-white/90 backdrop-blur-sm rounded-full px-3"
            >
              {post.category.name}
            </Badge>
          </motion.div>
        )}

        {/* Title */}
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4 max-w-3xl leading-tight"
        >
          {post.title}
        </motion.h2>

        {/* Excerpt */}
        {post.excerpt && (
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="text-lg text-white/80 mb-6 max-w-2xl line-clamp-2"
          >
            {post.excerpt}
          </motion.p>
        )}

        {/* Meta & Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="flex flex-wrap items-center gap-6"
        >
          {/* Meta Info */}
          <div className="flex items-center gap-4 text-sm text-white/70">
            <div className="flex items-center gap-1.5">
              <Calendar className="h-4 w-4" />
              {post.published_at
                ? new Date(post.published_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
                : new Date(post.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
            </div>
            {post.reading_time_minutes && (
              <div className="flex items-center gap-1.5">
                <Clock className="h-4 w-4" />
                {post.reading_time_minutes} min read
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3">
            <Link to={`/blog/${post.slug}`}>
              <Button 
                size="lg" 
                className="rounded-full px-6 gap-2 bg-white text-foreground hover:bg-white/90 shadow-xl"
              >
                Read Article
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>
            <Button
              variant="outline"
              size="icon"
              className={cn(
                "rounded-full h-11 w-11 border-white/30 bg-white/10 backdrop-blur-sm hover:bg-white/20",
                isSaved && "bg-primary/20 border-primary/50"
              )}
              onClick={(e) => {
                e.preventDefault();
                onToggleSave(post.id);
              }}
            >
              <Bookmark 
                className={cn(
                  "h-5 w-5 transition-colors",
                  isSaved ? "fill-white text-white" : "text-white"
                )} 
              />
            </Button>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
