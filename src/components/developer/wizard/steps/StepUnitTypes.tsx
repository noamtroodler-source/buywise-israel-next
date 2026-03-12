import { useState, useRef } from 'react';
import { Plus, Trash2, Edit2, Upload, Home, Bed, Bath, Ruler, Layers, DollarSign, Image, X, Loader2, GripVertical, HelpCircle } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { FormattedNumberInput } from '@/components/ui/formatted-number-input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useProjectWizard, UnitTypeData, OutdoorSpaceType } from '../ProjectWizardContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const UNIT_TYPE_PRESETS = [
  { value: 'Studio', label: 'Studio (1–1.5 rooms)' },
  { value: '1 Bedroom', label: '1 Bedroom (2 rooms)' },
  { value: '2 Bedroom', label: '2 Bedroom (3 rooms)' },
  { value: '3 Bedroom', label: '3 Bedroom (4 rooms)' },
  { value: '4 Bedroom', label: '4 Bedroom (5 rooms)' },
  { value: '5 Bedroom', label: '5 Bedroom (6 rooms)' },
  { value: 'Garden Apartment', label: 'Garden Apartment' },
  { value: 'Penthouse', label: 'Penthouse' },
  { value: 'Duplex', label: 'Duplex' },
  { value: 'Mini Penthouse', label: 'Mini Penthouse' },
  { value: 'Custom', label: 'Custom' },
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
  additionalRooms: 1,
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

// Sortable Unit Card Component
interface SortableUnitCardProps {
  unitType: UnitTypeData;
  onEdit: () => void;
  onDelete: () => void;
  formatPrice: (price: number) => string;
}

function SortableUnitCard({ unitType, onEdit, onDelete, formatPrice }: SortableUnitCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: unitType.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={cn(
        "group hover:border-primary/30 transition-colors",
        isDragging && "opacity-50 shadow-xl z-50 bg-card"
      )}
    >
      <CardContent className="p-4">
        <div className="flex gap-3">
          {/* Drag Handle */}
          <div
            {...attributes}
            {...listeners}
            className="flex items-center justify-center w-6 cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground transition-colors flex-shrink-0 touch-none"
          >
            <GripVertical className="h-5 w-5" />
          </div>

          <div className="flex flex-col sm:flex-row gap-4 flex-1 min-w-0">
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
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onEdit}>
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={onDelete}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Bed className="h-3.5 w-3.5" />
                  {unitType.bedrooms} Bed{unitType.additionalRooms > 0 ? ` + ${unitType.additionalRooms}` : ''}
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
        </div>
      </CardContent>
    </Card>
  );
}

