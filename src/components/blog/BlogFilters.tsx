import { Search, SlidersHorizontal, X } from 'lucide-react';
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

  return (
    <div className="space-y-6">
      {/* Row 1: Search + Sort */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-center">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search articles..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-11 h-11 rounded-xl bg-background border-border/50 focus:border-primary"
          />
        </div>
        <Select value={sortBy} onValueChange={(value) => onSortChange(value as BlogSortOption)}>
          <SelectTrigger className="w-full sm:w-[160px] h-11 rounded-xl bg-background border-border/50">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">Newest First</SelectItem>
            <SelectItem value="most_viewed">Most Viewed</SelectItem>
            <SelectItem value="most_saved">Most Saved</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Row 2: Category pills - horizontally scrollable */}
      <div className="relative">
        <ScrollArea className="w-full">
          <div className="flex gap-2 pb-2 px-1">
            <Button
              variant={!selectedCategory ? 'default' : 'outline'}
              size="sm"
              onClick={() => onCategoryChange(null)}
              className={cn(
                "rounded-full px-4 h-9 text-sm font-medium whitespace-nowrap transition-all",
                !selectedCategory 
                  ? "bg-primary text-primary-foreground shadow-md" 
                  : "bg-background hover:bg-accent border-border/50"
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
                  "rounded-full px-4 h-9 text-sm font-medium whitespace-nowrap transition-all",
                  selectedCategory === category.slug 
                    ? "bg-primary text-primary-foreground shadow-md" 
                    : "bg-background hover:bg-accent border-border/50"
                )}
              >
                {category.name}
              </Button>
            ))}
          </div>
          <ScrollBar orientation="horizontal" className="invisible" />
        </ScrollArea>
      </div>

      {/* Row 3: City + Audience filters */}
      <div className="flex flex-wrap gap-3 items-center justify-center">
        <Select 
          value={selectedCity || 'all'} 
          onValueChange={(value) => onCityChange(value === 'all' ? null : value)}
        >
          <SelectTrigger className="w-[150px] h-9 rounded-full text-sm bg-background border-border/50">
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

        <Popover>
          <PopoverTrigger asChild>
            <Button 
              variant="outline" 
              size="sm" 
              className="h-9 rounded-full px-4 text-sm gap-2 bg-background border-border/50"
            >
              <SlidersHorizontal className="h-4 w-4" />
              Audience
              {selectedAudiences.length > 0 && (
                <Badge variant="secondary" className="h-5 px-1.5 text-xs rounded-full">
                  {selectedAudiences.length}
                </Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-56 rounded-xl" align="center">
            <div className="space-y-3">
              <p className="text-sm font-medium">Filter by audience</p>
              {AUDIENCE_OPTIONS.map((option) => (
                <div key={option.value} className="flex items-center space-x-2">
                  <Checkbox
                    id={option.value}
                    checked={selectedAudiences.includes(option.value)}
                    onCheckedChange={() => handleAudienceToggle(option.value)}
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
                  className="w-full text-xs"
                  onClick={() => onAudienceChange([])}
                >
                  Clear all
                </Button>
              )}
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {/* Active filters display */}
      {activeFilterCount > 0 && (
        <div className="flex flex-wrap gap-2 items-center justify-center">
          <span className="text-xs text-muted-foreground">Active filters:</span>
          {selectedCategory && (
            <Badge variant="secondary" className="text-xs gap-1 rounded-full px-3 py-1">
              {categories.find(c => c.slug === selectedCategory)?.name}
              <button 
                onClick={() => onCategoryChange(null)}
                className="ml-1 hover:text-foreground"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {selectedCity && (
            <Badge variant="secondary" className="text-xs gap-1 rounded-full px-3 py-1">
              {selectedCity}
              <button 
                onClick={() => onCityChange(null)}
                className="ml-1 hover:text-foreground"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {selectedAudiences.map((audience) => (
            <Badge key={audience} variant="secondary" className="text-xs gap-1 rounded-full px-3 py-1">
              {AUDIENCE_OPTIONS.find(a => a.value === audience)?.label}
              <button 
                onClick={() => handleAudienceToggle(audience)}
                className="ml-1 hover:text-foreground"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs text-muted-foreground hover:text-foreground"
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
