import { useMemo } from 'react';
import { Building2, Mail, Phone } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useFormatPrice } from '@/contexts/PreferencesContext';
import { ProjectUnit, Developer } from '@/types/projects';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface ProjectFloorPlansProps {
  units: ProjectUnit[];
  developer?: Developer | null;
}

interface UnitTypeGroup {
  type: string;
  bedrooms: number;
  bathrooms: number;
  sizeRange: { min: number; max: number };
  floorRange: { min: number; max: number };
  priceRange: { min: number; max: number };
  pricePerSqm: number;
  outdoor: string;
}

export function ProjectFloorPlans({ units, developer }: ProjectFloorPlansProps) {
  const formatPrice = useFormatPrice();
  
  // Group units by type with aggregated data
  const unitGroups = useMemo(() => {
    const groups: Record<string, UnitTypeGroup> = {};
    
    units.forEach(unit => {
      const type = unit.unit_type;
      if (!groups[type]) {
        groups[type] = {
          type,
          bedrooms: unit.bedrooms || 0,
          bathrooms: unit.bathrooms || 0,
          sizeRange: { min: Infinity, max: 0 },
          floorRange: { min: Infinity, max: 0 },
          priceRange: { min: Infinity, max: 0 },
          pricePerSqm: 0,
          outdoor: (unit as any).outdoor_space || 'Balcony',
        };
      }
      
      if (unit.price) {
        groups[type].priceRange.min = Math.min(groups[type].priceRange.min, unit.price);
        groups[type].priceRange.max = Math.max(groups[type].priceRange.max, unit.price);
      }
      
      if (unit.size_sqm) {
        groups[type].sizeRange.min = Math.min(groups[type].sizeRange.min, unit.size_sqm);
        groups[type].sizeRange.max = Math.max(groups[type].sizeRange.max, unit.size_sqm);
      }
      
      if (unit.floor) {
        groups[type].floorRange.min = Math.min(groups[type].floorRange.min, unit.floor);
        groups[type].floorRange.max = Math.max(groups[type].floorRange.max, unit.floor);
      }
    });
    
    // Calculate price per sqm for each group
    Object.values(groups).forEach(group => {
      if (group.priceRange.min !== Infinity && group.sizeRange.min !== Infinity) {
        const avgPrice = (group.priceRange.min + group.priceRange.max) / 2;
        const avgSize = (group.sizeRange.min + group.sizeRange.max) / 2;
        group.pricePerSqm = Math.round(avgPrice / avgSize);
      }
      
      // Set outdoor type based on unit type if not provided
      if (group.type.toLowerCase().includes('penthouse')) {
        group.outdoor = 'Roof Terrace';
      } else if (group.type.toLowerCase().includes('garden')) {
        group.outdoor = 'Garden';
      }
    });
    
    return Object.values(groups).sort((a, b) => a.bedrooms - b.bedrooms);
  }, [units]);

  const formatRange = (min: number, max: number, suffix = '') => {
    if (min === Infinity || max === 0) return 'N/A';
    if (min === max) return `${min}${suffix}`;
    return `${min}-${max}${suffix}`;
  };

  const handleScrollToContact = () => {
    const section = document.getElementById('developer-section');
    section?.scrollIntoView({ behavior: 'smooth' });
  };

  // Empty state with CTA
  if (units.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            Floor Plans & Units
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 space-y-4">
            <Building2 className="h-12 w-12 text-muted-foreground mx-auto" />
            <div className="space-y-2">
              <p className="font-medium text-foreground">Unit details coming soon</p>
              <p className="text-sm text-muted-foreground max-w-md mx-auto">
                Detailed floor plans and pricing for this project are being finalized. 
                Contact the developer directly for the latest availability and unit options.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
              <Button onClick={handleScrollToContact}>
                <Mail className="h-4 w-4 mr-2" />
                Request Unit Availability
              </Button>
              {developer?.phone && (
                <Button variant="outline" asChild>
                  <a href={`tel:${developer.phone}`}>
                    <Phone className="h-4 w-4 mr-2" />
                    Call Developer
                  </a>
                </Button>
              )}
            </div>
          </div>
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
      <CardContent>
        {/* Desktop Table */}
        <div className="hidden md:block overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Unit Type</TableHead>
                <TableHead className="text-center">Rooms</TableHead>
                <TableHead className="text-center">Baths</TableHead>
                <TableHead className="text-center">Size (m²)</TableHead>
                <TableHead className="text-center">Floors</TableHead>
                <TableHead className="text-center">Outdoor</TableHead>
                <TableHead className="text-right">Price From</TableHead>
                <TableHead className="text-right">₪/m²</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {unitGroups.map((group) => (
                <TableRow key={group.type}>
                  <TableCell className="font-medium">{group.type}</TableCell>
                  <TableCell className="text-center">{group.bedrooms}</TableCell>
                  <TableCell className="text-center">{group.bathrooms}</TableCell>
                  <TableCell className="text-center">{formatRange(group.sizeRange.min, group.sizeRange.max)}</TableCell>
                  <TableCell className="text-center">{formatRange(group.floorRange.min, group.floorRange.max)}</TableCell>
                  <TableCell className="text-center text-muted-foreground">{group.outdoor}</TableCell>
                  <TableCell className="text-right font-semibold text-primary">
                    {group.priceRange.min !== Infinity ? formatPrice(group.priceRange.min, 'ILS') : 'N/A'}
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground">
                    {group.pricePerSqm > 0 ? `₪${group.pricePerSqm.toLocaleString()}` : 'N/A'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Mobile Cards */}
        <div className="md:hidden space-y-3">
          {unitGroups.map((group) => (
            <div key={group.type} className="p-4 rounded-lg border border-border bg-muted/20">
              <div className="mb-3">
                <h4 className="font-semibold">{group.type}</h4>
                <p className="text-sm text-muted-foreground">
                  {group.bedrooms} Bed • {group.bathrooms} Bath • {formatRange(group.sizeRange.min, group.sizeRange.max)} m²
                </p>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-muted-foreground">Floors:</span>{' '}
                  <span>{formatRange(group.floorRange.min, group.floorRange.max)}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Outdoor:</span>{' '}
                  <span>{group.outdoor}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">From:</span>{' '}
                  <span className="font-semibold text-primary">
                    {group.priceRange.min !== Infinity ? formatPrice(group.priceRange.min, 'ILS') : 'N/A'}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">₪/m²:</span>{' '}
                  <span>{group.pricePerSqm > 0 ? `₪${group.pricePerSqm.toLocaleString()}` : 'N/A'}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* CTA at bottom */}
        <div className="mt-6 pt-4 border-t border-border text-center">
          <p className="text-sm text-muted-foreground mb-3">
            Want more details on specific units or availability?
          </p>
          <Button variant="outline" onClick={handleScrollToContact}>
            <Mail className="h-4 w-4 mr-2" />
            Request Full Floor Plans
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
