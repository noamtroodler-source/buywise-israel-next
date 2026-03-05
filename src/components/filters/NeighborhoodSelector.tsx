import { useState } from 'react';
import { Check, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { useNeighborhoodNames } from '@/hooks/useNeighborhoodNames';

interface NeighborhoodSelectorProps {
  cityName: string | undefined;
  selectedNeighborhoods: string[];
  onNeighborhoodsChange: (neighborhoods: string[]) => void;
  externalSearch?: string;
}

export function NeighborhoodSelector({
  cityName,
  selectedNeighborhoods,
  onNeighborhoodsChange,
  externalSearch,
}: NeighborhoodSelectorProps) {
  const [search, setSearch] = useState('');
  const { data: neighborhoods = [] } = useNeighborhoodNames(cityName);
  const hasExternalSearch = externalSearch !== undefined;
  const activeSearch = hasExternalSearch ? externalSearch : search;

  if (!cityName || neighborhoods.length === 0) return null;

  const filtered = activeSearch
    ? neighborhoods.filter(n => n.toLowerCase().includes(activeSearch.toLowerCase()))
    : neighborhoods;

  const toggleNeighborhood = (name: string) => {
    if (selectedNeighborhoods.includes(name)) {
      onNeighborhoodsChange(selectedNeighborhoods.filter(n => n !== name));
    } else {
      onNeighborhoodsChange([...selectedNeighborhoods, name]);
    }
  };

  return (
    <div className="space-y-2 border-b border-border pb-3 mb-1">
      <Label className="text-sm font-medium">Neighborhoods</Label>
      {!hasExternalSearch && neighborhoods.length > 6 && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Search neighborhood..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-8 text-sm rounded-lg"
          />
        </div>
      )}
      <div className="max-h-[96px] overflow-y-auto space-y-0.5">
        {filtered.map(name => {
          const isSelected = selectedNeighborhoods.includes(name);
          return (
            <button
              key={name}
              className={cn(
                "w-full text-left px-3 py-1.5 text-sm rounded-lg transition-colors flex items-center justify-between",
                isSelected
                  ? "bg-primary/10 text-primary font-medium"
                  : "hover:bg-muted"
              )}
              onClick={() => toggleNeighborhood(name)}
            >
              <span>{name}</span>
              {isSelected && <Check className="h-3.5 w-3.5 shrink-0" />}
            </button>
          );
        })}
        {filtered.length === 0 && search && (
          <p className="text-xs text-muted-foreground px-3 py-2">No neighborhoods found</p>
        )}
      </div>
    </div>
  );
}
