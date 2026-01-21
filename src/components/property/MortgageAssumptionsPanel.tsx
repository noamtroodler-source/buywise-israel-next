import { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp, Info, Save, LogIn } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useMortgagePreferences, MortgagePreferences, MortgageEstimate } from '@/hooks/useMortgagePreferences';
import { useFormatPrice } from '@/contexts/PreferencesContext';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface MortgageAssumptionsPanelProps {
  propertyPrice: number;
  currency?: string;
  onEstimateChange?: (estimate: MortgageEstimate) => void;
  className?: string;
}

const TERM_OPTIONS = [15, 20, 25, 30];

export function MortgageAssumptionsPanel({
  propertyPrice,
  currency = 'ILS',
  onEstimateChange,
  className,
}: MortgageAssumptionsPanelProps) {
  const formatPrice = useFormatPrice();
  const { 
    preferences, 
    savePreferences, 
    getEstimate, 
    ltvLimit, 
    buyerCategory,
    isLoggedIn,
    isSaving,
  } = useMortgagePreferences();
  
  const [isOpen, setIsOpen] = useState(false);
  const [inputMode, setInputMode] = useState<'percent' | 'amount'>(
    preferences.down_payment_amount !== null ? 'amount' : 'percent'
  );
  
  // Local form state
  const [downPaymentPercent, setDownPaymentPercent] = useState<string>(
    preferences.down_payment_percent?.toString() || ''
  );
  const [downPaymentAmount, setDownPaymentAmount] = useState<string>(
    preferences.down_payment_amount?.toString() || ''
  );
  const [termYears, setTermYears] = useState<number>(preferences.term_years);
  
  // Sync form state when preferences change
  useEffect(() => {
    if (preferences.down_payment_percent !== null) {
      setDownPaymentPercent(preferences.down_payment_percent.toString());
    }
    if (preferences.down_payment_amount !== null) {
      setDownPaymentAmount(preferences.down_payment_amount.toString());
    }
    setTermYears(preferences.term_years);
  }, [preferences]);
  
  // Calculate current estimate
  const estimate = getEstimate(propertyPrice);
  
  // Notify parent of estimate changes
  useEffect(() => {
    onEstimateChange?.(estimate);
  }, [estimate, onEstimateChange]);
  
  // Format buyer category label
  const getCategoryLabel = (category: string): string => {
    switch (category) {
      case 'first_time': return 'First-Time Buyer';
      case 'oleh': return 'Oleh Hadash';
      case 'additional': return 'Investor';
      case 'non_resident': return 'Non-Resident';
      default: return 'First-Time Buyer';
    }
  };
  
  // Handle save
  const handleSave = () => {
    const newPrefs: Partial<MortgagePreferences> = {
      term_years: termYears,
    };
    
    if (inputMode === 'percent') {
      const percent = parseFloat(downPaymentPercent);
      newPrefs.down_payment_percent = isNaN(percent) ? null : percent;
      newPrefs.down_payment_amount = null;
    } else {
      const amount = parseFloat(downPaymentAmount.replace(/,/g, ''));
      newPrefs.down_payment_amount = isNaN(amount) ? null : amount;
      newPrefs.down_payment_percent = null;
    }
    
    savePreferences(newPrefs);
  };
  
  // Calculate min down payment based on LTV
  const minDownPaymentPercent = 100 - ltvLimit;
  const minDownPaymentAmount = propertyPrice * (minDownPaymentPercent / 100);
  
  return (
    <TooltipProvider>
      <Collapsible open={isOpen} onOpenChange={setIsOpen} className={className}>
        <CollapsibleTrigger asChild>
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-7 gap-1.5 text-xs text-muted-foreground hover:text-foreground"
          >
            Personalize
            {isOpen ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          </Button>
        </CollapsibleTrigger>
        
        <CollapsibleContent className="mt-3">
          <div className="p-4 rounded-xl bg-muted/30 border border-border/50 space-y-4">
            <div className="flex items-center justify-between">
              <h5 className="text-sm font-medium flex items-center gap-2">
                🏦 Your Mortgage Assumptions
              </h5>
              <Badge variant="outline" className="text-xs">
                {getCategoryLabel(buyerCategory)}
              </Badge>
            </div>
            
            {/* Down Payment */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm">Down Payment</Label>
                <div className="flex gap-1">
                  <Button
                    variant={inputMode === 'amount' ? 'secondary' : 'ghost'}
                    size="sm"
                    className="h-6 text-xs px-2"
                    onClick={() => setInputMode('amount')}
                  >
                    ₪ Amount
                  </Button>
                  <Button
                    variant={inputMode === 'percent' ? 'secondary' : 'ghost'}
                    size="sm"
                    className="h-6 text-xs px-2"
                    onClick={() => setInputMode('percent')}
                  >
                    % of price
                  </Button>
                </div>
              </div>
              
              {inputMode === 'amount' ? (
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">₪</span>
                  <Input
                    type="text"
                    value={downPaymentAmount}
                    onChange={(e) => setDownPaymentAmount(e.target.value.replace(/[^0-9,]/g, ''))}
                    placeholder={Math.round(minDownPaymentAmount).toLocaleString()}
                    className="pl-7"
                  />
                </div>
              ) : (
                <div className="relative">
                  <Input
                    type="number"
                    value={downPaymentPercent}
                    onChange={(e) => setDownPaymentPercent(e.target.value)}
                    placeholder={minDownPaymentPercent.toString()}
                    min={minDownPaymentPercent}
                    max={100}
                    className="pr-7"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">%</span>
                </div>
              )}
              
              <p className="text-xs text-muted-foreground">
                Min {minDownPaymentPercent}% ({formatPrice(minDownPaymentAmount, 'ILS')}) based on your LTV limit
              </p>
            </div>
            
            {/* Loan Term */}
            <div className="space-y-2">
              <Label className="text-sm">Loan Term</Label>
              <Select
                value={termYears.toString()}
                onValueChange={(v) => setTermYears(parseInt(v))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TERM_OPTIONS.map((years) => (
                    <SelectItem key={years} value={years.toString()}>
                      {years} years
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {/* LTV Info */}
            <div className="flex items-start gap-2 p-2 rounded-lg bg-background/50 text-xs">
              <Info className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" />
              <div>
                <span className="font-medium">Your max LTV: {ltvLimit}%</span>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="text-muted-foreground ml-1 cursor-help border-b border-dotted border-muted-foreground/50">
                      (Bank of Israel limit)
                    </span>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p>Bank of Israel sets LTV limits by buyer type: 75% for first-time buyers, 70% for upgraders, 50% for investors and non-residents.</p>
                  </TooltipContent>
                </Tooltip>
              </div>
            </div>
            
            {/* Save Button */}
            <div className="flex items-center justify-between pt-2">
              {isLoggedIn ? (
                <Button 
                  size="sm" 
                  onClick={handleSave}
                  disabled={isSaving}
                  className="gap-1.5"
                >
                  <Save className="h-3.5 w-3.5" />
                  {isSaving ? 'Saving...' : 'Save to Profile'}
                </Button>
              ) : (
                <div className="flex items-center gap-2">
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={handleSave}
                    disabled={isSaving}
                  >
                    Save Locally
                  </Button>
                  <Link to="/auth?tab=signup">
                    <Button size="sm" variant="default" className="gap-1.5">
                      <LogIn className="h-3.5 w-3.5" />
                      Sign Up to Save
                    </Button>
                  </Link>
                </div>
              )}
              
              <span className="text-xs text-muted-foreground">
                Rate: 4.5%–6.0% range
              </span>
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </TooltipProvider>
  );
}
