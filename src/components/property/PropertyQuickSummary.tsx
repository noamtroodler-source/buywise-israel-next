import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { MapPin, Share2, Heart, Bed, Bath, Maximize, Building2, Eye, Clock, Calendar, Layers, DollarSign, Car, Wrench, Calculator, Home, Shield, Sparkles, Trees, Users, Baby, Accessibility, Sofa, User, Thermometer, CalendarCheck, Flame, Zap } from 'lucide-react';
 import { Armchair, Refrigerator, Tv, UtensilsCrossed, WashingMachine } from 'lucide-react';
import { useFormatPrice, useFormatArea, useFormatPricePerArea, useAreaUnitLabel } from '@/contexts/PreferencesContext';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { formatMonthlyRange } from '@/lib/utils/formatRange';
import { useSavesCount } from '@/hooks/useSavesCount';
import { useBuyerProfile } from '@/hooks/useBuyerProfile';
import { useAuth } from '@/hooks/useAuth';
import { useMortgageEstimate } from '@/hooks/useMortgagePreferences';
interface PropertyQuickSummaryProps {
  property: {
    id: string;
    price: number;
    currency?: string;
    title: string;
    address: string;
    city: string;
    neighborhood?: string;
    bedrooms?: number;
    bathrooms?: number;
    size_sqm?: number;
    lot_size_sqm?: number;
    property_type: string;
    views_count?: number;
    created_at: string;
    year_built?: number | null;
    floor?: number | null;
    total_floors?: number | null;
    condition?: string | null;
    parking?: number | null;
    features?: string[] | null;
    is_furnished?: boolean | null;
    is_accessible?: boolean | null;
    listing_status?: string;
    entry_date?: string | null;
    ac_type?: 'none' | 'split' | 'central' | 'mini_central' | null;
    vaad_bayit_monthly?: number | null;
     furnished_status?: 'fully' | 'semi' | 'unfurnished' | null;
     furniture_items?: string[] | null;
  };
  onShare?: () => void;
  onSave?: () => void;
  isSaved?: boolean;
}

 // Furniture item labels mapping
 const furnitureItemLabels: Record<string, string> = {
   refrigerator: 'Refrigerator',
   oven_stove: 'Oven/Stove',
   microwave: 'Microwave',
   dishwasher: 'Dishwasher',
   washing_machine: 'Washing Machine',
   dryer: 'Dryer',
   sofa: 'Sofa',
   tv: 'TV',
   coffee_table: 'Coffee Table',
   dining_set: 'Dining Table + Chairs',
   bookshelf: 'Bookshelf',
   bed_double: 'Double Bed',
   bed_single: 'Single Bed(s)',
   wardrobe: 'Wardrobe/Closet',
   desk_chair: 'Desk + Chair',
   curtains: 'Curtains/Blinds',
   light_fixtures: 'Light Fixtures',
 };
 
