import { useState, useMemo } from 'react';
import { Hammer, ChefHat, Bath, PaintBucket, Zap, Droplets, Wind, Square, Shield, Home, AlertTriangle, Calendar, Info, Check } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { ToolLayout } from './shared/ToolLayout';
import { InfoBanner } from './shared/InfoBanner';
import { CashBreakdownTable, BreakdownItem } from './shared/CashBreakdownTable';
import { ToolDisclaimer } from './shared/ToolDisclaimer';
import { InsightCard } from './shared/InsightCard';

type QualityLevel = 'basic' | 'standard' | 'premium';
type PropertyType = 'apartment' | 'house' | 'penthouse';

interface RenovationCategory {
  id: string;
  label: string;
  icon: React.ElementType;
  description: string;
  basePricing: {
    basic: { min: number; max: number };
    standard: { min: number; max: number };
    premium: { min: number; max: number };
  };
  unit: 'per_sqm' | 'per_room' | 'fixed';
  timelineWeeks: { min: number; max: number };
  requiresPermit?: boolean;
  notes?: string;
}

const renovationCategories: RenovationCategory[] = [
  {
    id: 'kitchen',
    label: 'Kitchen',
    icon: ChefHat,
    description: 'Full kitchen renovation including cabinets, counters, and appliances',
    basePricing: {
      basic: { min: 35000, max: 55000 },
      standard: { min: 55000, max: 90000 },
      premium: { min: 90000, max: 180000 },
    },
    unit: 'fixed',
    timelineWeeks: { min: 4, max: 8 },
    notes: 'Includes demo, new cabinets, countertops, backsplash, and installation',
  },
  {
    id: 'bathroom',
    label: 'Bathroom',
    icon: Bath,
    description: 'Complete bathroom renovation with new fixtures and tiles',
    basePricing: {
      basic: { min: 25000, max: 40000 },
      standard: { min: 40000, max: 65000 },
      premium: { min: 65000, max: 120000 },
    },
    unit: 'per_room',
    timelineWeeks: { min: 2, max: 4 },
    notes: 'Per bathroom. Includes toilet, sink, shower/tub, tiles, and plumbing',
  },
  {
    id: 'flooring',
    label: 'Flooring',
    icon: Square,
    description: 'Replace flooring throughout the property',
    basePricing: {
      basic: { min: 180, max: 280 },
      standard: { min: 280, max: 450 },
      premium: { min: 450, max: 800 },
    },
    unit: 'per_sqm',
    timelineWeeks: { min: 1, max: 3 },
    notes: 'Basic = vinyl/laminate, Standard = ceramic tiles, Premium = natural stone/hardwood',
  },
  {
    id: 'painting',
    label: 'Painting',
    icon: PaintBucket,
    description: 'Interior painting including walls and ceilings',
    basePricing: {
      basic: { min: 35, max: 50 },
      standard: { min: 50, max: 80 },
      premium: { min: 80, max: 130 },
    },
    unit: 'per_sqm',
    timelineWeeks: { min: 1, max: 2 },
    notes: 'Basic = standard paint, Standard = premium paint + prep, Premium = specialty finishes',
  },
  {
    id: 'electrical',
    label: 'Electrical',
    icon: Zap,
    description: 'Electrical system upgrade or full rewiring',
    basePricing: {
      basic: { min: 15000, max: 25000 },
      standard: { min: 25000, max: 45000 },
      premium: { min: 45000, max: 80000 },
    },
    unit: 'fixed',
    timelineWeeks: { min: 1, max: 3 },
    requiresPermit: true,
    notes: 'Basic = panel upgrade, Standard = partial rewire, Premium = full smart home ready',
  },
  {
    id: 'plumbing',
    label: 'Plumbing',
    icon: Droplets,
    description: 'Plumbing system replacement or upgrade',
    basePricing: {
      basic: { min: 12000, max: 20000 },
      standard: { min: 20000, max: 35000 },
      premium: { min: 35000, max: 60000 },
    },
    unit: 'fixed',
    timelineWeeks: { min: 1, max: 2 },
    notes: 'Basic = fixture replacement, Standard = partial repipe, Premium = full system replacement',
  },
  {
    id: 'hvac',
    label: 'HVAC / AC',
    icon: Wind,
    description: 'Air conditioning and heating system',
    basePricing: {
      basic: { min: 8000, max: 15000 },
      standard: { min: 15000, max: 30000 },
      premium: { min: 30000, max: 60000 },
    },
    unit: 'fixed',
    timelineWeeks: { min: 1, max: 2 },
    notes: 'Basic = mini-splits (2-3 units), Standard = multi-split system, Premium = central/VRF system',
  },
  {
    id: 'mamad',
    label: 'Mamad (Safe Room)',
    icon: Shield,
    description: 'Add a reinforced safe room (required for pre-1992 buildings)',
    basePricing: {
      basic: { min: 80000, max: 100000 },
      standard: { min: 100000, max: 130000 },
      premium: { min: 130000, max: 180000 },
    },
    unit: 'fixed',
    timelineWeeks: { min: 6, max: 12 },
    requiresPermit: true,
    notes: 'Structural addition. Price varies significantly by building type and location',
  },
  {
    id: 'balcony',
    label: 'Balcony',
    icon: Home,
    description: 'Balcony enclosure or renovation',
    basePricing: {
      basic: { min: 15000, max: 25000 },
      standard: { min: 25000, max: 45000 },
      premium: { min: 45000, max: 80000 },
    },
    unit: 'fixed',
    timelineWeeks: { min: 2, max: 4 },
    requiresPermit: true,
    notes: 'Enclosure may require municipal approval. Price depends on size and finish level',
  },
];

