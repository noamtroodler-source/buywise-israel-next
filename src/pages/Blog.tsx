import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BookOpen, Loader2 } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { useBlogPosts, useBlogCategories, useBlogCities } from '@/hooks/useBlog';
import { useSavedArticles } from '@/hooks/useSavedArticles';
import { BlogFilters } from '@/components/blog/BlogFilters';
import { BlogCard } from '@/components/blog/BlogCard';
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
  const { isArticleSaved, toggleSave } = useSavedArticles();

  const handleCategoryFilter = (slug: string | null) => {
    if (slug) {
      setSearchParams({ category: slug });
    } else {
      setSearchParams({});
    }
  };

  return (
    <Layout>
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-primary/5 via-background to-accent/5 border-b border-border/50">
        <div className="container py-12 md:py-20">
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
            cities={cities}
            selectedCity={selectedCity}
            onCityChange={setSelectedCity}
            selectedAudiences={selectedAudiences}
            onAudienceChange={setSelectedAudiences}
            sortBy={sortBy}
            onSortChange={setSortBy}
          />

          {/* Posts Grid */}
          {postsLoading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
            </div>
          ) : posts.length === 0 ? (
            <div className="text-center py-16 bg-muted/30 rounded-2xl border border-border/50">
              <BookOpen className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-foreground mb-2">No articles found</h2>
              <p className="text-muted-foreground">
                {searchQuery || selectedCity || selectedAudiences.length > 0 || categorySlug
                  ? 'Try adjusting your filters or search terms.'
                  : 'Check back soon for expert insights and guides.'}
              </p>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
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
          )}
        </motion.div>
      </div>
    </Layout>
  );
}
