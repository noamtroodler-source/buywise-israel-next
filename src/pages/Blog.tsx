import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { BookOpen, Loader2, Clock, BarChart3, Scale, MapPin, ShoppingCart, Lightbulb } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { useBlogPosts, useBlogCategories, useBlogCities } from '@/hooks/useBlog';
import { useSavedArticles } from '@/hooks/useSavedArticles';
import { BlogFilters } from '@/components/blog/BlogFilters';
import { BlogCard } from '@/components/blog/BlogCard';
import { BlogSection } from '@/components/blog/BlogSection';
import { QuickPaths } from '@/components/blog/QuickPaths';
import { EssentialReading } from '@/components/blog/EssentialReading';
import { TrendingList } from '@/components/blog/TrendingList';
import { BlogCTA } from '@/components/blog/BlogCTA';
import { BlogSortOption, BlogAudience } from '@/types/content';
import { useSearchParams } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';

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

// Category icon mapping
const categoryIcons: Record<string, typeof BookOpen> = {
  'Buying Guides': ShoppingCart,
  'Buying in Israel': ShoppingCart,
  'Legal & Finance': Scale,
  'Market Insights': BarChart3,
  'Neighborhood Guides': MapPin,
  'Investment Tips': Lightbulb,
};

export default function Blog() {
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCity, setSelectedCity] = useState<string | null>(null);
  const [selectedAudiences, setSelectedAudiences] = useState<BlogAudience[]>([]);
  const [sortBy, setSortBy] = useState<BlogSortOption>('newest');
  const [quickPathAudience, setQuickPathAudience] = useState<BlogAudience | null>(null);
  
  const categorySlug = searchParams.get('category') || undefined;
  const debouncedSearch = useDebounceValue(searchQuery, 300);

  // Sync quick path selection with audiences filter
  useEffect(() => {
    if (quickPathAudience) {
      setSelectedAudiences([quickPathAudience]);
    }
  }, [quickPathAudience]);

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
  
  // Fetch all posts for sections when no filters
  const { data: allPosts = [] } = useBlogPosts({ sortBy: 'newest' });
  const { data: popularPosts = [] } = useBlogPosts({ sortBy: 'most_viewed' });
  
  const { isArticleSaved, toggleSave } = useSavedArticles();

  // Get essential reading posts (prioritize guides/getting started content)
  const essentialPosts = useMemo(() => {
    if (hasActiveFilters) return [];
    // Get posts that are good for newcomers - prioritize first-time-buyers audience
    const starterPosts = allPosts.filter(p => 
      p.audiences?.includes('first-time-buyers') || 
      p.category?.slug === 'buying-guides'
    );
    if (starterPosts.length >= 3) return starterPosts.slice(0, 3);
    return allPosts.slice(0, 3);
  }, [allPosts, hasActiveFilters]);

  // Group posts by category for topic sections
  const postsByCategory = useMemo(() => {
    if (hasActiveFilters) return {};
    const grouped: Record<string, typeof allPosts> = {};
    allPosts.forEach(post => {
      if (post.category?.name) {
        if (!grouped[post.category.name]) {
          grouped[post.category.name] = [];
        }
        if (grouped[post.category.name].length < 8) {
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

  const handleQuickPathSelect = (audience: BlogAudience | null) => {
    setQuickPathAudience(audience);
    if (audience) {
      setSelectedAudiences([audience]);
    } else {
      setSelectedAudiences([]);
    }
  };

  return (
    <Layout>
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
              Guides, market context, and honest answers for buying property in Israel — written for international buyers.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Quick Paths - Audience Self-Identification */}
      {!hasActiveFilters && (
        <QuickPaths 
          selectedAudience={quickPathAudience} 
          onSelectAudience={handleQuickPathSelect}
        />
      )}

      {/* Essential Reading - For Newcomers */}
      {!hasActiveFilters && essentialPosts.length > 0 && (
        <EssentialReading
          posts={essentialPosts}
          isArticleSaved={isArticleSaved}
          onToggleSave={toggleSave}
        />
      )}

      {/* Content Section */}
      <div className="container py-8 md:py-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="space-y-10"
        >
          {/* Filters - Now more compact */}
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
            onAudienceChange={(audiences) => {
              setSelectedAudiences(audiences);
              setQuickPathAudience(null);
            }}
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
                <div className="grid gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
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
            <div className="space-y-12">
              {/* Browse by Topic - Category Carousels */}
              {Object.entries(postsByCategory).slice(0, 4).map(([categoryName, categoryPosts]) => {
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

      {/* Trending Section - After topic browsing */}
      {!hasActiveFilters && popularPosts.length > 0 && (
        <TrendingList posts={popularPosts} />
      )}

      {/* Bottom CTA */}
      <BlogCTA />
    </Layout>
  );
}
