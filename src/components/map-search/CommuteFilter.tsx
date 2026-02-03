import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { SavedLocation, getLocationIcon } from '@/types/savedLocation';
import { MapPin, X, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface CommuteFilterValue {
  locationId: string;
  maxMinutes: number;
}

interface CommuteFilterProps {
  savedLocations: SavedLocation[];
  value: CommuteFilterValue | null;
  onChange: (value: CommuteFilterValue | null) => void;
}

const TIME_OPTIONS = [
  { value: 15, label: '15 min' },
  { value: 30, label: '30 min' },
  { value: 45, label: '45 min' },
  { value: 60, label: '60 min' },
];

export function CommuteFilter({ savedLocations, value, onChange }: CommuteFilterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<string>(value?.locationId || '');
  const [selectedTime, setSelectedTime] = useState<number>(value?.maxMinutes || 30);

  const selectedLocationData = savedLocations.find((l) => l.id === selectedLocation);
  const activeLocationData = savedLocations.find((l) => l.id === value?.locationId);

  const handleApply = () => {
    if (selectedLocation) {
      onChange({
        locationId: selectedLocation,
        maxMinutes: selectedTime,
      });
      setIsOpen(false);
    }
  };

  const handleClear = () => {
    onChange(null);
    setSelectedLocation('');
    setIsOpen(false);
  };

  if (savedLocations.length === 0) return null;

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant={value ? 'default' : 'outline'}
          size="sm"
          className={cn(
            'gap-2',
            value && 'bg-primary text-primary-foreground'
          )}
        >
          <Clock className="h-4 w-4" />
          {value ? (
            <span className="hidden sm:inline">
              {value.maxMinutes} min to {activeLocationData?.label}
            </span>
          ) : (
            <span className="hidden sm:inline">Near my places</span>
          )}
          {value && (
            <X
              className="h-3 w-3 ml-1"
              onClick={(e) => {
                e.stopPropagation();
                handleClear();
              }}
            />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72" align="start">
        <div className="space-y-4">
          <div>
            <h4 className="font-medium text-sm mb-2">Find properties within</h4>
            <Select
              value={String(selectedTime)}
              onValueChange={(v) => setSelectedTime(Number(v))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TIME_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={String(opt.value)}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <h4 className="font-medium text-sm mb-2">of my saved location</h4>
            <div className="space-y-2">
              {savedLocations.map((location) => {
                const Icon = getLocationIcon(location.icon);
                const isSelected = selectedLocation === location.id;
                
                return (
                  <button
                    key={location.id}
                    onClick={() => setSelectedLocation(location.id)}
                    className={cn(
                      'w-full flex items-center gap-3 p-2 rounded-lg border transition-colors text-left',
                      isSelected
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:bg-muted'
                    )}
                  >
                    <div
                      className={cn(
                        'w-8 h-8 rounded-full flex items-center justify-center',
                        isSelected ? 'bg-primary text-primary-foreground' : 'bg-muted'
                      )}
                    >
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{location.label}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {location.address}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={handleClear}
            >
              Clear
            </Button>
            <Button
              size="sm"
              className="flex-1"
              onClick={handleApply}
              disabled={!selectedLocation}
            >
              Apply
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
