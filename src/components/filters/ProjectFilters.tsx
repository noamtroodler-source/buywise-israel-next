import { useState } from 'react';
import { ChevronDown, ChevronUp, MapPin, DollarSign, Building2, Calendar, ArrowUpDown, Search, Check, ArrowRight, Home, HelpCircle, Bell, Briefcase } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useCities } from '@/hooks/useCities';
import { useDevelopers } from '@/hooks/useProjects';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';

export interface ProjectFiltersType {
  city?: string;
  status?: string;
  min_price?: number;
  max_price?: number;
  completion_year?: number;
  min_rooms?: number;
  developer_id?: string;
  sort_by?: 'newest' | 'price_asc' | 'price_desc' | 'completion';
}

interface ProjectFiltersProps {
  filters: ProjectFiltersType;
  onFiltersChange: (filters: ProjectFiltersType) => void;
  onCreateAlert?: () => void;
}

const PROJECT_STATUSES = [
  { value: 'planning', label: 'Planning' },
  { value: 'pre_sale', label: 'Pre-Sale' },
  { value: 'under_construction', label: 'Under Construction' },
  { value: 'completed', label: 'Completed' },
];

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest First' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
  { value: 'completion', label: 'Completion Date' },
];

const formatWithCommas = (value: number | undefined): string => {
  if (value === undefined || value === null) return '';
  return value.toLocaleString('en-US');
};

const parseCommaNumber = (value: string): number | undefined => {
  const cleaned = value.replace(/,/g, '');
  if (cleaned === '') return undefined;
  const num = Number(cleaned);
  return isNaN(num) ? undefined : num;
};

const ROOM_OPTIONS = [
  { value: 3, label: '3+ Rooms' },
  { value: 4, label: '4+ Rooms' },
  { value: 5, label: '5+ Rooms' },
];

