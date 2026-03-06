import { useRef, useState, useEffect } from 'react';
import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { BlogCategory, BlogSortOption } from '@/types/content';
import { cn } from '@/lib/utils';

interface BlogFiltersProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  categories: BlogCategory[];
  selectedCategory: string | null;
  onCategoryChange: (slug: string | null) => void;
  sortBy: BlogSortOption;
  onSortChange: (value: BlogSortOption) => void;
}

export function BlogFilters({
  searchQuery,
  onSearchChange,
  categories,
  selectedCategory,
  onCategoryChange,
  sortBy,
  onSortChange,
}: BlogFiltersProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [showLeftGradient, setShowLeftGradient] = useState(false);
  const [showRightGradient, setShowRightGradient] = useState(false);

  const checkScrollPosition = () => {
    const container = scrollContainerRef.current;
    if (!container) return;
    const { scrollLeft, scrollWidth, clientWidth } = container;
    setShowLeftGradient(scrollLeft > 10);
    setShowRightGradient(scrollLeft < scrollWidth - clientWidth - 10);
  };

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;
    checkScrollPosition();
    container.addEventListener('scroll', checkScrollPosition);
    window.addEventListener('resize', checkScrollPosition);
    return () => {
      container.removeEventListener('scroll', checkScrollPosition);
      window.removeEventListener('resize', checkScrollPosition);
    };
  }, [categories]);

  return (
    <div className="space-y-4">
      {/* Search + Sort */}
      <div className="flex justify-center gap-3">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by title..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10 h-10 rounded-xl bg-background border-border/50 focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </div>
        <Select value={sortBy} onValueChange={(v) => onSortChange(v as BlogSortOption)}>
          <SelectTrigger className="w-[140px] h-10 rounded-xl border-border/50 bg-background text-sm flex-shrink-0">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">Newest</SelectItem>
            <SelectItem value="most_viewed">Most Viewed</SelectItem>
            <SelectItem value="most_saved">Most Saved</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Category Pills */}
      <div className="relative">
        <div
          className={cn(
            "absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none transition-opacity duration-200",
            showLeftGradient ? "opacity-100" : "opacity-0"
          )}
        />
        <div
          className={cn(
            "absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none transition-opacity duration-200",
            showRightGradient ? "opacity-100" : "opacity-0"
          )}
        />
        <div
          ref={scrollContainerRef}
          className="flex justify-center gap-2 pb-2 px-1 overflow-x-auto scrollbar-hide"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          <Button
            variant={!selectedCategory ? 'default' : 'outline'}
            size="sm"
            onClick={() => onCategoryChange(null)}
            className={cn(
              "rounded-full px-5 h-9 text-sm font-medium whitespace-nowrap transition-all flex-shrink-0",
              !selectedCategory
                ? "bg-primary text-primary-foreground shadow-lg"
                : "bg-background hover:bg-accent border-border/50 hover:border-primary/50"
            )}
          >
            All Articles
          </Button>
          {categories.map((category) => (
            <Button
              key={category.id}
              variant={selectedCategory === category.slug ? 'default' : 'outline'}
              size="sm"
              onClick={() => onCategoryChange(category.slug)}
              className={cn(
                "rounded-full px-5 h-9 text-sm font-medium whitespace-nowrap transition-all flex-shrink-0",
                selectedCategory === category.slug
                  ? "bg-primary text-primary-foreground shadow-lg"
                  : "bg-background hover:bg-accent border-border/50 hover:border-primary/50"
              )}
            >
              {category.name}
            </Button>
          ))}
        </div>
      </div>

      {/* Active Category Filter */}
      {selectedCategory && (
        <div className="flex justify-center">
          <Badge variant="secondary" className="text-xs gap-1.5 rounded-full px-3 py-1 bg-primary/10 text-primary border-0">
            {categories.find(c => c.slug === selectedCategory)?.name}
            <button
              onClick={() => onCategoryChange(null)}
              className="hover:text-primary/70"
            >
              <X className="h-3 w-3" />
            </button>
          </Badge>
        </div>
      )}
    </div>
  );
}
