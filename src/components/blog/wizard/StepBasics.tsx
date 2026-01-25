import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useBlogWizard } from './BlogWizardContext';
import { useBlogCategories } from '@/hooks/useProfessionalBlog';
import { AUDIENCE_OPTIONS } from '@/types/content';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function StepBasics() {
  const { data, updateData } = useBlogWizard();
  const { data: categories = [] } = useBlogCategories();
  
  // Fetch cities for the dropdown
  const { data: cities = [] } = useQuery({
    queryKey: ['blog-cities'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cities')
        .select('name, slug')
        .order('name');
      if (error) throw error;
      return data;
    },
  });

  const handleAudienceToggle = (audience: string) => {
    const current = data.audiences || [];
    if (current.includes(audience)) {
      updateData({ audiences: current.filter(a => a !== audience) });
    } else {
      updateData({ audiences: [...current, audience] });
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

      <div className="space-y-2">
        <Label htmlFor="category">Category *</Label>
        <Select
          value={data.categoryId}
          onValueChange={(value) => updateData({ categoryId: value })}
        >
          <SelectTrigger id="category">
            <SelectValue placeholder="Select a category" />
          </SelectTrigger>
          <SelectContent>
            {categories.map((cat) => (
              <SelectItem key={cat.id} value={cat.id}>
                {cat.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-3">
        <Label>Target Audience</Label>
        <p className="text-xs text-muted-foreground mb-2">
          Select who this article is most relevant for (optional)
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {AUDIENCE_OPTIONS.map((audience) => (
            <div
              key={audience.value}
              className="flex items-center space-x-2"
            >
              <Checkbox
                id={`audience-${audience.value}`}
                checked={data.audiences?.includes(audience.value)}
                onCheckedChange={() => handleAudienceToggle(audience.value)}
              />
              <label
                htmlFor={`audience-${audience.value}`}
                className="text-sm cursor-pointer"
              >
                {audience.label}
              </label>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="city">Related City (Optional)</Label>
        <Select
          value={data.city}
          onValueChange={(value) => updateData({ city: value === 'none' ? '' : value })}
        >
          <SelectTrigger id="city">
            <SelectValue placeholder="Select a city if relevant" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">No specific city</SelectItem>
            {cities.map((city) => (
              <SelectItem key={city.slug} value={city.name}>
                {city.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          If your article focuses on a specific city, select it here
        </p>
      </div>
    </div>
  );
}
