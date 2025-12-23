import { useState, useMemo } from 'react';
import { Calculator, TrendingUp, Info, AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Button } from '@/components/ui/button';
import { 
  calculateMortgagePayment, 
  calculateMultiTrackMortgage, 
  getMaxLTV, 
  stressTestMortgage,
  type TrackType 
} from '@/lib/calculations/mortgage';
import type { BuyerType } from '@/lib/calculations/purchaseTax';

interface TrackAllocation {
  trackType: TrackType;
  percentage: number;
  rate: number;
}

const TRACK_INFO: Partial<Record<TrackType, { name: string; hebrewName: string; description: string; riskLevel: string }>> = {
  prime: { name: 'Prime (Variable)', hebrewName: 'פריים', description: 'Tied to Bank of Israel rate + bank margin', riskLevel: 'Medium-High' },
  fixed_unlinked: { name: 'Fixed Non-Linked', hebrewName: 'קבועה לא צמודה', description: 'Fixed rate, not linked to CPI', riskLevel: 'Low' },
  fixed_cpi: { name: 'Fixed CPI-Linked', hebrewName: 'קבועה צמודה', description: 'Fixed rate + CPI adjustment', riskLevel: 'Medium' },
  variable_unlinked: { name: 'Variable Non-Linked', hebrewName: 'משתנה לא צמודה', description: 'Rate changes every 5 years', riskLevel: 'Medium' },
  variable_cpi: { name: 'Variable CPI-Linked', hebrewName: 'משתנה צמודה', description: 'Variable rate + CPI adjustment', riskLevel: 'High' },
  eligibility: { name: 'Eligibility Loan', hebrewName: 'הלוואת זכאות', description: 'Government subsidized for eligible buyers', riskLevel: 'Low' },
};

const DEFAULT_RATES: Partial<Record<TrackType, number>> = {
  prime: 6.0, // Prime + 1.5%
  fixed_unlinked: 5.5,
  fixed_cpi: 3.5,
  variable_unlinked: 4.5,
  variable_cpi: 2.8,
  eligibility: 3.0,
};

