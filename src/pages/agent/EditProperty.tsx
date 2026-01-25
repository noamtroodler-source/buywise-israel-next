import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Loader2, AlertCircle, CheckCircle2, Clock, Send, XCircle, ShieldAlert } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { ImageUpload } from '@/components/agent/ImageUpload';
import { useProperty } from '@/hooks/useProperties';
import { useUpdateProperty, useSubmitForReview, VerificationStatus, useAgentProfile } from '@/hooks/useAgentProperties';
import { PropertyType, ListingStatus } from '@/types/database';
import { AddressAutocomplete } from '@/components/agent/wizard/AddressAutocomplete';
import { GoogleMapsProvider } from '@/components/maps/GoogleMapsProvider';

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
  { value: 'sold', label: 'Sold' },
  { value: 'rented', label: 'Rented' },
];

const acTypes = [
  { value: 'none', label: 'No A/C' },
  { value: 'split', label: 'Split Units (מפוצל)' },
  { value: 'central', label: 'Central A/C (מרכזי)' },
  { value: 'mini_central', label: 'Mini Central (מיני מרכזי)' },
];

const statusConfig: Record<VerificationStatus, { 
  label: string; 
  variant: 'default' | 'secondary' | 'destructive' | 'outline'; 
  icon: typeof Clock;
  description: string;
}> = {
  draft: { 
    label: 'Draft', 
    variant: 'secondary', 
    icon: Clock,
    description: 'This listing is a draft. Submit for review to get it published.'
  },
  pending_review: { 
    label: 'Pending Review', 
    variant: 'secondary', 
    icon: Clock,
    description: 'This listing is awaiting admin review. You\'ll be notified once reviewed.'
  },
  approved: { 
    label: 'Published', 
    variant: 'default', 
    icon: CheckCircle2,
    description: 'This listing is live and visible to buyers. Major changes will require re-review.'
  },
  changes_requested: { 
    label: 'Changes Requested', 
    variant: 'destructive', 
    icon: AlertCircle,
    description: 'Admin has requested changes. Please review the feedback and re-submit.'
  },
  rejected: { 
    label: 'Rejected', 
    variant: 'destructive', 
    icon: XCircle,
    description: 'This listing was rejected. Please review the feedback below.'
  },
};