export function StepUnitTypes() {
  const { data, updateData } = useProjectWizard();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingUnit, setEditingUnit] = useState<UnitTypeData | null>(null);
  const [formData, setFormData] = useState<Omit<UnitTypeData, 'id'>>(defaultUnitType);
  const [isUploading, setIsUploading] = useState(false);
  const [customName, setCustomName] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Drag-and-drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = data.unit_types.findIndex(ut => ut.id === active.id);
      const newIndex = data.unit_types.findIndex(ut => ut.id === over.id);

      updateData({
        unit_types: arrayMove(data.unit_types, oldIndex, newIndex),
      });

      toast.success('Unit type order updated');
    }
  };

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
      additionalRooms: unitType.additionalRooms,
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
    // No toast - item disappears from list visually
  };

  // Validation helpers for range fields
  const sizeRangeError = formData.sizeMin && formData.sizeMax && formData.sizeMin > formData.sizeMax;
  const floorRangeError = formData.floorMin && formData.floorMax && formData.floorMin > formData.floorMax;
  const priceRangeError = formData.priceMin && formData.priceMax && formData.priceMin > formData.priceMax;

  const handleSave = () => {
    const finalName = formData.name === 'Custom' ? customName : formData.name;
    
    // Validate all required fields (everything except floor plan)
    const errors: string[] = [];
    
    if (!finalName) {
      errors.push('Unit type name');
    }
    if (formData.bedrooms === undefined || formData.bedrooms === null) {
      errors.push('Rooms');
    }
    if (formData.bathrooms === undefined || formData.bathrooms === null) {
      errors.push('Bathrooms');
    }
    if (!formData.sizeMin) {
      errors.push('Size (From)');
    }
    if (!formData.sizeMax) {
      errors.push('Size (To)');
    }
    if (!formData.floorMin) {
      errors.push('Floor (From)');
    }
    if (!formData.floorMax) {
      errors.push('Floor (To)');
    }
    if (!formData.priceMin) {
      errors.push('Price (From)');
    }
    if (!formData.priceMax) {
      errors.push('Price (To)');
    }
    if (!formData.outdoorSpace) {
      errors.push('Outdoor space');
    }
    if (!formData.quantity) {
      errors.push('Number of units');
    }

    // Check range validations
    if (sizeRangeError) {
      errors.push('Size range invalid');
    }
    if (floorRangeError) {
      errors.push('Floor range invalid');
    }
    if (priceRangeError) {
      errors.push('Price range invalid');
    }

    if (errors.length > 0) {
      toast.error(`Please fix: ${errors.slice(0, 3).join(', ')}${errors.length > 3 ? ` and ${errors.length - 3} more` : ''}`);
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

    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      toast.error('Please upload a JPG, PNG, or WebP image');
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
          Define the types of units available in your project. Drag to reorder how they appear on the project page.
        </p>
      </div>

      {/* Unit Type Cards with Drag-and-Drop */}
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
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={data.unit_types.map(ut => ut.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-4">
                  {data.unit_types.map((unitType) => (
                    <SortableUnitCard
                      key={unitType.id}
                      unitType={unitType}
                      onEdit={() => handleEdit(unitType)}
                      onDelete={() => handleDelete(unitType.id)}
                      formatPrice={formatPrice}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>

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
          significantly more inquiries. Drag the grip handle to reorder unit types.
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

{/* Bedrooms, Other Rooms & Bathrooms */}
              <div className="grid grid-cols-3 gap-4">
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
                <Label>Other Rooms</Label>
                <Select
                  value={String(formData.additionalRooms)}
                  onValueChange={(v) => setFormData(prev => ({ ...prev, additionalRooms: Number(v) }))}
                >
                  <SelectTrigger className="rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[0, 1, 2, 3].map((n) => (
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
              <Label>Size Range (m²) *</Label>
              <div className="grid grid-cols-2 gap-3">
                <FormattedNumberInput
                  value={formData.sizeMin}
                  onChange={(v) => setFormData(prev => ({ ...prev, sizeMin: v }))}
                  placeholder="From"
                  className={cn("rounded-xl", sizeRangeError && "border-primary ring-1 ring-primary")}
                />
                <FormattedNumberInput
                  value={formData.sizeMax}
                  onChange={(v) => setFormData(prev => ({ ...prev, sizeMax: v }))}
                  placeholder="To"
                  className={cn("rounded-xl", sizeRangeError && "border-primary ring-1 ring-primary")}
                />
              </div>
              {sizeRangeError && (
                <p className="text-sm text-primary flex items-center gap-1.5 bg-primary/10 px-3 py-1.5 rounded-lg">
                  "From" must be smaller than "To"
                </p>
              )}
            </div>

            {/* Floor Range */}
            <div className="space-y-2">
              <div className="flex items-center gap-1.5">
                <Label>Floor Range *</Label>
                <TooltipProvider delayDuration={0}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button type="button" className="inline-flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors">
                        <HelpCircle className="h-3.5 w-3.5" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs text-sm">
                      <p>Which floors of the building is this unit type available on? For example, 2-10 means this unit type exists on floors 2 through 10.</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Input
                  type="number"
                  placeholder="From"
                  value={formData.floorMin || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, floorMin: e.target.value ? Number(e.target.value) : undefined }))}
                  className={cn("rounded-xl", floorRangeError && "border-primary ring-1 ring-primary")}
                />
                <Input
                  type="number"
                  placeholder="To"
                  value={formData.floorMax || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, floorMax: e.target.value ? Number(e.target.value) : undefined }))}
                  className={cn("rounded-xl", floorRangeError && "border-primary ring-1 ring-primary")}
                />
              </div>
              {floorRangeError && (
                <p className="text-sm text-primary flex items-center gap-1.5 bg-primary/10 px-3 py-1.5 rounded-lg">
                  "From" must be smaller than "To"
                </p>
              )}
            </div>

            {/* Price Range */}
            <div className="space-y-2">
              <Label>Price Range (₪) *</Label>
              <div className="grid grid-cols-2 gap-3">
                <FormattedNumberInput
                  value={formData.priceMin}
                  onChange={(v) => setFormData(prev => ({ ...prev, priceMin: v }))}
                  placeholder="From"
                  className={cn("rounded-xl", priceRangeError && "border-primary ring-1 ring-primary")}
                  prefix="₪"
                />
                <FormattedNumberInput
                  value={formData.priceMax}
                  onChange={(v) => setFormData(prev => ({ ...prev, priceMax: v }))}
                  placeholder="To"
                  className={cn("rounded-xl", priceRangeError && "border-primary ring-1 ring-primary")}
                  prefix="₪"
                />
              </div>
              {priceRangeError && (
                <p className="text-sm text-primary flex items-center gap-1.5 bg-primary/10 px-3 py-1.5 rounded-lg">
                  "From" must be smaller than "To"
                </p>
              )}
            </div>

            {/* Outdoor Space */}
            <div className="space-y-2">
              <Label>Outdoor Space *</Label>
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
              <Label>Number of Units *</Label>
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
                        JPG, PNG, or WebP up to 10MB
                      </p>
                    </>
                  )}
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
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
