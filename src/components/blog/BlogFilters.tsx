import { useRef, useState, useEffect } from 'react';
import { Search, SlidersHorizontal, X, Sparkles } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { BlogCategory, BlogSortOption, BlogAudience, AUDIENCE_OPTIONS } from '@/types/content';
import { cn } from '@/lib/utils';

interface BlogFiltersProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  categories: BlogCategory[];
  selectedCategory: string | null;
  onCategoryChange: (slug: string | null) => void;
  cities: string[];
  selectedCity: string | null;
  onCityChange: (city: string | null) => void;
  selectedAudiences: BlogAudience[];
  onAudienceChange: (audiences: BlogAudience[]) => void;
  sortBy: BlogSortOption;
  onSortChange: (sort: BlogSortOption) => void;
}

export function BlogFilters({
  searchQuery,
  onSearchChange,
  categories,
  selectedCategory,
  onCategoryChange,
  cities,
  selectedCity,
  onCityChange,
  selectedAudiences,
  onAudienceChange,
  sortBy,
  onSortChange,
}: BlogFiltersProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [showLeftGradient, setShowLeftGradient] = useState(false);
  const [showRightGradient, setShowRightGradient] = useState(false);

  const handleAudienceToggle = (audience: BlogAudience) => {
    if (selectedAudiences.includes(audience)) {
      onAudienceChange(selectedAudiences.filter(a => a !== audience));
    } else {
      onAudienceChange([...selectedAudiences, audience]);
    }
  };

  const activeFilterCount = 
    (selectedCategory ? 1 : 0) + 
    (selectedCity ? 1 : 0) + 
    selectedAudiences.length;

  // Check scroll position to show/hide gradients
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
    
    // Initial check
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
      {/* Sleek Filter Bar */}
      <div className="flex flex-col lg:flex-row justify-center items-center gap-4 p-4 rounded-2xl bg-muted/30 border border-border/50 backdrop-blur-sm">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search articles..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10 h-10 rounded-xl bg-background border-border/50 focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </div>

        {/* Filters Group */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Sort */}
          <Select value={sortBy} onValueChange={(value) => onSortChange(value as BlogSortOption)}>
            <SelectTrigger className="w-[140px] h-10 rounded-xl bg-background border-border/50 text-sm">
              <Sparkles className="h-3.5 w-3.5 mr-2 text-muted-foreground" />
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest</SelectItem>
              <SelectItem value="most_viewed">Most Viewed</SelectItem>
              <SelectItem value="most_saved">Most Saved</SelectItem>
            </SelectContent>
          </Select>

          {/* City */}
          <Select 
            value={selectedCity || 'all'} 
            onValueChange={(value) => onCityChange(value === 'all' ? null : value)}
          >
            <SelectTrigger className="w-[130px] h-10 rounded-xl bg-background border-border/50 text-sm">
              <SelectValue placeholder="All Cities" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Cities</SelectItem>
              {cities.map((city) => (
                <SelectItem key={city} value={city}>
                  {city}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Audience */}
          <Popover>
            <PopoverTrigger asChild>
              <Button 
                variant="outline" 
                className={cn(
                  "h-10 rounded-xl px-4 text-sm gap-2 bg-background border-border/50",
                  selectedAudiences.length > 0 && "border-primary/50 bg-primary/5"
                )}
              >
                <SlidersHorizontal className="h-4 w-4" />
                Audience
                {selectedAudiences.length > 0 && (
                  <Badge className="h-5 px-1.5 text-xs rounded-full bg-primary text-primary-foreground">
                    {selectedAudiences.length}
                  </Badge>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-56 rounded-xl p-4" align="end">
              <div className="space-y-3">
                <p className="text-sm font-semibold text-foreground">Filter by audience</p>
                {AUDIENCE_OPTIONS.map((option) => (
                  <div key={option.value} className="flex items-center space-x-3">
                    <Checkbox
                      id={option.value}
                      checked={selectedAudiences.includes(option.value)}
                      onCheckedChange={() => handleAudienceToggle(option.value)}
                      className="rounded"
                    />
                    <Label htmlFor={option.value} className="text-sm cursor-pointer">
                      {option.label}
                    </Label>
                  </div>
                ))}
                {selectedAudiences.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full text-xs mt-2"
                    onClick={() => onAudienceChange([])}
                  >
                    Clear audience
                  </Button>
                )}
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Category Pills with Fade Gradients */}
      <div className="relative">
        {/* Left fade gradient */}
        <div 
          className={cn(
            "absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none transition-opacity duration-200",
            showLeftGradient ? "opacity-100" : "opacity-0"
          )}
        />
        
        {/* Right fade gradient */}
        <div 
          className={cn(
            "absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none transition-opacity duration-200",
            showRightGradient ? "opacity-100" : "opacity-0"
          )}
        />

        <div 
          ref={scrollContainerRef}
          className="flex justify-center gap-2 pb-2 overflow-x-auto scrollbar-hide"
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

      {/* Active Filters */}
      {activeFilterCount > 0 && (
        <div className="flex flex-wrap justify-center gap-2 items-center">
          <span className="text-xs text-muted-foreground font-medium">Active:</span>
          {selectedCategory && (
            <Badge variant="secondary" className="text-xs gap-1.5 rounded-full px-3 py-1 bg-primary/10 text-primary border-0">
              {categories.find(c => c.slug === selectedCategory)?.name}
              <button 
                onClick={() => onCategoryChange(null)}
                className="hover:text-primary/70"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {selectedCity && (
            <Badge variant="secondary" className="text-xs gap-1.5 rounded-full px-3 py-1 bg-primary/10 text-primary border-0">
              {selectedCity}
              <button 
                onClick={() => onCityChange(null)}
                className="hover:text-primary/70"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {selectedAudiences.map((audience) => (
            <Badge key={audience} variant="secondary" className="text-xs gap-1.5 rounded-full px-3 py-1 bg-primary/10 text-primary border-0">
              {AUDIENCE_OPTIONS.find(a => a.value === audience)?.label}
              <button 
                onClick={() => handleAudienceToggle(audience)}
                className="hover:text-primary/70"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
          <Button
            variant="ghost"
            size="sm"
            className="h-6 text-xs text-muted-foreground hover:text-primary px-2"
            onClick={() => {
              onCategoryChange(null);
              onCityChange(null);
              onAudienceChange([]);
            }}
          >
            Clear all
          </Button>
        </div>
      )}
    </div>
  );
}