export default function EditProperty() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: property, isLoading } = useProperty(id || '');
  const { data: agentProfile } = useAgentProfile();
  const updateProperty = useUpdateProperty();
  const submitForReview = useSubmitForReview();
  
  // Check if agent is verified (status is 'active')
  const isAgentVerified = agentProfile?.status === 'active';

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    property_type: 'apartment' as PropertyType,
    listing_status: 'for_sale' as ListingStatus,
    price: 0,
    address: '',
    city: '',
    neighborhood: '',
    bedrooms: 0,
    bathrooms: 0,
    size_sqm: undefined as number | undefined,
    floor: undefined as number | undefined,
    total_floors: undefined as number | undefined,
    year_built: undefined as number | undefined,
    images: [] as string[],
    entry_date: undefined as string | undefined,
    ac_type: undefined as 'none' | 'split' | 'central' | 'mini_central' | undefined,
    vaad_bayit_monthly: undefined as number | undefined,
  });

  const [featuresInput, setFeaturesInput] = useState('');
  const [isImmediateEntry, setIsImmediateEntry] = useState(true);

  const verificationStatus = ((property as any)?.verification_status || 'draft') as VerificationStatus;
  const rejectionReason = (property as any)?.rejection_reason;
  const statusInfo = statusConfig[verificationStatus];
  const StatusIcon = statusInfo?.icon || Clock;

  useEffect(() => {
    if (property) {
      setFormData({
        title: property.title,
        description: property.description || '',
        property_type: property.property_type,
        listing_status: property.listing_status,
        price: property.price,
        address: property.address,
        city: property.city,
        neighborhood: property.neighborhood || '',
        bedrooms: property.bedrooms,
        bathrooms: property.bathrooms,
        size_sqm: property.size_sqm || undefined,
        floor: property.floor || undefined,
        total_floors: property.total_floors || undefined,
        year_built: property.year_built || undefined,
        images: property.images || [],
        entry_date: property.entry_date || undefined,
        ac_type: property.ac_type || undefined,
        vaad_bayit_monthly: property.vaad_bayit_monthly || undefined,
      });
      setFeaturesInput(property.features?.join(', ') || '');
      setIsImmediateEntry(!property.entry_date);
    }
  }, [property]);

  const updateField = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;

    const features = featuresInput
      .split(',')
      .map(f => f.trim())
      .filter(Boolean);

    updateProperty.mutate(
      { id, ...formData, features },
      { onSuccess: () => navigate('/agent/properties') }
    );
  };

  const handleSubmitForReview = () => {
    if (!id) return;
    
    // First save changes, then submit for review
    const features = featuresInput
      .split(',')
      .map(f => f.trim())
      .filter(Boolean);

    updateProperty.mutate(
      { id, ...formData, features },
      { 
        onSuccess: () => {
          submitForReview.mutate(id, {
            onSuccess: () => navigate('/agent/properties')
          });
        }
      }
    );
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  if (!property) {
    return (
      <Layout>
        <div className="container py-8 text-center">
          <p className="text-muted-foreground">Property not found</p>
          <Button onClick={() => navigate('/agent/properties')} className="mt-4">
            Back to Properties
          </Button>
        </div>
      </Layout>
    );
  }

  const canResubmit = verificationStatus === 'draft' || verificationStatus === 'changes_requested' || verificationStatus === 'rejected';
  const isLive = verificationStatus === 'approved';
  const isPending = verificationStatus === 'pending_review';

  return (
    <GoogleMapsProvider>
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

          {/* Status Banner */}
          <Card className={
            verificationStatus === 'approved' ? 'border-green-200 bg-green-50/50' :
            verificationStatus === 'changes_requested' || verificationStatus === 'rejected' ? 'border-red-200 bg-red-50/50' :
            verificationStatus === 'pending_review' ? 'border-yellow-200 bg-yellow-50/50' :
            ''
          }>
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <StatusIcon className={
                  verificationStatus === 'approved' ? 'h-6 w-6 text-green-600' :
                  verificationStatus === 'changes_requested' || verificationStatus === 'rejected' ? 'h-6 w-6 text-red-600' :
                  verificationStatus === 'pending_review' ? 'h-6 w-6 text-yellow-600' :
                  'h-6 w-6 text-muted-foreground'
                } />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold">Status</h3>
                    <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">{statusInfo.description}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Rejection/Feedback Alert */}
          {(verificationStatus === 'changes_requested' || verificationStatus === 'rejected') && rejectionReason && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Admin Feedback</AlertTitle>
              <AlertDescription className="mt-2 whitespace-pre-wrap">
                {rejectionReason}
              </AlertDescription>
            </Alert>
          )}

          {/* Live Listing Warning */}
          {isLive && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Live Listing</AlertTitle>
              <AlertDescription>
                This listing is currently published. Saving changes will update the live listing immediately. 
                Major changes may trigger a re-review.
              </AlertDescription>
            </Alert>
          )}

          {/* Pending Review Notice */}
          {isPending && (
            <Alert className="border-yellow-200 bg-yellow-50">
              <Clock className="h-4 w-4 text-yellow-600" />
              <AlertTitle className="text-yellow-800">Under Review</AlertTitle>
              <AlertDescription className="text-yellow-700">
                This listing is currently being reviewed. You can still make edits, but they won't affect the review process.
              </AlertDescription>
            </Alert>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Edit Property</CardTitle>
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
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => updateField('description', e.target.value)}
                      rows={4}
                    />
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Property Type *</Label>
                      <Select
                        value={formData.property_type}
                        onValueChange={(v) => updateField('property_type', v)}
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
                        onValueChange={(v) => updateField('listing_status', v)}
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
                        value={formData.neighborhood}
                        onChange={(e) => updateField('neighborhood', e.target.value)}
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

                {/* Availability & Building Details */}
                <div className="space-y-4">
                  <h3 className="font-medium">Availability & Building</h3>
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
                          />
                        )}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>A/C Type</Label>
                      <Select
                        value={formData.ac_type || ''}
                        onValueChange={(v) => updateField('ac_type', v)}
                      >
                        <SelectTrigger>
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
                      placeholder="Balcony, Parking, Elevator, Storage, Safe room"
                    />
                  </div>
                </div>

                {/* Images */}
                <div className="space-y-4">
                  <h3 className="font-medium">Images</h3>
                  <ImageUpload
                    images={formData.images}
                    onImagesChange={(images) => updateField('images', images)}
                  />
                </div>

                {/* Submit Buttons */}
                <div className="flex flex-col sm:flex-row gap-4 pt-4 border-t">
                  {/* Save Changes - Always available */}
                  <Button
                    type="submit"
                    variant={canResubmit ? 'outline' : 'default'}
                    className="flex-1"
                    disabled={updateProperty.isPending || submitForReview.isPending}
                  >
                    {updateProperty.isPending && (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    )}
                    {isLive ? 'Update Live Listing' : 'Save Changes'}
                  </Button>

                  {/* Submit for Review - Only for draft/changes_requested/rejected AND verified agents */}
                  {canResubmit && (
                    <div className="flex flex-col gap-2 flex-1">
                      {!isAgentVerified && (
                        <div className="flex items-center gap-2 text-xs text-amber-600">
                          <ShieldAlert className="h-3 w-3" />
                          <span>Agent verification required</span>
                        </div>
                      )}
                      <Button
                        type="button"
                        onClick={handleSubmitForReview}
                        className="w-full"
                        disabled={updateProperty.isPending || submitForReview.isPending || !isAgentVerified}
                        title={!isAgentVerified ? 'Your agent license must be verified before submitting listings' : undefined}
                      >
                        {submitForReview.isPending && (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        )}
                        <Send className="h-4 w-4 mr-2" />
                        {verificationStatus === 'changes_requested' || verificationStatus === 'rejected' 
                          ? 'Re-submit for Review' 
                          : 'Submit for Review'}
                      </Button>
                    </div>
                  )}

                  <Button
                    type="button"
                    variant="ghost"
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
    </GoogleMapsProvider>
  );
}