export function MortgageCalculator() {
  const [propertyPrice, setPropertyPrice] = useState(2500000);
  const [downPaymentPercent, setDownPaymentPercent] = useState(25);
  const [loanTerm, setLoanTerm] = useState(25);
  const [buyerType, setBuyerType] = useState<BuyerType>('first_time');
  const [useMultiTrack, setUseMultiTrack] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [hasForeignIncome, setHasForeignIncome] = useState(false);
  const [foreignIncomePercent, setForeignIncomePercent] = useState(0);
  const [foreignCurrency, setForeignCurrency] = useState<'USD' | 'EUR' | 'GBP'>('USD');

  // Single track mode
  const [selectedTrack, setSelectedTrack] = useState<TrackType>('fixed_unlinked');
  const [interestRate, setInterestRate] = useState(DEFAULT_RATES.fixed_unlinked);

  // Multi-track mode
  const [trackAllocations, setTrackAllocations] = useState<TrackAllocation[]>([
    { trackType: 'fixed_unlinked', percentage: 34, rate: 5.5 },
    { trackType: 'prime', percentage: 33, rate: 6.0 },
    { trackType: 'variable_cpi', percentage: 33, rate: 2.8 },
  ]);

  const buyerCategory = (buyerType === 'oleh' ? 'first_time' : buyerType === 'company' ? 'investor' : buyerType) as 'first_time' | 'upgrader' | 'investor' | 'foreign';
  const maxLTV = getMaxLTV(buyerCategory);
  const minDownPayment = 100 - (maxLTV * 100);

  const loanAmount = useMemo(() => {
    const effectiveDownPayment = Math.max(downPaymentPercent, minDownPayment);
    return propertyPrice * (1 - effectiveDownPayment / 100);
  }, [propertyPrice, downPaymentPercent, minDownPayment]);

  const calculations = useMemo(() => {
    if (useMultiTrack) {
      const tracks = trackAllocations.map(alloc => ({
        type: alloc.trackType,
        principal: Math.round(loanAmount * alloc.percentage / 100),
        interestRate: alloc.rate,
        termYears: loanTerm,
        isCpiLinked: alloc.trackType.includes('cpi') || alloc.trackType.includes('linked'),
      }));
      const multiResult = calculateMultiTrackMortgage(tracks);
      return {
        totalMonthlyPayment: multiResult.totalMonthlyPayment,
        totalPayment: multiResult.totalPayment,
        totalInterest: multiResult.totalInterest,
        trackDetails: multiResult.trackBreakdown.map(b => ({
          trackType: b.track.type,
          monthlyPayment: b.monthlyPayment,
          totalPayment: b.totalPayment,
          totalInterest: b.totalInterest,
          loanPortion: b.track.principal,
        })),
      };
    } else {
      const result = calculateMortgagePayment(loanAmount, interestRate, loanTerm);
      return {
        totalMonthlyPayment: result.monthlyPayment,
        totalPayment: result.totalPayment,
        totalInterest: result.totalInterest,
        trackDetails: [{ 
          trackType: selectedTrack, 
          ...result, 
          loanPortion: loanAmount 
        }],
      };
    }
  }, [loanAmount, loanTerm, useMultiTrack, trackAllocations, interestRate, selectedTrack]);

  const stressTest = useMemo(() => {
    return stressTestMortgage(loanAmount, interestRate, loanTerm, 2);
  }, [loanAmount, interestRate, loanTerm]);

  // Foreign income discount calculation
  const foreignIncomeImpact = useMemo(() => {
    if (!hasForeignIncome || foreignIncomePercent === 0) return null;
    
    const discountRates: Record<string, number> = { USD: 0.85, EUR: 0.80, GBP: 0.85 };
    const effectiveIncome = foreignIncomePercent * (discountRates[foreignCurrency] || 0.80);
    const incomeReduction = foreignIncomePercent - effectiveIncome;
    
    return {
      originalPercent: foreignIncomePercent,
      effectivePercent: effectiveIncome,
      reductionPercent: incomeReduction,
      discountApplied: discountRates[foreignCurrency] * 100,
    };
  }, [hasForeignIncome, foreignIncomePercent, foreignCurrency]);

  const updateTrackAllocation = (index: number, field: 'percentage' | 'rate', value: number) => {
    const newAllocations = [...trackAllocations];
    newAllocations[index] = { ...newAllocations[index], [field]: value };
    setTrackAllocations(newAllocations);
  };

  const totalAllocation = trackAllocations.reduce((sum, t) => sum + t.percentage, 0);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('he-IL', {
      style: 'currency',
      currency: 'ILS',
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calculator className="h-5 w-5 text-primary" />
          Israeli Mortgage Calculator (מחשבון משכנתא)
        </CardTitle>
        <CardDescription>
          Calculate payments across all 6 mortgage track types with multi-track simulation and BOI stress testing
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Basic Inputs */}
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-5">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="propertyPrice">Property Price</Label>
                <span className="text-sm font-medium">{formatCurrency(propertyPrice)}</span>
              </div>
              <Slider
                value={[propertyPrice]}
                onValueChange={([v]) => setPropertyPrice(v)}
                min={500000}
                max={20000000}
                step={50000}
              />
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Buyer Type</Label>
              </div>
              <Select value={buyerType} onValueChange={(v) => {
                setBuyerType(v as BuyerType);
                const newMaxLTV = getMaxLTV(v as BuyerType);
                if (downPaymentPercent < 100 - newMaxLTV) {
                  setDownPaymentPercent(100 - newMaxLTV);
                }
              }}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="first_time">First-Time Buyer (max 75% LTV)</SelectItem>
                  <SelectItem value="upgrader">Upgrader (max 70% LTV)</SelectItem>
                  <SelectItem value="investor">Investor (max 50% LTV)</SelectItem>
                  <SelectItem value="foreign">Foreign Resident (max 50% LTV)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1">
                  <Label>Down Payment</Label>
                  <Tooltip>
                    <TooltipTrigger>
                      <Info className="h-3.5 w-3.5 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      Bank of Israel limits: {maxLTV}% max LTV for {buyerType.replace('_', ' ')} buyers
                    </TooltipContent>
                  </Tooltip>
                </div>
                <span className="text-sm font-medium">{downPaymentPercent}% ({formatCurrency(propertyPrice * downPaymentPercent / 100)})</span>
              </div>
              <Slider
                value={[downPaymentPercent]}
                onValueChange={([v]) => setDownPaymentPercent(Math.max(v, minDownPayment))}
                min={minDownPayment}
                max={80}
                step={1}
              />
              {downPaymentPercent === minDownPayment && (
                <p className="text-xs text-amber-600">Minimum down payment for {buyerType.replace('_', ' ')} buyers</p>
              )}
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Loan Term</Label>
                <span className="text-sm font-medium">{loanTerm} years</span>
              </div>
              <Slider
                value={[loanTerm]}
                onValueChange={([v]) => setLoanTerm(v)}
                min={5}
                max={30}
                step={1}
              />
            </div>
          </div>

          {/* Track Selection */}
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Label>Multi-Track Mortgage</Label>
                <Badge variant="outline" className="text-xs">Recommended</Badge>
              </div>
              <Switch checked={useMultiTrack} onCheckedChange={setUseMultiTrack} />
            </div>

            {!useMultiTrack ? (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Mortgage Track (מסלול)</Label>
                  <Select value={selectedTrack} onValueChange={(v) => {
                    setSelectedTrack(v as TrackType);
                    setInterestRate(DEFAULT_RATES[v as TrackType]);
                  }}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(TRACK_INFO).map(([key, info]) => (
                        <SelectItem key={key} value={key}>
                          {info.name} ({info.hebrewName})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    {TRACK_INFO[selectedTrack].description} • Risk: {TRACK_INFO[selectedTrack].riskLevel}
                  </p>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>Interest Rate</Label>
                    <span className="text-sm font-medium">{interestRate}%</span>
                  </div>
                  <Slider
                    value={[interestRate]}
                    onValueChange={([v]) => setInterestRate(v)}
                    min={1}
                    max={10}
                    step={0.1}
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Track Mix (תמהיל)</Label>
                  {totalAllocation !== 100 && (
                    <Badge variant="destructive">Total: {totalAllocation}%</Badge>
                  )}
                </div>
                {trackAllocations.map((track, idx) => (
                  <div key={idx} className="p-3 rounded-lg bg-muted/50 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{TRACK_INFO[track.trackType].name}</span>
                      <Badge variant="outline">{track.percentage}%</Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label className="text-xs">Allocation</Label>
                        <Slider
                          value={[track.percentage]}
                          onValueChange={([v]) => updateTrackAllocation(idx, 'percentage', v)}
                          min={0}
                          max={100}
                          step={1}
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Rate: {track.rate}%</Label>
                        <Slider
                          value={[track.rate]}
                          onValueChange={([v]) => updateTrackAllocation(idx, 'rate', v)}
                          min={1}
                          max={10}
                          step={0.1}
                        />
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Portion: {formatCurrency(loanAmount * track.percentage / 100)} • 
                      Payment: {formatCurrency(calculateMortgagePayment(loanAmount * track.percentage / 100, track.rate, loanTerm).monthlyPayment)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Results */}
        <div className="pt-4 border-t border-border space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-lg bg-primary/10">
              <p className="text-sm text-muted-foreground">Monthly Payment</p>
              <p className="text-2xl font-bold text-primary">
                {formatCurrency(calculations.totalMonthlyPayment)}
              </p>
            </div>
            <div className="p-4 rounded-lg bg-muted">
              <p className="text-sm text-muted-foreground">Loan Amount</p>
              <p className="text-2xl font-bold text-foreground">
                {formatCurrency(loanAmount)}
              </p>
            </div>
            <div className="p-3 rounded-lg bg-muted/50">
              <p className="text-xs text-muted-foreground">Total Payment</p>
              <p className="text-lg font-semibold">{formatCurrency(calculations.totalPayment)}</p>
            </div>
            <div className="p-3 rounded-lg bg-muted/50">
              <p className="text-xs text-muted-foreground">Total Interest</p>
              <p className="text-lg font-semibold text-destructive">
                {formatCurrency(calculations.totalInterest)}
              </p>
            </div>
          </div>

          {/* BOI Stress Test */}
          <Alert variant="default" className="bg-amber-50 border-amber-200">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            <AlertDescription className="text-amber-800 text-sm">
              <strong>BOI Stress Test (+2%):</strong> If rates increase by 2%, your payment would be {formatCurrency(stressTest.stressedPayment)} 
              ({stressTest.increase > 0 ? '+' : ''}{formatCurrency(stressTest.increase)}/month, +{stressTest.increasePercent.toFixed(1)}%)
            </AlertDescription>
          </Alert>

          {/* Advanced Options */}
          <Collapsible open={showAdvanced} onOpenChange={setShowAdvanced}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" className="w-full justify-between">
                Advanced Options
                {showAdvanced ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-4 pt-4">
              <div className="flex items-center justify-between">
                <Label>Foreign Income (הכנסה מחו"ל)</Label>
                <Switch checked={hasForeignIncome} onCheckedChange={setHasForeignIncome} />
              </div>

              {hasForeignIncome && (
                <div className="space-y-4 p-4 rounded-lg bg-muted/50">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>% of Income from Abroad</Label>
                      <Input
                        type="number"
                        value={foreignIncomePercent}
                        onChange={(e) => setForeignIncomePercent(Number(e.target.value))}
                        min={0}
                        max={100}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Currency</Label>
                      <Select value={foreignCurrency} onValueChange={(v) => setForeignCurrency(v as typeof foreignCurrency)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="USD">USD (85% counted)</SelectItem>
                          <SelectItem value="EUR">EUR (80% counted)</SelectItem>
                          <SelectItem value="GBP">GBP (85% counted)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  {foreignIncomeImpact && (
                    <Alert>
                      <Info className="h-4 w-4" />
                      <AlertDescription className="text-sm">
                        Banks count only {foreignIncomeImpact.discountApplied}% of your {foreignCurrency} income. 
                        Your {foreignIncomeImpact.originalPercent}% foreign income is treated as {foreignIncomeImpact.effectivePercent.toFixed(1)}% for qualification.
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              )}

              <div className="p-4 rounded-lg border">
                <h4 className="font-semibold mb-3">BOI Regulations Summary</h4>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <p>• Max LTV: {maxLTV}% for {buyerType.replace('_', ' ')} buyers</p>
                  <p>• Max PTI: 40% of net monthly income</p>
                  <p>• Max term: 30 years</p>
                  <p>• Variable portion limit: ⅓ for CPI-linked, ⅓ for Prime</p>
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>
        </div>
      </CardContent>
    </Card>
  );
}
