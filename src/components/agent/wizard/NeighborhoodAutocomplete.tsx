import * as React from 'react';
import { Check, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { useNeighborhoodNames } from '@/hooks/useNeighborhoodNames';

interface NeighborhoodAutocompleteProps {
  value: string;
  onValueChange: (value: string) => void;
  cityName: string;
  placeholder?: string;
  className?: string;
}

function AngloBadge() {
  return (
    <span className="text-[10px] font-medium text-primary/70 bg-primary/[0.08] border border-primary/15 rounded-full px-1.5 py-0.5 whitespace-nowrap">
      Anglo hub
    </span>
  );
}

export function NeighborhoodAutocomplete({
  value,
  onValueChange,
  cityName,
  placeholder = 'Select or search neighborhood',
  className,
}: NeighborhoodAutocompleteProps) {
  const [open, setOpen] = React.useState(false);
  const [inputValue, setInputValue] = React.useState(value);
  const { data: neighborhoods = [], isLoading } = useNeighborhoodNames(cityName);
  const containerRef = React.useRef<HTMLDivElement>(null);

  const filtered = inputValue.trim()
    ? neighborhoods.filter((n) =>
        n.name.toLowerCase().includes(inputValue.toLowerCase())
      )
    : neighborhoods;

  // Sync input with external value
  React.useEffect(() => {
    setInputValue(value);
  }, [value]);

  // Close on outside click
  React.useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSelect = (neighborhood: string) => {
    setInputValue(neighborhood);
    onValueChange(neighborhood);
    setOpen(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
    setOpen(true);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') setOpen(false);
  };

  const disabled = !cityName;

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <Input
          value={inputValue}
          onChange={handleInputChange}
          onFocus={() => !disabled && setOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={disabled ? 'Select a city first' : placeholder}
          disabled={disabled}
          className={cn('h-11 rounded-xl pr-9', className)}
          autoComplete="off"
        />
        <ChevronDown
          className={cn(
            'absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground transition-transform',
            open && 'rotate-180'
          )}
        />
      </div>

      {open && !disabled && (
        <div className="absolute z-50 w-full mt-1 bg-background border border-border/50 rounded-xl shadow-[0_4px_24px_-4px_rgba(0,0,0,0.08),0_2px_8px_-2px_rgba(0,0,0,0.04)] max-h-60 overflow-auto">
          {isLoading ? (
            <div className="px-3 py-3 text-sm text-muted-foreground">
              Loading neighborhoods…
            </div>
          ) : filtered.length > 0 ? (
            filtered.map(({ name, isAnglo }) => (
              <button
                key={name}
                type="button"
                onClick={() => handleSelect(name)}
                className={cn(
                  'w-full px-3 py-2.5 text-left text-sm hover:bg-muted/50 flex items-center gap-2 first:rounded-t-xl last:rounded-b-xl transition-colors',
                  value === name && 'bg-primary/10'
                )}
              >
                {value === name && (
                  <Check className="h-4 w-4 text-primary shrink-0" />
                )}
                <span className={cn('flex items-center gap-1.5', value !== name && 'ml-6')}>
                  <span>{name}</span>
                  {isAnglo && <AngloBadge />}
                </span>
              </button>
            ))
          ) : inputValue.trim() ? (
            <div className="px-3 py-3 text-sm text-muted-foreground">
              No matching neighborhood found
            </div>
          ) : (
            <div className="px-3 py-3 text-sm text-muted-foreground">
              No neighborhoods available for this city
            </div>
          )}
        </div>
      )}
    </div>
  );
}
