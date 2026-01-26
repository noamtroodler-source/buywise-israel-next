import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ChevronDown, Layers, Bed, Bath, Maximize, DollarSign, FileImage } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { ProjectUnit } from '@/types/projects';

interface CompareProject {
  id: string;
  name: string;
}

interface CompareUnitTypesSectionProps {
  projects: CompareProject[];
  projectUnits: Record<string, ProjectUnit[]>;
  formatPrice: (price: number, currency?: string) => string;
  formatArea: (sqm: number) => string;
}

export function CompareUnitTypesSection({ 
  projects, 
  projectUnits, 
  formatPrice, 
  formatArea 
}: CompareUnitTypesSectionProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedUnits, setSelectedUnits] = useState<Record<string, string>>({});

  // Get all unique unit types across projects and auto-select matching ones
  useEffect(() => {
    const allUnitTypes = new Map<string, string[]>();
    
    projects.forEach(project => {
      const units = projectUnits[project.id] || [];
      units.forEach(unit => {
        if (!allUnitTypes.has(unit.unit_type)) {
          allUnitTypes.set(unit.unit_type, []);
        }
        allUnitTypes.get(unit.unit_type)?.push(project.id);
      });
    });

    // Find a unit type that exists in all projects
    const commonUnitType = Array.from(allUnitTypes.entries())
      .find(([_, projectIds]) => projectIds.length === projects.length)?.[0];

    if (commonUnitType) {
      const autoSelected: Record<string, string> = {};
      projects.forEach(project => {
        const units = projectUnits[project.id] || [];
        const matchingUnit = units.find(u => u.unit_type === commonUnitType);
        if (matchingUnit) {
          autoSelected[project.id] = matchingUnit.id;
        }
      });
      setSelectedUnits(autoSelected);
    }
  }, [projects, projectUnits]);

  const hasAnyUnits = projects.some(p => (projectUnits[p.id] || []).length > 0);
  if (!hasAnyUnits) return null;

  const getSelectedUnit = (projectId: string): ProjectUnit | undefined => {
    const unitId = selectedUnits[projectId];
    if (!unitId) return undefined;
    return (projectUnits[projectId] || []).find(u => u.id === unitId);
  };

  const allSelected = projects.every(p => selectedUnits[p.id]);

  // Helper to find best values
  const getBestForMetric = (metric: 'price' | 'size' | 'pricePerSqm'): string | null => {
    if (!allSelected) return null;
    
    const values = projects.map(p => {
      const unit = getSelectedUnit(p.id);
      if (!unit) return null;
      
      switch (metric) {
        case 'price':
          return unit.price ? { id: p.id, value: unit.price } : null;
        case 'size':
          return unit.size_sqm ? { id: p.id, value: unit.size_sqm } : null;
        case 'pricePerSqm':
          return unit.price && unit.size_sqm 
            ? { id: p.id, value: unit.price / unit.size_sqm } 
            : null;
      }
    }).filter(Boolean) as { id: string; value: number }[];

    if (values.length < 2) return null;

    if (metric === 'size') {
      // Higher is better for size
      return values.reduce((max, v) => v.value > max.value ? v : max).id;
    } else {
      // Lower is better for price and price/sqm
      return values.reduce((min, v) => v.value < min.value ? v : min).id;
    }
  };

  return (
    <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-xl border border-border overflow-hidden bg-card"
      >
        <CollapsibleTrigger asChild>
          <Button 
            variant="ghost" 
            className="w-full flex items-center justify-between px-4 py-4 h-auto hover:bg-muted/50"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                <Layers className="h-4 w-4 text-primary" />
              </div>
              <div className="text-left">
                <div className="font-semibold">Compare Unit Types</div>
                <div className="text-sm text-muted-foreground">
                  Select a unit type from each project for detailed comparison
                </div>
              </div>
            </div>
            <ChevronDown className={`h-5 w-5 text-muted-foreground transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
          </Button>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div className="border-t border-border p-4 space-y-6">
            {/* Unit Selectors */}
            <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${projects.length}, minmax(0, 1fr))` }}>
              {projects.map(project => {
                const units = projectUnits[project.id] || [];
                return (
                  <div key={project.id} className="space-y-2">
                    <div className="text-sm font-medium truncate">{project.name}</div>
                    {units.length > 0 ? (
                      <Select
                        value={selectedUnits[project.id] || ''}
                        onValueChange={(value) => setSelectedUnits(prev => ({ ...prev, [project.id]: value }))}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select unit type" />
                        </SelectTrigger>
                        <SelectContent className="bg-popover border border-border shadow-lg z-50">
                          {units.map(unit => (
                            <SelectItem key={unit.id} value={unit.id}>
                              {unit.unit_type}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <div className="text-sm text-muted-foreground italic py-2">No units listed</div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Comparison Table */}
            {allSelected && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="space-y-1"
              >
                {/* Price */}
                <CompareRow 
                  label="Price (from)"
                  icon={DollarSign}
                  values={projects.map(p => {
                    const unit = getSelectedUnit(p.id);
                    return {
                      projectId: p.id,
                      value: unit?.price ? formatPrice(unit.price, unit.currency || 'ILS') : '—',
                      isBest: getBestForMetric('price') === p.id,
                    };
                  })}
                  highlight
                />

                {/* Size */}
                <CompareRow 
                  label="Size"
                  icon={Maximize}
                  values={projects.map(p => {
                    const unit = getSelectedUnit(p.id);
                    return {
                      projectId: p.id,
                      value: unit?.size_sqm ? formatArea(unit.size_sqm) : '—',
                      isBest: getBestForMetric('size') === p.id,
                    };
                  })}
                />

                {/* Price per sqm */}
                <CompareRow 
                  label="Price/m²"
                  icon={DollarSign}
                  values={projects.map(p => {
                    const unit = getSelectedUnit(p.id);
                    const pricePerSqm = unit?.price && unit?.size_sqm 
                      ? Math.round(unit.price / unit.size_sqm) 
                      : null;
                    return {
                      projectId: p.id,
                      value: pricePerSqm ? formatPrice(pricePerSqm) : '—',
                      isBest: getBestForMetric('pricePerSqm') === p.id,
                    };
                  })}
                />

                {/* Bathrooms */}
                <CompareRow 
                  label="Bathrooms"
                  icon={Bath}
                  values={projects.map(p => {
                    const unit = getSelectedUnit(p.id);
                    return {
                      projectId: p.id,
                      value: unit?.bathrooms?.toString() || '—',
                    };
                  })}
                />

                {/* Floor */}
                <CompareRow 
                  label="Floor Range"
                  icon={Layers}
                  values={projects.map(p => {
                    const unit = getSelectedUnit(p.id);
                    return {
                      projectId: p.id,
                      value: unit?.floor ? `Floor ${unit.floor}` : '—',
                    };
                  })}
                />

                {/* Floor Plan */}
                <CompareRow 
                  label="Floor Plan"
                  icon={FileImage}
                  values={projects.map(p => {
                    const unit = getSelectedUnit(p.id);
                    return {
                      projectId: p.id,
                      value: unit?.floor_plan_url ? (
                        <a 
                          href={unit.floor_plan_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-primary hover:underline"
                        >
                          View Plan
                        </a>
                      ) : '—',
                    };
                  })}
                />
              </motion.div>
            )}

            {!allSelected && (
              <div className="text-center py-4 text-muted-foreground text-sm">
                Select a unit type from each project to see the comparison
              </div>
            )}
          </div>
        </CollapsibleContent>
      </motion.div>
    </Collapsible>
  );
}

interface CompareRowProps {
  label: string;
  icon: React.ElementType;
  values: { projectId: string; value: React.ReactNode; isBest?: boolean }[];
  highlight?: boolean;
}

function CompareRow({ label, icon: Icon, values, highlight }: CompareRowProps) {
  return (
    <div 
      className="grid gap-4 py-3 px-4 rounded-lg odd:bg-muted/30"
      style={{ gridTemplateColumns: `minmax(100px, 140px) repeat(${values.length}, minmax(0, 1fr))` }}
    >
      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
        <Icon className="h-4 w-4 shrink-0" />
        <span>{label}</span>
      </div>
      {values.map(({ projectId, value, isBest }) => (
        <div 
          key={projectId} 
          className={`text-sm flex items-center gap-2 ${highlight ? 'font-semibold text-primary' : ''} ${isBest && !highlight ? 'font-medium text-primary' : ''}`}
        >
          {isBest && (
            <span className="w-1 h-4 bg-primary rounded-full" />
          )}
          <span>{value}</span>
        </div>
      ))}
    </div>
  );
}
