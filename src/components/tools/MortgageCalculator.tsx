import { useState, useMemo } from 'react';
import { Calculator, Landmark, ChevronDown, ChevronUp, HelpCircle } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { 
  ToolLayout,
  CurrencyProvider,
  CurrencyToggle,
  useCurrency,
  ResultCard,
  CashBreakdownTable,
  ToolDisclaimer,
  InputSection,
  SliderInput,
  CTACard,
  InfoBanner,
  LTVIndicator,
} from './shared';
import { 
  calculateMortgagePayment, 
  calculateMultiTrackMortgage, 
  getMaxLTV, 
  stressTestMortgage,
  type TrackType 
} from '@/lib/calculations/mortgage';
import type { BuyerType } from '@/lib/calculations/purchaseTax';
import { calculatePurchaseTax } from '@/lib/calculations/purchaseTax';

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
  prime: 6.0,
  fixed_unlinked: 5.5,
  fixed_cpi: 3.5,
  variable_unlinked: 4.5,
  variable_cpi: 2.8,
  eligibility: 3.0,
};

const BUYER_TYPE_LABELS: Record<BuyerType, { label: string; maxLTV: number }> = {
  first_time: { label: 'First-Time Buyer', maxLTV: 75 },
  upgrader: { label: 'Upgrader', maxLTV: 70 },
  investor: { label: 'Investor', maxLTV: 50 },
  foreign: { label: 'Foreign Resident', maxLTV: 50 },
  oleh: { label: 'New Oleh', maxLTV: 75 },
  company: { label: 'Company', maxLTV: 50 },
};

