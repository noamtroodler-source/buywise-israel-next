import { useState, useMemo } from 'react';
import { Bed, Bath, Maximize, Building2, ChevronRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useFormatPrice } from '@/contexts/PreferencesContext';
import { ProjectUnit } from '@/types/projects';

interface ProjectFloorPlansProps {
  units: ProjectUnit[];
  onSelectUnit?: (unit: ProjectUnit) => void;
  selectedUnitId?: string;
}

interface UnitTypeGroup {
  type: string;
  units: ProjectUnit[];
  priceRange: { min: number; max: number };
  sizeRange: { min: number; max: number };
  bedrooms: number;
  bathrooms: number;
  availableCount: number;
}

export function ProjectFloorPlans({ units, onSelectUnit, selectedUnitId }: ProjectFloorPlansProps) {
  const formatPrice = useFormatPrice();
  
  // Group units by type
  const unitGroups = useMemo(() => {
    const groups: Record<string, UnitTypeGroup> = {};
    
    units.forEach(unit => {
      const type = unit.unit_type;
      if (!groups[type]) {
        groups[type] = {
          type,
          units: [],
          priceRange: { min: Infinity, max: 0 },
          sizeRange: { min: Infinity, max: 0 },
          bedrooms: unit.bedrooms || 0,
          bathrooms: unit.bathrooms || 0,
          availableCount: 0,
        };
      }
      
      groups[type].units.push(unit);
      
      if (unit.price) {
        groups[type].priceRange.min = Math.min(groups[type].priceRange.min, unit.price);
        groups[type].priceRange.max = Math.max(groups[type].priceRange.max, unit.price);
      }
      
      if (unit.size_sqm) {
        groups[type].sizeRange.min = Math.min(groups[type].sizeRange.min, unit.size_sqm);
        groups[type].sizeRange.max = Math.max(groups[type].sizeRange.max, unit.size_sqm);
      }
      
      if (unit.status === 'available') {
        groups[type].availableCount++;
      }
    });
    
    return Object.values(groups).sort((a, b) => a.bedrooms - b.bedrooms);
  }, [units]);

  const [selectedType, setSelectedType] = useState(unitGroups[0]?.type || '');
  const selectedGroup = unitGroups.find(g => g.type === selectedType);

  const getUnitStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300';
      case 'reserved': return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300';
      case 'sold': return 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  if (units.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            Floor Plans & Units
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center py-8">
          <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">Unit details coming soon</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building2 className="h-5 w-5 text-primary" />
          Floor Plans & Units
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Unit Type Selector */}
        <Tabs value={selectedType} onValueChange={setSelectedType}>
          <TabsList className="w-full flex flex-wrap h-auto gap-1 bg-muted/50 p-1">
            {unitGroups.map((group) => (
              <TabsTrigger 
                key={group.type} 
                value={group.type}
                className="flex-1 min-w-[120px] data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                <span className="truncate">{group.type}</span>
                {group.availableCount > 0 && (
                  <Badge variant="secondary" className="ml-1.5 h-5 text-xs">
                    {group.availableCount}
                  </Badge>
                )}
              </TabsTrigger>
            ))}
          </TabsList>

          {unitGroups.map((group) => (
            <TabsContent key={group.type} value={group.type} className="mt-4 space-y-4">
              {/* Group Summary */}
              <div className="p-4 bg-muted/30 rounded-lg border border-border/50">
                <div className="flex flex-wrap gap-6">
                  <div className="flex items-center gap-2">
                    <Bed className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{group.bedrooms} Bedrooms</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Bath className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{group.bathrooms} Bathrooms</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Maximize className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">
                      {group.sizeRange.min === group.sizeRange.max 
                        ? `${group.sizeRange.min} m²`
                        : `${group.sizeRange.min} - ${group.sizeRange.max} m²`}
                    </span>
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-border/50">
                  <p className="text-sm text-muted-foreground">Price Range</p>
                  <p className="text-xl font-bold text-primary">
                    {formatPrice(group.priceRange.min, 'ILS')}
                    {group.priceRange.min !== group.priceRange.max && (
                      <span className="text-base font-normal text-muted-foreground">
                        {' '} – {formatPrice(group.priceRange.max, 'ILS')}
                      </span>
                    )}
                  </p>
                </div>
              </div>

              {/* Individual Units */}
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-muted-foreground">
                  Available Units ({group.units.length})
                </h4>
                <div className="grid gap-2">
                  {group.units.map((unit) => (
                    <button
                      key={unit.id}
                      onClick={() => onSelectUnit?.(unit)}
                      className={`w-full p-3 rounded-lg border text-left transition-all ${
                        selectedUnitId === unit.id
                          ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                          : 'border-border hover:border-primary/50 hover:bg-muted/30'
                      } ${unit.status !== 'available' ? 'opacity-60' : ''}`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="text-sm">
                            <span className="font-medium">Floor {unit.floor || 'N/A'}</span>
                            {unit.size_sqm && (
                              <span className="text-muted-foreground ml-2">
                                {unit.size_sqm} m²
                              </span>
                            )}
                          </div>
                          <Badge className={getUnitStatusColor(unit.status || 'available')}>
                            {unit.status || 'available'}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-primary">
                            {formatPrice(unit.price || 0, unit.currency || 'ILS')}
                          </span>
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  );
}