import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { BookOpen, Loader2, TrendingUp, Clock, Bookmark, Lightbulb, BarChart3 } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { useBlogPosts, useBlogCategories, useBlogCities } from '@/hooks/useBlog';
import { useSavedArticles } from '@/hooks/useSavedArticles';
import { BlogFilters } from '@/components/blog/BlogFilters';
import { BlogCard } from '@/components/blog/BlogCard';
import { FeaturedArticle } from '@/components/blog/FeaturedArticle';
import { BlogSection } from '@/components/blog/BlogSection';
import { BlogSortOption, BlogAudience } from '@/types/content';
import { useSearchParams } from 'react-router-dom';

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
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCity, setSelectedCity] = useState<string | null>(null);
  const [selectedAudiences, setSelectedAudiences] = useState<BlogAudience[]>([]);
  const [sortBy, setSortBy] = useState<BlogSortOption>('newest');
  
  const categorySlug = searchParams.get('category') || undefined;
  const debouncedSearch = useDebounceValue(searchQuery, 300);

  // Check if any filters are active
  const hasActiveFilters = categorySlug || selectedCity || selectedAudiences.length > 0 || debouncedSearch;

  // Data hooks
  const { data: categories = [] } = useBlogCategories();
  const { data: cities = [] } = useBlogCities();
  const { data: posts = [], isLoading: postsLoading } = useBlogPosts({
    categorySlug,
    city: selectedCity || undefined,
    audiences: selectedAudiences.length > 0 ? selectedAudiences : undefined,
    search: debouncedSearch || undefined,
    sortBy,
  });
  
  // Also fetch all posts for sections when no filters
  const { data: allPosts = [] } = useBlogPosts({ sortBy: 'newest' });
  const { data: popularPosts = [] } = useBlogPosts({ sortBy: 'most_viewed' });
  
  const { isArticleSaved, toggleSave } = useSavedArticles();

  // Get featured article (most viewed from all posts)
  const featuredPost = useMemo(() => {
    if (hasActiveFilters) return null;
    return popularPosts[0] || allPosts[0] || null;
  }, [popularPosts, allPosts, hasActiveFilters]);

  // Get latest articles (excluding featured)
  const latestPosts = useMemo(() => {
    if (hasActiveFilters) return [];
    return allPosts.filter(p => p.id !== featuredPost?.id).slice(0, 8);
  }, [allPosts, featuredPost, hasActiveFilters]);

  // Get popular articles (excluding featured)
  const trendingPosts = useMemo(() => {
    if (hasActiveFilters) return [];
    return popularPosts.filter(p => p.id !== featuredPost?.id).slice(0, 8);
  }, [popularPosts, featuredPost, hasActiveFilters]);

  // Group posts by category for topic sections
  const postsByCategory = useMemo(() => {
    if (hasActiveFilters) return {};
    const grouped: Record<string, typeof allPosts> = {};
    allPosts.forEach(post => {
      if (post.category?.name) {
        if (!grouped[post.category.name]) {
          grouped[post.category.name] = [];
        }
        if (grouped[post.category.name].length < 6) {
          grouped[post.category.name].push(post);
        }
      }
    });
    return grouped;
  }, [allPosts, hasActiveFilters]);

  const handleCategoryFilter = (slug: string | null) => {
    if (slug) {
      setSearchParams({ category: slug });
    } else {
      setSearchParams({});
    }
  };

  return (
    <Layout>
      {/* Featured Article Hero (only when no filters) */}
      {!hasActiveFilters && featuredPost && (
        <section className="container pt-8 pb-4">
          <FeaturedArticle
            post={featuredPost}
            isSaved={isArticleSaved(featuredPost.id)}
            onToggleSave={toggleSave}
          />
        </section>
      )}

      {/* Hero with title (when filters active or no featured) */}
      {(hasActiveFilters || !featuredPost) && (
        <section className="relative bg-gradient-to-br from-primary/5 via-background to-accent/5 border-b border-border/50">
          <div className="container py-12 md:py-16">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-3xl mx-auto text-center space-y-4"
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium">
                <BookOpen className="h-4 w-4" />
                Expert Insights & Guides
              </div>
              <h1 className="text-4xl md:text-5xl font-bold text-foreground tracking-tight">
                Blog & Guides
              </h1>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Expert insights, buying guides, and market updates to help you make informed real estate decisions in Israel.
              </p>
            </motion.div>
          </div>
        </section>
      )}

      {/* Content Section */}
      <div className="container py-8 md:py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="space-y-12"
        >
          {/* Filters */}
          <BlogFilters
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            categories={categories}
            selectedCategory={categorySlug || null}
            onCategoryChange={handleCategoryFilter}
            cities={cities}
            selectedCity={selectedCity}
            onCityChange={setSelectedCity}
            selectedAudiences={selectedAudiences}
            onAudienceChange={setSelectedAudiences}
            sortBy={sortBy}
            onSortChange={setSortBy}
          />

          {/* Content: Filtered Grid OR Topic Sections */}
          {postsLoading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
          ) : hasActiveFilters ? (
            /* Filtered Results Grid */
            posts.length === 0 ? (
              <div className="text-center py-20 bg-muted/30 rounded-3xl border border-border/50">
                <BookOpen className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h2 className="text-xl font-semibold text-foreground mb-2">No articles found</h2>
                <p className="text-muted-foreground">
                  Try adjusting your filters or search terms.
                </p>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground font-medium">
                    {posts.length} article{posts.length !== 1 ? 's' : ''} found
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
            )
          ) : (
            /* Topic Hub Sections */
            <div className="space-y-16">
              {/* Latest Articles */}
              {latestPosts.length > 0 && (
                <BlogSection
                  title="Latest Articles"
                  subtitle="Fresh insights and guides"
                  icon={Clock}
                  posts={latestPosts}
                  isArticleSaved={isArticleSaved}
                  onToggleSave={toggleSave}
                  showViewAll={false}
                />
              )}

              {/* Trending This Month */}
              {trendingPosts.length > 0 && (
                <BlogSection
                  title="Trending This Month"
                  subtitle="Most popular with our readers"
                  icon={TrendingUp}
                  posts={trendingPosts}
                  isArticleSaved={isArticleSaved}
                  onToggleSave={toggleSave}
                  showViewAll={false}
                />
              )}

              {/* Category Sections */}
              {Object.entries(postsByCategory).slice(0, 3).map(([categoryName, categoryPosts]) => {
                const categoryIcons: Record<string, typeof BookOpen> = {
                  'Buying Guides': Lightbulb,
                  'Market Insights': BarChart3,
                  'Investment Tips': TrendingUp,
                };
                const IconComponent = categoryIcons[categoryName] || BookOpen;
                
                return (
                  <BlogSection
                    key={categoryName}
                    title={categoryName}
                    icon={IconComponent}
                    posts={categoryPosts}
                    isArticleSaved={isArticleSaved}
                    onToggleSave={toggleSave}
                    onViewAll={() => {
                      const category = categories.find(c => c.name === categoryName);
                      if (category) handleCategoryFilter(category.slug);
                    }}
                  />
                );
              })}
            </div>
          )}
        </motion.div>
      </div>
    </Layout>
  );
}
