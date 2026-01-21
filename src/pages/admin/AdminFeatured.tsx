import { useState } from 'react';
import { Star, Home, Building, AlertTriangle, Plus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  useFeaturedPropertySlots,
  useFeaturedProjectSlots,
  useAvailablePropertiesForFeaturing,
  useAvailableProjectsForFeaturing,
  useAddFeaturedProperty,
  useAddFeaturedProject,
  useRemoveFeaturedSlot,
  useExpiringSoonCount,
  FeaturedProjectSlot as FeaturedProjectSlotType,
} from '@/hooks/useHomepageFeatured';
import { FeaturedPropertyCard } from '@/components/admin/FeaturedPropertyCard';
import { FeaturedProjectSlot } from '@/components/admin/FeaturedProjectSlot';
import { AddFeaturedModal } from '@/components/admin/AddFeaturedModal';

type PropertyListingType = 'for_sale' | 'for_rent';
type ProjectSlotTarget = { type: 'project_hero' | 'project_secondary'; position: number };

export default function AdminFeatured() {
  const [propertyTab, setPropertyTab] = useState<PropertyListingType>('for_sale');
  const [propertyModalOpen, setPropertyModalOpen] = useState(false);
  const [projectModalOpen, setProjectModalOpen] = useState(false);
  const [projectSlotTarget, setProjectSlotTarget] = useState<ProjectSlotTarget | null>(null);

  // Fetch data
  const { data: saleSlots, isLoading: saleLoading } = useFeaturedPropertySlots('property_sale');
  const { data: rentSlots, isLoading: rentLoading } = useFeaturedPropertySlots('property_rent');
  const { data: projectSlots, isLoading: projectsLoading } = useFeaturedProjectSlots();
  const { data: expiringSoon } = useExpiringSoonCount();

  // Available items for modals
  const { data: availableSaleProperties, isLoading: availableSaleLoading } = useAvailablePropertiesForFeaturing('for_sale');
  const { data: availableRentProperties, isLoading: availableRentLoading } = useAvailablePropertiesForFeaturing('for_rent');
  const { data: availableProjects, isLoading: availableProjectsLoading } = useAvailableProjectsForFeaturing();

  // Mutations
  const addProperty = useAddFeaturedProperty();
  const addProject = useAddFeaturedProject();
  const removeSlot = useRemoveFeaturedSlot();

  const currentSlots = propertyTab === 'for_sale' ? saleSlots : rentSlots;
  const currentLoading = propertyTab === 'for_sale' ? saleLoading : rentLoading;
  const currentAvailable = propertyTab === 'for_sale' ? availableSaleProperties : availableRentProperties;
  const currentAvailableLoading = propertyTab === 'for_sale' ? availableSaleLoading : availableRentLoading;

  // Get project slots by type
  const heroSlot = projectSlots?.find(s => s.slot_type === 'project_hero');
  const secondarySlots = projectSlots?.filter(s => s.slot_type === 'project_secondary') || [];

  const handleAddProperty = (property: any, expiresAt: Date | null) => {
    addProperty.mutate({
      propertyId: property.id,
      slotType: propertyTab === 'for_sale' ? 'property_sale' : 'property_rent',
      expiresAt,
    });
  };

  const handleAddProject = (project: any, expiresAt: Date | null) => {
    if (!projectSlotTarget) return;
    
    addProject.mutate({
      projectId: project.id,
      slotType: projectSlotTarget.type,
      position: projectSlotTarget.position,
      expiresAt,
    });
  };

  const openProjectModal = (type: 'project_hero' | 'project_secondary', position: number, existingSlot?: FeaturedProjectSlotType) => {
    // If there's an existing slot, remove it first
    if (existingSlot) {
      removeSlot.mutate(existingSlot.id);
    }
    setProjectSlotTarget({ type, position });
    setProjectModalOpen(true);
  };

  const formatPrice = (price: number, currency: string = 'ILS') => {
    return new Intl.NumberFormat('en-IL', {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(price);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Star className="h-8 w-8 text-yellow-500" />
          <div>
            <h2 className="text-2xl font-bold text-foreground">Homepage Featured</h2>
            <p className="text-muted-foreground">Manage which listings appear on the homepage</p>
          </div>
        </div>
        {expiringSoon && expiringSoon > 0 && (
          <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
            <AlertTriangle className="h-3 w-3 mr-1" />
            {expiringSoon} expiring soon
          </Badge>
        )}
      </div>

      {/* Expiring Alert */}
      {expiringSoon && expiringSoon > 0 && (
        <Alert className="border-yellow-200 bg-yellow-50">
          <AlertTriangle className="h-4 w-4 text-yellow-600" />
          <AlertDescription className="text-yellow-800">
            {expiringSoon} featured {expiringSoon === 1 ? 'listing is' : 'listings are'} expiring within the next 3 days. Review and update them below.
          </AlertDescription>
        </Alert>
      )}

      {/* Properties Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Home className="h-5 w-5 text-primary" />
              <CardTitle>Featured Properties</CardTitle>
            </div>
            <Button onClick={() => setPropertyModalOpen(true)} size="sm" className="gap-2">
              <Plus className="h-4 w-4" />
              Add Property
            </Button>
          </div>
          <CardDescription>
            Properties shown in the homepage showcase. Up to 8 per category.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={propertyTab} onValueChange={(v) => setPropertyTab(v as PropertyListingType)}>
            <TabsList className="mb-4">
              <TabsTrigger value="for_sale" className="gap-2">
                For Sale
                {saleSlots && <Badge variant="secondary" className="ml-1">{saleSlots.length}</Badge>}
              </TabsTrigger>
              <TabsTrigger value="for_rent" className="gap-2">
                For Rent
                {rentSlots && <Badge variant="secondary" className="ml-1">{rentSlots.length}</Badge>}
              </TabsTrigger>
            </TabsList>

            <TabsContent value={propertyTab} className="mt-0">
              {currentLoading ? (
                <div className="grid gap-3 sm:grid-cols-2">
                  {[1, 2, 3, 4].map((i) => (
                    <Skeleton key={i} className="h-28" />
                  ))}
                </div>
              ) : currentSlots && currentSlots.length > 0 ? (
                <div className="grid gap-3 sm:grid-cols-2">
                  {currentSlots.map((slot) => (
                    <FeaturedPropertyCard
                      key={slot.id}
                      slot={slot}
                      onRemove={(id) => removeSlot.mutate(id)}
                      isRemoving={removeSlot.isPending}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Home className="h-12 w-12 mx-auto mb-3 opacity-30" />
                  <p>No featured properties for {propertyTab === 'for_sale' ? 'sale' : 'rent'}</p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setPropertyModalOpen(true)}
                    className="mt-3"
                  >
                    Add your first
                  </Button>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Projects Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Building className="h-5 w-5 text-primary" />
            <CardTitle>Featured Projects</CardTitle>
          </div>
          <CardDescription>
            New development projects shown on the homepage. One hero (large) and two secondary (smaller).
          </CardDescription>
        </CardHeader>
        <CardContent>
          {projectsLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-48" />
              <div className="grid gap-4 sm:grid-cols-2">
                <Skeleton className="h-32" />
                <Skeleton className="h-32" />
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Hero Slot */}
              <FeaturedProjectSlot
                slot={heroSlot}
                slotLabel="Hero Project (Large Card)"
                isHero
                onRemove={(id) => removeSlot.mutate(id)}
                onAdd={() => openProjectModal('project_hero', 1, heroSlot)}
                isRemoving={removeSlot.isPending}
              />

              {/* Secondary Slots */}
              <div className="grid gap-4 sm:grid-cols-2">
                <FeaturedProjectSlot
                  slot={secondarySlots[0]}
                  slotLabel="Secondary #1"
                  onRemove={(id) => removeSlot.mutate(id)}
                  onAdd={() => openProjectModal('project_secondary', 1, secondarySlots[0])}
                  isRemoving={removeSlot.isPending}
                />
                <FeaturedProjectSlot
                  slot={secondarySlots[1]}
                  slotLabel="Secondary #2"
                  onRemove={(id) => removeSlot.mutate(id)}
                  onAdd={() => openProjectModal('project_secondary', 2, secondarySlots[1])}
                  isRemoving={removeSlot.isPending}
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Property Modal */}
      <AddFeaturedModal
        open={propertyModalOpen}
        onOpenChange={setPropertyModalOpen}
        title={`Add Featured Property (${propertyTab === 'for_sale' ? 'For Sale' : 'For Rent'})`}
        items={currentAvailable || []}
        isLoading={currentAvailableLoading}
        onSelect={handleAddProperty}
        getItemId={(p) => p.id}
        getSearchableText={(p) => `${p.title} ${p.city} ${p.neighborhood || ''}`}
        defaultExpiryDays={7}
        renderItem={(property) => (
          <div className="flex gap-3">
            <div className="w-14 h-14 rounded bg-muted flex-shrink-0 overflow-hidden">
              {property.images?.[0] ? (
                <img src={property.images[0]} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground">
                  No img
                </div>
              )}
            </div>
            <div className="min-w-0">
              <p className="font-medium text-sm truncate">{property.title}</p>
              <p className="text-xs text-muted-foreground">{property.city}</p>
              <p className="text-sm font-semibold text-primary">
                {formatPrice(property.price, property.currency)}
              </p>
            </div>
          </div>
        )}
      />

      {/* Add Project Modal */}
      <AddFeaturedModal
        open={projectModalOpen}
        onOpenChange={(open) => {
          setProjectModalOpen(open);
          if (!open) setProjectSlotTarget(null);
        }}
        title={`Assign ${projectSlotTarget?.type === 'project_hero' ? 'Hero' : 'Secondary'} Project`}
        items={availableProjects || []}
        isLoading={availableProjectsLoading}
        onSelect={handleAddProject}
        getItemId={(p) => p.id}
        getSearchableText={(p) => `${p.name} ${p.city} ${p.developer?.name || ''}`}
        defaultExpiryDays={30}
        renderItem={(project) => (
          <div className="flex gap-3">
            <div className="w-14 h-14 rounded bg-muted flex-shrink-0 overflow-hidden">
              {project.images?.[0] ? (
                <img src={project.images[0]} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground">
                  No img
                </div>
              )}
            </div>
            <div className="min-w-0">
              <p className="font-medium text-sm truncate">{project.name}</p>
              <p className="text-xs text-muted-foreground">
                {project.developer?.name} • {project.city}
              </p>
              {project.price_from && (
                <p className="text-sm font-semibold text-primary">
                  From {formatPrice(project.price_from, project.currency)}
                </p>
              )}
            </div>
          </div>
        )}
      />
    </div>
  );
}
