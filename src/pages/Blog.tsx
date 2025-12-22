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
      <div className="container py-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Header */}
          <div className="text-center space-y-3">
            <div className="flex items-center justify-center gap-2">
              <BookOpen className="h-7 w-7 text-primary" />
              <h1 className="text-3xl font-bold text-foreground">Blog & Guides</h1>
            </div>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Expert insights, buying guides, and market updates to help you make informed real estate decisions in Israel.
            </p>
          </div>

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
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : posts.length === 0 ? (
            <div className="text-center py-12">
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
              <p className="text-sm text-muted-foreground">
                {posts.length} article{posts.length !== 1 ? 's' : ''} found
              </p>
              <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
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
