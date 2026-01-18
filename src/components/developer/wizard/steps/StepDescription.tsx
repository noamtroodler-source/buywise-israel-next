import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useProjectWizard } from '../ProjectWizardContext';

export function StepDescription() {
  const { data, updateData } = useProjectWizard();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-4">Project Description</h2>
        <p className="text-muted-foreground mb-6">
          Write a compelling description that highlights what makes your development special.
        </p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="description">Description *</Label>
          <Textarea
            id="description"
            value={data.description}
            onChange={(e) => updateData({ description: e.target.value })}
            placeholder="Describe your project's unique features, location benefits, target buyers, construction quality, and lifestyle it offers..."
            rows={10}
            className="resize-none"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{data.description.length} characters</span>
            <span>Recommended: 300-1000 characters</span>
          </div>
        </div>

        <div className="bg-muted/50 p-4 rounded-lg space-y-3">
          <h4 className="font-medium text-sm">Tips for a great description:</h4>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• Highlight unique architectural features and design elements</li>
            <li>• Mention proximity to transportation, schools, and amenities</li>
            <li>• Describe the lifestyle and community the project creates</li>
            <li>• Include information about construction quality and materials</li>
            <li>• Mention any green building certifications or sustainability features</li>
            <li>• Describe the developer's track record if relevant</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
