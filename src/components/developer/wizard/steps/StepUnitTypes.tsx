import { useState, useRef } from 'react';
import { Plus, Trash2, Edit2, Upload, Home, Bed, Bath, Ruler, Layers, DollarSign, Image, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useProjectWizard, UnitTypeData, OutdoorSpaceType } from '../ProjectWizardContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const UNIT_TYPE_PRESETS = [
  '2-Room Apartment',
  '3-Room Apartment',
  '4-Room Apartment',
  '5-Room Apartment',
  'Garden Apartment',
  'Penthouse',
  'Duplex',
  'Mini Penthouse',
  'Studio',
  'Custom',
];

const OUTDOOR_SPACE_OPTIONS: { value: OutdoorSpaceType; label: string }[] = [
  { value: 'balcony', label: 'Balcony' },
  { value: 'garden', label: 'Private Garden' },
  { value: 'roof_terrace', label: 'Roof Terrace' },
  { value: 'none', label: 'None' },
];

const defaultUnitType: Omit<UnitTypeData, 'id'> = {
  name: '',
  bedrooms: 2,
  bathrooms: 1,
  sizeMin: undefined,
  sizeMax: undefined,
  floorMin: undefined,
  floorMax: undefined,
  priceMin: undefined,
  priceMax: undefined,
  outdoorSpace: 'balcony',
  floorPlanUrl: undefined,
  quantity: undefined,
};

