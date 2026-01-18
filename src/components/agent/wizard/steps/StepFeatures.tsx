import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { usePropertyWizard } from '../PropertyWizardContext';
import { Thermometer, Calendar, Wrench } from 'lucide-react';

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
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-1">Features & Amenities</h2>
        <p className="text-sm text-muted-foreground">
          Highlight what makes this property special
        </p>
      </div>

      <div className="space-y-6">
        {/* Condition */}
        <div>
          <h3 className="font-medium mb-4 flex items-center gap-2">
            <Wrench className="h-4 w-4" />
            Property Condition
          </h3>
          <Select
            value={data.condition}
            onValueChange={(v) => updateData({ condition: v })}
          >
            <SelectTrigger className="w-full sm:w-64">
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
        <div>
          <h3 className="font-medium mb-4 flex items-center gap-2">
            <Thermometer className="h-4 w-4" />
            Air Conditioning
          </h3>
          <Select
            value={data.ac_type}
            onValueChange={(v) => updateData({ ac_type: v })}
          >
            <SelectTrigger className="w-full sm:w-64">
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
        <div>
          <h3 className="font-medium mb-4 flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Entry Date
          </h3>
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
              <Label htmlFor="immediate" className="text-sm font-normal">
                Immediate entry available
              </Label>
            </div>
            {!data.is_immediate_entry && (
              <Input
                type="date"
                value={data.entry_date || ''}
                onChange={(e) => updateData({ entry_date: e.target.value || undefined })}
                min={new Date().toISOString().split('T')[0]}
                className="w-full sm:w-64"
              />
            )}
          </div>
        </div>

        {/* Va'ad Bayit */}
        <div className="space-y-2">
          <Label htmlFor="vaad_bayit">Va'ad Bayit (₪/month)</Label>
          <Input
            id="vaad_bayit"
            type="number"
            min="0"
            value={data.vaad_bayit_monthly || ''}
            onChange={(e) => updateData({ vaad_bayit_monthly: e.target.value ? Number(e.target.value) : undefined })}
            placeholder="e.g., 350"
            className="w-full sm:w-64"
          />
        </div>

        {/* Feature Checkboxes */}
        <div>
          <h3 className="font-medium mb-4">Property Features</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {commonFeatures.map((feature) => (
              <div key={feature.id} className="flex items-center space-x-2">
                <Checkbox
                  id={feature.id}
                  checked={data.features.includes(feature.id)}
                  onCheckedChange={() => toggleFeature(feature.id)}
                />
                <Label htmlFor={feature.id} className="text-sm font-normal cursor-pointer">
                  {feature.label}
                </Label>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
