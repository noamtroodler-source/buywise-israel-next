import { useState, useEffect } from 'react';
import { MapPin, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AddressAutocomplete, ParsedAddress } from '@/components/agent/wizard/AddressAutocomplete';
import { GoogleMapsProvider } from '@/components/maps/GoogleMapsProvider';
import { 
  LocationIcon, 
  LOCATION_ICONS, 
  suggestIconFromLabel,
  getLocationIcon 
} from '@/types/savedLocation';
import { useAddSavedLocation } from '@/hooks/useSavedLocations';
import { cn } from '@/lib/utils';

interface AddCoreLocationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function AddCoreLocationDialogContent({ onOpenChange }: { onOpenChange: (open: boolean) => void }) {
  const [label, setLabel] = useState('');
  const [selectedIcon, setSelectedIcon] = useState<LocationIcon>('building');
  const [address, setAddress] = useState('');
  const [parsedAddress, setParsedAddress] = useState<ParsedAddress | null>(null);

  const addLocation = useAddSavedLocation();

  // Auto-suggest icon based on label
  useEffect(() => {
    if (label) {
      setSelectedIcon(suggestIconFromLabel(label));
    }
  }, [label]);

  const handleAddressSelect = (parsed: ParsedAddress | null) => {
    setParsedAddress(parsed);
    if (parsed) {
      setAddress(parsed.fullAddress);
    }
  };

  const handleSubmit = () => {
    if (!label.trim() || !parsedAddress) return;

    addLocation.mutate(
      {
        label: label.trim(),
        address: parsedAddress.fullAddress,
        latitude: parsedAddress.latitude,
        longitude: parsedAddress.longitude,
        icon: selectedIcon,
      },
      {
        onSuccess: () => {
          // Reset form
          setLabel('');
          setAddress('');
          setParsedAddress(null);
          setSelectedIcon('building');
          onOpenChange(false);
        },
      }
    );
  };

  const canSubmit = label.trim() && parsedAddress && !addLocation.isPending;
  const PreviewIcon = getLocationIcon(selectedIcon);

  return (
    <DialogContent className="sm:max-w-md">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <span className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
            <MapPin className="h-4 w-4 text-primary" />
          </span>
          Add Core Location
        </DialogTitle>
        <DialogDescription>
          Save a location that matters to you. You'll see travel times from this location on every property page.
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-4 pt-2">
        {/* Label Input */}
        <div className="space-y-2">
          <Label htmlFor="location-label">Name this location</Label>
          <Input
            id="location-label"
            placeholder="e.g., Mom's House, Office, Gym"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            maxLength={30}
          />
        </div>

        {/* Icon Picker */}
        <div className="space-y-2">
          <Label>Choose an icon</Label>
          <div className="flex gap-2">
            {LOCATION_ICONS.map((icon) => {
              const IconComponent = icon.Icon;
              return (
                <button
                  key={icon.value}
                  type="button"
                  onClick={() => setSelectedIcon(icon.value)}
                  className={cn(
                    'flex h-11 w-11 items-center justify-center rounded-xl border-2 transition-all',
                    selectedIcon === icon.value
                      ? 'border-primary bg-primary/10'
                      : 'border-muted bg-muted/30 hover:border-muted-foreground/50'
                  )}
                  title={icon.label}
                >
                  <IconComponent className={cn(
                    'h-5 w-5',
                    selectedIcon === icon.value ? 'text-primary' : 'text-muted-foreground'
                  )} />
                </button>
              );
            })}
          </div>
        </div>

        {/* Address Input */}
        <div className="space-y-2">
          <Label>Address</Label>
          <AddressAutocomplete
            value={address}
            onAddressSelect={handleAddressSelect}
            onInputChange={setAddress}
            placeholder="Search for an address in Israel..."
          />
          {parsedAddress && (
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {parsedAddress.fullAddress}
            </p>
          )}
        </div>

        {/* Preview */}
        {label && parsedAddress && (
          <div className="rounded-xl border bg-muted/30 p-3">
            <p className="text-sm font-medium flex items-center gap-2">
              <span className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center">
                <PreviewIcon className="h-4 w-4 text-primary" />
              </span>
              {label}
            </p>
            <p className="text-xs text-muted-foreground mt-1 ml-9">
              {parsedAddress.fullAddress}
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          <Button
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="flex-1"
          >
            {addLocation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Save Location
          </Button>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
        </div>
      </div>
    </DialogContent>
  );
}

export function AddCoreLocationDialog({ open, onOpenChange }: AddCoreLocationDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <GoogleMapsProvider>
        <AddCoreLocationDialogContent onOpenChange={onOpenChange} />
      </GoogleMapsProvider>
    </Dialog>
  );
}
