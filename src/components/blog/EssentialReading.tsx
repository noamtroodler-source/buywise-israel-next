import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Bookmark, Clock, ArrowRight, Sparkles } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { BlogPost } from '@/types/content';
import { cn } from '@/lib/utils';

interface EssentialReadingProps {
  posts: BlogPost[];
  isArticleSaved: (postId: string) => boolean;
  onToggleSave: (postId: string) => void;
}

export function EssentialReading({ posts, isArticleSaved, onToggleSave }: EssentialReadingProps) {
  if (posts.length === 0) return null;

  // Take top 3 posts
  const essentialPosts = posts.slice(0, 3);

  return (
    <section className="py-10 bg-gradient-to-b from-muted/30 to-transparent">
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="flex items-center gap-3 mb-6"
        >
          <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Bookmark className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground">Essential Reading</h2>
            <p className="text-sm text-muted-foreground">New to Israeli real estate? Start here.</p>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {essentialPosts.map((post, index) => {
            const isSaved = isArticleSaved(post.id);
            
            return (
              <motion.div
                key={post.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="h-full overflow-hidden rounded-2xl border-0 bg-card shadow-md hover:shadow-xl transition-all duration-300 group">
                  <Link to={`/blog/${post.slug}`} className="block">
                    <div className="aspect-[16/10] overflow-hidden relative">
                      <img
                        src={post.cover_image || 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=600'}
                        alt={post.title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
                      
                      {/* Start Here Badge */}
                      <Badge className="absolute top-3 left-3 bg-primary text-primary-foreground shadow-lg rounded-full px-3 py-1 text-xs font-semibold gap-1">
                        <Sparkles className="h-3 w-3" />
                        Start Here
                      </Badge>

                      {/* Save Button */}
                      <Button
                        variant="ghost"
                        size="icon"
                        className={cn(
                          "absolute top-3 right-3 h-8 w-8 rounded-full bg-white/90 backdrop-blur-sm shadow hover:bg-white",
                          isSaved && "bg-primary/90 hover:bg-primary"
                        )}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          onToggleSave(post.id);
                        }}
                      >
                        <Bookmark className={cn("h-4 w-4", isSaved ? "fill-white text-white" : "text-foreground")} />
                      </Button>

                      {/* Title on Image */}
                      <div className="absolute bottom-0 left-0 right-0 p-4">
                        <h3 className="font-bold text-white text-lg leading-tight line-clamp-2 group-hover:underline decoration-2 underline-offset-2">
                          {post.title}
                        </h3>
                        <div className="flex items-center gap-3 mt-2 text-white/80 text-xs">
                          {post.reading_time_minutes && (
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {post.reading_time_minutes} min read
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </Link>
                  
                  {/* Content */}
                  <div className="p-4">
                    {post.excerpt && (
                      <p className="text-muted-foreground text-sm line-clamp-2 mb-3">
                        {post.excerpt}
                      </p>
                    )}
                    <Link to={`/blog/${post.slug}`}>
                      <Button variant="ghost" size="sm" className="text-primary p-0 h-auto font-medium group/btn">
                        Read Guide
                        <ArrowRight className="h-4 w-4 ml-1 transition-transform group-hover/btn:translate-x-1" />
                      </Button>
                    </Link>
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
