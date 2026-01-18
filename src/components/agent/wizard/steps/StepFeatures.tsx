import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { usePropertyWizard } from '../PropertyWizardContext';
import { Thermometer, Calendar, Wrench, Sparkles, Building } from 'lucide-react';
import { cn } from '@/lib/utils';

const conditions = [
  { value: 'new', label: 'New (from developer)' },
  { value: 'like_new', label: 'Like New' },
  { value: 'renovated', label: 'Renovated' },
  { value: 'good', label: 'Good Condition' },
  { value: 'needs_renovation', label: 'Needs Renovation' },
];

const acTypes = [
  { value: 'none', label: 'No A/C' },
  { value: 'split', label: 'Split Units (מפוצל)' },
  { value: 'central', label: 'Central A/C (מרכזי)' },
  { value: 'mini_central', label: 'Mini Central (מיני מרכזי)' },
];

const commonFeatures = [
  { id: 'elevator', label: 'Elevator' },
  { id: 'balcony', label: 'Balcony' },
  { id: 'mamad', label: 'Safe Room (ממ״ד)' },
  { id: 'storage', label: 'Storage Room' },
  { id: 'sukkah_balcony', label: 'Sukkah Balcony' },
  { id: 'shabbat_elevator', label: 'Shabbat Elevator' },
  { id: 'accessible', label: 'Accessible' },
  { id: 'furnished', label: 'Furnished' },
  { id: 'pets_allowed', label: 'Pets Allowed' },
  { id: 'renovated_kitchen', label: 'Renovated Kitchen' },
  { id: 'master_suite', label: 'Master Suite' },
  { id: 'garden', label: 'Private Garden' },
  { id: 'pool', label: 'Pool Access' },
  { id: 'gym', label: 'Gym Access' },
  { id: 'doorman', label: 'Doorman/Concierge' },
];

export function StepFeatures() {
  const { data, updateData } = usePropertyWizard();

  const toggleFeature = (featureId: string) => {
    const newFeatures = data.features.includes(featureId)
      ? data.features.filter(f => f !== featureId)
      : [...data.features, featureId];
    updateData({ features: newFeatures });
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold mb-1">Features & Amenities</h2>
        <p className="text-muted-foreground">
          Highlight what makes this property special
        </p>
      </div>

      <div className="space-y-6">
        {/* Condition */}
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Wrench className="h-4 w-4 text-primary" />
            </div>
            <h3 className="font-semibold">Property Condition</h3>
          </div>
          <Select
            value={data.condition}
            onValueChange={(v) => updateData({ condition: v })}
          >
            <SelectTrigger className="w-full sm:w-64 h-11 rounded-xl">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {conditions.map((c) => (
                <SelectItem key={c.value} value={c.value}>
                  {c.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* A/C */}
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Thermometer className="h-4 w-4 text-primary" />
            </div>
            <h3 className="font-semibold">Air Conditioning</h3>
          </div>
          <Select
            value={data.ac_type}
            onValueChange={(v) => updateData({ ac_type: v })}
          >
            <SelectTrigger className="w-full sm:w-64 h-11 rounded-xl">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {acTypes.map((ac) => (
                <SelectItem key={ac.value} value={ac.value}>
                  {ac.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Entry Date */}
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Calendar className="h-4 w-4 text-primary" />
            </div>
            <h3 className="font-semibold">Entry Date</h3>
          </div>
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="immediate"
                checked={data.is_immediate_entry}
                onCheckedChange={(checked) => {
                  updateData({ 
                    is_immediate_entry: !!checked,
                    entry_date: checked ? undefined : data.entry_date 
                  });
                }}
              />
              <Label htmlFor="immediate" className="text-sm font-normal cursor-pointer">
                Immediate entry available
              </Label>
            </div>
            {!data.is_immediate_entry && (
              <Input
                type="date"
                value={data.entry_date || ''}
                onChange={(e) => updateData({ entry_date: e.target.value || undefined })}
                min={new Date().toISOString().split('T')[0]}
                className="w-full sm:w-64 h-11 rounded-xl"
              />
            )}
          </div>
        </div>

        {/* Va'ad Bayit */}
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Building className="h-4 w-4 text-primary" />
            </div>
            <h3 className="font-semibold">Building Fee</h3>
          </div>
          <div className="space-y-2">
            <Label htmlFor="vaad_bayit">Va'ad Bayit (₪/month)</Label>
            <Input
              id="vaad_bayit"
              type="number"
              min="0"
              value={data.vaad_bayit_monthly || ''}
              onChange={(e) => updateData({ vaad_bayit_monthly: e.target.value ? Number(e.target.value) : undefined })}
              placeholder="e.g., 350"
              className="w-full sm:w-64 h-11 rounded-xl"
            />
          </div>
        </div>

        {/* Feature Checkboxes */}
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Sparkles className="h-4 w-4 text-primary" />
            </div>
            <h3 className="font-semibold">Property Features</h3>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {commonFeatures.map((feature) => (
              <label
                key={feature.id}
                className={cn(
                  "flex items-center justify-center p-3 rounded-xl border cursor-pointer transition-all text-sm text-center",
                  data.features.includes(feature.id)
                    ? "bg-primary/10 border-primary text-primary font-medium"
                    : "border-border hover:border-primary/50 hover:bg-muted/50"
                )}
              >
                <Checkbox
                  id={feature.id}
                  checked={data.features.includes(feature.id)}
                  onCheckedChange={() => toggleFeature(feature.id)}
                  className="sr-only"
                />
                {feature.label}
              </label>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
