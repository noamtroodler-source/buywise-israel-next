import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { FormattedNumberInput } from '@/components/ui/formatted-number-input';
import { usePropertyWizard } from '../PropertyWizardContext';
import { Thermometer, Calendar, Wrench, Sparkles, Building, FileText, Home, Banknote } from 'lucide-react';
 import { Armchair } from 'lucide-react';
 import { AnimatePresence, motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { LeaseTermOption, SublettingOption, FurnishedStatus, PetsPolicy } from '@/types/database';

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

// Lease reality options
const leaseTermOptions: { value: LeaseTermOption; label: string }[] = [
  { value: '6_months', label: '6 Months' },
  { value: '12_months', label: '12 Months (Standard)' },
  { value: '24_months', label: '24 Months' },
  { value: 'flexible', label: 'Flexible' },
  { value: 'other', label: 'Other (specify in description)' },
];

const sublettingOptions: { value: SublettingOption; label: string }[] = [
  { value: 'allowed', label: 'Subletting Allowed' },
  { value: 'case_by_case', label: 'Case by Case' },
  { value: 'not_allowed', label: 'No Subletting' },
];

const furnishedOptions: { value: FurnishedStatus; label: string }[] = [
  { value: 'fully', label: 'Fully Furnished' },
  { value: 'semi', label: 'Semi Furnished' },
  { value: 'unfurnished', label: 'Unfurnished' },
];

const petsOptions: { value: PetsPolicy; label: string }[] = [
  { value: 'allowed', label: 'Pets Allowed' },
  { value: 'case_by_case', label: 'Case by Case' },
  { value: 'not_allowed', label: 'No Pets' },
];

// Removed 'furnished' and 'pets_allowed' - now using structured dropdowns instead
const commonFeatures = [
  { id: 'elevator', label: 'Elevator' },
  { id: 'balcony', label: 'Balcony' },
  { id: 'mamad', label: 'Safe Room (ממ״ד)' },
  { id: 'storage', label: 'Storage Room' },
  { id: 'sukkah_balcony', label: 'Sukkah Balcony' },
  { id: 'shabbat_elevator', label: 'Shabbat Elevator' },
  { id: 'accessible', label: 'Accessible' },
  { id: 'renovated_kitchen', label: 'Renovated Kitchen' },
  { id: 'master_suite', label: 'Master Suite' },
  { id: 'garden', label: 'Private Garden' },
  { id: 'pool', label: 'Pool Access' },
  { id: 'gym', label: 'Gym Access' },
  { id: 'doorman', label: 'Doorman/Concierge' },
];
 
 // Furniture items grouped by category
 const furnitureCategories = [
   {
     name: 'Kitchen',
     items: [
       { id: 'refrigerator', label: 'Refrigerator' },
       { id: 'oven_stove', label: 'Oven/Stove' },
       { id: 'microwave', label: 'Microwave' },
       { id: 'dishwasher', label: 'Dishwasher' },
       { id: 'washing_machine', label: 'Washing Machine' },
       { id: 'dryer', label: 'Dryer' },
     ],
   },
   {
     name: 'Living Room',
     items: [
       { id: 'sofa', label: 'Sofa' },
       { id: 'tv', label: 'TV' },
       { id: 'coffee_table', label: 'Coffee Table' },
       { id: 'dining_set', label: 'Dining Table + Chairs' },
       { id: 'bookshelf', label: 'Bookshelf' },
     ],
   },
   {
     name: 'Bedroom',
     items: [
       { id: 'bed_double', label: 'Double Bed' },
       { id: 'bed_single', label: 'Single Bed(s)' },
       { id: 'wardrobe', label: 'Wardrobe/Closet' },
       { id: 'desk_chair', label: 'Desk + Chair' },
     ],
   },
   {
     name: 'General',
     items: [
       { id: 'ac_units', label: 'Air Conditioner Units' },
       { id: 'curtains', label: 'Curtains/Blinds' },
       { id: 'light_fixtures', label: 'Light Fixtures' },
     ],
   },
 ];

export function StepFeatures() {
  const { data, updateData } = usePropertyWizard();
  const isRental = data.listing_status === 'for_rent';
   const showFurnitureSection = data.furnished_status === 'fully' || data.furnished_status === 'semi';

  const toggleFeature = (featureId: string) => {
    const newFeatures = data.features.includes(featureId)
      ? data.features.filter(f => f !== featureId)
      : [...data.features, featureId];
    
    // Sync explicit boolean fields for key amenities
    const updates: Partial<typeof data> = { features: newFeatures };
    if (featureId === 'balcony') {
      updates.has_balcony = newFeatures.includes('balcony');
    }
    if (featureId === 'elevator') {
      updates.has_elevator = newFeatures.includes('elevator');
    }
    if (featureId === 'storage') {
      updates.has_storage = newFeatures.includes('storage');
    }
    
    updateData(updates);
  };
 
   const toggleFurnitureItem = (itemId: string) => {
     const newItems = data.furniture_items.includes(itemId)
       ? data.furniture_items.filter(i => i !== itemId)
       : [...data.furniture_items, itemId];
     updateData({ furniture_items: newItems });
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
            <FormattedNumberInput
              id="vaad_bayit"
              value={data.vaad_bayit_monthly}
              onChange={(value) => updateData({ vaad_bayit_monthly: value })}
              placeholder="e.g., 350"
              prefix="₪"
              className="w-full sm:w-64 h-11 rounded-xl"
            />
          </div>
        </div>

        {/* Lease Details Section - Rental Only */}
        {isRental && (
          <div className="space-y-4 pt-4 border-t">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <FileText className="h-4 w-4 text-primary" />
              </div>
              <h3 className="font-semibold">Lease Details</h3>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Lease Term */}
              <div className="space-y-2">
                <Label>Typical Lease Term</Label>
                <Select
                  value={data.lease_term || ''}
                  onValueChange={(v) => updateData({ lease_term: v as LeaseTermOption })}
                >
                  <SelectTrigger className="w-full h-11 rounded-xl">
                    <SelectValue placeholder="Select lease term" />
                  </SelectTrigger>
                  <SelectContent>
                    {leaseTermOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Subletting */}
              <div className="space-y-2">
                <Label>Subletting</Label>
                <Select
                  value={data.subletting_allowed || ''}
                  onValueChange={(v) => updateData({ subletting_allowed: v as SublettingOption })}
                >
                  <SelectTrigger className="w-full h-11 rounded-xl">
                    <SelectValue placeholder="Select subletting policy" />
                  </SelectTrigger>
                  <SelectContent>
                    {sublettingOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Agent Fee */}
              <div className="space-y-2">
                <Label>Agent Fee</Label>
                <Select
                  value={data.agent_fee_required === undefined ? '' : data.agent_fee_required ? 'yes' : 'no'}
                  onValueChange={(v) => updateData({ agent_fee_required: v === 'yes' })}
                >
                  <SelectTrigger className="w-full h-11 rounded-xl">
                    <SelectValue placeholder="Does tenant pay agent fee?" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="yes">Yes - Tenant pays</SelectItem>
                    <SelectItem value="no">No agent fee</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        )}

        {/* Property Terms Section - Both Rental and Sale */}
        <div className="space-y-4 pt-4 border-t">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Home className="h-4 w-4 text-primary" />
            </div>
            <h3 className="font-semibold">Property Terms</h3>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Furnished Status */}
            <div className="space-y-2">
              <Label>Furnished Status</Label>
              <Select
                value={data.furnished_status || ''}
                onValueChange={(v) => updateData({ furnished_status: v as FurnishedStatus })}
              >
                <SelectTrigger className="w-full h-11 rounded-xl">
                  <SelectValue placeholder="Select furnished status" />
                </SelectTrigger>
                <SelectContent>
                  {furnishedOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Pets Policy */}
            <div className="space-y-2">
              <Label>Pets Policy</Label>
              <Select
                value={data.pets_policy || ''}
                onValueChange={(v) => updateData({ pets_policy: v as PetsPolicy })}
              >
                <SelectTrigger className="w-full h-11 rounded-xl">
                  <SelectValue placeholder="Select pets policy" />
                </SelectTrigger>
                <SelectContent>
                  {petsOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
           
           {/* Furniture Items Selection - Conditional */}
           <AnimatePresence>
             {showFurnitureSection && (
               <motion.div
                 initial={{ opacity: 0, height: 0 }}
                 animate={{ opacity: 1, height: 'auto' }}
                 exit={{ opacity: 0, height: 0 }}
                 transition={{ duration: 0.3 }}
                 className="overflow-hidden"
               >
                 <div className="space-y-4 p-4 rounded-xl bg-muted/30 border border-border">
                   <div className="flex items-start gap-3">
                     <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                       <Armchair className="h-4 w-4 text-primary" />
                     </div>
                     <div>
                       <h4 className="font-semibold">What's Included</h4>
                       <p className="text-sm text-muted-foreground">
                         Select furniture and appliances that come with this property
                       </p>
                     </div>
                   </div>
                   
                   <p className="text-xs text-primary/80 bg-primary/5 p-2 rounded-lg">
                     💡 Listings with detailed furniture lists get 40% more inquiries
                   </p>
                   
                   <div className="space-y-4">
                     {furnitureCategories.map((category) => (
                       <div key={category.name} className="space-y-2">
                         <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                           {category.name}
                         </p>
                         <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                           {category.items.map((item) => (
                             <label
                               key={item.id}
                               className={cn(
                                 "flex items-center justify-center p-2.5 rounded-xl border cursor-pointer transition-all text-sm text-center",
                                 data.furniture_items.includes(item.id)
                                   ? "bg-primary/10 border-primary text-primary font-medium"
                                   : "border-border hover:border-primary/50 hover:bg-muted/50"
                               )}
                             >
                               <Checkbox
                                 checked={data.furniture_items.includes(item.id)}
                                 onCheckedChange={() => toggleFurnitureItem(item.id)}
                                 className="sr-only"
                               />
                               {item.label}
                             </label>
                           ))}
                         </div>
                       </div>
                     ))}
                   </div>
                 </div>
               </motion.div>
             )}
           </AnimatePresence>
         </div>

        {/* Feature Checkboxes */}
        <div className="space-y-4 pt-4 border-t">
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
