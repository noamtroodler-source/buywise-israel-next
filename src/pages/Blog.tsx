import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { BookOpen, Loader2 } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { SEOHead } from '@/components/seo/SEOHead';
import { useBlogPosts, useBlogCategories } from '@/hooks/useBlog';
import { useSavedArticles } from '@/hooks/useSavedArticles';
import { BlogFilters } from '@/components/blog/BlogFilters';
import { BlogCard } from '@/components/blog/BlogCard';
import { BlogCTA } from '@/components/blog/BlogCTA';
import { useSearchParams } from 'react-router-dom';
import { PullToRefresh } from '@/components/shared/PullToRefresh';
import { useIsMobile } from '@/hooks/use-mobile';
import { useQueryClient } from '@tanstack/react-query';
import { useTrackContentVisit } from '@/hooks/useTrackContentVisit';

// Debounce hook for search
function useDebounceValue<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

export default function Blog() {
  useTrackContentVisit('blog');
  const [searchParams, setSearchParams] = useSearchParams();
  const isMobile = useIsMobile();
  const queryClient = useQueryClient();
  
  // Filter state
  const [searchQuery, setSearchQuery] = useState('');
  
  const categorySlug = searchParams.get('category') || undefined;
  const debouncedSearch = useDebounceValue(searchQuery, 300);

  // Data hooks
  const { data: categories = [] } = useBlogCategories();
  const { data: posts = [], isLoading: postsLoading } = useBlogPosts({
    categorySlug,
    search: debouncedSearch || undefined,
  });
  
  const { isArticleSaved, toggleSave } = useSavedArticles();

  // Pull-to-refresh handler
  const handleRefresh = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: ['blog-posts'] });
  }, [queryClient]);

  const handleCategoryFilter = (slug: string | null) => {
    if (slug) {
      setSearchParams({ category: slug });
    } else {
      setSearchParams({});
    }
  };

  return (
    <Layout>
      <SEOHead
        title="Real Estate Guides & Articles | BuyWise Israel"
        description="Learn about buying property in Israel with guides, market insights, and honest answers for international buyers. Expert advice on taxes, mortgages, and more."
        canonicalUrl="https://buywiseisrael.com/blog"
      />
      
      {/* Compact Hero Section */}
      <section className="relative bg-gradient-to-br from-primary/5 via-background to-accent/5 border-b border-border/50">
        <div className="container py-10 md:py-14">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-3xl mx-auto text-center space-y-4"
          >
            <h1 className="text-3xl md:text-4xl font-bold text-foreground tracking-tight">
              Learn Before You Leap
            </h1>
            <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto">
              Guides, market context, and honest answers for buying property in <span className="text-primary">Israel</span> — written for international buyers.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Content Section */}
      <div className="container py-8 md:py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="space-y-8"
        >
          {/* Filters */}
          <BlogFilters
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            categories={categories}
            selectedCategory={categorySlug || null}
            onCategoryChange={handleCategoryFilter}
          />

          {/* Content Grid */}
          {postsLoading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
          ) : posts.length === 0 ? (
            <div className="text-center py-20 bg-muted/30 rounded-2xl border border-border/50">
              <BookOpen className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-foreground mb-2">No articles found</h2>
              <p className="text-muted-foreground">
                Try adjusting your filters or search terms.
              </p>
            </div>
          ) : (
            <PullToRefresh onRefresh={handleRefresh} disabled={!isMobile}>
              <>
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    {posts.length} article{posts.length !== 1 ? 's' : ''}
                  </p>
                </div>
                <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {posts.map((post, index) => (
                    <BlogCard
                      key={post.id}
                      post={post}
                      index={index}
                      isSaved={isArticleSaved(post.id)}
                      onToggleSave={toggleSave}
                    />
                  ))}
                </div>
              </>
            </PullToRefresh>
          )}
        </motion.div>
      </div>

      {/* Bottom CTA */}
      <BlogCTA />
    </Layout>
  );
}
