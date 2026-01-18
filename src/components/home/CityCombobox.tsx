import * as React from 'react';
import { Check, MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useCities } from '@/hooks/useCities';
import { cityMatchesQuery, getCityKeywords } from '@/lib/utils/cityMatcher';

interface CityComboboxProps {
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

const popularCities = ['Tel Aviv', 'Jerusalem', 'Herzliya', "Ra'anana", "Modi'in"];

export function CityCombobox({ value, onValueChange, placeholder = 'Select a city...', className }: CityComboboxProps) {
  const [open, setOpen] = React.useState(false);
  const { data: cities = [] } = useCities();

  const allCities = cities.map(c => c.name);
  const otherCities = allCities.filter(city => !popularCities.includes(city));

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full h-12 justify-start gap-2 font-normal border-input hover:bg-muted/50", className)}
        >
          <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
          <span className={cn("truncate", !value && "text-muted-foreground")}>
            {value || placeholder}
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-[300px] p-0 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:duration-100 data-[state=closed]:duration-75 data-[side=bottom]:slide-in-from-top-0 data-[side=top]:slide-in-from-bottom-0 data-[side=left]:slide-in-from-right-0 data-[side=right]:slide-in-from-left-0" 
        align="start"
        sideOffset={6}
      >
        <Command filter={(value, search) => {
          // Use fuzzy matcher
          return cityMatchesQuery(value, search) ? 1 : 0;
        }}>
          <CommandInput placeholder="Search cities..." className="h-11" />
          <CommandList>
            <CommandEmpty>No city found.</CommandEmpty>
            <CommandGroup heading="Popular">
              {popularCities.map((city) => (
                <CommandItem
                  key={city}
                  keywords={getCityKeywords(city)}
                  value={city}
                  onSelect={(currentValue) => {
                    onValueChange(currentValue === value ? '' : currentValue);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      'mr-2 h-4 w-4',
                      value === city ? 'opacity-100' : 'opacity-0'
                    )}
                  />
                  {city}
                </CommandItem>
              ))}
            </CommandGroup>
            <CommandGroup heading="All Cities">
              {otherCities.map((city) => (
                <CommandItem
                  key={city}
                  keywords={getCityKeywords(city)}
                  value={city}
                  onSelect={(currentValue) => {
                    onValueChange(currentValue === value ? '' : currentValue);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      'mr-2 h-4 w-4',
                      value === city ? 'opacity-100' : 'opacity-0'
                    )}
                  />
                  {city}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
