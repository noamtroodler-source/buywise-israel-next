import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { ImageUpload } from '@/components/agent/ImageUpload';
import { useCreateProperty, CreatePropertyData } from '@/hooks/useAgentProperties';
import { PropertyType, ListingStatus } from '@/types/database';

const propertyTypes: { value: PropertyType; label: string }[] = [
  { value: 'apartment', label: 'Apartment' },
  { value: 'house', label: 'House' },
  { value: 'penthouse', label: 'Penthouse' },
  { value: 'cottage', label: 'Cottage' },
  { value: 'land', label: 'Land' },
  { value: 'commercial', label: 'Commercial' },
];

const listingStatuses: { value: ListingStatus; label: string }[] = [
  { value: 'for_sale', label: 'For Sale' },
  { value: 'for_rent', label: 'For Rent' },
];

export default function NewProperty() {
  const navigate = useNavigate();
  const createProperty = useCreateProperty();

  const [formData, setFormData] = useState<CreatePropertyData>({
    title: '',
    description: '',
    property_type: 'apartment',
    listing_status: 'for_sale',
    price: 0,
    currency: 'ILS',
    address: '',
    city: '',
    neighborhood: '',
    bedrooms: 0,
    bathrooms: 0,
    size_sqm: undefined,
    floor: undefined,
    total_floors: undefined,
    year_built: undefined,
    features: [],
    images: [],
    is_published: true,
  });

  const [featuresInput, setFeaturesInput] = useState('');

  const updateField = <K extends keyof CreatePropertyData>(field: K, value: CreatePropertyData[K]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const features = featuresInput
      .split(',')
      .map(f => f.trim())
      .filter(Boolean);

    createProperty.mutate(
      { ...formData, features },
      { onSuccess: () => navigate('/agent/properties') }
    );
  };

  return (
    <Layout>
      <div className="container py-8 max-w-3xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <Button variant="ghost" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>

          <Card>
            <CardHeader>
              <CardTitle>Add New Property</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Basic Info */}
                <div className="space-y-4">
                  <h3 className="font-medium">Basic Information</h3>
                  
                  <div className="space-y-2">
                    <Label htmlFor="title">Title *</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => updateField('title', e.target.value)}
                      placeholder="Beautiful 3-bedroom apartment in Tel Aviv"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={formData.description || ''}
                      onChange={(e) => updateField('description', e.target.value)}
                      placeholder="Describe the property..."
                      rows={4}
                    />
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Property Type *</Label>
                      <Select
                        value={formData.property_type}
                        onValueChange={(v) => updateField('property_type', v as PropertyType)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {propertyTypes.map((type) => (
                            <SelectItem key={type.value} value={type.value}>
                              {type.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Listing Status *</Label>
                      <Select
                        value={formData.listing_status}
                        onValueChange={(v) => updateField('listing_status', v as ListingStatus)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {listingStatuses.map((status) => (
                            <SelectItem key={status.value} value={status.value}>
                              {status.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                {/* Price */}
                <div className="space-y-4">
                  <h3 className="font-medium">Pricing</h3>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="price">Price (ILS) *</Label>
                      <Input
                        id="price"
                        type="number"
                        min="0"
                        value={formData.price}
                        onChange={(e) => updateField('price', Number(e.target.value))}
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Location */}
                <div className="space-y-4">
                  <h3 className="font-medium">Location</h3>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="city">City *</Label>
                      <Input
                        id="city"
                        value={formData.city}
                        onChange={(e) => updateField('city', e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="neighborhood">Neighborhood</Label>
                      <Input
                        id="neighborhood"
                        value={formData.neighborhood || ''}
                        onChange={(e) => updateField('neighborhood', e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="address">Address *</Label>
                    <Input
                      id="address"
                      value={formData.address}
                      onChange={(e) => updateField('address', e.target.value)}
                      required
                    />
                  </div>
                </div>

                {/* Details */}
                <div className="space-y-4">
                  <h3 className="font-medium">Property Details</h3>
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <div className="space-y-2">
                      <Label htmlFor="bedrooms">Bedrooms</Label>
                      <Input
                        id="bedrooms"
                        type="number"
                        min="0"
                        value={formData.bedrooms}
                        onChange={(e) => updateField('bedrooms', Number(e.target.value))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="bathrooms">Bathrooms</Label>
                      <Input
                        id="bathrooms"
                        type="number"
                        min="0"
                        value={formData.bathrooms}
                        onChange={(e) => updateField('bathrooms', Number(e.target.value))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="size_sqm">Size (m²)</Label>
                      <Input
                        id="size_sqm"
                        type="number"
                        min="0"
                        value={formData.size_sqm || ''}
                        onChange={(e) => updateField('size_sqm', e.target.value ? Number(e.target.value) : undefined)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="year_built">Year Built</Label>
                      <Input
                        id="year_built"
                        type="number"
                        min="1900"
                        max={new Date().getFullYear()}
                        value={formData.year_built || ''}
                        onChange={(e) => updateField('year_built', e.target.value ? Number(e.target.value) : undefined)}
                      />
                    </div>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="floor">Floor</Label>
                      <Input
                        id="floor"
                        type="number"
                        min="0"
                        value={formData.floor || ''}
                        onChange={(e) => updateField('floor', e.target.value ? Number(e.target.value) : undefined)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="total_floors">Total Floors</Label>
                      <Input
                        id="total_floors"
                        type="number"
                        min="0"
                        value={formData.total_floors || ''}
                        onChange={(e) => updateField('total_floors', e.target.value ? Number(e.target.value) : undefined)}
                      />
                    </div>
                  </div>
                </div>

                {/* Features */}
                <div className="space-y-4">
                  <h3 className="font-medium">Features</h3>
                  <div className="space-y-2">
                    <Label htmlFor="features">Features (comma-separated)</Label>
                    <Input
                      id="features"
                      value={featuresInput}
                      onChange={(e) => setFeaturesInput(e.target.value)}
                      placeholder="Balcony, Parking, Air conditioning, Storage"
                    />
                  </div>
                </div>

                {/* Images */}
                <div className="space-y-4">
                  <h3 className="font-medium">Images</h3>
                  <ImageUpload
                    images={formData.images || []}
                    onImagesChange={(images) => updateField('images', images)}
                  />
                </div>

                {/* Publish */}
                <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                  <div>
                    <p className="font-medium">Publish immediately</p>
                    <p className="text-sm text-muted-foreground">
                      Make this property visible to everyone
                    </p>
                  </div>
                  <Switch
                    checked={formData.is_published}
                    onCheckedChange={(checked) => updateField('is_published', checked)}
                  />
                </div>

                {/* Submit */}
                <div className="flex gap-4">
                  <Button
                    type="submit"
                    className="flex-1"
                    disabled={createProperty.isPending}
                  >
                    {createProperty.isPending && (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    )}
                    Create Property
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigate(-1)}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </Layout>
  );
}
