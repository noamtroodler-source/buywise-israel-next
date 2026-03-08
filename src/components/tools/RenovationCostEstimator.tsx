import { useState, useMemo, useEffect } from 'react';
import { useSavePromptTrigger } from '@/hooks/useSavePromptTrigger';
import { motion } from 'framer-motion';
import { Hammer, ChefHat, Bath, PaintBucket, Zap, Droplets, Wind, Square, Shield, Home, AlertTriangle, Calendar, HelpCircle, Check, ChevronDown, Calculator, FileText, TrendingUp, BookOpen, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';
import { ToolLayout } from './shared/ToolLayout';
import { InfoBanner } from './shared/InfoBanner';
import { CashBreakdownTable, BreakdownItem } from './shared/CashBreakdownTable';
import { ToolDisclaimer } from './shared/ToolDisclaimer';
import { InsightCard } from './shared/InsightCard';
import { CTACard } from './shared/CTACard';
import { ToolFeedback } from './shared/ToolFeedback';
import { SourceAttribution } from './shared/SourceAttribution';
import { SaveResultsPrompt } from './shared/SaveResultsPrompt';

import { usePreferences, useFormatPrice, useFormatArea, useCurrencySymbol, useAreaUnitLabel } from '@/contexts/PreferencesContext';

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

// Quality examples - dynamic priceIndicator will be set in component
const getQualityExamples = (symbol: string) => ({
  basic: {
    label: 'Basic',
    description: 'Functional, budget-friendly materials',
    examples: 'IKEA cabinets, Israeli-made fixtures, standard tiles, local appliances',
    priceIndicator: symbol,
  },
  standard: {
    label: 'Standard',
    description: 'Good quality, durable materials',
    examples: 'Mid-range cabinets, Hansgrohe/Grohe fixtures, ceramic tiles, Bosch appliances',
    priceIndicator: symbol + symbol,
  },
  premium: {
    label: 'Premium',
    description: 'High-end, luxury finishes',
    examples: 'Custom cabinetry, Caesarstone counters, imported tiles, Miele/Sub-Zero appliances',
    priceIndicator: symbol + symbol + symbol,
  },
});

export function RenovationCostEstimator() {
  const { areaUnit } = usePreferences();
  const formatCurrency = useFormatPrice();
  const formatArea = useFormatArea();
  const currencySymbol = useCurrencySymbol();
  const areaUnitLabel = useAreaUnitLabel();
  const { showPrompt: showSavePrompt, dismissPrompt: dismissSavePrompt, trackChange } = useSavePromptTrigger();
  
  // Get quality examples with dynamic currency symbol
  const qualityExamples = useMemo(() => getQualityExamples(currencySymbol), [currencySymbol]);
  
  // Property basics
  const [propertySize, setPropertySize] = useState(80);
  const [buildingYear, setBuildingYear] = useState(1995);
  const [propertyType, setPropertyType] = useState<PropertyType>('apartment');
  const [bathroomCount, setBathroomCount] = useState(2);

  // Renovation scope
  const [selectedCategories, setSelectedCategories] = useState<string[]>(['painting', 'flooring']);
  const [qualityLevel, setQualityLevel] = useState<QualityLevel>('standard');

  // Track input changes for save prompt
  useEffect(() => {
    trackChange();
  }, [propertySize, buildingYear, propertyType, qualityLevel, selectedCategories, trackChange]);

  // Advanced options
  const [includePermits, setIncludePermits] = useState(true);
  const [includeContingency, setIncludeContingency] = useState(true);
  const [contingencyPercent, setContingencyPercent] = useState(15);
  const [includeTempHousing, setIncludeTempHousing] = useState(false);
  const [includeArchitect, setIncludeArchitect] = useState(false);
  
  // Collapsible states
  const [isBreakdownOpen, setIsBreakdownOpen] = useState(true);
  const [isTipsOpen, setIsTipsOpen] = useState(false);

  // Reset handler
  const handleReset = () => {
    setPropertySize(80);
    setBuildingYear(1995);
    setPropertyType('apartment');
    setBathroomCount(2);
    setSelectedCategories(['painting', 'flooring']);
    setQualityLevel('standard');
    setIncludePermits(true);
    setIncludeContingency(true);
    setContingencyPercent(15);
    setIncludeTempHousing(false);
    setIncludeArchitect(false);
    toast.success('Estimator reset');
  };

  // Header actions
  const headerActions = (
    <Button variant="ghost" size="sm" onClick={handleReset} className="gap-2">
      <RotateCcw className="h-4 w-4" />
      <span className="hidden sm:inline">Reset</span>
    </Button>
  );

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
    
    // Cost per sqm
    const costPerSqmMin = propertySize > 0 ? totalMin / propertySize : 0;
    const costPerSqmMax = propertySize > 0 ? totalMax / propertySize : 0;
    
    // Other costs total (non-renovation)
    const otherCostsMin = contingencyMin + actualPermitCost + tempHousingCost + architectFeeMin;
    const otherCostsMax = contingencyMax + actualPermitCost + tempHousingCost + architectFeeMax;

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
      costPerSqmMin,
      costPerSqmMax,
      otherCostsMin,
      otherCostsMax,
    };
  }, [selectedCategories, qualityLevel, propertySize, bathroomCount, includePermits, includeContingency, contingencyPercent, includeTempHousing, includeArchitect]);


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
    const totalMin = calculations.totalMin;
    const timelineMax = calculations.timelineMax;
    
    // No insights if nothing selected
    if (selectedCategories.length === 0) return messages;
    
    // Per-sqm context when property size is available
    if (propertySize > 0 && totalMax > 0) {
      const avgTotal = (totalMin + totalMax) / 2;
      const perSqm = Math.round(avgTotal / propertySize);
      const level = perSqm < 1500 ? 'light' : perSqm < 3500 ? 'moderate' : 'heavy';
      messages.push(`At ₪${perSqm.toLocaleString()}/sqm, this is a ${level} renovation by Israeli standards.`);
    }
    
    // Scale-based insight
    if (totalMax > 200000) {
      messages.push(`This is a significant renovation. Consider living elsewhere during the work — it often speeds up the project by 20-30%.`);
    }
    
    // Get 3 quotes for large projects
    if (totalMax > 150000) {
      messages.push(`Get at least 3 written quotes — price variation of 20-30% is normal in Israel for projects this size.`);
    }
    
    // Timeline warning
    if (messages.length < 3 && timelineMax > 8) {
      messages.push(`Budget time as carefully as money — Israeli holidays, material delays, and contractor schedules can push your ${timelineMax}-week timeline.`);
    }
    
    // Age-based alerts
    if (messages.length < 3 && ageAlerts.length > 0) {
      messages.push(`Your building's age may require additional upgrades. Check the alerts above for mandatory considerations.`);
    }
    
    return messages.slice(0, 3);
  }, [calculations, selectedCategories.length, propertySize, ageAlerts]);
  
  // Visual breakdown bar percentages
  const breakdownBarData = useMemo(() => {
    if (calculations.totalMax === 0) return { renovation: 0, contingency: 0, other: 0 };
    const avgTotal = (calculations.totalMin + calculations.totalMax) / 2;
    const avgSubtotal = (calculations.subtotalMin + calculations.subtotalMax) / 2;
    const avgContingency = (calculations.contingencyMin + calculations.contingencyMax) / 2;
    const avgOther = (calculations.otherCostsMin + calculations.otherCostsMax) / 2 - avgContingency;
    
    return {
      renovation: (avgSubtotal / avgTotal) * 100,
      contingency: (avgContingency / avgTotal) * 100,
      other: (avgOther / avgTotal) * 100,
    };
  }, [calculations]);

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
                    <HelpCircle className="h-3.5 w-3.5 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent>Total interior area in square meters</TooltipContent>
                </Tooltip>
              </Label>
              <div className="relative">
                <Input
                  type="number"
                  value={propertySize}
                  onChange={(e) => setPropertySize(Number(e.target.value))}
                  className="h-11 pr-12 text-lg"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">{areaUnitLabel}</span>
              </div>
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-1.5">
                Building Year
                <Tooltip>
                  <TooltipTrigger>
                    <HelpCircle className="h-3.5 w-3.5 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent>Helps identify required upgrades (electrical, plumbing, Mamad)</TooltipContent>
                </Tooltip>
              </Label>
              <Input
                type="number"
                value={buildingYear}
                onChange={(e) => setBuildingYear(Number(e.target.value))}
                className="h-11 text-lg"
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
              <Label className="flex items-center gap-1.5">
                Bathrooms
                <Tooltip>
                  <TooltipTrigger>
                    <HelpCircle className="h-3.5 w-3.5 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent>Number of bathrooms to renovate</TooltipContent>
                </Tooltip>
              </Label>
              <Input
                type="number"
                value={bathroomCount}
                onChange={(e) => setBathroomCount(Number(e.target.value))}
                className="h-11 text-lg"
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
                <HelpCircle className="h-4 w-4 text-muted-foreground" />
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
      {/* Hero Result Card */}
      <Card className="border-primary/20 overflow-hidden">
        <div className="bg-gradient-to-b from-primary/5 via-background to-background p-6">
          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-2">Estimated Total Cost</p>
            <motion.div
              key={`${calculations.totalMin}-${calculations.totalMax}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="text-3xl md:text-4xl font-bold text-primary"
            >
              {formatCurrency(calculations.totalMin)} - {formatCurrency(calculations.totalMax)}
            </motion.div>
            <div className="flex items-center justify-center gap-2 mt-3">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                {calculations.timelineMin}-{calculations.timelineMax} weeks
              </span>
            </div>
          </div>
          
          {/* Quick Stats Grid */}
          {selectedCategories.length > 0 && (
            <div className="grid grid-cols-2 gap-4 mt-6 pt-6 border-t border-border/50">
              <div className="text-center">
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Cost / {areaUnitLabel}</p>
                <p className="text-lg font-semibold text-foreground mt-1">
                  {formatCurrency(calculations.costPerSqmMin)} - {formatCurrency(calculations.costPerSqmMax)}
                </p>
              </div>
              <div className="text-center border-l border-border/50">
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Quality</p>
                <p className="text-lg font-semibold text-foreground mt-1 capitalize">{qualityLevel}</p>
              </div>
              <div className="text-center border-t border-border/50 pt-4">
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Areas Selected</p>
                <p className="text-lg font-semibold text-foreground mt-1">{selectedCategories.length} of 9</p>
              </div>
              <div className="text-center border-l border-t border-border/50 pt-4">
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Property</p>
                <p className="text-lg font-semibold text-foreground mt-1">{propertySize} {areaUnitLabel}</p>
              </div>
            </div>
          )}
        </div>
        
        {/* Visual Breakdown Bar */}
        {selectedCategories.length > 0 && calculations.totalMax > 0 && (
          <div className="px-6 pb-6">
            <p className="text-xs text-muted-foreground mb-2">Cost Allocation</p>
            <div className="h-3 rounded-full overflow-hidden bg-muted flex">
              <div 
                className="bg-primary transition-all duration-300" 
                style={{ width: `${breakdownBarData.renovation}%` }} 
              />
              <div 
                className="bg-primary/50 transition-all duration-300" 
                style={{ width: `${breakdownBarData.contingency}%` }} 
              />
              <div 
                className="bg-primary/30 transition-all duration-300" 
                style={{ width: `${breakdownBarData.other}%` }} 
              />
            </div>
            <div className="flex justify-between text-xs text-muted-foreground mt-2">
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-primary" />
                <span>Renovation</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-primary/50" />
                <span>Contingency</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-primary/30" />
                <span>Other</span>
              </div>
            </div>
          </div>
        )}
        
      </Card>

      {/* Cost Breakdown - Collapsible */}
      {selectedCategories.length > 0 && (
        <Collapsible open={isBreakdownOpen} onOpenChange={setIsBreakdownOpen}>
          <Card>
            <CollapsibleTrigger asChild>
              <CardHeader className="pb-3 cursor-pointer hover:bg-muted/30 transition-colors">
                <CardTitle className="text-base flex items-center justify-between">
                  Cost Breakdown
                  <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform", isBreakdownOpen && "rotate-180")} />
                </CardTitle>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="pt-0">
                <CashBreakdownTable items={breakdownItems} />
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>
      )}

      {/* Payment Schedule */}
      {selectedCategories.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              Typical Payment Schedule
              <Tooltip>
                <TooltipTrigger>
                  <HelpCircle className="h-4 w-4 text-muted-foreground" />
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

      {/* What's Included - Quality Level */}
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
    </div>
  );
  
  // Bottom section with insight card, educational content, CTAs, and feedback
  const bottomSection = (
    <div className="space-y-8">
      {/* 1. Interpret */}
      {renovationInsights.length > 0 && selectedCategories.length > 0 && (
        <InsightCard insights={renovationInsights} />
      )}
      
      {/* 2. Understand - Educational Collapsible */}
      <Collapsible open={isTipsOpen} onOpenChange={setIsTipsOpen}>
        <Card>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-muted/30 transition-colors">
              <CardTitle className="text-base flex items-center justify-between">
                Renovation Tips for Israel
                <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform", isTipsOpen && "rotate-180")} />
              </CardTitle>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="pt-0 space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="p-4 bg-muted/30 rounded-lg">
                  <h4 className="font-medium text-sm mb-2">Vetting Contractors</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Check for valid Tik 14 (business license)</li>
                    <li>• Ask for references from recent projects</li>
                    <li>• Get everything in writing (Hebrew contract standard)</li>
                    <li>• Verify insurance coverage</li>
                  </ul>
                </div>
                <div className="p-4 bg-muted/30 rounded-lg">
                  <h4 className="font-medium text-sm mb-2">Payment Best Practices</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Never pay more than 30% upfront</li>
                    <li>• Tie payments to completed milestones</li>
                    <li>• Hold 10-15% until final walkthrough</li>
                    <li>• Get receipts for all payments</li>
                  </ul>
                </div>
                <div className="p-4 bg-muted/30 rounded-lg">
                  <h4 className="font-medium text-sm mb-2">Timeline Considerations</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Factor in High Holidays (Sep-Oct delays)</li>
                    <li>• Passover/Sukkot can add 2-3 weeks</li>
                    <li>• August vacations slow everything down</li>
                    <li>• Material imports take 4-8 weeks</li>
                  </ul>
                </div>
                <div className="p-4 bg-muted/30 rounded-lg">
                  <h4 className="font-medium text-sm mb-2">Legal Requirements</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Balcony enclosures need municipal approval</li>
                    <li>• Structural changes require engineer sign-off</li>
                    <li>• 1-year warranty required by law</li>
                    <li>• VAT (18%) typically included in quotes</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* 3. Sources */}
      <SourceAttribution toolType="renovation" />

      {/* 4. Continue Exploring */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center gap-2">
          <div className="h-px flex-1 bg-border/60" />
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Continue exploring</span>
          <div className="h-px flex-1 bg-border/60" />
        </div>
        <div className="grid sm:grid-cols-3 gap-4">
          <Link to="/tools?tool=totalcost"><Card className="p-4 cursor-pointer hover:border-primary/50 transition-colors group h-full"><Calculator className="h-5 w-5 text-primary mb-2" /><h4 className="font-medium text-sm group-hover:text-primary transition-colors">True Cost Calculator</h4><p className="text-xs text-muted-foreground mt-1">Include renovation in your total purchase cost</p></Card></Link>
          <Link to="/tools?tool=affordability"><Card className="p-4 cursor-pointer hover:border-primary/50 transition-colors group h-full"><TrendingUp className="h-5 w-5 text-primary mb-2" /><h4 className="font-medium text-sm group-hover:text-primary transition-colors">Affordability Calculator</h4><p className="text-xs text-muted-foreground mt-1">See how much you can borrow for purchase + renovation</p></Card></Link>
          <Link to="/guides/new-vs-resale"><Card className="p-4 cursor-pointer hover:border-primary/50 transition-colors group h-full"><BookOpen className="h-5 w-5 text-primary mb-2" /><h4 className="font-medium text-sm group-hover:text-primary transition-colors">New vs Resale Guide</h4><p className="text-xs text-muted-foreground mt-1">Understand renovation implications</p></Card></Link>
        </div>
      </div>

      {/* 5. Disclaimer */}
      <ToolDisclaimer
        text="Cost estimates are for planning purposes only and based on average Israeli market rates. Always get multiple quotes from licensed contractors. Prices vary significantly by location (Tel Aviv typically 20-30% higher than peripheral areas), building age, and specific requirements."
      />

      {/* 6. Feedback */}
      <div className="text-center">
        <ToolFeedback toolName="renovation-estimator" variant="inline" />
      </div>
    </div>
  );

  return (
    <>
    <ToolLayout
      title="Renovation Cost Estimator"
      subtitle="Estimate renovation costs for Israeli properties — clearly and realistically."
      icon={<Hammer className="h-6 w-6" />}
      headerActions={headerActions}
      infoBanner={
        <InfoBanner variant="info">
          Prices based on CBS construction cost index and contractor market research (Q4 2024). Actual costs vary by location, contractor, and specific requirements.
        </InfoBanner>
      }
      leftColumn={leftColumn}
      rightColumn={rightColumn}
      bottomSection={bottomSection}
    />
    <SaveResultsPrompt
      show={showSavePrompt}
      calculatorName="renovation"
      onDismiss={dismissSavePrompt}
      resultSummary={`Estimated cost: ${formatCurrency(calculations.totalMin)}–${formatCurrency(calculations.totalMax)}`}
    />
    </>
  );
}
