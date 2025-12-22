import { useState } from 'react';
import { ChevronDown, ChevronUp, Shield, Car, Trees, Building, Sparkles, Accessibility } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';

interface PropertyDescriptionProps {
  description?: string | null;
  features?: string[] | null;
  condition?: string | null;
  yearBuilt?: number | null;
  isFurnished?: boolean | null;
  isAccessible?: boolean | null;
  parking?: number | null;
}

// Feature categorization
const featureCategories: Record<string, { label: string; icon: React.ComponentType<{ className?: string }>; keywords: string[] }> = {
  security: {
    label: 'Security',
    icon: Shield,
    keywords: ['safe room', 'mamad', 'security', 'guard', 'intercom', 'alarm', 'cctv', 'gated'],
  },
  parking: {
    label: 'Parking',
    icon: Car,
    keywords: ['parking', 'garage', 'carport'],
  },
  outdoor: {
    label: 'Outdoor',
    icon: Trees,
    keywords: ['balcony', 'terrace', 'garden', 'yard', 'patio', 'pool', 'roof'],
  },
  building: {
    label: 'Building',
    icon: Building,
    keywords: ['elevator', 'lobby', 'storage', 'gym', 'concierge', 'doorman'],
  },
  interior: {
    label: 'Interior',
    icon: Sparkles,
    keywords: ['air conditioning', 'ac', 'heating', 'floor', 'renovated', 'modern', 'kitchen', 'bathroom', 'closet', 'window'],
  },
  accessibility: {
    label: 'Accessibility',
    icon: Accessibility,
    keywords: ['accessible', 'wheelchair', 'ramp', 'ground floor'],
  },
};

function categorizeFeature(feature: string): string {
  const lowerFeature = feature.toLowerCase();
  for (const [category, config] of Object.entries(featureCategories)) {
    if (config.keywords.some(keyword => lowerFeature.includes(keyword))) {
      return category;
    }
  }
  return 'interior'; // Default category
}

export function PropertyDescription({ 
  description, 
  features, 
  condition,
  yearBuilt,
  isFurnished,
  isAccessible,
  parking,
}: PropertyDescriptionProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const maxLength = 300;
  const shouldTruncate = description && description.length > maxLength;

  // Categorize features
  const categorizedFeatures: Record<string, string[]> = {};
  features?.forEach(feature => {
    const category = categorizeFeature(feature);
    if (!categorizedFeatures[category]) {
      categorizedFeatures[category] = [];
    }
    categorizedFeatures[category].push(feature);
  });

  // Add computed features
  if (parking && parking > 0) {
    if (!categorizedFeatures['parking']) categorizedFeatures['parking'] = [];
    categorizedFeatures['parking'].push(`${parking} Parking space${parking > 1 ? 's' : ''}`);
  }
  if (isAccessible) {
    if (!categorizedFeatures['accessibility']) categorizedFeatures['accessibility'] = [];
    if (!categorizedFeatures['accessibility'].some(f => f.toLowerCase().includes('accessible'))) {
      categorizedFeatures['accessibility'].push('Wheelchair Accessible');
    }
  }

  const hasFeatures = Object.keys(categorizedFeatures).length > 0 || condition || yearBuilt || isFurnished !== null;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.1 }}
      className="space-y-6"
    >
      {/* Description */}
      <div className="space-y-3">
        <h2 className="text-xl font-semibold text-foreground">About This Property</h2>
        {description ? (
          <div className="relative">
            <p className="text-muted-foreground leading-relaxed">
              {shouldTruncate && !isExpanded 
                ? `${description.slice(0, maxLength)}...` 
                : description}
            </p>
            {shouldTruncate && (
              <Button 
                variant="link" 
                className="px-0 h-auto text-primary"
                onClick={() => setIsExpanded(!isExpanded)}
              >
                {isExpanded ? (
                  <>Show less <ChevronUp className="h-4 w-4 ml-1" /></>
                ) : (
                  <>Read more <ChevronDown className="h-4 w-4 ml-1" /></>
                )}
              </Button>
            )}
          </div>
        ) : (
          <p className="text-muted-foreground italic">No description available.</p>
        )}
      </div>

      {/* Quick Facts */}
      {(condition || yearBuilt || isFurnished !== null) && (
        <div className="flex flex-wrap gap-3">
          {condition && (
            <Badge variant="outline" className="px-3 py-1.5 text-sm">
              {condition.charAt(0).toUpperCase() + condition.slice(1)} Condition
            </Badge>
          )}
          {yearBuilt && (
            <Badge variant="outline" className="px-3 py-1.5 text-sm">
              Built {yearBuilt}
            </Badge>
          )}
          {isFurnished && (
            <Badge variant="outline" className="px-3 py-1.5 text-sm">
              Furnished
            </Badge>
          )}
        </div>
      )}

      {/* Features by Category */}
      {hasFeatures && Object.keys(categorizedFeatures).length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-foreground">Features & Amenities</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(categorizedFeatures).map(([categoryKey, categoryFeatures]) => {
              const category = featureCategories[categoryKey];
              if (!category || categoryFeatures.length === 0) return null;
              const Icon = category.icon;
              
              return (
                <div 
                  key={categoryKey}
                  className="p-4 rounded-lg bg-muted/30 border border-border/50"
                >
                  <div className="flex items-center gap-2 mb-3">
                    <Icon className="h-5 w-5 text-primary" />
                    <h4 className="font-medium text-foreground">{category.label}</h4>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {categoryFeatures.map((feature, i) => (
                      <Badge key={i} variant="secondary" className="text-xs">
                        {feature}
                      </Badge>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </motion.div>
  );
}
