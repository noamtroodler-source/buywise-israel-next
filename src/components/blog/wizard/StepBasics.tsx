import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { useBlogWizard } from './BlogWizardContext';
import { useBlogCategories } from '@/hooks/useProfessionalBlog';
import { cn } from '@/lib/utils';

export function StepBasics() {
  const { data, updateData } = useBlogWizard();
  const { data: categories = [] } = useBlogCategories();

  const handleCategoryToggle = (categoryId: string) => {
    const current = data.categoryIds || [];
    if (current.includes(categoryId)) {
      updateData({ categoryIds: current.filter(c => c !== categoryId) });
    } else if (current.length < 3) {
      updateData({ categoryIds: [...current, categoryId] });
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="title">Article Title *</Label>
        <Input
          id="title"
          placeholder="e.g., 5 Things First-Time Buyers in Israel Should Know"
          value={data.title}
          onChange={(e) => updateData({ title: e.target.value })}
          className="text-lg"
        />
        <p className="text-xs text-muted-foreground">
          A clear, compelling title that tells readers what they'll learn
        </p>
      </div>

      <div className="space-y-3">
        <Label>Categories * <span className="text-muted-foreground font-normal">(select up to 3)</span></Label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {categories.map((cat) => {
            const isSelected = data.categoryIds?.includes(cat.id);
            const isDisabled = !isSelected && (data.categoryIds?.length || 0) >= 3;
            return (
              <div key={cat.id} className="flex items-center space-x-2">
                <Checkbox
                  id={`category-${cat.id}`}
                  checked={isSelected}
                  onCheckedChange={() => handleCategoryToggle(cat.id)}
                  disabled={isDisabled}
                />
                <label
                  htmlFor={`category-${cat.id}`}
                  className={cn("text-sm cursor-pointer", isDisabled && "text-muted-foreground")}
                >
                  {cat.name}
                </label>
              </div>
            );
          })}
        </div>
        <p className="text-xs text-muted-foreground">
          {data.categoryIds?.length || 0} of 3 selected
        </p>
      </div>
    </div>
  );
}