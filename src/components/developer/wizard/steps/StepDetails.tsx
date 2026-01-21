import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { useProjectWizard } from '../ProjectWizardContext';

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
            <Label htmlFor="total_units">Total Units</Label>
            <Input
              id="total_units"
              type="number"
              min={1}
              value={data.total_units || ''}
              onChange={(e) => updateData({ total_units: e.target.value ? Number(e.target.value) : undefined })}
              placeholder="e.g., 120"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="available_units">Available Units</Label>
            <Input
              id="available_units"
              type="number"
              min={0}
              value={data.available_units || ''}
              onChange={(e) => updateData({ available_units: e.target.value ? Number(e.target.value) : undefined })}
              placeholder="e.g., 45"
            />
          </div>
        </div>

        {/* Pricing */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="price_from">Price From (₪)</Label>
            <Input
              id="price_from"
              type="number"
              min={0}
              step={10000}
              value={data.price_from || ''}
              onChange={(e) => updateData({ price_from: e.target.value ? Number(e.target.value) : undefined })}
              placeholder="e.g., 1,500,000"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="price_to">Price To (₪)</Label>
            <Input
              id="price_to"
              type="number"
              min={0}
              step={10000}
              value={data.price_to || ''}
              onChange={(e) => updateData({ price_to: e.target.value ? Number(e.target.value) : undefined })}
              placeholder="e.g., 4,500,000"
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
