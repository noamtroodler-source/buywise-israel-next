import { useState } from 'react';
import { Percent, Pencil, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ProfileSection } from '../ProfileSection';
import { useMortgagePreferences } from '@/hooks/useMortgagePreferences';
import { useFormatPrice } from '@/contexts/PreferencesContext';

export function MortgageSection() {
  const { preferences, savePreferences, ltvLimit, buyerCategory, hasCustomPreferences, isSaving } = useMortgagePreferences();
  const formatPrice = useFormatPrice();
  const [isEditing, setIsEditing] = useState(false);
  
  const [formData, setFormData] = useState({
    downPaymentPercent: preferences.down_payment_percent?.toString() || '',
    termYears: preferences.term_years?.toString() || '25',
    monthlyIncome: preferences.monthly_income?.toString() || '',
  });

  const handleSave = () => {
    savePreferences({
      down_payment_percent: formData.downPaymentPercent ? parseFloat(formData.downPaymentPercent) : null,
      term_years: parseInt(formData.termYears) || 25,
      monthly_income: formData.monthlyIncome ? parseFloat(formData.monthlyIncome) : null,
    });
    setIsEditing(false);
  };

  // Calculate max budget based on income (40% PTI)
  const maxBudget = preferences.monthly_income 
    ? Math.round(preferences.monthly_income * 0.4 * 12 * preferences.term_years * 0.7) 
    : null;

  return (
    <ProfileSection
      title="Mortgage Preferences"
      icon={<Percent className="h-5 w-5" />}
      status={hasCustomPreferences ? 'complete' : 'incomplete'}
      statusText={hasCustomPreferences 
        ? `${preferences.down_payment_percent || 25}% down · ${preferences.term_years} years` 
        : 'Using defaults'}
      defaultOpen={!hasCustomPreferences}
    >
      {isEditing ? (
        <div className="space-y-4">
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
