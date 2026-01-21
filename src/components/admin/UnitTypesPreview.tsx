import { useState, useMemo } from 'react';
import { 
  Home, Eye, BedDouble, Bath, Ruler, Layers, X 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ProjectUnit } from '@/hooks/useAdminProjects';

interface UnitTypeGroup {
  type: string;
  bedrooms: number;
  bathrooms: number;
  sizeRange: { min: number; max: number };
  floorRange: { min: number; max: number };
  priceRange: { min: number; max: number };
  floorPlanUrl: string | null;
  count: number;
  avgPricePerSqm: number;
}

interface UnitTypesPreviewProps {
  units: ProjectUnit[];
  compact?: boolean;
}

export function UnitTypesPreview({ units, compact = false }: UnitTypesPreviewProps) {
  const [selectedFloorPlan, setSelectedFloorPlan] = useState<{ url: string; type: string } | null>(null);

  const unitGroups = useMemo(() => {
    if (!units || units.length === 0) return [];

    const groups: Record<string, UnitTypeGroup> = {};

    units.forEach(unit => {
      const key = unit.unit_type || `${unit.bedrooms}-Room`;
      
      if (!groups[key]) {
        groups[key] = {
          type: key,
          bedrooms: unit.bedrooms,
          bathrooms: unit.bathrooms,
          sizeRange: { min: unit.size_sqm, max: unit.size_sqm },
          floorRange: { min: unit.floor || 0, max: unit.floor || 0 },
          priceRange: { min: unit.price || 0, max: unit.price || 0 },
          floorPlanUrl: unit.floor_plan_url,
          count: 1,
          avgPricePerSqm: 0,
        };
      } else {
        const g = groups[key];
        g.count++;
        g.sizeRange.min = Math.min(g.sizeRange.min, unit.size_sqm);
        g.sizeRange.max = Math.max(g.sizeRange.max, unit.size_sqm);
        if (unit.floor) {
          g.floorRange.min = g.floorRange.min === 0 ? unit.floor : Math.min(g.floorRange.min, unit.floor);
          g.floorRange.max = Math.max(g.floorRange.max, unit.floor);
        }
        if (unit.price) {
          g.priceRange.min = g.priceRange.min === 0 ? unit.price : Math.min(g.priceRange.min, unit.price);
          g.priceRange.max = Math.max(g.priceRange.max, unit.price);
        }
        if (!g.floorPlanUrl && unit.floor_plan_url) {
          g.floorPlanUrl = unit.floor_plan_url;
        }
      }
    });

    // Calculate avg price per sqm
    Object.values(groups).forEach(g => {
      const avgPrice = (g.priceRange.min + g.priceRange.max) / 2;
      const avgSize = (g.sizeRange.min + g.sizeRange.max) / 2;
      g.avgPricePerSqm = avgSize > 0 ? avgPrice / avgSize : 0;
    });

    return Object.values(groups).sort((a, b) => a.bedrooms - b.bedrooms);
  }, [units]);

  const formatPrice = (price: number) => {
    if (!price) return 'TBD';
    return new Intl.NumberFormat('he-IL', {
      style: 'currency',
      currency: 'ILS',
      maximumFractionDigits: 0,
    }).format(price);
  };

  const formatRange = (min: number, max: number, suffix: string = '') => {
    if (min === max || max === 0) return `${min}${suffix}`;
    return `${min}-${max}${suffix}`;
  };

  if (!units || units.length === 0) {
    return (
      <div className="text-center py-4 text-muted-foreground">
        <Home className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p className="text-sm">No unit types defined yet</p>
      </div>
    );
  }

  if (compact) {
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-sm font-medium">
          <Home className="h-4 w-4 text-primary" />
          <span>{unitGroups.length} Unit Types</span>
          <span className="text-muted-foreground">({units.length} total units)</span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {unitGroups.map((group) => (
            <Badge key={group.type} variant="secondary" className="text-xs gap-1">
              {group.type}
              <span className="text-muted-foreground">({group.count})</span>
              {group.floorPlanUrl && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-4 w-4 p-0 ml-1"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedFloorPlan({ url: group.floorPlanUrl!, type: group.type });
                  }}
                >
                  <Eye className="h-3 w-3" />
                </Button>
              )}
            </Badge>
          ))}
        </div>
        
        {/* Floor Plan Dialog */}
        <Dialog open={!!selectedFloorPlan} onOpenChange={() => setSelectedFloorPlan(null)}>
          <DialogContent className="max-w-3xl">
            <div className="relative">
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-0 top-0"
                onClick={() => setSelectedFloorPlan(null)}
              >
                <X className="h-4 w-4" />
              </Button>
              <h3 className="text-lg font-semibold mb-4">{selectedFloorPlan?.type} Floor Plan</h3>
              {selectedFloorPlan?.url && (
                <img
                  src={selectedFloorPlan.url}
                  alt={`${selectedFloorPlan.type} Floor Plan`}
                  className="w-full max-h-[70vh] object-contain rounded-lg"
                />
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Home className="h-5 w-5 text-primary" />
        <h3 className="font-semibold">Floor Plans & Unit Types</h3>
        <Badge variant="outline">{unitGroups.length} types</Badge>
      </div>

      <div className="rounded-lg border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Unit Type</TableHead>
              <TableHead className="text-center">
                <BedDouble className="h-4 w-4 mx-auto" />
              </TableHead>
              <TableHead className="text-center">
                <Bath className="h-4 w-4 mx-auto" />
              </TableHead>
              <TableHead>
                <div className="flex items-center gap-1">
                  <Ruler className="h-4 w-4" />
                  Size
                </div>
              </TableHead>
              <TableHead>
                <div className="flex items-center gap-1">
                  <Layers className="h-4 w-4" />
                  Floors
                </div>
              </TableHead>
              <TableHead>Price From</TableHead>
              <TableHead>₪/m²</TableHead>
              <TableHead className="text-center">Floor Plan</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {unitGroups.map((group) => (
              <TableRow key={group.type}>
                <TableCell className="font-medium">
                  {group.type}
                  <span className="text-muted-foreground text-xs ml-1">({group.count})</span>
                </TableCell>
                <TableCell className="text-center">{group.bedrooms}</TableCell>
                <TableCell className="text-center">{group.bathrooms}</TableCell>
                <TableCell>{formatRange(group.sizeRange.min, group.sizeRange.max, ' m²')}</TableCell>
                <TableCell>
                  {group.floorRange.min > 0 ? formatRange(group.floorRange.min, group.floorRange.max) : '-'}
                </TableCell>
                <TableCell className="font-medium text-primary">
                  {group.priceRange.min > 0 ? formatPrice(group.priceRange.min) : 'TBD'}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {group.avgPricePerSqm > 0 
                    ? `₪${Math.round(group.avgPricePerSqm).toLocaleString()}`
                    : '-'
                  }
                </TableCell>
                <TableCell className="text-center">
                  {group.floorPlanUrl ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedFloorPlan({ url: group.floorPlanUrl!, type: group.type })}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      View
                    </Button>
                  ) : (
                    <span className="text-xs text-muted-foreground">Coming Soon</span>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Floor Plan Dialog */}
      <Dialog open={!!selectedFloorPlan} onOpenChange={() => setSelectedFloorPlan(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <div className="relative">
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-0 top-0 z-10"
              onClick={() => setSelectedFloorPlan(null)}
            >
              <X className="h-4 w-4" />
            </Button>
            <h3 className="text-lg font-semibold mb-4">{selectedFloorPlan?.type} Floor Plan</h3>
            {selectedFloorPlan?.url && (
              <img
                src={selectedFloorPlan.url}
                alt={`${selectedFloorPlan.type} Floor Plan`}
                className="w-full max-h-[75vh] object-contain rounded-lg"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