function MortgageCalculatorContent() {
  const { formatCurrency } = useCurrency();
  
  // Core inputs
  const [propertyPrice, setPropertyPrice] = useState(2500000);
  const [downPaymentPercent, setDownPaymentPercent] = useState(30);
  const [downPaymentMode, setDownPaymentMode] = useState<'percent' | 'amount'>('percent');
  const [loanTerm, setLoanTerm] = useState(25);
  const [buyerType, setBuyerType] = useState<BuyerType>('first_time');
  
  // Track selection
  const [useMultiTrack, setUseMultiTrack] = useState(false);
  const [selectedTrack, setSelectedTrack] = useState<TrackType>('fixed_unlinked');
  const [interestRate, setInterestRate] = useState(DEFAULT_RATES.fixed_unlinked || 5.5);
  const [trackAllocations, setTrackAllocations] = useState<TrackAllocation[]>([
    { trackType: 'fixed_unlinked', percentage: 34, rate: 5.5 },
    { trackType: 'prime', percentage: 33, rate: 6.0 },
    { trackType: 'variable_cpi', percentage: 33, rate: 2.8 },
  ]);

  // Advanced assumptions
  const [showAssumptions, setShowAssumptions] = useState(false);
  const [includeTaxesAndFees, setIncludeTaxesAndFees] = useState(true);
  const [bankLegalFeesPercent, setBankLegalFeesPercent] = useState(2);
  const [appraisalFee, setAppraisalFee] = useState(3500);
  const [bufferReserve, setBufferReserve] = useState(50000);
  
  // Educational content
  const [showTrackInfo, setShowTrackInfo] = useState(false);

  // Derived values
  const buyerCategory = (buyerType === 'oleh' ? 'first_time' : buyerType === 'company' ? 'investor' : buyerType) as 'first_time' | 'upgrader' | 'investor' | 'foreign';
  const maxLTV = getMaxLTV(buyerCategory);
  const minDownPayment = 100 - (maxLTV * 100);

  const downPaymentAmount = useMemo(() => {
    return propertyPrice * downPaymentPercent / 100;
  }, [propertyPrice, downPaymentPercent]);

  const loanAmount = useMemo(() => {
    const effectiveDownPayment = Math.max(downPaymentPercent, minDownPayment);
    return propertyPrice * (1 - effectiveDownPayment / 100);
  }, [propertyPrice, downPaymentPercent, minDownPayment]);

  const ltv = useMemo(() => {
    return (loanAmount / propertyPrice) * 100;
  }, [loanAmount, propertyPrice]);

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
      };
    } else {
      const result = calculateMortgagePayment(loanAmount, interestRate, loanTerm);
      return {
        totalMonthlyPayment: result.monthlyPayment,
        totalPayment: result.totalPayment,
        totalInterest: result.totalInterest,
      };
    }
  }, [loanAmount, loanTerm, useMultiTrack, trackAllocations, interestRate]);

  const stressTest = useMemo(() => {
    return stressTestMortgage(loanAmount, interestRate, loanTerm, 2);
  }, [loanAmount, interestRate, loanTerm]);

  // Purchase tax estimate
  const purchaseTaxResult = useMemo(() => {
    return calculatePurchaseTax(propertyPrice, buyerType);
  }, [propertyPrice, buyerType]);
  const purchaseTaxAmount = purchaseTaxResult.totalTax;

  // Total cash needed
  const bankLegalFees = (loanAmount * bankLegalFeesPercent) / 100;
  const totalCashNeeded = downPaymentAmount + (includeTaxesAndFees ? (purchaseTaxAmount + bankLegalFees + appraisalFee + bufferReserve) : 0);

  const updateTrackAllocation = (index: number, field: 'percentage' | 'rate', value: number) => {
    const newAllocations = [...trackAllocations];
    newAllocations[index] = { ...newAllocations[index], [field]: value };
    setTrackAllocations(newAllocations);
  };

  const totalAllocation = trackAllocations.reduce((sum, t) => sum + t.percentage, 0);

  // Handle buyer type change
  const handleBuyerTypeChange = (newType: BuyerType) => {
    setBuyerType(newType);
    const newMaxLTV = getMaxLTV(newType as any);
    if (downPaymentPercent < 100 - newMaxLTV) {
      setDownPaymentPercent(100 - newMaxLTV);
    }
  };

  const cashBreakdownItems = [
    { 
      label: 'Down Payment', 
      value: formatCurrency(downPaymentAmount),
      percentage: `${downPaymentPercent}%`,
    },
    ...(includeTaxesAndFees ? [
      { 
        label: 'Est. Purchase Tax', 
        value: formatCurrency(purchaseTaxAmount),
        percentage: `${((purchaseTaxAmount / propertyPrice) * 100).toFixed(1)}%`,
        tooltip: 'Based on your buyer type and property price',
      },
      { 
        label: 'Bank + Legal Fees', 
        value: formatCurrency(bankLegalFees),
        percentage: `${bankLegalFeesPercent}%`,
      },
      { 
        label: 'Appraisal Fee', 
        value: formatCurrency(appraisalFee),
      },
      { 
        label: 'Buffer/Reserve', 
        value: formatCurrency(bufferReserve),
        tooltip: 'Recommended emergency fund for unexpected costs',
      },
    ] : []),
    { label: '', value: '', isSeparator: true },
    { 
      label: 'Total Cash Needed', 
      value: formatCurrency(totalCashNeeded),
      isTotal: true,
    },
  ];

  const leftColumn = (
    <div className="space-y-8">
      {/* Currency Toggle */}
      <div className="flex justify-end">
        <CurrencyToggle />
      </div>

      {/* Mortgage Basics Section */}
      <div className="space-y-6">
        <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
          <Calculator className="h-5 w-5 text-primary" />
          Mortgage Basics
        </h2>

        <SliderInput
          label="Property Price"
          value={propertyPrice}
          onChange={setPropertyPrice}
          min={500000}
          max={20000000}
          step={50000}
          formatValue={formatCurrency}
        />

        <InputSection label="Buyer Profile" tooltip="Bank of Israel limits maximum loan-to-value based on buyer type">
          <Select value={buyerType} onValueChange={(v) => handleBuyerTypeChange(v as BuyerType)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(BUYER_TYPE_LABELS).map(([key, info]) => (
                <SelectItem key={key} value={key}>
                  {info.label} (max {info.maxLTV}% LTV)
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-primary">Min {minDownPayment.toFixed(0)}% down for {BUYER_TYPE_LABELS[buyerType].label}</p>
        </InputSection>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium text-foreground">Down Payment</Label>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setDownPaymentMode('percent')}
                className={`px-2 py-1 text-xs rounded ${downPaymentMode === 'percent' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}
              >
                %
              </button>
              <button
                onClick={() => setDownPaymentMode('amount')}
                className={`px-2 py-1 text-xs rounded ${downPaymentMode === 'amount' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}
              >
                ₪
              </button>
            </div>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">{downPaymentPercent}%</span>
            <span className="font-semibold">{formatCurrency(downPaymentAmount)}</span>
          </div>
          <Slider
            value={[downPaymentPercent]}
            onValueChange={([v]) => setDownPaymentPercent(Math.max(v, minDownPayment))}
            min={minDownPayment}
            max={80}
            step={1}
          />
        </div>

        <SliderInput
          label="Loan Term"
          value={loanTerm}
          onChange={setLoanTerm}
          min={5}
          max={30}
          step={1}
          formatValue={(v) => `${v} years`}
        />
      </div>

      {/* Mortgage Track Section */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">Mortgage Track</h2>
          <div className="flex items-center gap-2">
            <Label htmlFor="multi-track" className="text-sm text-muted-foreground">Multi-Track</Label>
            <Switch id="multi-track" checked={useMultiTrack} onCheckedChange={setUseMultiTrack} />
          </div>
        </div>

        {!useMultiTrack ? (
          <div className="space-y-4">
            <InputSection label="Mortgage Track (מסלול)">
              <Select value={selectedTrack} onValueChange={(v) => {
                setSelectedTrack(v as TrackType);
                setInterestRate(DEFAULT_RATES[v as TrackType] || 5.5);
              }}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(TRACK_INFO).map(([key, info]) => (
                    <SelectItem key={key} value={key}>
                      {info?.name} ({info?.hebrewName})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {TRACK_INFO[selectedTrack]?.description} • Risk: {TRACK_INFO[selectedTrack]?.riskLevel}
              </p>
            </InputSection>

            <SliderInput
              label="Interest Rate"
              value={interestRate}
              onChange={setInterestRate}
              min={1}
              max={10}
              step={0.1}
              formatValue={(v) => `${v.toFixed(1)}%`}
            />
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Track Mix (תמהיל)</Label>
              {totalAllocation !== 100 && (
                <Badge variant="destructive" className="text-xs">Total: {totalAllocation}%</Badge>
              )}
            </div>
            {trackAllocations.map((track, idx) => (
              <div key={idx} className="p-4 rounded-xl bg-muted/50 border border-border space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-foreground">{TRACK_INFO[track.trackType]?.name}</span>
                  <Badge variant="outline">{track.percentage}%</Badge>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">Allocation</Label>
                    <Slider
                      value={[track.percentage]}
                      onValueChange={([v]) => updateTrackAllocation(idx, 'percentage', v)}
                      min={0}
                      max={100}
                      step={1}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">Rate: {track.rate}%</Label>
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

      {/* Edit Assumptions Collapsible */}
      <Collapsible open={showAssumptions} onOpenChange={setShowAssumptions}>
        <CollapsibleTrigger asChild>
          <Button variant="ghost" className="w-full justify-between h-12 px-4 bg-muted/30 hover:bg-muted/50">
            <span className="font-medium">Edit Assumptions</span>
            {showAssumptions ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-4 pt-4 px-1">
          <div className="flex items-center justify-between">
            <Label className="text-sm">Include taxes + fees in total</Label>
            <Switch checked={includeTaxesAndFees} onCheckedChange={setIncludeTaxesAndFees} />
          </div>
          
          {includeTaxesAndFees && (
            <>
              <SliderInput
                label="Bank + Legal Fees"
                value={bankLegalFeesPercent}
                onChange={setBankLegalFeesPercent}
                min={0.5}
                max={4}
                step={0.1}
                formatValue={(v) => `${v}% (${formatCurrency(loanAmount * v / 100)})`}
              />
              
              <SliderInput
                label="Appraisal Fee"
                value={appraisalFee}
                onChange={setAppraisalFee}
                min={2000}
                max={8000}
                step={500}
                formatValue={formatCurrency}
              />
              
              <SliderInput
                label="Buffer/Reserve"
                value={bufferReserve}
                onChange={setBufferReserve}
                min={0}
                max={200000}
                step={10000}
                formatValue={formatCurrency}
                tooltip="Emergency fund for unexpected costs during the purchase process"
              />
            </>
          )}
        </CollapsibleContent>
      </Collapsible>

      {/* Educational Content */}
      <Collapsible open={showTrackInfo} onOpenChange={setShowTrackInfo}>
        <CollapsibleTrigger asChild>
          <Button variant="ghost" className="w-full justify-between h-12 px-4 bg-muted/30 hover:bg-muted/50">
            <span className="font-medium flex items-center gap-2">
              <HelpCircle className="h-4 w-4" />
              How Mortgage Tracks Affect Your Payment
            </span>
            {showTrackInfo ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="pt-4 px-1">
          <div className="space-y-4 p-4 rounded-xl bg-muted/30 border border-border">
            <div className="space-y-3">
              <h4 className="font-semibold text-foreground">Israeli Mortgage Tracks Explained</h4>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p><strong className="text-foreground">Fixed Non-Linked:</strong> Predictable payments, no inflation risk. Best for stability seekers.</p>
                <p><strong className="text-foreground">Prime:</strong> Variable rate tied to BOI base rate. Can go up or down.</p>
                <p><strong className="text-foreground">CPI-Linked:</strong> Lower rate but payments adjust with inflation.</p>
              </div>
            </div>
            <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
              <p className="text-sm text-foreground">
                <strong>Rule of Thumb:</strong> Max ⅓ in variable tracks (Prime), max ⅓ in CPI-linked. 
                The rest should be fixed for stability.
              </p>
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );

  const rightColumn = (
    <div className="space-y-4">
      {/* Main Result */}
      <ResultCard
        label="Monthly Mortgage Payment"
        value={formatCurrency(calculations.totalMonthlyPayment)}
        sublabel={`Over ${loanTerm} years at ${interestRate}%`}
        variant="primary"
        size="lg"
      />

      {/* Loan Details */}
      <div className="grid grid-cols-2 gap-3">
        <ResultCard
          label="Loan Amount"
          value={formatCurrency(loanAmount)}
          size="sm"
          variant="muted"
        />
        <ResultCard
          label="Total Interest"
          value={formatCurrency(calculations.totalInterest)}
          size="sm"
          variant="muted"
          badge={{ text: `+${((calculations.totalInterest / loanAmount) * 100).toFixed(0)}%`, variant: 'warning' }}
        />
      </div>

      {/* LTV Indicator */}
      <div className="p-4 rounded-xl border border-border bg-card">
        <LTVIndicator ltv={ltv} maxLTV={maxLTV * 100} />
      </div>

      {/* Stress Test Alert */}
      <div className="p-4 rounded-xl bg-warning/10 border border-warning/30">
        <div className="flex items-start gap-3">
          <span className="text-warning-foreground text-lg">⚠️</span>
          <div>
            <p className="font-medium text-foreground text-sm">BOI Stress Test (+2%)</p>
            <p className="text-sm text-muted-foreground mt-1">
              If rates rise 2%, payment becomes {formatCurrency(stressTest.stressedPayment)}{' '}
              <span className="text-destructive">(+{formatCurrency(stressTest.increase)}/mo)</span>
            </p>
          </div>
        </div>
      </div>

      {/* Cash Breakdown */}
      <CashBreakdownTable
        title="Total Cash Needed to Close"
        items={cashBreakdownItems}
      />

      {/* CTA */}
      <CTACard
        title="Get Mortgage Guidance"
        description="Connect with an English-speaking mortgage advisor who specializes in olim"
        buttonText="Find an Advisor"
        buttonLink="/guides"
        icon={<Landmark className="h-5 w-5" />}
        trustMessage="Free consultation • No obligation"
        variant="primary"
      />
    </div>
  );

  const infoBanner = (
    <InfoBanner variant="info">
      <span>
        <strong>Israeli mortgages work differently.</strong> Banks offer 6 track types with different risk profiles. 
        Most buyers use a mix of 2-3 tracks for optimal balance.
      </span>
    </InfoBanner>
  );

  const disclaimer = (
    <ToolDisclaimer 
      text="This calculator provides estimates for informational purposes only. Actual mortgage rates, terms, and eligibility depend on your personal financial situation and the lender. Bank of Israel regulations may change. Consult with a licensed mortgage advisor for personalized advice."
    />
  );

  return (
    <ToolLayout
      title="Mortgage Calculator"
      subtitle="Calculate payments across all Israeli mortgage track types"
      icon={<Calculator className="h-6 w-6" />}
      infoBanner={infoBanner}
      leftColumn={leftColumn}
      rightColumn={rightColumn}
      disclaimer={disclaimer}
    />
  );
}

export function MortgageCalculator() {
  return (
    <CurrencyProvider>
      <MortgageCalculatorContent />
    </CurrencyProvider>
  );
}
