import { Search, SlidersHorizontal } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
    <div className="space-y-4">
      {/* Row 1: Search + Sort */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search articles..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={sortBy} onValueChange={(value) => onSortChange(value as BlogSortOption)}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">Newest First</SelectItem>
            <SelectItem value="most_viewed">Most Viewed</SelectItem>
            <SelectItem value="most_saved">Most Saved</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Row 2: Category pills + City + Audience filters */}
      <div className="flex flex-col lg:flex-row gap-3">
        {/* Category pills - scrollable on mobile */}
        <div className="flex-1 overflow-x-auto pb-2 lg:pb-0">
          <div className="flex gap-2 min-w-max">
            <Button
              variant={!selectedCategory ? 'default' : 'outline'}
              size="sm"
              onClick={() => onCategoryChange(null)}
              className="text-xs h-8"
            >
              All
            </Button>
            {categories.map((category) => (
              <Button
                key={category.id}
                variant={selectedCategory === category.slug ? 'default' : 'outline'}
                size="sm"
                onClick={() => onCategoryChange(category.slug)}
                className="text-xs h-8 whitespace-nowrap"
              >
                {category.name}
              </Button>
            ))}
          </div>
        </div>

        {/* City + Audience filters */}
        <div className="flex gap-2 flex-shrink-0">
          <Select 
            value={selectedCity || 'all'} 
            onValueChange={(value) => onCityChange(value === 'all' ? null : value)}
          >
            <SelectTrigger className="w-[140px] h-8 text-xs">
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
              <Button variant="outline" size="sm" className="h-8 text-xs gap-2">
                <SlidersHorizontal className="h-3 w-3" />
                Audience
                {selectedAudiences.length > 0 && (
                  <Badge variant="secondary" className="h-5 px-1.5 text-[10px]">
                    {selectedAudiences.length}
                  </Badge>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-56" align="end">
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
      </div>

      {/* Active filters display */}
      {activeFilterCount > 0 && (
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-xs text-muted-foreground">Active filters:</span>
          {selectedCategory && (
            <Badge variant="secondary" className="text-xs gap-1">
              {categories.find(c => c.slug === selectedCategory)?.name}
              <button 
                onClick={() => onCategoryChange(null)}
                className="ml-1 hover:text-foreground"
              >
                ×
              </button>
            </Badge>
          )}
          {selectedCity && (
            <Badge variant="secondary" className="text-xs gap-1">
              {selectedCity}
              <button 
                onClick={() => onCityChange(null)}
                className="ml-1 hover:text-foreground"
              >
                ×
              </button>
            </Badge>
          )}
          {selectedAudiences.map((audience) => (
            <Badge key={audience} variant="secondary" className="text-xs gap-1">
              {AUDIENCE_OPTIONS.find(a => a.value === audience)?.label}
              <button 
                onClick={() => handleAudienceToggle(audience)}
                className="ml-1 hover:text-foreground"
              >
                ×
              </button>
            </Badge>
          ))}
          <Button
            variant="ghost"
            size="sm"
            className="h-6 text-xs text-muted-foreground"
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
