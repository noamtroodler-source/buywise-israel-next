import { useState, useEffect } from 'react';
import { Percent, Pencil, Loader2, Banknote, CreditCard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { ProfileSection } from '../ProfileSection';
import { useMortgagePreferences } from '@/hooks/useMortgagePreferences';
import { useFormatPrice } from '@/contexts/PreferencesContext';

export function MortgageSection() {
  const { preferences, savePreferences, ltvLimit, buyerCategory, hasCustomPreferences, includeMortgage, isSaving } = useMortgagePreferences();
  const formatPrice = useFormatPrice();
  const [isEditing, setIsEditing] = useState(false);
  
  const [formData, setFormData] = useState({
    includeMortgage: preferences.include_mortgage,
    downPaymentPercent: preferences.down_payment_percent?.toString() || '',
    termYears: preferences.term_years?.toString() || '25',
    monthlyIncome: preferences.monthly_income?.toString() || '',
  });

  // Sync form data with preferences when they change
  useEffect(() => {
    setFormData({
      includeMortgage: preferences.include_mortgage,
      downPaymentPercent: preferences.down_payment_percent?.toString() || '',
      termYears: preferences.term_years?.toString() || '25',
      monthlyIncome: preferences.monthly_income?.toString() || '',
    });
  }, [preferences]);

  const handleSave = () => {
    savePreferences({
      include_mortgage: formData.includeMortgage,
      down_payment_percent: formData.includeMortgage && formData.downPaymentPercent 
        ? parseFloat(formData.downPaymentPercent) : null,
      term_years: parseInt(formData.termYears) || 25,
      monthly_income: formData.includeMortgage && formData.monthlyIncome 
        ? parseFloat(formData.monthlyIncome) : null,
    });
    setIsEditing(false);
  };

  // Calculate max budget based on income (40% PTI)
  const maxBudget = preferences.monthly_income && includeMortgage
    ? Math.round(preferences.monthly_income * 0.4 * 12 * preferences.term_years * 0.7) 
    : null;

  // Status text based on financing method
  const getStatusText = () => {
    if (!includeMortgage) return 'Paid in Full';
    if (hasCustomPreferences) {
      return `${preferences.down_payment_percent || 25}% down · ${preferences.term_years} years`;
    }
    return 'Using defaults';
  };

  return (
    <ProfileSection
      title="Financing Method"
      icon={includeMortgage ? <Percent className="h-5 w-5" /> : <Banknote className="h-5 w-5" />}
      status={includeMortgage ? (hasCustomPreferences ? 'complete' : 'incomplete') : 'complete'}
      statusText={getStatusText()}
      defaultOpen={includeMortgage && !hasCustomPreferences}
    >
      {isEditing ? (
        <div className="space-y-4">
          {/* Financing Method Toggle */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
            <div className="flex items-center gap-2">
              {formData.includeMortgage ? (
                <CreditCard className="h-4 w-4 text-primary" />
              ) : (
                <Banknote className="h-4 w-4 text-primary" />
              )}
              <div>
                <p className="text-sm font-medium">
                  {formData.includeMortgage ? 'Taking a Mortgage' : 'Paid in Full'}
                </p>
                <p className="text-xs text-muted-foreground">
                  {formData.includeMortgage 
                    ? 'Mortgage costs included. Toggle off to pay in full.' 
                    : 'Cash purchase — mortgage costs are excluded. Toggle on to take a mortgage.'}
                </p>
              </div>
            </div>
            <Switch
              checked={formData.includeMortgage}
              onCheckedChange={(checked) => setFormData({ ...formData, includeMortgage: checked })}
            />
          </div>

          {/* Mortgage-specific fields - only shown when mortgage is enabled */}
          {formData.includeMortgage && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs">Down Payment %</Label>
                <Input
                  type="number"
                  min={100 - ltvLimit}
                  max={100}
                  value={formData.downPaymentPercent}
                  onChange={(e) => setFormData({ ...formData, downPaymentPercent: e.target.value })}
                  placeholder={`Min ${100 - ltvLimit}%`}
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-xs">Loan Term (years)</Label>
                <Input
                  type="number"
                  min={5}
                  max={30}
                  value={formData.termYears}
                  onChange={(e) => setFormData({ ...formData, termYears: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div className="col-span-2">
                <Label className="text-xs">Monthly Income (₪)</Label>
                <Input
                  type="number"
                  value={formData.monthlyIncome}
                  onChange={(e) => setFormData({ ...formData, monthlyIncome: e.target.value })}
                  placeholder="For affordability calculation"
                  className="mt-1"
                />
              </div>
            </div>
          )}

          <div className="flex gap-2">
            <Button size="sm" onClick={handleSave} disabled={isSaving} className="flex-1">
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save'}
            </Button>
            <Button size="sm" variant="outline" onClick={() => setIsEditing(false)} className="flex-1">
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Show financing method status */}
          {!includeMortgage ? (
            <div className="p-3 rounded-lg bg-muted/50">
              <div className="flex items-center gap-2 mb-2">
                <Banknote className="h-4 w-4 text-primary" />
                <p className="text-sm font-medium">Paid in Full</p>
              </div>
              <p className="text-xs text-muted-foreground mb-3">
                Cash purchase — cost breakdowns exclude mortgage fees
              </p>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => savePreferences({ include_mortgage: true })}
                disabled={isSaving}
                className="text-xs h-7"
              >
                <CreditCard className="h-3 w-3 mr-1" />
                Switch to Mortgage
              </Button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Down Payment</p>
                  <p className="text-sm font-medium">
                    {preferences.down_payment_percent ? `${preferences.down_payment_percent}%` : 'Not set'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Loan Term</p>
                  <p className="text-sm font-medium">{preferences.term_years} years</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">LTV Limit</p>
                  <p className="text-sm font-medium">{ltvLimit}%</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Monthly Income</p>
                  <p className="text-sm font-medium">
                    {preferences.monthly_income 
                      ? formatPrice(preferences.monthly_income, 'ILS') 
                      : 'Not set'}
                  </p>
                </div>
              </div>
              
              {maxBudget && (
                <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
                  <p className="text-xs text-muted-foreground">Est. Max Budget</p>
                  <p className="text-lg font-semibold text-primary">
                    {formatPrice(maxBudget, 'ILS')}
                  </p>
                </div>
              )}
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => savePreferences({ include_mortgage: false })}
                disabled={isSaving}
                className="text-xs h-7"
              >
                <Banknote className="h-3 w-3 mr-1" />
                Switch to Paid in Full
              </Button>
            </>
          )}

          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setIsEditing(true)}
            className="w-full"
          >
            <Pencil className="h-3.5 w-3.5 mr-1.5" />
            Edit Preferences
          </Button>
        </div>
      )}
    </ProfileSection>
  );
}