// Generate highlights automatically from property data
function generateHighlights(property: PropertyQuickSummaryProps['property']): Array<{ label: string; icon: React.ElementType }> {
  const highlights: Array<{ label: string; icon: React.ElementType }> = [];
  const features = property.features || [];
  const featureLower = features.map(f => f.toLowerCase());

  // Location-based
  if (property.floor === 0 || (property.floor === null && featureLower.some(f => f.includes('garden')))) {
    highlights.push({ label: 'Ground Floor', icon: Home });
  }
  if (featureLower.some(f => f.includes('sea view') || f.includes('ocean view'))) {
    highlights.push({ label: 'Sea View', icon: Sparkles });
  }
  if (featureLower.some(f => f.includes('mamad') || f.includes('safe room') || f.includes('shelter'))) {
    highlights.push({ label: 'Protected Room', icon: Shield });
  }

  // Size-based
  if (property.size_sqm && property.size_sqm >= 120) {
    highlights.push({ label: 'Spacious Layout', icon: Maximize });
  }
  if (property.bedrooms && property.bedrooms >= 5) {
    highlights.push({ label: 'Large Family Home', icon: Users });
  }

  // Amenity-based
  if (property.parking && property.parking >= 2) {
    highlights.push({ label: 'Double Parking', icon: Car });
  }
  if (featureLower.some(f => f.includes('elevator'))) {
    highlights.push({ label: 'Elevator Access', icon: Layers });
  }
  if (featureLower.some(f => f.includes('storage'))) {
    highlights.push({ label: 'Storage Room', icon: Home });
  }
  if (featureLower.some(f => f.includes('balcony') || f.includes('mirpeset'))) {
    highlights.push({ label: 'Balcony', icon: Home });
  }
  if (featureLower.some(f => f.includes('garden'))) {
    highlights.push({ label: 'Private Garden', icon: Trees });
  }

  // Condition-based
  if (property.condition === 'new') {
    highlights.push({ label: 'Brand New', icon: Sparkles });
  }
  if (property.condition === 'renovated') {
    highlights.push({ label: 'Recently Renovated', icon: Wrench });
  }
  if (property.is_furnished) {
    highlights.push({ label: 'Fully Furnished', icon: Sofa });
  }
  if (property.is_accessible) {
    highlights.push({ label: 'Wheelchair Accessible', icon: Accessibility });
  }

  // Age-based
  if (property.year_built && new Date().getFullYear() - property.year_built <= 5) {
    highlights.push({ label: 'Modern Build', icon: Sparkles });
  }

  return highlights.slice(0, 6); // Max 6 highlights
}

