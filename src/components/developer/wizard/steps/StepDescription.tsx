import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useProjectWizard } from '../ProjectWizardContext';

export function StepDescription() {
  const { data, updateData } = useProjectWizard();

  const descriptionLength = data.description.length;
  const minLength = 150;
  const optimalMin = 400;
  const optimalMax = 600;
  const warningLength = 1500;
  const maxLength = 2000;

  const getCharacterFeedback = () => {
    if (descriptionLength < minLength) {
      return { text: `${descriptionLength} characters (minimum ${minLength})`, color: 'text-primary' };
    }
    if (descriptionLength < optimalMin) {
      return { text: `${descriptionLength} characters · ${optimalMin - descriptionLength} more for optimal`, color: 'text-muted-foreground' };
    }
    if (descriptionLength <= optimalMax) {
      return { text: `${descriptionLength} characters · Great length!`, color: 'text-primary' };
    }
    if (descriptionLength < warningLength) {
      return { text: `${descriptionLength} characters`, color: 'text-muted-foreground' };
    }
    if (descriptionLength < maxLength) {
      return { text: `${descriptionLength} characters · ${maxLength - descriptionLength} remaining`, color: 'text-primary' };
    }
    return { text: `Maximum reached (${maxLength})`, color: 'text-primary' };
  };

  const charFeedback = getCharacterFeedback();

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
            maxLength={maxLength}
            placeholder="Describe your project's unique features, location benefits, target buyers, construction quality, and lifestyle it offers..."
            rows={10}
            className="resize-none"
          />
          <div className="flex justify-between text-xs">
            <span className={charFeedback.color}>
              {charFeedback.text}
            </span>
            <span className="text-muted-foreground">
              Recommended: {optimalMin}-{optimalMax}
            </span>
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
