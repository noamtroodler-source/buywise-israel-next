import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { FormattedNumberInput } from '@/components/ui/formatted-number-input';
import { Info } from 'lucide-react';
import { useProjectWizard } from '../ProjectWizardContext';

function LabelWithTooltip({ htmlFor, label, tooltip }: { 
  htmlFor: string; 
  label: string; 
  tooltip: string; 
}) {
  return (
    <div className="flex items-center gap-1.5">
      <Label htmlFor={htmlFor}>{label}</Label>
      <Tooltip>
        <TooltipTrigger type="button" className="cursor-help">
          <Info className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground transition-colors" />
        </TooltipTrigger>
        <TooltipContent className="max-w-xs text-sm">
          {tooltip}
        </TooltipContent>
      </Tooltip>
    </div>
  );
}

export function StepDetails() {
  const { data, updateData } = useProjectWizard();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-4">Project Details</h2>
        <p className="text-muted-foreground mb-6">
          Provide details about units, pricing, and timeline.
        </p>
      </div>

      <div className="space-y-6">
        {/* Units */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <LabelWithTooltip 
              htmlFor="total_units" 
              label="Total Units"
              tooltip="The total number of units in the entire project. This is a fixed number that typically doesn't change."
            />
            <FormattedNumberInput
              id="total_units"
              value={data.total_units}
              onChange={(value) => updateData({ total_units: value })}
              placeholder="e.g., 120"
            />
          </div>

          <div className="space-y-2">
            <LabelWithTooltip 
              htmlFor="available_units" 
              label="Available Units"
              tooltip="Units still available for sale. Update this regularly (we recommend weekly) as units are sold to keep your listing accurate."
            />
            <FormattedNumberInput
              id="available_units"
              value={data.available_units}
              onChange={(value) => updateData({ available_units: value })}
              placeholder="e.g., 45"
            />
          </div>
        </div>

        {/* Pricing */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <LabelWithTooltip 
              htmlFor="price_from" 
              label="Starting Price (₪)"
              tooltip="The lowest-priced unit in your project (e.g., smallest apartment, lowest floor). This is the 'החל מ' price shown to buyers."
            />
            <FormattedNumberInput
              id="price_from"
              value={data.price_from}
              onChange={(value) => updateData({ price_from: value })}
              placeholder="e.g., 1,500,000"
              prefix="₪"
            />
          </div>

          <div className="space-y-2">
            <LabelWithTooltip 
              htmlFor="price_to" 
              label="Maximum Price (₪)"
              tooltip="The highest-priced unit in your project (e.g., penthouse, premium floor plan). Leave empty if all units are similarly priced."
            />
            <FormattedNumberInput
              id="price_to"
              value={data.price_to}
              onChange={(value) => updateData({ price_to: value })}
              placeholder="e.g., 4,500,000"
              prefix="₪"
            />
          </div>
        </div>

        {/* Timeline */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="construction_start">Construction Start</Label>
            <Input
              id="construction_start"
              type="date"
              value={data.construction_start || ''}
              onChange={(e) => updateData({ construction_start: e.target.value || undefined })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="completion_date">Expected Completion</Label>
            <Input
              id="completion_date"
              type="date"
              value={data.completion_date || ''}
              onChange={(e) => updateData({ completion_date: e.target.value || undefined })}
            />
          </div>
        </div>

        {/* Construction Progress */}
        {['foundation', 'structure', 'finishing', 'delivery'].includes(data.status) && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Construction Progress</Label>
              <span className="text-sm font-medium">{data.construction_progress_percent}%</span>
            </div>
            <Slider
              value={[data.construction_progress_percent]}
              onValueChange={([value]) => updateData({ construction_progress_percent: value })}
              max={100}
              step={5}
            />
            <p className="text-xs text-muted-foreground">
              Current construction completion percentage
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