export function PropertyQuickSummary({ property, onShare, onSave, isSaved }: PropertyQuickSummaryProps) {
  const formatPrice = useFormatPrice();
  const formatArea = useFormatArea();
  const formatPricePerArea = useFormatPricePerArea();
  const areaUnitLabel = useAreaUnitLabel();
  const { data: savesCount = 0 } = useSavesCount(property.id);
  const { user } = useAuth();
  const { data: buyerProfile } = useBuyerProfile();

  const pricePerSqm = property.size_sqm ? property.price / property.size_sqm : null;
  
  // Get mortgage estimate using user's profile preferences (or defaults)
  const mortgageEstimate = useMortgageEstimate(property.price);
  const showMortgageEstimate = property.listing_status !== 'for_rent';
  
  // Calculate days on market and freshness tier
  const createdDate = new Date(property.created_at);
  const now = new Date();
  const daysOnMarket = Math.floor((now.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24));
  
  // Freshness tier for enhanced display
  type FreshnessTier = 'hot' | 'fresh' | 'standard' | 'stale';
  const freshnessTier: FreshnessTier = daysOnMarket <= 3 ? 'hot' : daysOnMarket <= 7 ? 'fresh' : daysOnMarket <= 30 ? 'standard' : 'stale';
  const isRental = property.listing_status === 'for_rent';
  
  // Get freshness label
  const getFreshnessLabel = () => {
    if (daysOnMarket === 0) return isRental ? 'Available today' : 'Listed today';
    if (daysOnMarket === 1) return isRental ? 'Available 1 day' : 'Listed 1 day';
    return `${daysOnMarket} days on market`;
  };

  const locationText = property.neighborhood 
    ? `${property.neighborhood}, ${property.city}`
    : property.city;

  const propertyTypeLabel = property.property_type.charAt(0).toUpperCase() + property.property_type.slice(1);

  const highlights = generateHighlights(property);

  // Format floor display
  const getFloorDisplay = () => {
    if (property.floor === null || property.floor === undefined) return 'Not specified';
    if (property.floor === 0) return 'Ground';
    if (property.total_floors) return `${property.floor} of ${property.total_floors}`;
    return `Floor ${property.floor}`;
  };

  // Format condition display
  const getConditionDisplay = () => {
    if (!property.condition) return 'Not specified';
    return property.condition.charAt(0).toUpperCase() + property.condition.slice(1);
  };

  // Format parking display
  const getParkingDisplay = () => {
    if (!property.parking || property.parking === 0) return 'None';
    return `${property.parking} spot${property.parking > 1 ? 's' : ''}`;
  };

  // Format entry date display
  const getEntryDateDisplay = () => {
    if (!property.entry_date) return 'Immediate Entry';
    const date = new Date(property.entry_date);
    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  // Format A/C type display
  const getAcTypeDisplay = () => {
    if (!property.ac_type) return null;
    const labels: Record<string, string> = {
      'none': 'No A/C',
      'split': 'Split A/C',
      'central': 'Central A/C',
      'mini_central': 'Mini Central',
    };
    return labels[property.ac_type] || property.ac_type;
  };

  return (
    <TooltipProvider>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="space-y-5"
      >
        {/* Price & Title Row */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-baseline gap-3 flex-wrap">
              <h1 className="text-3xl font-bold text-foreground">
                {formatPrice(property.price, property.currency || 'ILS')}
              </h1>
              {pricePerSqm && (
                <span className="text-muted-foreground text-sm">
                  {formatPricePerArea(pricePerSqm, property.currency || 'ILS')}
                </span>
              )}
            </div>
            
            {/* Estimated Monthly Payment Range - Only show when mortgage is enabled */}
            {showMortgageEstimate && mortgageEstimate && mortgageEstimate.hasCustomPreferences !== false && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="cursor-help border-b border-dotted border-muted-foreground/50 inline-flex items-center gap-1">
                      {mortgageEstimate.hasCustomPreferences && <User className="h-3 w-3 text-primary" />}
                      {formatMonthlyRange(mortgageEstimate.monthlyPaymentLow, mortgageEstimate.monthlyPaymentHigh, 'ILS')}
                    </span>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <div className="space-y-1">
                      {mortgageEstimate.hasCustomPreferences ? (
                        <p className="font-medium">Based on your mortgage preferences</p>
                      ) : (
                        <p className="font-medium">Estimated monthly range</p>
                      )}
                      <p className="text-xs">
                        {mortgageEstimate.downPaymentPercent}% down, 4.5–6.0% rates, {mortgageEstimate.termYears}-year term
                      </p>
                      <p className="text-xs text-muted-foreground pt-1 border-t border-border">
                        {!user 
                          ? 'Sign in to personalize.' 
                          : !mortgageEstimate.hasCustomPreferences 
                            ? 'Set mortgage preferences in your profile.' 
                            : 'Actual rates depend on your bank and credit history.'
                        }
                      </p>
                    </div>
                  </TooltipContent>
                </Tooltip>
                <span className="text-muted-foreground/60">•</span>
                <Link 
                  to={`/tools?calculator=mortgage&price=${property.price}`}
                  className="text-primary hover:underline inline-flex items-center gap-1"
                >
                  <Calculator className="h-3.5 w-3.5" />
                  Calculate Exact
                </Link>
              </div>
            )}

            <h2 className="text-xl font-semibold text-foreground">{property.title}</h2>
            <p className="text-muted-foreground flex items-center gap-1.5">
              <MapPin className="h-4 w-4 shrink-0" />
              <span>{property.address}, {locationText}</span>
            </p>
          </div>
          
          {/* Action Buttons - Desktop */}
          <div className="hidden sm:flex gap-2 shrink-0">
            <Button variant="outline" size="sm" className="gap-2" onClick={onShare}>
              <Share2 className="h-4 w-4" />
              Share
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="gap-2" 
              onClick={onSave}
            >
              <Heart className={`h-4 w-4 ${isSaved ? 'fill-primary text-primary' : ''}`} />
              {isSaved ? 'Saved' : 'Save'}
            </Button>
          </div>
        </div>

        {/* Hero Stats Bar */}
        <div className="flex flex-wrap gap-6 py-4 border-y border-border">
          {property.bedrooms !== undefined && property.bedrooms !== null && (
            <div className="flex items-center gap-2">
              <Bed className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-lg font-semibold">{property.bedrooms}{(property as any).additional_rooms ? ` + ${(property as any).additional_rooms}` : ''}</p>
                <p className="text-xs text-muted-foreground">Bedrooms{(property as any).additional_rooms ? ' + Other' : ''}</p>
              </div>
            </div>
          )}
          {property.bathrooms !== undefined && property.bathrooms !== null && (
            <div className="flex items-center gap-2">
              <Bath className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-lg font-semibold">{property.bathrooms}</p>
                <p className="text-xs text-muted-foreground">Baths</p>
              </div>
            </div>
          )}
          {property.size_sqm && (
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-2 cursor-help">
                  <Maximize className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-lg font-semibold">{formatArea(property.size_sqm)}</p>
                    <p className="text-xs text-muted-foreground">Size</p>
                  </div>
                </div>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p>In Israel, listed size typically includes balconies and storage ("built area"). Net living space is usually 10-15% smaller.</p>
              </TooltipContent>
            </Tooltip>
          )}
          <div className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-lg font-semibold">{propertyTypeLabel}</p>
              <p className="text-xs text-muted-foreground">Type</p>
            </div>
          </div>
        </div>

        {/* Quick Facts Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 md:gap-3">
          {/* Year Built */}
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-2 md:gap-3 p-2.5 md:p-3 rounded-lg bg-muted/50 cursor-help">
                <Calendar className="h-5 w-5 text-muted-foreground shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">
                    {property.year_built || 'Not specified'}
                  </p>
                  <p className="text-xs text-muted-foreground border-b border-dotted border-muted-foreground/30">Built</p>
                </div>
              </div>
            </TooltipTrigger>
            <TooltipContent className="max-w-xs">
              <p>Buildings from before 1980 may require seismic retrofitting (TAMA 38 eligibility).</p>
            </TooltipContent>
          </Tooltip>

          {/* Floor */}
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-2 md:gap-3 p-2.5 md:p-3 rounded-lg bg-muted/50 cursor-help">
                <Layers className="h-5 w-5 text-muted-foreground shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{getFloorDisplay()}</p>
                  <p className="text-xs text-muted-foreground border-b border-dotted border-muted-foreground/30">Floor</p>
                </div>
              </div>
            </TooltipTrigger>
            <TooltipContent className="max-w-xs">
              <p>Ground floor (קומת קרקע) properties often have private gardens. Top floors may have roof access rights.</p>
            </TooltipContent>
          </Tooltip>

          {/* Price per sqm */}
          {pricePerSqm && (
            <div className="flex items-center gap-2 md:gap-3 p-2.5 md:p-3 rounded-lg bg-muted/50">
              <DollarSign className="h-5 w-5 text-muted-foreground shrink-0" />
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">
                  {formatPricePerArea(pricePerSqm, property.currency || 'ILS')}
                </p>
                <p className="text-xs text-muted-foreground">Price/{areaUnitLabel}</p>
              </div>
            </div>
          )}

          {/* Lot Size (only for houses) */}
          {property.lot_size_sqm && (
            <div className="flex items-center gap-2 md:gap-3 p-2.5 md:p-3 rounded-lg bg-muted/50">
              <Trees className="h-5 w-5 text-muted-foreground shrink-0" />
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{formatArea(property.lot_size_sqm)}</p>
                <p className="text-xs text-muted-foreground">Lot Size</p>
              </div>
            </div>
          )}

          {/* Parking */}
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-2 md:gap-3 p-2.5 md:p-3 rounded-lg bg-muted/50 cursor-help">
                <Car className="h-5 w-5 text-muted-foreground shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{getParkingDisplay()}</p>
                  <p className="text-xs text-muted-foreground border-b border-dotted border-muted-foreground/30">Parking</p>
                </div>
              </div>
            </TooltipTrigger>
            <TooltipContent className="max-w-xs">
              <p>Indoor parking is premium in Israeli cities. Street parking permits are limited in many areas.</p>
            </TooltipContent>
          </Tooltip>

          {/* Condition */}
          <div className="flex items-center gap-2 md:gap-3 p-2.5 md:p-3 rounded-lg bg-muted/50">
            <Wrench className="h-5 w-5 text-muted-foreground shrink-0" />
            <div className="min-w-0">
              <p className="text-sm font-medium truncate">{getConditionDisplay()}</p>
              <p className="text-xs text-muted-foreground">Condition</p>
            </div>
          </div>

          {/* Entry Date */}
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-2 md:gap-3 p-2.5 md:p-3 rounded-lg bg-muted/50 cursor-help">
                <CalendarCheck className="h-5 w-5 text-muted-foreground shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{getEntryDateDisplay()}</p>
                  <p className="text-xs text-muted-foreground border-b border-dotted border-muted-foreground/30">Available</p>
                </div>
              </div>
            </TooltipTrigger>
            <TooltipContent className="max-w-xs">
              <p>When you can move in. "Immediate" means the property is vacant and ready.</p>
            </TooltipContent>
          </Tooltip>

          {/* A/C Type */}
          {getAcTypeDisplay() && (
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 cursor-help">
                  <Thermometer className="h-5 w-5 text-muted-foreground shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{getAcTypeDisplay()}</p>
                    <p className="text-xs text-muted-foreground border-b border-dotted border-muted-foreground/30">A/C</p>
                  </div>
                </div>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p>Split units (מפוצל) are room-by-room. Central A/C (מרכזי) is whole-home ducted. Mini-central is a hybrid.</p>
              </TooltipContent>
            </Tooltip>
          )}
        </div>

        {/* Amenities & Features */}
        {highlights.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Amenities & Features
            </h3>
            <div className="flex flex-wrap gap-2">
              {highlights.map((highlight, index) => {
                const Icon = highlight.icon;
                return (
                  <Badge key={index} variant="secondary" className="gap-1.5 py-1.5 px-3">
                    <Icon className="h-3.5 w-3.5" />
                    {highlight.label}
                  </Badge>
                );
              })}
            </div>
          </div>
        )}

         {/* Furniture Items - Show when furnished and has items */}
         {(property.furnished_status === 'fully' || property.furnished_status === 'semi') && 
          property.furniture_items && property.furniture_items.length > 0 && (
           <div className="space-y-2">
             <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
               <Armchair className="h-4 w-4" />
               What's Included
             </h3>
             <div className="flex flex-wrap gap-2">
               {property.furniture_items.map((itemId) => (
                 <Badge key={itemId} variant="outline" className="text-sm font-normal">
                   {furnitureItemLabels[itemId] || itemId}
                 </Badge>
               ))}
             </div>
           </div>
         )}
         
        {/* Activity & Social Proof Bar - Days on Market now more prominent */}
        <div className="flex flex-wrap items-center gap-4 text-sm">
          {/* Days on Market - Enhanced prominence */}
          <div className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-full",
            freshnessTier === 'hot' 
              ? "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300" 
              : freshnessTier === 'fresh' 
                ? "bg-primary/10 text-primary" 
                : "bg-muted text-muted-foreground"
          )}>
            {freshnessTier === 'hot' ? (
              <Flame className="h-4 w-4" />
            ) : freshnessTier === 'fresh' ? (
              <Zap className="h-4 w-4" />
            ) : (
              <Clock className="h-4 w-4" />
            )}
            <span className="font-medium">{getFreshnessLabel()}</span>
          </div>
          
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Eye className="h-4 w-4" />
            <span className="font-semibold text-foreground">{property.views_count || 0}</span>
            <span>views</span>
          </div>
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Heart className="h-4 w-4" />
            <span className="font-semibold text-foreground">{savesCount}</span>
            <span>saves</span>
          </div>
        </div>

        {/* Mobile Action Buttons */}
        <div className="flex gap-2 sm:hidden">
          <Button variant="outline" size="sm" className="flex-1 gap-2" onClick={onShare}>
            <Share2 className="h-4 w-4" />
            Share
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            className="flex-1 gap-2" 
            onClick={onSave}
          >
            <Heart className={`h-4 w-4 ${isSaved ? 'fill-primary text-primary' : ''}`} />
            {isSaved ? 'Saved' : 'Save'}
          </Button>
        </div>
      </motion.div>
    </TooltipProvider>
  );
}
