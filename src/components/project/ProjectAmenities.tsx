import { 
  Sparkles, Dumbbell, Waves, Car, Leaf, Baby, Dog, Lock, Shield, 
  Wifi, Sun, Building, Sofa, Wind, Zap, Users, Coffee
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface ProjectAmenitiesProps {
  amenities: string[];
}

const amenityCategories: Record<string, { icon: typeof Sparkles; keywords: string[] }> = {
  'Fitness & Wellness': { icon: Dumbbell, keywords: ['gym', 'fitness', 'yoga', 'spa', 'sauna'] },
  'Pool & Water': { icon: Waves, keywords: ['pool', 'swimming', 'jacuzzi', 'heated_pool', 'beach'] },
  'Parking & Transport': { icon: Car, keywords: ['parking', 'garage', 'electric', 'charging', 'bicycle', 'ev_', 'multiple_parking'] },
  'Outdoor & Green': { icon: Leaf, keywords: ['garden', 'terrace', 'balcony', 'rooftop', 'landscap', 'private_garden', 'sukkot', 'sea_city_view'] },
  'Family & Kids': { icon: Baby, keywords: ['playground', 'kids', 'children', 'family', 'daycare'] },
  'Pet Friendly': { icon: Dog, keywords: ['pet', 'dog'] },
  'Security & Safety': { icon: Shield, keywords: ['security', 'guard', 'cctv', 'surveillance', 'doorman', 'concierge', 'mamad', 'safe room', 'generator', 'acoustic_insulation'] },
  'Smart Home': { icon: Wifi, keywords: ['smart', 'wifi', 'internet', 'fiber'] },
  'Community & Religious': { icon: Users, keywords: ['club', 'lounge', 'community', 'social', 'shul', 'synagogue', 'mikvah', 'event', 'commercial', 'coworking', 'eruv'] },
  'Comfort & Accessibility': { icon: Wind, keywords: ['ac', 'air condition', 'heating', 'elevator', 'lift', 'shabbat', 'underfloor', 'accessible', 'lobby', 'high_ceiling', 'floor_to_ceiling', 'central_ac'] },
  'Unit Features': { icon: Sparkles, keywords: ['pre_installed_kitchen', 'payment_plan'] },
};

function categorizeAmenities(amenities: string[]) {
  const categorized: Record<string, string[]> = {};
  const uncategorized: string[] = [];

  amenities.forEach(amenity => {
    const lowerAmenity = amenity.toLowerCase();
    let found = false;

    for (const [category, { keywords }] of Object.entries(amenityCategories)) {
      if (keywords.some(keyword => lowerAmenity.includes(keyword))) {
        if (!categorized[category]) categorized[category] = [];
        categorized[category].push(amenity);
        found = true;
        break;
      }
    }

    if (!found) {
      uncategorized.push(amenity);
    }
  });

  if (uncategorized.length > 0) {
    categorized['Other Features'] = uncategorized;
  }

  return categorized;
}

function getAmenityIcon(amenity: string): typeof Sparkles {
  const lowerAmenity = amenity.toLowerCase();
  
  for (const { icon, keywords } of Object.values(amenityCategories)) {
    if (keywords.some(keyword => lowerAmenity.includes(keyword))) {
      return icon;
    }
  }
  
  return Sparkles;
}

export function ProjectAmenities({ amenities }: ProjectAmenitiesProps) {
  if (!amenities || amenities.length === 0) {
    return null;
  }

  const categorized = categorizeAmenities(amenities);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          Amenities & Features
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {Object.entries(categorized).map(([category, items]) => {
          const CategoryIcon = amenityCategories[category]?.icon || Sparkles;
          
          return (
            <div key={category} className="space-y-2">
              <h4 className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
                <CategoryIcon className="h-4 w-4" />
                {category}
              </h4>
              <div className="grid grid-cols-2 gap-2">
                {items.map((amenity, index) => {
                  const Icon = getAmenityIcon(amenity);
                  return (
                    <div 
                      key={index}
                      className="flex items-center gap-2 p-2.5 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                    >
                      <Icon className="h-4 w-4 text-primary shrink-0" />
                      <span className="text-sm truncate">{amenity}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}