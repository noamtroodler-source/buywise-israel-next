import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';
import { SavedLocation, MAX_SAVED_LOCATIONS } from '@/types/savedLocation';
import { Json } from '@/integrations/supabase/types';
import { getUserFriendlyError } from '@/utils/userFriendlyErrors';

// Helper to safely parse saved locations from JSON
function parseSavedLocations(data: Json | null | undefined): SavedLocation[] {
  if (!data || !Array.isArray(data)) return [];
  return data as unknown as SavedLocation[];
}

// Helper to convert SavedLocation[] to Json for database updates
function toJson(locations: SavedLocation[]): Json {
  return locations as unknown as Json;
}

export function useSavedLocations() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['saved-locations', user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from('buyer_profiles')
        .select('saved_locations')
        .eq('user_id', user.id)
        .single();

      if (error) {
        // If no profile exists yet, return empty array
        if (error.code === 'PGRST116') return [];
        throw error;
      }

      return parseSavedLocations(data?.saved_locations);
    },
    enabled: !!user,
  });
}

export function useAddSavedLocation() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (newLocation: Omit<SavedLocation, 'id' | 'created_at'>) => {
      if (!user) throw new Error('Not authenticated');

      // First get current locations
      const { data: profile, error: fetchError } = await supabase
        .from('buyer_profiles')
        .select('saved_locations')
        .eq('user_id', user.id)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') throw fetchError;

      const currentLocations = parseSavedLocations(profile?.saved_locations);

      if (currentLocations.length >= MAX_SAVED_LOCATIONS) {
        throw new Error(`Maximum ${MAX_SAVED_LOCATIONS} locations allowed`);
      }

      const locationWithId: SavedLocation = {
        ...newLocation,
        id: crypto.randomUUID(),
        created_at: new Date().toISOString(),
      };

      const updatedLocations = [...currentLocations, locationWithId];

      // Update the profile with new locations
      const { error: updateError } = await supabase
        .from('buyer_profiles')
        .update({ saved_locations: toJson(updatedLocations) })
        .eq('user_id', user.id);

      if (updateError) throw updateError;

      return locationWithId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['saved-locations'] });
      toast.success('Location saved');
    },
    onError: (error) => {
      toast.error(getUserFriendlyError(error, 'Failed to save location'));
    },
  });
}

export function useDeleteSavedLocation() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (locationId: string) => {
      if (!user) throw new Error('Not authenticated');

      const { data: profile, error: fetchError } = await supabase
        .from('buyer_profiles')
        .select('saved_locations')
        .eq('user_id', user.id)
        .single();

      if (fetchError) throw fetchError;

      const currentLocations = parseSavedLocations(profile?.saved_locations);
      const updatedLocations = currentLocations.filter(loc => loc.id !== locationId);

      const { error: updateError } = await supabase
        .from('buyer_profiles')
        .update({ saved_locations: toJson(updatedLocations) })
        .eq('user_id', user.id);

      if (updateError) throw updateError;

      return locationId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['saved-locations'] });
      toast.success('Location removed');
    },
    onError: (error) => {
      toast.error('Failed to remove location: ' + error.message);
    },
  });
}
