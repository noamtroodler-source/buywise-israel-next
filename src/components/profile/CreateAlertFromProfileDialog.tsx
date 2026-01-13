import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Building, Key, HardHat, MapPin, Search, X, Check, 
  Bell, Mail, MessageCircle, Phone, DollarSign
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useCities } from '@/hooks/useCities';
import { useCreateSearchAlert } from '@/hooks/useSearchAlerts';
import { ListingType, AlertFrequency, PropertyFilters } from '@/types/database';
import { matchCities } from '@/lib/utils/cityMatcher';

interface CreateAlertFromProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const LISTING_TYPES = [
  { value: 'for_sale' as ListingType, label: 'Buy', icon: Building, description: 'Properties for sale' },
  { value: 'for_rent' as ListingType, label: 'Rent', icon: Key, description: 'Rental properties' },
  { value: 'projects' as ListingType, label: 'New Projects', icon: HardHat, description: 'New developments' },
];

const PROPERTY_TYPES = [
  { value: 'apartment', label: 'Apartment' },
  { value: 'house', label: 'House' },
  { value: 'penthouse', label: 'Penthouse' },
  { value: 'cottage', label: 'Cottage' },
  { value: 'land', label: 'Land' },
  { value: 'commercial', label: 'Commercial' },
];

const FREQUENCIES: { value: AlertFrequency; label: string; icon: string }[] = [
  { value: 'instant', label: 'Instant', icon: '⚡' },
  { value: 'daily', label: 'Daily', icon: '🕐' },
  { value: 'weekly', label: 'Weekly', icon: '📅' },
];

const ROOM_OPTIONS = [3, 4, 5, 6, 7];
const BATHROOM_OPTIONS = [1, 2, 3, 4];

function formatPriceInput(value: string): string {
  const num = value.replace(/[^\d]/g, '');
  if (!num) return '';
  return Number(num).toLocaleString();
}

function parsePriceInput(value: string): number | undefined {
  const num = value.replace(/[^\d]/g, '');
  return num ? Number(num) : undefined;
}