export function StepUnitTypes() {
  const { data, updateData } = useProjectWizard();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingUnit, setEditingUnit] = useState<UnitTypeData | null>(null);
  const [formData, setFormData] = useState<Omit<UnitTypeData, 'id'>>(defaultUnitType);
  const [isUploading, setIsUploading] = useState(false);
  const [customName, setCustomName] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAddNew = () => {
    setEditingUnit(null);
    setFormData(defaultUnitType);
    setCustomName('');
    setIsDialogOpen(true);
  };

  const handleEdit = (unitType: UnitTypeData) => {
    setEditingUnit(unitType);
    setFormData({
      name: unitType.name,
      bedrooms: unitType.bedrooms,
      bathrooms: unitType.bathrooms,
      sizeMin: unitType.sizeMin,
      sizeMax: unitType.sizeMax,
      floorMin: unitType.floorMin,
      floorMax: unitType.floorMax,
      priceMin: unitType.priceMin,
      priceMax: unitType.priceMax,
      outdoorSpace: unitType.outdoorSpace,
      floorPlanUrl: unitType.floorPlanUrl,
      quantity: unitType.quantity,
    });
    setCustomName(UNIT_TYPE_PRESETS.includes(unitType.name) ? '' : unitType.name);
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    updateData({
      unit_types: data.unit_types.filter(ut => ut.id !== id),
    });
    toast.success('Unit type removed');
  };

  const handleSave = () => {
    const finalName = formData.name === 'Custom' ? customName : formData.name;
    
    if (!finalName) {
      toast.error('Please enter a unit type name');
      return;
    }

    if (editingUnit) {
      // Update existing
      updateData({
        unit_types: data.unit_types.map(ut =>
          ut.id === editingUnit.id
            ? { ...formData, id: editingUnit.id, name: finalName }
            : ut
        ),
      });
      toast.success('Unit type updated');
    } else {
      // Add new
      const newUnit: UnitTypeData = {
        ...formData,
        id: crypto.randomUUID(),
        name: finalName,
      };
      updateData({
        unit_types: [...data.unit_types, newUnit],
      });
      toast.success('Unit type added');
    }

    setIsDialogOpen(false);
    setFormData(defaultUnitType);
    setEditingUnit(null);
    setCustomName('');
  };

  const handleFloorPlanUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    if (!validTypes.includes(file.type)) {
      toast.error('Please upload a JPG, PNG, WebP, or PDF file');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error('File size must be under 10MB');
      return;
    }

    setIsUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${crypto.randomUUID()}.${fileExt}`;
      const filePath = `floor-plans/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('project-images')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('project-images')
        .getPublicUrl(filePath);

      setFormData(prev => ({ ...prev, floorPlanUrl: publicUrl }));
      toast.success('Floor plan uploaded');
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload floor plan');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const removeFloorPlan = () => {
    setFormData(prev => ({ ...prev, floorPlanUrl: undefined }));
  };

  const formatPrice = (price: number) => `₪${price.toLocaleString()}`;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-1">Unit Types & Floor Plans</h2>
        <p className="text-muted-foreground text-sm">
          Define the types of units available in your project. Each type can have its own floor plan.
        </p>
      </div>

      {/* Unit Type Cards */}
      <div className="space-y-4">
        {data.unit_types.length === 0 ? (
          <Card className="border-dashed border-2 border-muted-foreground/20">
            <CardContent className="py-8 text-center">
              <Home className="h-10 w-10 mx-auto text-muted-foreground/40 mb-3" />
              <p className="text-muted-foreground mb-4">
                No unit types defined yet. Add your first unit type to show buyers what's available.
              </p>
              <Button onClick={handleAddNew} className="rounded-xl">
                <Plus className="h-4 w-4 mr-2" />
                Add Unit Type
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            {data.unit_types.map((unitType) => (
              <Card key={unitType.id} className="group hover:border-primary/30 transition-colors">
                <CardContent className="p-4">
                  <div className="flex flex-col sm:flex-row gap-4">
                    {/* Floor Plan Preview */}
                    <div className="w-full sm:w-32 h-24 bg-muted rounded-lg overflow-hidden flex-shrink-0">
                      {unitType.floorPlanUrl ? (
                        <img
                          src={unitType.floorPlanUrl}
                          alt={`${unitType.name} floor plan`}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                          <Image className="h-8 w-8 opacity-30" />
                        </div>
                      )}
                    </div>

                    {/* Unit Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h3 className="font-semibold text-lg truncate">{unitType.name}</h3>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(unitType)}>
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => handleDelete(unitType.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Bed className="h-3.5 w-3.5" />
                          {unitType.bedrooms} Bed
                        </span>
                        <span className="flex items-center gap-1">
                          <Bath className="h-3.5 w-3.5" />
                          {unitType.bathrooms} Bath
                        </span>
                        {(unitType.sizeMin || unitType.sizeMax) && (
                          <span className="flex items-center gap-1">
                            <Ruler className="h-3.5 w-3.5" />
                            {unitType.sizeMin && unitType.sizeMax
                              ? `${unitType.sizeMin}-${unitType.sizeMax} m²`
                              : `${unitType.sizeMin || unitType.sizeMax} m²`}
                          </span>
                        )}
                        {(unitType.floorMin || unitType.floorMax) && (
                          <span className="flex items-center gap-1">
                            <Layers className="h-3.5 w-3.5" />
                            Floors {unitType.floorMin}-{unitType.floorMax}
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-2 mt-2">
                        {(unitType.priceMin || unitType.priceMax) && (
                          <Badge variant="secondary" className="font-normal">
                            <DollarSign className="h-3 w-3 mr-0.5" />
                            {unitType.priceMin && unitType.priceMax
                              ? `${formatPrice(unitType.priceMin)} - ${formatPrice(unitType.priceMax)}`
                              : formatPrice(unitType.priceMin || unitType.priceMax!)}
                          </Badge>
                        )}
                        {unitType.outdoorSpace !== 'none' && (
                          <Badge variant="outline" className="font-normal capitalize">
                            {unitType.outdoorSpace.replace('_', ' ')}
                          </Badge>
                        )}
                        {unitType.quantity && (
                          <Badge variant="outline" className="font-normal">
                            {unitType.quantity} units
                          </Badge>
                        )}
                        {unitType.floorPlanUrl && (
                          <Badge variant="default" className="font-normal bg-primary/10 text-primary border-primary/20">
                            Floor Plan Added
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            <Button variant="outline" onClick={handleAddNew} className="w-full rounded-xl border-dashed">
              <Plus className="h-4 w-4 mr-2" />
              Add Another Unit Type
            </Button>
          </>
        )}
      </div>

      {/* Info Box */}
      <div className="bg-muted/50 p-4 rounded-lg text-sm text-muted-foreground">
        <p>
          <strong>Tip:</strong> Floor plans are optional but highly recommended. Projects with floor plans receive 
          significantly more inquiries. You can always add them later.
        </p>
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingUnit ? 'Edit Unit Type' : 'Add Unit Type'}</DialogTitle>
          </DialogHeader>

          <div className="space-y-5 py-4">
            {/* Unit Type Name */}
            <div className="space-y-2">
              <Label>Unit Type *</Label>
              <Select
                value={formData.name}
                onValueChange={(value) => setFormData(prev => ({ ...prev, name: value }))}
              >
                <SelectTrigger className="rounded-xl">
                  <SelectValue placeholder="Select unit type" />
                </SelectTrigger>
                <SelectContent>
                  {UNIT_TYPE_PRESETS.map((preset) => (
                    <SelectItem key={preset} value={preset}>
                      {preset}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {formData.name === 'Custom' && (
                <Input
                  placeholder="Enter custom unit type name"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  className="rounded-xl mt-2"
                />
              )}
            </div>

            {/* Bedrooms & Bathrooms */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Bedrooms *</Label>
                <Select
                  value={String(formData.bedrooms)}
                  onValueChange={(v) => setFormData(prev => ({ ...prev, bedrooms: Number(v) }))}
                >
                  <SelectTrigger className="rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[0, 1, 2, 3, 4, 5, 6].map((n) => (
                      <SelectItem key={n} value={String(n)}>{n}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Bathrooms *</Label>
                <Select
                  value={String(formData.bathrooms)}
                  onValueChange={(v) => setFormData(prev => ({ ...prev, bathrooms: Number(v) }))}
                >
                  <SelectTrigger className="rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5].map((n) => (
                      <SelectItem key={n} value={String(n)}>{n}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Size Range */}
            <div className="space-y-2">
              <Label>Size Range (m²)</Label>
              <div className="grid grid-cols-2 gap-3">
                <Input
                  type="number"
                  placeholder="From"
                  value={formData.sizeMin || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, sizeMin: e.target.value ? Number(e.target.value) : undefined }))}
                  className="rounded-xl"
                />
                <Input
                  type="number"
                  placeholder="To"
                  value={formData.sizeMax || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, sizeMax: e.target.value ? Number(e.target.value) : undefined }))}
                  className="rounded-xl"
                />
              </div>
            </div>

            {/* Floor Range */}
            <div className="space-y-2">
              <Label>Floor Range</Label>
              <div className="grid grid-cols-2 gap-3">
                <Input
                  type="number"
                  placeholder="From"
                  value={formData.floorMin || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, floorMin: e.target.value ? Number(e.target.value) : undefined }))}
                  className="rounded-xl"
                />
                <Input
                  type="number"
                  placeholder="To"
                  value={formData.floorMax || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, floorMax: e.target.value ? Number(e.target.value) : undefined }))}
                  className="rounded-xl"
                />
              </div>
            </div>

            {/* Price Range */}
            <div className="space-y-2">
              <Label>Price Range (₪)</Label>
              <div className="grid grid-cols-2 gap-3">
                <Input
                  type="number"
                  placeholder="From"
                  value={formData.priceMin || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, priceMin: e.target.value ? Number(e.target.value) : undefined }))}
                  className="rounded-xl"
                />
                <Input
                  type="number"
                  placeholder="To"
                  value={formData.priceMax || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, priceMax: e.target.value ? Number(e.target.value) : undefined }))}
                  className="rounded-xl"
                />
              </div>
            </div>

            {/* Outdoor Space */}
            <div className="space-y-2">
              <Label>Outdoor Space</Label>
              <RadioGroup
                value={formData.outdoorSpace}
                onValueChange={(v) => setFormData(prev => ({ ...prev, outdoorSpace: v as OutdoorSpaceType }))}
                className="grid grid-cols-2 gap-2"
              >
                {OUTDOOR_SPACE_OPTIONS.map((option) => (
                  <div key={option.value} className="flex items-center space-x-2">
                    <RadioGroupItem value={option.value} id={option.value} />
                    <Label htmlFor={option.value} className="font-normal cursor-pointer">
                      {option.label}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>

            {/* Quantity */}
            <div className="space-y-2">
              <Label>Number of Units</Label>
              <Input
                type="number"
                placeholder="How many units of this type?"
                value={formData.quantity || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, quantity: e.target.value ? Number(e.target.value) : undefined }))}
                className="rounded-xl"
              />
            </div>

            {/* Floor Plan Upload */}
            <div className="space-y-2">
              <Label>Floor Plan</Label>
              {formData.floorPlanUrl ? (
                <div className="relative">
                  <div className="aspect-[4/3] rounded-lg overflow-hidden bg-muted border">
                    {formData.floorPlanUrl.endsWith('.pdf') ? (
                      <div className="w-full h-full flex flex-col items-center justify-center">
                        <Image className="h-10 w-10 text-muted-foreground mb-2" />
                        <span className="text-sm text-muted-foreground">PDF Floor Plan</span>
                      </div>
                    ) : (
                      <img
                        src={formData.floorPlanUrl}
                        alt="Floor plan preview"
                        className="w-full h-full object-contain"
                      />
                    )}
                  </div>
                  <Button
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2 h-7 w-7 rounded-full"
                    onClick={removeFloorPlan}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div
                  className="border-2 border-dashed border-muted-foreground/20 rounded-lg p-6 text-center cursor-pointer hover:border-primary/40 transition-colors"
                  onClick={() => fileInputRef.current?.click()}
                >
                  {isUploading ? (
                    <Loader2 className="h-8 w-8 mx-auto animate-spin text-primary" />
                  ) : (
                    <>
                      <Upload className="h-8 w-8 mx-auto text-muted-foreground/40 mb-2" />
                      <p className="text-sm text-muted-foreground">
                        Click to upload floor plan
                      </p>
                      <p className="text-xs text-muted-foreground/60 mt-1">
                        JPG, PNG, WebP, or PDF up to 10MB
                      </p>
                    </>
                  )}
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,application/pdf"
                className="hidden"
                onChange={handleFloorPlanUpload}
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setIsDialogOpen(false)} className="rounded-xl">
              Cancel
            </Button>
            <Button onClick={handleSave} className="rounded-xl">
              {editingUnit ? 'Save Changes' : 'Add Unit Type'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
