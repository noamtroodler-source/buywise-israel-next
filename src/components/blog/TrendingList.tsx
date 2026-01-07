import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { TrendingUp, Eye, Clock, ArrowUpRight } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BlogPost } from '@/types/content';

interface TrendingListProps {
  posts: BlogPost[];
}

export function TrendingList({ posts }: TrendingListProps) {
  if (posts.length === 0) return null;

  const topPosts = posts.slice(0, 5);
  const featuredPost = topPosts[0];
  const listPosts = topPosts.slice(1);

  return (
    <section className="py-10">
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="flex items-center gap-3 mb-6"
        >
          <div className="h-10 w-10 rounded-xl bg-accent/20 flex items-center justify-center">
            <TrendingUp className="h-5 w-5 text-accent-foreground" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground">Trending This Month</h2>
            <p className="text-sm text-muted-foreground">Most popular with our readers</p>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Featured #1 Article */}
          {featuredPost && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="lg:col-span-2"
            >
              <Link to={`/blog/${featuredPost.slug}`}>
                <Card className="h-full overflow-hidden rounded-2xl border-0 bg-card shadow-md hover:shadow-xl transition-all duration-300 group">
                  <div className="aspect-[4/3] overflow-hidden relative">
                    <img
                      src={featuredPost.cover_image || 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=600'}
                      alt={featuredPost.title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
                    
                    <Badge className="absolute top-3 left-3 bg-accent text-accent-foreground shadow-lg rounded-full px-3 py-1 text-xs font-bold">
                      #1 Trending
                    </Badge>

                    <div className="absolute bottom-0 left-0 right-0 p-4">
                      <h3 className="font-bold text-white text-lg leading-tight line-clamp-2 group-hover:underline">
                        {featuredPost.title}
                      </h3>
                      <div className="flex items-center gap-4 mt-2 text-white/80 text-xs">
                        <span className="flex items-center gap-1">
                          <Eye className="h-3 w-3" />
                          {featuredPost.views_count || 0} views
                        </span>
                        {featuredPost.reading_time_minutes && (
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {featuredPost.reading_time_minutes} min
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              </Link>
            </motion.div>
          )}

          {/* List of #2-5 */}
          <div className="lg:col-span-3 space-y-3">
            {listPosts.map((post, index) => (
              <motion.div
                key={post.id}
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05 }}
              >
                <Link to={`/blog/${post.slug}`}>
                  <Card className="flex items-center gap-4 p-4 rounded-xl border border-border/50 bg-card hover:bg-muted/50 hover:border-primary/30 transition-all duration-200 group">
                    {/* Rank Number */}
                    <div className="flex-shrink-0 h-10 w-10 rounded-full bg-muted flex items-center justify-center font-bold text-lg text-muted-foreground">
                      #{index + 2}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-foreground text-sm line-clamp-1 group-hover:text-primary transition-colors">
                        {post.title}
                      </h4>
                      <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Eye className="h-3 w-3" />
                          {post.views_count || 0}
                        </span>
                        {post.reading_time_minutes && (
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {post.reading_time_minutes} min
                          </span>
                        )}
                        {post.category && (
                          <Badge variant="secondary" className="text-[10px] px-2 py-0 rounded-full">
                            {post.category.name}
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Arrow */}
                    <ArrowUpRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0" />
                  </Card>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
