import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export type SlotType = 'property_sale' | 'property_rent' | 'project_hero' | 'project_secondary';

export interface FeaturedSlot {
  id: string;
  slot_type: SlotType;
  entity_id: string;
  position: number;
  featured_at: string;
  expires_at: string | null;
  added_by: string | null;
  created_at: string;
}

export interface FeaturedPropertySlot extends FeaturedSlot {
  property: {
    id: string;
    title: string;
    city: string;
    neighborhood: string | null;
    price: number;
    currency: string;
    images: string[] | null;
    listing_status: string;
    agent: {
      name: string;
    } | null;
  };
}

export interface FeaturedProjectSlot extends FeaturedSlot {
  project: {
    id: string;
    name: string;
    city: string;
    price_from: number | null;
    price_to: number | null;
    currency: string;
    images: string[] | null;
    developer: {
      name: string;
    } | null;
  };
}

// Fetch all featured property slots
export function useFeaturedPropertySlots(type: 'property_sale' | 'property_rent') {
  return useQuery({
    queryKey: ['featured-slots', type],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('homepage_featured_slots')
        .select(`
          *,
          property:properties!entity_id (
            id, title, city, neighborhood, price, currency, images, listing_status,
            agent:agents!agent_id (name)
          )
        `)
        .eq('slot_type', type)
        .order('position', { ascending: true });

      if (error) throw error;
      return (data || []) as unknown as FeaturedPropertySlot[];
    },
  });
}

// Fetch all featured project slots
export function useFeaturedProjectSlots() {
  return useQuery({
    queryKey: ['featured-slots', 'projects'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('homepage_featured_slots')
        .select(`
          *,
          project:projects!entity_id (
            id, name, city, price_from, price_to, currency, images,
            developer:developers!developer_id (name)
          )
        `)
        .in('slot_type', ['project_hero', 'project_secondary'])
        .order('slot_type', { ascending: true })
        .order('position', { ascending: true });

      if (error) throw error;
      return (data || []) as unknown as FeaturedProjectSlot[];
    },
  });
}

// Fetch available properties to feature (approved, published, not already featured)
export function useAvailablePropertiesForFeaturing(listingStatus: 'for_sale' | 'for_rent') {
  return useQuery({
    queryKey: ['available-properties-for-featuring', listingStatus],
    queryFn: async () => {
      // Get currently featured property IDs
      const { data: featuredSlots } = await supabase
        .from('homepage_featured_slots')
        .select('entity_id')
        .in('slot_type', ['property_sale', 'property_rent']);

      const featuredIds = (featuredSlots || []).map(s => s.entity_id);

      // Get available properties
      let query = supabase
        .from('properties')
        .select(`
          id, title, city, neighborhood, price, currency, images, listing_status,
          agent:agents!agent_id (name)
        `)
        .eq('is_published', true)
        .eq('verification_status', 'approved')
        .eq('listing_status', listingStatus)
        .order('created_at', { ascending: false })
        .limit(50);

      if (featuredIds.length > 0) {
        query = query.not('id', 'in', `(${featuredIds.join(',')})`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
  });
}

// Fetch available projects to feature
export function useAvailableProjectsForFeaturing() {
  return useQuery({
    queryKey: ['available-projects-for-featuring'],
    queryFn: async () => {
      // Get currently featured project IDs
      const { data: featuredSlots } = await supabase
        .from('homepage_featured_slots')
        .select('entity_id')
        .in('slot_type', ['project_hero', 'project_secondary']);

      const featuredIds = (featuredSlots || []).map(s => s.entity_id);

      // Get available projects
      let query = supabase
        .from('projects')
        .select(`
          id, name, city, price_from, price_to, currency, images, slug,
          developer:developers!developer_id (name)
        `)
        .eq('is_published', true)
        .eq('verification_status', 'approved')
        .order('created_at', { ascending: false })
        .limit(50);

      if (featuredIds.length > 0) {
        query = query.not('id', 'in', `(${featuredIds.join(',')})`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
  });
}

// Add a property to featured slots
export function useAddFeaturedProperty() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      propertyId, 
      slotType, 
      expiresAt 
    }: { 
      propertyId: string; 
      slotType: 'property_sale' | 'property_rent'; 
      expiresAt: Date | null;
    }) => {
      // Get current max position for this slot type
      const { data: existingSlots } = await supabase
        .from('homepage_featured_slots')
        .select('position')
        .eq('slot_type', slotType)
        .order('position', { ascending: false })
        .limit(1);

      const nextPosition = existingSlots && existingSlots.length > 0 
        ? existingSlots[0].position + 1 
        : 1;

      const { data: user } = await supabase.auth.getUser();

      const { error } = await supabase
        .from('homepage_featured_slots')
        .insert({
          entity_id: propertyId,
          slot_type: slotType,
          position: nextPosition,
          expires_at: expiresAt?.toISOString() || null,
          added_by: user?.user?.id || null,
        });

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['featured-slots', variables.slotType] });
      queryClient.invalidateQueries({ queryKey: ['available-properties-for-featuring'] });
      toast.success('Property added to featured');
    },
    onError: (error: Error) => {
      toast.error('Failed to add property: ' + error.message);
    },
  });
}