const qualityExamples = {
  basic: {
    label: 'Basic',
    description: 'Functional, budget-friendly materials',
    examples: 'IKEA cabinets, Israeli-made fixtures, standard tiles, local appliances',
    priceIndicator: '₪',
  },
  standard: {
    label: 'Standard',
    description: 'Good quality, durable materials',
    examples: 'Mid-range cabinets, Hansgrohe/Grohe fixtures, ceramic tiles, Bosch appliances',
    priceIndicator: '₪₪',
  },
  premium: {
    label: 'Premium',
    description: 'High-end, luxury finishes',
    examples: 'Custom cabinetry, Caesarstone counters, imported tiles, Miele/Sub-Zero appliances',
    priceIndicator: '₪₪₪',
  },
};

export function RenovationCostEstimator() {
  // Property basics
  const [propertySize, setPropertySize] = useState(80);
  const [buildingYear, setBuildingYear] = useState(1995);
  const [propertyType, setPropertyType] = useState<PropertyType>('apartment');
  const [bathroomCount, setBathroomCount] = useState(2);

  // Renovation scope
  const [selectedCategories, setSelectedCategories] = useState<string[]>(['painting', 'flooring']);
  const [qualityLevel, setQualityLevel] = useState<QualityLevel>('standard');

  // Advanced options
  const [includePermits, setIncludePermits] = useState(true);
  const [includeContingency, setIncludeContingency] = useState(true);
  const [contingencyPercent, setContingencyPercent] = useState(15);
  const [includeTempHousing, setIncludeTempHousing] = useState(false);
  const [includeArchitect, setIncludeArchitect] = useState(false);

  const toggleCategory = (categoryId: string) => {
    setSelectedCategories(prev =>
      prev.includes(categoryId)
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  // Property age alerts
  const ageAlerts = useMemo(() => {
    const alerts: { type: 'warning' | 'info'; message: string }[] = [];
    const currentYear = new Date().getFullYear();
    const age = currentYear - buildingYear;

    if (buildingYear < 1992 && !selectedCategories.includes('mamad')) {
      alerts.push({
        type: 'warning',
        message: 'Pre-1992 building: No Mamad (safe room). Consider adding one for safety and resale value.',
      });
    }

    if (age >= 30 && !selectedCategories.includes('electrical')) {
      alerts.push({
        type: 'info',
        message: '30+ year building: Electrical panel upgrade may be required for modern appliances.',
      });
    }

    if (age >= 40 && !selectedCategories.includes('plumbing')) {
      alerts.push({
        type: 'info',
        message: '40+ year building: Old plumbing may need replacement to prevent future issues.',
      });
    }

    return alerts;
  }, [buildingYear, selectedCategories]);

  // Calculate costs
  const calculations = useMemo(() => {
    const breakdown: { category: string; min: number; max: number; weeks: { min: number; max: number } }[] = [];
    let permitCost = 0;
    let requiresPermit = false;

    selectedCategories.forEach(categoryId => {
      const category = renovationCategories.find(c => c.id === categoryId);
      if (!category) return;

      const pricing = category.basePricing[qualityLevel];
      let min = pricing.min;
      let max = pricing.max;

      // Adjust for unit type
      if (category.unit === 'per_sqm') {
        min *= propertySize;
        max *= propertySize;
      } else if (category.unit === 'per_room' && categoryId === 'bathroom') {
        min *= bathroomCount;
        max *= bathroomCount;
      }

      breakdown.push({
        category: category.label,
        min,
        max,
        weeks: category.timelineWeeks,
      });

      if (category.requiresPermit) {
        requiresPermit = true;
        permitCost += 3000; // Base permit cost per category
      }
    });

    const subtotalMin = breakdown.reduce((sum, item) => sum + item.min, 0);
    const subtotalMax = breakdown.reduce((sum, item) => sum + item.max, 0);

    // Calculate additional costs
    const contingencyMin = includeContingency ? subtotalMin * (contingencyPercent / 100) : 0;
    const contingencyMax = includeContingency ? subtotalMax * (contingencyPercent / 100) : 0;

    const actualPermitCost = includePermits && requiresPermit ? permitCost : 0;

    // Temporary housing estimate (based on timeline)
    const totalWeeksMin = breakdown.reduce((sum, item) => sum + item.weeks.min, 0);
    const totalWeeksMax = breakdown.reduce((sum, item) => sum + item.weeks.max, 0);
    const tempHousingCost = includeTempHousing ? (totalWeeksMax * 4000) : 0; // ~4000/week for temp housing

    // Architect/designer fee (5-8% of project cost)
    const architectFeeMin = includeArchitect ? subtotalMin * 0.05 : 0;
    const architectFeeMax = includeArchitect ? subtotalMax * 0.08 : 0;

    const totalMin = subtotalMin + contingencyMin + actualPermitCost + tempHousingCost + architectFeeMin;
    const totalMax = subtotalMax + contingencyMax + actualPermitCost + tempHousingCost + architectFeeMax;

    // Timeline with Israeli holiday buffer
    const timelineMin = Math.max(4, totalWeeksMin);
    const timelineMax = totalWeeksMax + 2; // Add buffer for holidays/delays

    return {
      breakdown,
      subtotalMin,
      subtotalMax,
      contingencyMin,
      contingencyMax,
      permitCost: actualPermitCost,
      tempHousingCost,
      architectFeeMin,
      architectFeeMax,
      totalMin,
      totalMax,
      timelineMin,
      timelineMax,
    };
  }, [selectedCategories, qualityLevel, propertySize, bathroomCount, includePermits, includeContingency, contingencyPercent, includeTempHousing, includeArchitect]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('he-IL', {
      style: 'currency',
      currency: 'ILS',
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Build breakdown items for table
  const breakdownItems: BreakdownItem[] = [
    ...calculations.breakdown.map(item => ({
      label: item.category,
      value: `${formatCurrency(item.min)} - ${formatCurrency(item.max)}`,
    })),
    ...(calculations.breakdown.length > 0 ? [{
      label: 'Renovation Subtotal',
      value: `${formatCurrency(calculations.subtotalMin)} - ${formatCurrency(calculations.subtotalMax)}`,
      isSeparator: true,
    }] : []),
    ...(includeContingency ? [{
      label: `Contingency (${contingencyPercent}%)`,
      value: `${formatCurrency(calculations.contingencyMin)} - ${formatCurrency(calculations.contingencyMax)}`,
      tooltip: 'Buffer for unexpected issues like hidden damage, price increases, or scope changes',
    }] : []),
    ...(calculations.permitCost > 0 ? [{
      label: 'Permit Fees',
      value: formatCurrency(calculations.permitCost),
      tooltip: 'Municipal permits required for structural, electrical, or balcony work',
    }] : []),
    ...(includeTempHousing ? [{
      label: 'Temporary Housing',
      value: formatCurrency(calculations.tempHousingCost),
      tooltip: `Estimated ${calculations.timelineMax} weeks at ₪4,000/week`,
    }] : []),
    ...(includeArchitect ? [{
      label: 'Architect/Designer',
      value: `${formatCurrency(calculations.architectFeeMin)} - ${formatCurrency(calculations.architectFeeMax)}`,
      tooltip: '5-8% of project cost for professional design and oversight',
    }] : []),
    {
      label: 'Estimated Total',
      value: `${formatCurrency(calculations.totalMin)} - ${formatCurrency(calculations.totalMax)}`,
      isTotal: true,
    },
  ];

  // Payment schedule
  const paymentSchedule = [
    { phase: 'Deposit (Contract)', percent: 30, amount: calculations.totalMin * 0.3 },
    { phase: 'Materials & Start', percent: 40, amount: calculations.totalMin * 0.4 },
    { phase: 'Completion', percent: 30, amount: calculations.totalMin * 0.3 },
  ];

  // Generate personalized insights
  const renovationInsights = useMemo(() => {
    const messages: string[] = [];
    const totalMax = calculations.totalMax;
    const timelineMax = calculations.timelineMax;
    
    if (totalMax > 200000) {
      messages.push(`This is a significant renovation. Consider living elsewhere during the work—it's worth the sanity and often speeds up the project.`);
    } else if (selectedCategories.length > 0 && totalMax < 80000) {
      messages.push(`This is a manageable project. Most contractors can handle this scope without major disruption to your life.`);
    }
    
    if (timelineMax > 8) {
      messages.push(`Expect some delays. Israeli holidays, material delays, and contractor schedules can push timelines. Budget time as carefully as money.`);
    }
    
    if (qualityLevel === 'premium') {
      messages.push(`Premium finishes look great, but consider where they matter most. A premium kitchen has more resale impact than premium painting.`);
    }
    
    // Age-based alerts
    if (ageAlerts.length > 0) {
      messages.push(`Your building's age may require additional upgrades. Check the alerts above for mandatory considerations.`);
    }
    
    return messages;
  }, [calculations, selectedCategories.length, qualityLevel, ageAlerts]);

  const leftColumn = (
    <div className="space-y-6">
      {/* Property Basics */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-lg">Property Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-1.5">
                Property Size
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="h-3.5 w-3.5 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent>Total interior area in square meters</TooltipContent>
                </Tooltip>
              </Label>
              <div className="relative">
                <Input
                  type="number"
                  value={propertySize}
                  onChange={(e) => setPropertySize(Number(e.target.value))}
                  className="h-11 pr-12"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">sqm</span>
              </div>
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-1.5">
                Building Year
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="h-3.5 w-3.5 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent>Helps identify required upgrades (electrical, plumbing, Mamad)</TooltipContent>
                </Tooltip>
              </Label>
              <Input
                type="number"
                value={buildingYear}
                onChange={(e) => setBuildingYear(Number(e.target.value))}
                className="h-11"
                min={1900}
                max={new Date().getFullYear()}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Property Type</Label>
              <Select value={propertyType} onValueChange={(v) => setPropertyType(v as PropertyType)}>
                <SelectTrigger className="h-11">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="apartment">Apartment</SelectItem>
                  <SelectItem value="house">House</SelectItem>
                  <SelectItem value="penthouse">Penthouse</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Number of Bathrooms</Label>
              <Input
                type="number"
                value={bathroomCount}
                onChange={(e) => setBathroomCount(Number(e.target.value))}
                className="h-11"
                min={1}
                max={6}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Age-based alerts */}
      {ageAlerts.length > 0 && (
        <div className="space-y-2">
          {ageAlerts.map((alert, index) => (
            <Alert key={index} variant={alert.type === 'warning' ? 'destructive' : 'default'} className="border-primary/20 bg-primary/5">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription className="text-sm">{alert.message}</AlertDescription>
            </Alert>
          ))}
        </div>
      )}

      {/* Quality Level */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-lg flex items-center gap-2">
            Quality Level
            <Tooltip>
              <TooltipTrigger>
                <Info className="h-4 w-4 text-muted-foreground" />
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                Quality level affects material costs. All levels include professional labor.
              </TooltipContent>
            </Tooltip>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-3">
            {(Object.entries(qualityExamples) as [QualityLevel, typeof qualityExamples.basic][]).map(([level, info]) => (
              <button
                key={level}
                onClick={() => setQualityLevel(level)}
                className={cn(
                  "p-3 rounded-lg border-2 text-left transition-all",
                  qualityLevel === level
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50"
                )}
              >
                <div className="font-medium text-sm">{info.label}</div>
                <div className="text-lg font-bold text-primary mt-1">{info.priceIndicator}</div>
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{info.description}</p>
              </button>
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-3 italic">
            {qualityExamples[qualityLevel].label}: {qualityExamples[qualityLevel].examples}
          </p>
        </CardContent>
      </Card>

      {/* Renovation Scope */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-lg">Renovation Scope</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {renovationCategories.map((category) => {
              const isSelected = selectedCategories.includes(category.id);
              const Icon = category.icon;
              const pricing = category.basePricing[qualityLevel];
              
              let priceLabel = '';
              if (category.unit === 'per_sqm') {
                priceLabel = `${formatCurrency(pricing.min)}/sqm`;
              } else if (category.unit === 'per_room') {
                priceLabel = `${formatCurrency(pricing.min)}/room`;
              } else {
                priceLabel = `From ${formatCurrency(pricing.min)}`;
              }

              return (
                <button
                  key={category.id}
                  onClick={() => toggleCategory(category.id)}
                  className={cn(
                    "p-3 rounded-lg border-2 text-left transition-all relative",
                    isSelected
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50"
                  )}
                >
                  {isSelected && (
                    <div className="absolute top-2 right-2">
                      <Check className="h-4 w-4 text-primary" />
                    </div>
                  )}
                  <Icon className={cn("h-5 w-5 mb-2", isSelected ? "text-primary" : "text-muted-foreground")} />
                  <div className="font-medium text-sm">{category.label}</div>
                  <div className="text-xs text-muted-foreground mt-1">{priceLabel}</div>
                  {category.requiresPermit && (
                    <div className="text-xs text-primary mt-1">Requires permit</div>
                  )}
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Advanced Options */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-lg">Additional Costs</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-sm">Include Contingency</Label>
              <p className="text-xs text-muted-foreground">Buffer for unexpected issues</p>
            </div>
            <div className="flex items-center gap-3">
              {includeContingency && (
                <Input
                  type="number"
                  value={contingencyPercent}
                  onChange={(e) => setContingencyPercent(Number(e.target.value))}
                  className="h-9 w-16 text-center"
                  min={5}
                  max={25}
                />
              )}
              <Switch checked={includeContingency} onCheckedChange={setIncludeContingency} />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-sm">Include Permit Fees</Label>
              <p className="text-xs text-muted-foreground">Required for structural/electrical work</p>
            </div>
            <Switch checked={includePermits} onCheckedChange={setIncludePermits} />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-sm">Temporary Housing</Label>
              <p className="text-xs text-muted-foreground">If you can't live in the property</p>
            </div>
            <Switch checked={includeTempHousing} onCheckedChange={setIncludeTempHousing} />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-sm">Architect/Designer Fee</Label>
              <p className="text-xs text-muted-foreground">Professional design oversight</p>
            </div>
            <Switch checked={includeArchitect} onCheckedChange={setIncludeArchitect} />
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const rightColumn = (
    <div className="space-y-4">
      {/* Hero Result */}
      <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
        <CardContent className="pt-6">
          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-1">Estimated Total Cost</p>
            <p className="text-3xl font-bold text-foreground">
              {formatCurrency(calculations.totalMin)} - {formatCurrency(calculations.totalMax)}
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              <Calendar className="h-4 w-4 inline mr-1" />
              Timeline: {calculations.timelineMin}-{calculations.timelineMax} weeks
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Cost Breakdown */}
      {selectedCategories.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Cost Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <CashBreakdownTable items={breakdownItems} />
          </CardContent>
        </Card>
      )}

      {/* Payment Schedule */}
      {selectedCategories.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              Typical Payment Schedule
              <Tooltip>
                <TooltipTrigger>
                  <Info className="h-4 w-4 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  Standard Israeli contractor payment structure. Never pay 100% upfront.
                </TooltipContent>
              </Tooltip>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {paymentSchedule.map((phase, index) => (
              <div key={index} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium text-primary">
                    {index + 1}
                  </div>
                  <div>
                    <p className="text-sm font-medium">{phase.phase}</p>
                    <p className="text-xs text-muted-foreground">{phase.percent}%</p>
                  </div>
                </div>
                <p className="font-medium">{formatCurrency(phase.amount)}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* What's Included */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">What's Included at {qualityExamples[qualityLevel].label} Level</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">{qualityExamples[qualityLevel].description}</p>
          <p className="text-sm mt-2"><strong>Examples:</strong> {qualityExamples[qualityLevel].examples}</p>
        </CardContent>
      </Card>

      {/* Empty State */}
      {selectedCategories.length === 0 && (
        <Card>
          <CardContent className="py-8 text-center">
            <Hammer className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
            <p className="text-muted-foreground">Select renovation areas to see cost estimates</p>
          </CardContent>
        </Card>
      )}
      
      {/* Insight Card */}
      {renovationInsights.length > 0 && selectedCategories.length > 0 && (
        <InsightCard insights={renovationInsights} />
      )}
    </div>
  );

  return (
    <ToolLayout
      title="Renovation Cost Estimator"
      subtitle="Estimate renovation costs for Israeli properties with transparent pricing"
      icon={<Hammer className="h-6 w-6" />}
      infoBanner={
        <InfoBanner variant="info">
          Prices based on CBS construction cost index and contractor market research (Q4 2024). Actual costs vary by location, contractor, and specific requirements.
        </InfoBanner>
      }
      leftColumn={leftColumn}
      rightColumn={rightColumn}
      disclaimer={
        <ToolDisclaimer
          text="Cost estimates are for planning purposes only and based on average Israeli market rates. Always get multiple quotes from licensed contractors. Prices vary significantly by location (Tel Aviv typically 20-30% higher than peripheral areas), building age, and specific requirements."
        />
      }
    />
  );
}
