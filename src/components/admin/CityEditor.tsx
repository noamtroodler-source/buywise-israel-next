import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { City } from '@/types/content';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { Save, Loader2 } from 'lucide-react';

interface CityEditorProps {
  city: City;
  onClose: () => void;
}

export function CityEditor({ city, onClose }: CityEditorProps) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState<Partial<City>>({
    name: city.name,
    slug: city.slug,
    description: city.description,
    region: city.region,
    identity_sentence: city.identity_sentence,
    card_description: city.card_description,
    hero_image: city.hero_image,
    population: city.population,
    is_featured: city.is_featured,
    // Pricing
    average_price: city.average_price,
    median_apartment_price: city.median_apartment_price,
    average_price_sqm: city.average_price_sqm,
    average_price_sqm_min: city.average_price_sqm_min,
    average_price_sqm_max: city.average_price_sqm_max,
    yoy_price_change: city.yoy_price_change,
    // Rentals
    rental_3_room_min: city.rental_3_room_min,
    rental_3_room_max: city.rental_3_room_max,
    rental_4_room_min: city.rental_4_room_min,
    rental_4_room_max: city.rental_4_room_max,
    rental_5_room_min: city.rental_5_room_min,
    rental_5_room_max: city.rental_5_room_max,
    // Investment
    gross_yield_percent: city.gross_yield_percent,
    gross_yield_percent_min: city.gross_yield_percent_min,
    gross_yield_percent_max: city.gross_yield_percent_max,
    net_yield_percent: city.net_yield_percent,
    net_yield_percent_min: city.net_yield_percent_min,
    net_yield_percent_max: city.net_yield_percent_max,
    investment_score: city.investment_score,
    // Costs
    arnona_rate_sqm: city.arnona_rate_sqm,
    arnona_rate_sqm_min: city.arnona_rate_sqm_min,
    arnona_rate_sqm_max: city.arnona_rate_sqm_max,
    arnona_monthly_avg: city.arnona_monthly_avg,
    average_vaad_bayit: city.average_vaad_bayit,
    average_vaad_bayit_min: city.average_vaad_bayit_min,
    average_vaad_bayit_max: city.average_vaad_bayit_max,
    renovation_cost_basic: city.renovation_cost_basic,
    renovation_cost_premium: city.renovation_cost_premium,
    // Lifestyle
    anglo_presence: city.anglo_presence,
    commute_time_tel_aviv: city.commute_time_tel_aviv,
    commute_time_jerusalem: city.commute_time_jerusalem,
    has_train_station: city.has_train_station,
    socioeconomic_rank: city.socioeconomic_rank,
  });

  const updateMutation = useMutation({
    mutationFn: async (data: Partial<City>) => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { neighborhoods, highlights, ...safeData } = data;
      const { error } = await supabase
        .from('cities')
        .update({ ...safeData, updated_at: new Date().toISOString() })
        .eq('id', city.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-cities'] });
      queryClient.invalidateQueries({ queryKey: ['cities'] });
      queryClient.invalidateQueries({ queryKey: ['city', city.slug] });
      toast.success('City updated successfully');
      onClose();
    },
    onError: (error) => {
      toast.error('Failed to update city: ' + error.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate(formData);
  };

  const updateField = (field: keyof City, value: unknown) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const NumberInput = ({
    field,
    label,
    suffix,
  }: {
    field: keyof City;
    label: string;
    suffix?: string;
  }) => (
    <div className="space-y-1.5">
      <Label htmlFor={field} className="text-sm">
        {label}
      </Label>
      <div className="relative">
        <Input
          id={field}
          type="number"
          step="any"
          value={(formData[field] as number) ?? ''}
          onChange={(e) =>
            updateField(field, e.target.value ? parseFloat(e.target.value) : null)
          }
          className="pr-12"
        />
        {suffix && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
            {suffix}
          </span>
        )}
      </div>
    </div>
  );

  const RangeInputs = ({
    label,
    minField,
    maxField,
    suffix,
  }: {
    label: string;
    minField: keyof City;
    maxField: keyof City;
    suffix?: string;
  }) => (
    <div className="space-y-1.5">
      <Label className="text-sm">{label}</Label>
      <div className="flex items-center gap-2">
        <Input
          type="number"
          step="any"
          placeholder="Min"
          value={(formData[minField] as number) ?? ''}
          onChange={(e) =>
            updateField(minField, e.target.value ? parseFloat(e.target.value) : null)
          }
        />
        <span className="text-muted-foreground">–</span>
        <Input
          type="number"
          step="any"
          placeholder="Max"
          value={(formData[maxField] as number) ?? ''}
          onChange={(e) =>
            updateField(maxField, e.target.value ? parseFloat(e.target.value) : null)
          }
        />
        {suffix && <span className="text-sm text-muted-foreground whitespace-nowrap">{suffix}</span>}
      </div>
    </div>
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Tabs defaultValue="basic" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="basic">Basic</TabsTrigger>
          <TabsTrigger value="pricing">Pricing</TabsTrigger>
          <TabsTrigger value="rentals">Rentals</TabsTrigger>
          <TabsTrigger value="investment">Investment</TabsTrigger>
          <TabsTrigger value="lifestyle">Lifestyle</TabsTrigger>
        </TabsList>

        <TabsContent value="basic" className="space-y-4 pt-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="name">City Name</Label>
              <Input
                id="name"
                value={formData.name ?? ''}
                onChange={(e) => updateField('name', e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="slug">Slug</Label>
              <Input
                id="slug"
                value={formData.slug ?? ''}
                onChange={(e) => updateField('slug', e.target.value)}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="region">Region</Label>
              <Input
                id="region"
                value={formData.region ?? ''}
                onChange={(e) => updateField('region', e.target.value)}
              />
            </div>
            <NumberInput field="population" label="Population" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="identity_sentence">Identity Sentence</Label>
            <Textarea
              id="identity_sentence"
              value={formData.identity_sentence ?? ''}
              onChange={(e) => updateField('identity_sentence', e.target.value)}
              rows={2}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="card_description">Card Description</Label>
            <Textarea
              id="card_description"
              value={formData.card_description ?? ''}
              onChange={(e) => updateField('card_description', e.target.value)}
              rows={2}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="description">Full Description</Label>
            <Textarea
              id="description"
              value={formData.description ?? ''}
              onChange={(e) => updateField('description', e.target.value)}
              rows={4}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="hero_image">Hero Image URL</Label>
            <Input
              id="hero_image"
              value={formData.hero_image ?? ''}
              onChange={(e) => updateField('hero_image', e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            <Switch
              id="is_featured"
              checked={formData.is_featured ?? false}
              onCheckedChange={(checked) => updateField('is_featured', checked)}
            />
            <Label htmlFor="is_featured">Featured City</Label>
          </div>
        </TabsContent>

        <TabsContent value="pricing" className="space-y-4 pt-4">
          <div className="grid grid-cols-2 gap-4">
            <NumberInput field="average_price" label="Average Price" suffix="₪" />
            <NumberInput field="median_apartment_price" label="Median Apartment Price" suffix="₪" />
          </div>
          <NumberInput field="average_price_sqm" label="Average Price per sqm" suffix="₪/sqm" />
          <RangeInputs
            label="Price per sqm Range"
            minField="average_price_sqm_min"
            maxField="average_price_sqm_max"
            suffix="₪/sqm"
          />
          <NumberInput field="yoy_price_change" label="Year-over-Year Change" suffix="%" />
        </TabsContent>

        <TabsContent value="rentals" className="space-y-4 pt-4">
          <RangeInputs
            label="3-Room Rental"
            minField="rental_3_room_min"
            maxField="rental_3_room_max"
            suffix="₪/mo"
          />
          <RangeInputs
            label="4-Room Rental"
            minField="rental_4_room_min"
            maxField="rental_4_room_max"
            suffix="₪/mo"
          />
          <RangeInputs
            label="5-Room Rental"
            minField="rental_5_room_min"
            maxField="rental_5_room_max"
            suffix="₪/mo"
          />
        </TabsContent>

        <TabsContent value="investment" className="space-y-4 pt-4">
          <NumberInput field="gross_yield_percent" label="Gross Yield" suffix="%" />
          <RangeInputs
            label="Gross Yield Range"
            minField="gross_yield_percent_min"
            maxField="gross_yield_percent_max"
            suffix="%"
          />
          <NumberInput field="net_yield_percent" label="Net Yield" suffix="%" />
          <RangeInputs
            label="Net Yield Range"
            minField="net_yield_percent_min"
            maxField="net_yield_percent_max"
            suffix="%"
          />
          <NumberInput field="investment_score" label="Investment Score" suffix="/100" />
        </TabsContent>

        <TabsContent value="lifestyle" className="space-y-4 pt-4">
          <div className="grid grid-cols-2 gap-4">
            <NumberInput field="arnona_rate_sqm" label="Arnona Rate" suffix="₪/sqm" />
            <NumberInput field="arnona_monthly_avg" label="Arnona Monthly Avg" suffix="₪" />
          </div>
          <RangeInputs
            label="Arnona Rate Range"
            minField="arnona_rate_sqm_min"
            maxField="arnona_rate_sqm_max"
            suffix="₪/sqm"
          />
          <div className="grid grid-cols-2 gap-4">
            <NumberInput field="average_vaad_bayit" label="Avg Vaad Bayit" suffix="₪/mo" />
            <div className="space-y-1.5">
              <Label htmlFor="anglo_presence">Anglo Presence</Label>
              <Input
                id="anglo_presence"
                value={formData.anglo_presence ?? ''}
                onChange={(e) => updateField('anglo_presence', e.target.value)}
                placeholder="e.g., High, Medium, Low"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <NumberInput field="commute_time_tel_aviv" label="Commute to Tel Aviv" suffix="min" />
            <NumberInput field="commute_time_jerusalem" label="Commute to Jerusalem" suffix="min" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <NumberInput field="socioeconomic_rank" label="Socioeconomic Rank" suffix="/10" />
            <div className="flex items-center gap-2 pt-6">
              <Switch
                id="has_train_station"
                checked={formData.has_train_station ?? false}
                onCheckedChange={(checked) => updateField('has_train_station', checked)}
              />
              <Label htmlFor="has_train_station">Has Train Station</Label>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <NumberInput field="renovation_cost_basic" label="Basic Renovation Cost" suffix="₪/sqm" />
            <NumberInput field="renovation_cost_premium" label="Premium Renovation Cost" suffix="₪/sqm" />
          </div>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end gap-3 pt-4 border-t">
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" disabled={updateMutation.isPending}>
          {updateMutation.isPending ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          Save Changes
        </Button>
      </div>
    </form>
  );
}