export function ProjectFilters({ filters, onFiltersChange, onCreateAlert }: ProjectFiltersProps) {
  const [cityOpen, setCityOpen] = useState(false);
  const [priceOpen, setPriceOpen] = useState(false);
  const [statusOpen, setStatusOpen] = useState(false);
  const [yearOpen, setYearOpen] = useState(false);
  const [roomsOpen, setRoomsOpen] = useState(false);
  const [developerOpen, setDeveloperOpen] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);
  const [citySearch, setCitySearch] = useState('');
  const [developerSearch, setDeveloperSearch] = useState('');
  
  const { data: cities } = useCities();
  const { data: developers } = useDevelopers();

  const filteredDevelopers = developers?.filter(dev => 
    dev.name.toLowerCase().includes(developerSearch.toLowerCase())
  );

  const updateFilter = <K extends keyof ProjectFiltersType>(key: K, value: ProjectFiltersType[K]) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const filteredCities = cities?.filter(city => 
    city.name.toLowerCase().includes(citySearch.toLowerCase())
  );

  const currentYear = new Date().getFullYear();
  const completionYears = Array.from({ length: 6 }, (_, i) => currentYear + i);

  const getSortLabel = () => {
    if (filters.sort_by) {
      const found = SORT_OPTIONS.find(s => s.value === filters.sort_by);
      return found?.label || 'Newest First';
    }
    return 'Newest First';
  };

  const filterButtonBase = "h-11 gap-2 rounded-full border border-border/60 bg-background hover:bg-muted/30 shadow-sm px-4 font-medium transition-all";
  const filterButtonActive = "bg-accent/20 border-accent/40 text-foreground";

  return (
    <div className="flex flex-wrap gap-2 items-center">
      {/* City Filter */}
      <Popover open={cityOpen} onOpenChange={setCityOpen}>
        <PopoverTrigger asChild>
          <Button 
            variant="outline" 
            className={cn(filterButtonBase, (cityOpen || filters.city) && filterButtonActive)}
          >
            <MapPin className="h-4 w-4" />
            <span>{filters.city || 'City'}</span>
            {cityOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[320px] p-0 bg-background border shadow-xl z-50" align="start">
          <div className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-lg">Select City</h3>
              {filters.city && (
                <button 
                  className="text-sm text-muted-foreground hover:text-foreground"
                  onClick={() => {
                    updateFilter('city', undefined);
                    setCityOpen(false);
                  }}
                >
                  Clear
                </button>
              )}
            </div>
            
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search city..."
                value={citySearch}
                onChange={(e) => setCitySearch(e.target.value)}
                className="pl-10 rounded-lg"
              />
            </div>

            <div className="max-h-[250px] overflow-y-auto space-y-1">
              {filteredCities?.map(city => (
                <button
                  key={city.id}
                  className={cn(
                    "w-full text-left px-3 py-2.5 text-sm rounded-lg transition-colors",
                    filters.city === city.name 
                      ? "bg-accent text-accent-foreground font-medium" 
                      : "hover:bg-muted"
                  )}
                  onClick={() => {
                    updateFilter('city', city.name);
                    setCityOpen(false);
                    setCitySearch('');
                  }}
                >
                  {city.name}
                </button>
              ))}
            </div>

            <Link 
              to="/areas" 
              className="flex items-center gap-1 text-primary text-sm font-medium hover:underline"
            >
              Explore all areas <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </PopoverContent>
      </Popover>

      {/* Status Filter */}
      <Popover open={statusOpen} onOpenChange={setStatusOpen}>
        <PopoverTrigger asChild>
          <Button 
            variant="outline" 
            className={cn(filterButtonBase, (statusOpen || filters.status) && filterButtonActive)}
          >
            <Building2 className="h-4 w-4" />
            <span>{filters.status ? PROJECT_STATUSES.find(s => s.value === filters.status)?.label : 'Status'}</span>
            {statusOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[240px] p-0 bg-background border shadow-xl z-50" align="start">
          <div className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-lg">Project Status</h3>
              {filters.status && (
                <button 
                  className="text-sm text-muted-foreground hover:text-foreground"
                  onClick={() => updateFilter('status', undefined)}
                >
                  Clear
                </button>
              )}
            </div>
            
            <div className="space-y-1">
              {PROJECT_STATUSES.map(status => (
                <button
                  key={status.value}
                  className={cn(
                    "w-full text-left px-3 py-2.5 text-sm rounded-lg transition-colors flex items-center justify-between",
                    filters.status === status.value 
                      ? "bg-accent text-accent-foreground font-medium" 
                      : "hover:bg-muted"
                  )}
                  onClick={() => {
                    updateFilter('status', status.value);
                    setStatusOpen(false);
                  }}
                >
                  {status.label}
                  {filters.status === status.value && <Check className="h-4 w-4" />}
                </button>
              ))}
            </div>
          </div>
        </PopoverContent>
      </Popover>

      {/* Rooms Filter */}
      <Popover open={roomsOpen} onOpenChange={setRoomsOpen}>
        <PopoverTrigger asChild>
          <Button 
            variant="outline" 
            className={cn(filterButtonBase, (roomsOpen || filters.min_rooms) && filterButtonActive)}
          >
            <Home className="h-4 w-4" />
            <span>{filters.min_rooms ? `${filters.min_rooms}+ Rooms` : 'Rooms'}</span>
            {roomsOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[260px] p-0 bg-background border shadow-xl z-50" align="start">
          <div className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-lg">Rooms</h3>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <HelpCircle className="h-4 w-4 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <p>In Israel, rooms are counted differently. A "3-room" apartment typically means 2 bedrooms + living room.</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              {filters.min_rooms && (
                <button 
                  className="text-sm text-muted-foreground hover:text-foreground"
                  onClick={() => updateFilter('min_rooms', undefined)}
                >
                  Clear
                </button>
              )}
            </div>
            
            <div className="flex gap-2">
              {ROOM_OPTIONS.map(option => (
                <button
                  key={option.value}
                  className={cn(
                    "flex-1 h-10 rounded-lg border text-sm font-medium transition-all",
                    filters.min_rooms === option.value 
                      ? "bg-primary text-primary-foreground border-primary" 
                      : "border-border hover:bg-muted"
                  )}
                  onClick={() => {
                    updateFilter('min_rooms', filters.min_rooms === option.value ? undefined : option.value);
                    setRoomsOpen(false);
                  }}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        </PopoverContent>
      </Popover>

      {/* Price Filter */}
      <Popover open={priceOpen} onOpenChange={setPriceOpen}>
        <PopoverTrigger asChild>
          <Button 
            variant="outline" 
            className={cn(filterButtonBase, (priceOpen || filters.min_price || filters.max_price) && filterButtonActive)}
          >
            <DollarSign className="h-4 w-4" />
            <span>Price</span>
            {priceOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[320px] p-0 bg-background border shadow-xl z-50" align="start">
          <div className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-lg">Price Range</h3>
              {(filters.min_price || filters.max_price) && (
                <button 
                  className="text-sm text-muted-foreground hover:text-foreground"
                  onClick={() => {
                    updateFilter('min_price', undefined);
                    updateFilter('max_price', undefined);
                  }}
                >
                  Clear
                </button>
              )}
            </div>
            
            <div className="flex gap-3">
              <Input
                type="text"
                inputMode="numeric"
                placeholder="Min (₪)"
                value={formatWithCommas(filters.min_price)}
                onChange={(e) => updateFilter('min_price', parseCommaNumber(e.target.value))}
                className="flex-1 rounded-lg"
              />
              <Input
                type="text"
                inputMode="numeric"
                placeholder="Max (₪)"
                value={formatWithCommas(filters.max_price)}
                onChange={(e) => updateFilter('max_price', parseCommaNumber(e.target.value))}
                className="flex-1 rounded-lg"
              />
            </div>

            <Link 
              to="/tools?tool=affordability" 
              className="flex items-center gap-1 text-primary text-sm font-medium hover:underline"
            >
              Not sure how much you can afford? <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </PopoverContent>
      </Popover>

      {/* Completion Year Filter */}
      <Popover open={yearOpen} onOpenChange={setYearOpen}>
        <PopoverTrigger asChild>
          <Button 
            variant="outline" 
            className={cn(filterButtonBase, (yearOpen || filters.completion_year) && filterButtonActive)}
          >
            <Calendar className="h-4 w-4" />
            <span>{filters.completion_year || 'Completion'}</span>
            {yearOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[200px] p-0 bg-background border shadow-xl z-50" align="start">
          <div className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-lg">Completion</h3>
              {filters.completion_year && (
                <button 
                  className="text-sm text-muted-foreground hover:text-foreground"
                  onClick={() => updateFilter('completion_year', undefined)}
                >
                  Clear
                </button>
              )}
            </div>
            
            <div className="grid grid-cols-2 gap-2">
              {completionYears.map(year => (
                <button
                  key={year}
                  className={cn(
                    "h-10 rounded-lg border text-sm font-medium transition-all",
                    filters.completion_year === year 
                      ? "bg-primary text-primary-foreground border-primary" 
                      : "border-border hover:bg-muted"
                  )}
                  onClick={() => {
                    updateFilter('completion_year', filters.completion_year === year ? undefined : year);
                    setYearOpen(false);
                  }}
                >
                  {year}
                </button>
              ))}
            </div>
          </div>
        </PopoverContent>
      </Popover>

      {/* Developer Filter */}
      <Popover open={developerOpen} onOpenChange={setDeveloperOpen}>
        <PopoverTrigger asChild>
          <Button 
            variant="outline" 
            className={cn(filterButtonBase, (developerOpen || filters.developer_id) && filterButtonActive)}
          >
            <Briefcase className="h-4 w-4" />
            <span>{filters.developer_id ? developers?.find(d => d.id === filters.developer_id)?.name || 'Developer' : 'Developer'}</span>
            {developerOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[320px] p-0 bg-background border shadow-xl z-50" align="start">
          <div className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-lg">Developer</h3>
              {filters.developer_id && (
                <button 
                  className="text-sm text-muted-foreground hover:text-foreground"
                  onClick={() => {
                    updateFilter('developer_id', undefined);
                    setDeveloperOpen(false);
                  }}
                >
                  Clear
                </button>
              )}
            </div>
            
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search developer..."
                value={developerSearch}
                onChange={(e) => setDeveloperSearch(e.target.value)}
                className="pl-10 rounded-lg"
              />
            </div>

            <div className="max-h-[200px] overflow-y-auto space-y-1">
              {filteredDevelopers?.map(dev => (
                <button
                  key={dev.id}
                  className={cn(
                    "w-full text-left px-3 py-2.5 text-sm rounded-lg transition-colors flex items-center justify-between",
                    filters.developer_id === dev.id 
                      ? "bg-accent text-accent-foreground font-medium" 
                      : "hover:bg-muted"
                  )}
                  onClick={() => {
                    updateFilter('developer_id', dev.id);
                    setDeveloperOpen(false);
                    setDeveloperSearch('');
                  }}
                >
                  <span>{dev.name}</span>
                  {dev.is_verified && (
                    <span className="text-xs text-primary">✓ Verified</span>
                  )}
                </button>
              ))}
              {filteredDevelopers?.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">No developers found</p>
              )}
            </div>

            <Link 
              to="/developers" 
              className="flex items-center gap-1 text-primary text-sm font-medium hover:underline"
            >
              View all developers <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </PopoverContent>
      </Popover>

      {/* Sort & Create Alert */}
      <div className="flex items-center gap-2 ml-auto">
        <div className="flex items-center gap-1">
          <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
          <Popover open={sortOpen} onOpenChange={setSortOpen}>
            <PopoverTrigger asChild>
              <Button 
                variant="ghost" 
                className="h-11 gap-1 px-2 font-medium hover:bg-muted/50"
              >
                <span className="text-sm">{getSortLabel()}</span>
                {sortOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[200px] p-2 bg-background border shadow-xl z-50" align="end">
              {SORT_OPTIONS.map(option => (
                <button
                  key={option.value}
                  className={cn(
                    "w-full text-left px-3 py-2 text-sm rounded-md transition-colors flex items-center justify-between",
                    filters.sort_by === option.value 
                      ? "bg-amber-100 text-foreground font-medium" 
                      : "hover:bg-muted"
                  )}
                  onClick={() => {
                    updateFilter('sort_by', option.value as ProjectFiltersType['sort_by']);
                    setSortOpen(false);
                  }}
                >
                  {option.label}
                  {filters.sort_by === option.value && <Check className="h-4 w-4" />}
                </button>
              ))}
            </PopoverContent>
          </Popover>
        </div>

        {onCreateAlert && (
          <Button 
            onClick={onCreateAlert}
            className="h-11 gap-2 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground px-4"
          >
            <Bell className="h-4 w-4" />
            <span className="hidden sm:inline">Create Alert</span>
          </Button>
        )}
      </div>
    </div>
  );
}