export function CreateAlertFromProfileDialog({ open, onOpenChange }: CreateAlertFromProfileDialogProps) {
  const { data: cities = [] } = useCities();
  const createAlert = useCreateSearchAlert();
  
  // Form state
  const [listingType, setListingType] = useState<ListingType>('for_sale');
  const [alertName, setAlertName] = useState('');
  const [citySearch, setCitySearch] = useState('');
  const [selectedCities, setSelectedCities] = useState<string[]>([]);
  const [priceMin, setPriceMin] = useState('');
  const [priceMax, setPriceMax] = useState('');
  const [minRooms, setMinRooms] = useState<number | null>(null);
  const [minBathrooms, setMinBathrooms] = useState<number | null>(null);
  const [selectedPropertyTypes, setSelectedPropertyTypes] = useState<string[]>([]);
  const [frequency, setFrequency] = useState<AlertFrequency>('daily');
  const [notifyEmail, setNotifyEmail] = useState(true);
  const [notifyWhatsApp, setNotifyWhatsApp] = useState(false);
  const [notifySms, setNotifySms] = useState(false);
  const [phone, setPhone] = useState('');
  const [showCityDropdown, setShowCityDropdown] = useState(false);

  const filteredCities = useMemo(() => {
    return matchCities(citySearch, cities);
  }, [cities, citySearch]);

  const handleCitySelect = (cityName: string) => {
    if (!selectedCities.includes(cityName)) {
      setSelectedCities([...selectedCities, cityName]);
    }
    setCitySearch('');
    setShowCityDropdown(false);
  };

  const handleCityRemove = (cityName: string) => {
    setSelectedCities(selectedCities.filter(c => c !== cityName));
  };

  const togglePropertyType = (type: string) => {
    setSelectedPropertyTypes(prev => 
      prev.includes(type) 
        ? prev.filter(t => t !== type)
        : [...prev, type]
    );
  };

  const handleSubmit = async () => {
    const filters: PropertyFilters = {};
    
    if (selectedCities.length > 0) {
      filters.city = selectedCities[0]; // Primary city
    }
    if (selectedPropertyTypes.length > 0) {
      filters.property_types = selectedPropertyTypes as any;
    }
    if (parsePriceInput(priceMin)) {
      filters.min_price = parsePriceInput(priceMin);
    }
    if (parsePriceInput(priceMax)) {
      filters.max_price = parsePriceInput(priceMax);
    }
    if (minRooms) {
      filters.min_rooms = minRooms;
    }
    if (minBathrooms) {
      filters.min_bathrooms = minBathrooms;
    }

    // Add cities array to filters for display purposes
    const filtersWithCities = {
      ...filters,
      cities: selectedCities,
      propertyTypes: selectedPropertyTypes,
      priceMin: parsePriceInput(priceMin),
      priceMax: parsePriceInput(priceMax),
      bedrooms: minRooms,
    };

    await createAlert.mutateAsync({
      name: alertName || undefined,
      filters: filtersWithCities as PropertyFilters,
      listing_type: listingType,
      frequency,
      notify_email: notifyEmail,
      notify_whatsapp: notifyWhatsApp,
      notify_sms: notifySms,
      phone: (notifyWhatsApp || notifySms) ? phone : undefined,
    });

    // Reset form and close
    resetForm();
    onOpenChange(false);
  };

  const resetForm = () => {
    setListingType('for_sale');
    setAlertName('');
    setCitySearch('');
    setSelectedCities([]);
    setPriceMin('');
    setPriceMax('');
    setMinRooms(null);
    setMinBathrooms(null);
    setSelectedPropertyTypes([]);
    setFrequency('daily');
    setNotifyEmail(true);
    setNotifyWhatsApp(false);
    setNotifySms(false);
    setPhone('');
  };

  const summaryParts = useMemo(() => {
    const parts: string[] = [];
    if (selectedCities.length > 0) {
      parts.push(selectedCities.slice(0, 2).join(', ') + (selectedCities.length > 2 ? ` +${selectedCities.length - 2}` : ''));
    }
    if (parsePriceInput(priceMin) || parsePriceInput(priceMax)) {
      const min = parsePriceInput(priceMin);
      const max = parsePriceInput(priceMax);
      parts.push(`₪${min?.toLocaleString() || '0'} - ${max ? `₪${max.toLocaleString()}` : 'Any'}`);
    }
    if (minRooms) {
      parts.push(`${minRooms}+ rooms`);
    }
    if (selectedPropertyTypes.length > 0) {
      parts.push(`${selectedPropertyTypes.length} type${selectedPropertyTypes.length > 1 ? 's' : ''}`);
    }
    return parts;
  }, [selectedCities, priceMin, priceMax, minRooms, selectedPropertyTypes]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[540px] max-h-[90vh] p-0 gap-0 overflow-hidden">
        <DialogHeader className="p-6 pb-4 border-b border-border">
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Bell className="h-5 w-5 text-primary" />
            Create New Alert
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(90vh-180px)]">
          <div className="p-6 space-y-6">
            {/* Listing Type Selection */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">What are you looking for?</Label>
              <div className="grid grid-cols-3 gap-3">
                {LISTING_TYPES.map(type => {
                  const Icon = type.icon;
                  const isSelected = listingType === type.value;
                  return (
                    <button
                      key={type.value}
                      onClick={() => setListingType(type.value)}
                      className={`relative p-4 rounded-xl border-2 transition-all text-center ${
                        isSelected 
                          ? 'border-primary bg-primary/5' 
                          : 'border-border hover:border-muted-foreground/50'
                      }`}
                    >
                      {isSelected && (
                        <div className="absolute top-2 right-2">
                          <Check className="h-4 w-4 text-primary" />
                        </div>
                      )}
                      <Icon className={`h-6 w-6 mx-auto mb-2 ${isSelected ? 'text-primary' : 'text-muted-foreground'}`} />
                      <span className={`font-medium text-sm ${isSelected ? 'text-foreground' : 'text-muted-foreground'}`}>
                        {type.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Alert Name */}
            <div className="space-y-2">
              <Label htmlFor="alertName" className="text-sm font-medium">
                Alert Name <span className="text-muted-foreground">(optional)</span>
              </Label>
              <Input
                id="alertName"
                placeholder="e.g., My Dream Tel Aviv Apartment"
                value={alertName}
                onChange={(e) => setAlertName(e.target.value)}
              />
            </div>

            {/* City Selection */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Cities</Label>
              <div className="relative">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search cities..."
                    value={citySearch}
                    onChange={(e) => setCitySearch(e.target.value)}
                    onFocus={() => setShowCityDropdown(true)}
                    className="pl-10"
                  />
                </div>
                
                <AnimatePresence>
                  {showCityDropdown && filteredCities.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="absolute z-50 w-full mt-1 bg-popover border border-border rounded-lg shadow-lg max-h-48 overflow-y-auto"
                    >
                      {filteredCities.map(city => (
                        <button
                          key={city.id}
                          onClick={() => handleCitySelect(city.name)}
                          className="w-full px-4 py-2 text-left hover:bg-accent flex items-center gap-2 text-sm"
                        >
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          {city.name}
                          {selectedCities.includes(city.name) && (
                            <Check className="h-4 w-4 text-primary ml-auto" />
                          )}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {selectedCities.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {selectedCities.map(city => (
                    <Badge key={city} variant="secondary" className="gap-1 pr-1">
                      {city}
                      <button
                        onClick={() => handleCityRemove(city)}
                        className="ml-1 hover:bg-accent rounded p-0.5"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* Price Range */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Price Range</Label>
              <div className="grid grid-cols-2 gap-3">
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Min"
                    value={priceMin}
                    onChange={(e) => setPriceMin(formatPriceInput(e.target.value))}
                    className="pl-10"
                  />
                </div>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Max"
                    value={priceMax}
                    onChange={(e) => setPriceMax(formatPriceInput(e.target.value))}
                    className="pl-10"
                  />
                </div>
              </div>
            </div>

            {/* Rooms */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Minimum Rooms</Label>
              <div className="flex flex-wrap gap-2">
                {ROOM_OPTIONS.map(num => (
                  <Button
                    key={num}
                    variant={minRooms === num ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setMinRooms(minRooms === num ? null : num)}
                    className="min-w-[48px]"
                  >
                    {num}+
                  </Button>
                ))}
              </div>
            </div>

            {/* Bathrooms */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Minimum Bathrooms</Label>
              <div className="flex flex-wrap gap-2">
                {BATHROOM_OPTIONS.map(num => (
                  <Button
                    key={num}
                    variant={minBathrooms === num ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setMinBathrooms(minBathrooms === num ? null : num)}
                    className="min-w-[48px]"
                  >
                    {num}+
                  </Button>
                ))}
              </div>
            </div>

            {/* Property Types */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Property Types</Label>
              <div className="flex flex-wrap gap-2">
                {PROPERTY_TYPES.map(type => (
                  <Badge
                    key={type.value}
                    variant={selectedPropertyTypes.includes(type.value) ? 'default' : 'outline'}
                    className="cursor-pointer transition-all hover:bg-primary/10"
                    onClick={() => togglePropertyType(type.value)}
                  >
                    {selectedPropertyTypes.includes(type.value) && (
                      <Check className="h-3 w-3 mr-1" />
                    )}
                    {type.label}
                  </Badge>
                ))}
              </div>
            </div>

            <hr className="border-border" />

            {/* Notification Frequency */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">How often?</Label>
              <div className="flex gap-2">
                {FREQUENCIES.map(freq => (
                  <Button
                    key={freq.value}
                    variant={frequency === freq.value ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFrequency(freq.value)}
                    className="flex-1"
                  >
                    <span className="mr-1">{freq.icon}</span>
                    {freq.label}
                  </Button>
                ))}
              </div>
            </div>

            {/* Notification Methods */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Notify me via</Label>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Email</span>
                  </div>
                  <Switch checked={notifyEmail} onCheckedChange={setNotifyEmail} />
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MessageCircle className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">WhatsApp</span>
                  </div>
                  <Switch checked={notifyWhatsApp} onCheckedChange={setNotifyWhatsApp} />
                </div>
              </div>

              {notifyWhatsApp && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                >
                  <Input
                    placeholder="WhatsApp number"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="mt-2"
                  />
                </motion.div>
              )}
            </div>

            {/* Summary */}
            {summaryParts.length > 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-muted/50 rounded-lg p-4"
              >
                <div className="flex items-start gap-2">
                  <Bell className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="text-sm font-medium">Alert Summary: </span>
                    <span className="text-sm text-muted-foreground">
                      {summaryParts.join(' • ')}
                    </span>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </ScrollArea>

        {/* Footer */}
        <div className="p-6 pt-4 border-t border-border flex gap-3 justify-end">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={createAlert.isPending}
            className="min-w-[120px]"
          >
            {createAlert.isPending ? 'Creating...' : 'Create Alert'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}