// Add a project to featured slots
export function useAddFeaturedProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      projectId, 
      slotType, 
      position,
      expiresAt 
    }: { 
      projectId: string; 
      slotType: 'project_hero' | 'project_secondary'; 
      position: number;
      expiresAt: Date | null;
    }) => {
      const { data: user } = await supabase.auth.getUser();

      const { error } = await supabase
        .from('homepage_featured_slots')
        .insert({
          entity_id: projectId,
          slot_type: slotType,
          position,
          expires_at: expiresAt?.toISOString() || null,
          added_by: user?.user?.id || null,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['featured-slots', 'projects'] });
      queryClient.invalidateQueries({ queryKey: ['available-projects-for-featuring'] });
      toast.success('Project added to featured');
    },
    onError: (error: Error) => {
      toast.error('Failed to add project: ' + error.message);
    },
  });
}

// Remove from featured slots
export function useRemoveFeaturedSlot() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (slotId: string) => {
      const { error } = await supabase
        .from('homepage_featured_slots')
        .delete()
        .eq('id', slotId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['featured-slots'] });
      queryClient.invalidateQueries({ queryKey: ['available-properties-for-featuring'] });
      queryClient.invalidateQueries({ queryKey: ['available-projects-for-featuring'] });
      toast.success('Removed from featured');
    },
    onError: (error: Error) => {
      toast.error('Failed to remove: ' + error.message);
    },
  });
}

// Update expiry date
export function useUpdateFeaturedExpiry() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ slotId, expiresAt }: { slotId: string; expiresAt: Date | null }) => {
      const { error } = await supabase
        .from('homepage_featured_slots')
        .update({ expires_at: expiresAt?.toISOString() || null })
        .eq('id', slotId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['featured-slots'] });
      toast.success('Expiry date updated');
    },
    onError: (error: Error) => {
      toast.error('Failed to update: ' + error.message);
    },
  });
}

// Reorder slots
export function useReorderFeaturedSlots() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ slotId, newPosition, slotType }: { slotId: string; newPosition: number; slotType: SlotType }) => {
      // This is a simplified reorder - in production you'd want to update all affected positions
      const { error } = await supabase
        .from('homepage_featured_slots')
        .update({ position: newPosition })
        .eq('id', slotId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['featured-slots'] });
      toast.success('Order updated');
    },
    onError: (error: Error) => {
      toast.error('Failed to reorder: ' + error.message);
    },
  });
}

// Get expiring soon count (within 3 days)
export function useExpiringSoonCount() {
  return useQuery({
    queryKey: ['featured-slots', 'expiring-soon'],
    queryFn: async () => {
      const threeDaysFromNow = new Date();
      threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);

      const { count, error } = await supabase
        .from('homepage_featured_slots')
        .select('*', { count: 'exact', head: true })
        .not('expires_at', 'is', null)
        .lt('expires_at', threeDaysFromNow.toISOString())
        .gt('expires_at', new Date().toISOString());

      if (error) throw error;
      return count || 0;
    },
  });
}
