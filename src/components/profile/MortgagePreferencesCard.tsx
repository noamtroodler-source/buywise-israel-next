import { useState } from 'react';
import { Home, Edit3, DollarSign, Calendar, TrendingUp, Info, Percent, Banknote } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Toggle } from '@/components/ui/toggle';
import { Loader2 } from 'lucide-react';
import { useMortgagePreferences } from '@/hooks/useMortgagePreferences';
import { useBuyerProfile, getEffectiveBuyerType } from '@/hooks/useBuyerProfile';
import { cn } from '@/lib/utils';

const LOAN_TERMS = [15, 20, 25, 30];

interface StatItemProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  subValue?: string;
}

function StatItem({ icon, label, value, subValue }: StatItemProps) {
  return (
    <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/40">
      <div className="text-muted-foreground flex-shrink-0 mt-0.5">{icon}</div>
      <div className="min-w-0 flex-1">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="font-medium text-foreground truncate">{value}</p>
        {subValue && <p className="text-xs text-muted-foreground">{subValue}</p>}
      </div>
    </div>
  );
}

export function MortgagePreferencesCard() {
  const { data: buyerProfile, isLoading: profileLoading } = useBuyerProfile();
  const { preferences, savePreferences, isLoggedIn, hasCustomPreferences, isSaving, ltvLimit, buyerCategory } = useMortgagePreferences();
  
  const [isEditing, setIsEditing] = useState(false);
  const [downPaymentMode, setDownPaymentMode] = useState<'percent' | 'amount'>(
    preferences.down_payment_amount ? 'amount' : 'percent'
  );
  const [amountCurrency, setAmountCurrency] = useState<'ILS' | 'USD'>('ILS');
  const [formData, setFormData] = useState({
    down_payment_percent: preferences.down_payment_percent ?? 25,
    down_payment_amount: preferences.down_payment_amount ?? null,
    term_years: preferences.term_years ?? 25,
    monthly_income: preferences.monthly_income ?? null,
    income_type: preferences.income_type ?? 'net' as 'net' | 'gross',
  });
  
  const currencySymbol = amountCurrency === 'USD' ? '$' : '₪';

  const handleEdit = () => {
    setFormData({
      down_payment_percent: preferences.down_payment_percent ?? 25,
      down_payment_amount: preferences.down_payment_amount ?? null,
      term_years: preferences.term_years ?? 25,
      monthly_income: preferences.monthly_income ?? null,
      income_type: preferences.income_type ?? 'net',
    });
    setDownPaymentMode(preferences.down_payment_amount ? 'amount' : 'percent');
    setIsEditing(true);
  };

  const handleSave = () => {
    const dataToSave = {
      ...formData,
      down_payment_percent: downPaymentMode === 'percent' ? formData.down_payment_percent : null,
      down_payment_amount: downPaymentMode === 'amount' ? formData.down_payment_amount : null,
    };
    savePreferences(dataToSave);
    setIsEditing(false);
  };

  // Calculate max affordable price based on income
  const getMaxAffordablePrice = () => {
    if (!formData.monthly_income) return null;
    
    const ptiRatio = 0.40; // Bank of Israel guideline
    const maxMonthlyPayment = formData.monthly_income * ptiRatio;
    const annualRate = 0.055; // 5.5% average
    const monthlyRate = annualRate / 12;
    const termMonths = formData.term_years * 12;
    
    // Reverse PMT formula to get principal
    const maxLoan = maxMonthlyPayment * ((1 - Math.pow(1 + monthlyRate, -termMonths)) / monthlyRate);
    
    // Max price = loan / (1 - down payment %)
    const downPaymentPercent = downPaymentMode === 'percent' 
      ? (formData.down_payment_percent ?? 25) / 100
      : 0.25; // Default assumption
    
    const maxPrice = maxLoan / (1 - downPaymentPercent);
    return Math.round(maxPrice / 10000) * 10000; // Round to nearest 10k
  };

  const formatCurrency = (amount: number) => {
    if (amount >= 1000000) {
      return `₪${(amount / 1000000).toFixed(1)}M`;
    }
    return `₪${amount.toLocaleString()}`;
  };

  const maxBudget = getMaxAffordablePrice();
  const effectiveBuyerType = buyerProfile ? getEffectiveBuyerType(buyerProfile) : null;

  if (profileLoading) {
    return (
      <Card>
        <CardContent className="p-6 flex items-center justify-center">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  // Empty state for users without preferences
  if (!hasCustomPreferences && !isEditing) {
    return (
      <Card id="mortgage-preferences-section">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-medium flex items-center gap-2">
            <Home className="h-4 w-4 text-primary" />
            Mortgage Preferences
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <div className="w-12 h-12 rounded-full bg-muted/60 flex items-center justify-center mx-auto mb-3">
              <TrendingUp className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Set your mortgage preferences to see personalized estimates on all properties.
            </p>
            <Button onClick={handleEdit} size="sm">
              Set Preferences
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card id="mortgage-preferences-section">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="text-base font-medium flex items-center gap-2">
          <Home className="h-4 w-4 text-primary" />
          Mortgage Preferences
        </CardTitle>
        {!isEditing && (
          <Button variant="ghost" size="sm" onClick={handleEdit} className="h-8">
            <Edit3 className="h-4 w-4 mr-1" />
            Edit
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {isEditing ? (
          <div className="space-y-4">
            {/* Down Payment */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Down Payment</Label>
                <div className="flex gap-1">
                  <Toggle
                    size="sm"
                    pressed={downPaymentMode === 'percent'}
                    onPressedChange={() => setDownPaymentMode('percent')}
                    className="h-7 px-2 text-xs data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
                  >
                    %
                  </Toggle>
                  <Toggle
                    size="sm"
                    pressed={downPaymentMode === 'amount' && amountCurrency === 'ILS'}
                    onPressedChange={() => {
                      setDownPaymentMode('amount');
                      setAmountCurrency('ILS');
                    }}
                    className="h-7 px-2 text-xs data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
                  >
                    ₪
                  </Toggle>
                  <Toggle
                    size="sm"
                    pressed={downPaymentMode === 'amount' && amountCurrency === 'USD'}
                    onPressedChange={() => {
                      setDownPaymentMode('amount');
                      setAmountCurrency('USD');
                    }}
                    className="h-7 px-2 text-xs data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
                  >
                    $
                  </Toggle>
                </div>
              </div>
              {downPaymentMode === 'percent' ? (
                <div className="relative">
                  <Input
                    type="number"
                    value={formData.down_payment_percent ?? ''}
                    onChange={(e) => setFormData({ ...formData, down_payment_percent: Number(e.target.value) })}
                    min={Math.round((1 - ltvLimit) * 100)}
                    max={100}
                    className="pr-8"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">%</span>
                </div>
              ) : (
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">{currencySymbol}</span>
                  <Input
                    type="number"
                    value={formData.down_payment_amount ?? ''}
                    onChange={(e) => setFormData({ ...formData, down_payment_amount: Number(e.target.value) })}
                    className="pl-8"
                    placeholder={amountCurrency === 'USD' ? '400,000' : '1,500,000'}
                  />
                </div>
              )}
              <p className="text-xs text-muted-foreground">
                Min {Math.round((1 - ltvLimit) * 100)}% required ({buyerCategory})
              </p>
            </div>

            {/* Loan Term */}
            <div className="space-y-2">
              <Label>Loan Term</Label>
              <Select
                value={String(formData.term_years)}
                onValueChange={(value) => setFormData({ ...formData, term_years: Number(value) })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LOAN_TERMS.map((term) => (
                    <SelectItem key={term} value={String(term)}>
                      {term} years
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Monthly Income */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-1">
                  Monthly Income
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-3 w-3 text-muted-foreground cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        <p>Used to calculate your max affordable property price based on Bank of Israel's 40% payment-to-income guideline.</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </Label>
                <Select
                  value={formData.income_type}
                  onValueChange={(value: 'net' | 'gross') => setFormData({ ...formData, income_type: value })}
                >
                  <SelectTrigger className="w-24 h-7 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="net">Net</SelectItem>
                    <SelectItem value="gross">Gross</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">₪</span>
                <Input
                  type="number"
                  value={formData.monthly_income ?? ''}
                  onChange={(e) => setFormData({ ...formData, monthly_income: e.target.value ? Number(e.target.value) : null })}
                  className="pl-8"
                  placeholder="35,000"
                />
              </div>
              <p className="text-xs text-muted-foreground">Optional - helps calculate your budget</p>
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-2">
              <Button onClick={handleSave} disabled={isSaving} className="flex-1">
                {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Save
              </Button>
              <Button variant="outline" onClick={() => setIsEditing(false)} className="flex-1">
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-2">
              <StatItem
                icon={<Percent className="h-4 w-4" />}
                label="Down Payment"
                value={
                  preferences.down_payment_amount
                    ? formatCurrency(preferences.down_payment_amount)
                    : `${preferences.down_payment_percent ?? 25}%`
                }
              />
              <StatItem
                icon={<Calendar className="h-4 w-4" />}
                label="Loan Term"
                value={`${preferences.term_years ?? 25} years`}
              />
              <StatItem
                icon={<DollarSign className="h-4 w-4" />}
                label="Monthly Income"
                value={
                  preferences.monthly_income
                    ? formatCurrency(preferences.monthly_income)
                    : 'Not set'
                }
                subValue={preferences.monthly_income ? preferences.income_type : undefined}
              />
              <StatItem
                icon={<TrendingUp className="h-4 w-4" />}
                label="Max Budget"
                value={maxBudget ? formatCurrency(maxBudget) : 'Set income'}
                subValue={maxBudget ? 'estimated' : undefined}
              />
            </div>

            {/* LTV Info */}
            <div className="flex items-start gap-2 p-3 rounded-lg bg-primary/5 border border-primary/10">
              <Info className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
              <div className="text-xs">
                <p className="font-medium text-foreground">
                  Your LTV limit: {Math.round(ltvLimit * 100)}%
                </p>
                <p className="text-muted-foreground">
                  {buyerCategory} • Bank of Israel regulations
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
