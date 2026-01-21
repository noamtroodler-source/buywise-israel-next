import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Loader2, Home, DollarSign, MapPin, Building2, Calendar, Sparkles, ImageIcon, Save, Send } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { ImageUpload } from '@/components/agent/ImageUpload';
import { useCreateProperty, CreatePropertyData } from '@/hooks/useAgentProperties';
import { PropertyType, ListingStatus } from '@/types/database';
import { AddressAutocomplete } from '@/components/agent/wizard/AddressAutocomplete';

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

const acTypes = [
  { value: 'none', label: 'No A/C' },
  { value: 'split', label: 'Split Units (מפוצל)' },
  { value: 'central', label: 'Central A/C (מרכזי)' },
  { value: 'mini_central', label: 'Mini Central (מיני מרכזי)' },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
};

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
    entry_date: undefined,
    ac_type: undefined,
    vaad_bayit_monthly: undefined,
  });

  const [isImmediateEntry, setIsImmediateEntry] = useState(true);

  const [featuresInput, setFeaturesInput] = useState('');

  const updateField = <K extends keyof CreatePropertyData>(field: K, value: CreatePropertyData[K]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent, submitForReview: boolean = false) => {
    e.preventDefault();
    
    const features = featuresInput
      .split(',')
      .map(f => f.trim())
      .filter(Boolean);

    createProperty.mutate(
      { ...formData, features, submitForReview },
      { onSuccess: () => navigate('/agent/properties') }
    );
  };

  return (
    <Layout>
      <div className="min-h-screen relative">
        {/* Background Effects */}
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-primary/[0.02] to-background -z-10" />
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/5 rounded-full blur-3xl -z-10" />
        <div className="absolute top-40 right-20 w-96 h-96 bg-primary/3 rounded-full blur-3xl -z-10" />

        <div className="container py-8 max-w-3xl">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-6"
          >
            {/* Back Button */}
            <motion.div variants={itemVariants}>
              <Button variant="ghost" onClick={() => navigate(-1)} className="rounded-xl hover:bg-primary/5 -ml-2">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            </motion.div>

            {/* Premium Gradient Header */}
            <motion.div variants={itemVariants}>
              <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border border-primary/20 p-6">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,hsl(var(--primary)/0.08),transparent_50%)]" />
                <div className="relative flex items-center gap-4">
                  <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Home className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold">Add New Property</h1>
                    <p className="text-muted-foreground">Create a new listing for your property</p>
                  </div>
                </div>
              </div>
            </motion.div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Basic Info */}
              <motion.div variants={itemVariants}>
                <Card className="rounded-2xl border-primary/20 hover:shadow-lg hover:border-primary/30 transition-all">
                  <CardContent className="pt-6 space-y-4">
                    <div className="flex items-center gap-3 pb-2">
                      <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Home className="h-4 w-4 text-primary" />
                      </div>
                      <h3 className="font-semibold text-foreground">Basic Information</h3>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="title">Title *</Label>
                      <Input
                        id="title"
                        value={formData.title}
                        onChange={(e) => updateField('title', e.target.value)}
                        placeholder="Beautiful 3-bedroom apartment in Tel Aviv"
                        className="h-11 rounded-xl"
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
                        className="rounded-xl resize-none"
                      />
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label>Property Type *</Label>
                        <Select
                          value={formData.property_type}
                          onValueChange={(v) => updateField('property_type', v as PropertyType)}
                        >
                          <SelectTrigger className="h-11 rounded-xl">
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
                          <SelectTrigger className="h-11 rounded-xl">
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
                  </CardContent>
                </Card>
              </motion.div>

              {/* Pricing */}
              <motion.div variants={itemVariants}>
                <Card className="rounded-2xl border-primary/20 hover:shadow-lg hover:border-primary/30 transition-all">
                  <CardContent className="pt-6 space-y-4">
                    <div className="flex items-center gap-3 pb-2">
                      <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                        <DollarSign className="h-4 w-4 text-primary" />
                      </div>
                      <h3 className="font-semibold text-foreground">Pricing</h3>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="price">Price (ILS) *</Label>
                        <Input
                          id="price"
                          type="number"
                          min="0"
                          value={formData.price}
                          onChange={(e) => updateField('price', Number(e.target.value))}
                          className="h-11 rounded-xl"
                          required
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Location */}
              <motion.div variants={itemVariants}>
                <Card className="rounded-2xl border-primary/20 hover:shadow-lg hover:border-primary/30 transition-all">
                  <CardContent className="pt-6 space-y-4">
                    <div className="flex items-center gap-3 pb-2">
                      <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                        <MapPin className="h-4 w-4 text-primary" />
                      </div>
                      <h3 className="font-semibold text-foreground">Location</h3>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="city">City *</Label>
                        <Input
                          id="city"
                          value={formData.city}
                          onChange={(e) => updateField('city', e.target.value)}
                          className="h-11 rounded-xl"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="neighborhood">Neighborhood</Label>
                        <Input
                          id="neighborhood"
                          value={formData.neighborhood || ''}
                          onChange={(e) => updateField('neighborhood', e.target.value)}
                          className="h-11 rounded-xl"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="address">Address *</Label>
                      <AddressAutocomplete
                        value={formData.address}
                        onAddressSelect={(address) => {
                          updateField('address', address.fullAddress);
                          updateField('city', address.city);
                          updateField('neighborhood', address.neighborhood);
                          updateField('latitude', address.latitude);
                          updateField('longitude', address.longitude);
                        }}
                        onInputChange={() => {
                          updateField('latitude', undefined);
                          updateField('longitude', undefined);
                        }}
                        placeholder="Start typing: Rothschild 42, Tel Aviv..."
                        className="h-11 rounded-xl"
                      />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Property Details */}
              <motion.div variants={itemVariants}>
                <Card className="rounded-2xl border-primary/20 hover:shadow-lg hover:border-primary/30 transition-all">
                  <CardContent className="pt-6 space-y-4">
                    <div className="flex items-center gap-3 pb-2">
                      <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Building2 className="h-4 w-4 text-primary" />
                      </div>
                      <h3 className="font-semibold text-foreground">Property Details</h3>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                      <div className="space-y-2">
                        <Label htmlFor="bedrooms">Bedrooms</Label>
                        <Input
                          id="bedrooms"
                          type="number"
                          min="0"
                          value={formData.bedrooms}
                          onChange={(e) => updateField('bedrooms', Number(e.target.value))}
                          className="h-11 rounded-xl"
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
                          className="h-11 rounded-xl"
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
                          className="h-11 rounded-xl"
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
                          className="h-11 rounded-xl"
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
                          className="h-11 rounded-xl"
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
                          className="h-11 rounded-xl"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Availability & Building */}
              <motion.div variants={itemVariants}>
                <Card className="rounded-2xl border-primary/20 hover:shadow-lg hover:border-primary/30 transition-all">
                  <CardContent className="pt-6 space-y-4">
                    <div className="flex items-center gap-3 pb-2">
                      <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Calendar className="h-4 w-4 text-primary" />
                      </div>
                      <h3 className="font-semibold text-foreground">Availability & Building</h3>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label>Entry Date</Label>
                        <div className="space-y-2">
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="immediate"
                              checked={isImmediateEntry}
                              onCheckedChange={(checked) => {
                                setIsImmediateEntry(!!checked);
                                if (checked) updateField('entry_date', undefined);
                              }}
                            />
                            <Label htmlFor="immediate" className="text-sm font-normal">Immediate entry</Label>
                          </div>
                          {!isImmediateEntry && (
                            <Input
                              type="date"
                              value={formData.entry_date || ''}
                              onChange={(e) => updateField('entry_date', e.target.value || undefined)}
                              min={new Date().toISOString().split('T')[0]}
                              className="h-11 rounded-xl"
                            />
                          )}
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>A/C Type</Label>
                        <Select
                          value={formData.ac_type || ''}
                          onValueChange={(v) => updateField('ac_type', v as CreatePropertyData['ac_type'])}
                        >
                          <SelectTrigger className="h-11 rounded-xl">
                            <SelectValue placeholder="Select A/C type" />
                          </SelectTrigger>
                          <SelectContent>
                            {acTypes.map((type) => (
                              <SelectItem key={type.value} value={type.value}>
                                {type.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="vaad_bayit">Va'ad Bayit (₪/month)</Label>
                        <Input
                          id="vaad_bayit"
                          type="number"
                          min="0"
                          value={formData.vaad_bayit_monthly || ''}
                          onChange={(e) => updateField('vaad_bayit_monthly', e.target.value ? Number(e.target.value) : undefined)}
                          placeholder="e.g. 350"
                          className="h-11 rounded-xl"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Features */}
              <motion.div variants={itemVariants}>
                <Card className="rounded-2xl border-primary/20 hover:shadow-lg hover:border-primary/30 transition-all">
                  <CardContent className="pt-6 space-y-4">
                    <div className="flex items-center gap-3 pb-2">
                      <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Sparkles className="h-4 w-4 text-primary" />
                      </div>
                      <h3 className="font-semibold text-foreground">Features</h3>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="features">Features (comma-separated)</Label>
                      <Input
                        id="features"
                        value={featuresInput}
                        onChange={(e) => setFeaturesInput(e.target.value)}
                        placeholder="Balcony, Parking, Elevator, Storage, Safe room"
                        className="h-11 rounded-xl"
                      />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Images */}
              <motion.div variants={itemVariants}>
                <Card className="rounded-2xl border-primary/20 hover:shadow-lg hover:border-primary/30 transition-all">
                  <CardContent className="pt-6 space-y-4">
                    <div className="flex items-center gap-3 pb-2">
                      <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                        <ImageIcon className="h-4 w-4 text-primary" />
                      </div>
                      <h3 className="font-semibold text-foreground">Images</h3>
                    </div>
                    <ImageUpload
                      images={formData.images || []}
                      onImagesChange={(images) => updateField('images', images)}
                    />
                  </CardContent>
                </Card>
              </motion.div>

              {/* Sticky Submit */}
              <motion.div variants={itemVariants} className="sticky bottom-4">
                <div className="flex flex-col sm:flex-row items-center gap-3 p-4 rounded-2xl bg-card/95 backdrop-blur-sm border border-border shadow-lg">
                  <Button
                    type="button"
                    onClick={(e) => handleSubmit(e, true)}
                    className="flex-1 w-full sm:w-auto rounded-xl h-11"
                    disabled={createProperty.isPending}
                  >
                    {createProperty.isPending ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4 mr-2" />
                    )}
                    Submit for Review
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={(e) => handleSubmit(e, false)}
                    disabled={createProperty.isPending}
                    className="w-full sm:w-auto rounded-xl h-11"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Save as Draft
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => navigate(-1)}
                    className="w-full sm:w-auto rounded-xl h-11"
                  >
                    Cancel
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground text-center mt-3">
                  All listings are reviewed before going live to ensure quality.
                </p>
              </motion.div>
            </form>
          </motion.div>
        </div>
      </div>
    </Layout>
  );
}
