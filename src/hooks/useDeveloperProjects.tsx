import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useDeveloperProfile } from './useDeveloperProfile';
import { toast } from 'sonner';
import { UnitTypeData } from '@/components/developer/wizard/ProjectWizardContext';

export interface DeveloperProject {
  id: string;
  developer_id: string | null;
  name: string;
  slug: string;
  description: string | null;
  city: string;
  neighborhood: string | null;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  status: 'planning' | 'pre_sale' | 'foundation' | 'structure' | 'finishing' | 'delivery';
  total_units: number | null;
  available_units: number | null;
  price_from: number | null;
  price_to: number | null;
  currency: string | null;
  completion_date: string | null;
  construction_start: string | null;
  construction_progress_percent: number | null;
  amenities: string[] | null;
  images: string[] | null;
  floor_plans: string[] | null;
  is_featured: boolean | null;
  is_published: boolean | null;
  views_count: number | null;
  verification_status: string | null;
  admin_feedback: string | null;
  last_renewed_at: string | null;
  submitted_at: string | null;
  created_at: string;
  updated_at: string;
}

export function useDeveloperProjects() {
  const { data: developerProfile } = useDeveloperProfile();

  return useQuery({
    queryKey: ['developerProjects', developerProfile?.id],
    queryFn: async (): Promise<DeveloperProject[]> => {
      if (!developerProfile?.id) return [];

      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('developer_id', developerProfile.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as DeveloperProject[];
    },
    enabled: !!developerProfile?.id,
  });
}

export function useDeveloperProject(projectId: string) {
  return useQuery({
    queryKey: ['developerProject', projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .maybeSingle();

      if (error) throw error;
      if (!data) throw new Error('Project not found');
      return data as DeveloperProject;
    },
    enabled: !!projectId,
  });
}

export function useCreateProject() {
  const queryClient = useQueryClient();
  const { data: developerProfile } = useDeveloperProfile();

  return useMutation({
    mutationFn: async (projectData: {
      name: string;
      city: string;
      neighborhood?: string;
      address?: string;
      latitude?: number;
      longitude?: number;
      description?: string;
      status: 'planning' | 'pre_sale' | 'foundation' | 'structure' | 'finishing' | 'delivery';
      total_units?: number;
      available_units?: number;
      price_from?: number;
      price_to?: number;
      completion_date?: string;
      construction_start?: string;
      construction_progress_percent?: number;
      amenities?: string[];
      images?: string[];
      floor_plans?: string[];
      unit_types?: UnitTypeData[];
      submitForReview?: boolean;
    }) => {
      if (!developerProfile?.id) throw new Error('Developer profile not found');

      // Generate slug from name
      const slug = projectData.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        + '-' + Date.now().toString(36);

      const verificationStatus = projectData.submitForReview ? 'pending_review' : 'draft';
      const submittedAt = projectData.submitForReview ? new Date().toISOString() : null;

      const { data, error } = await supabase
        .from('projects')
        .insert({
          developer_id: developerProfile.id,
          name: projectData.name,
          slug,
          city: projectData.city,
          neighborhood: projectData.neighborhood || null,
          address: projectData.address || null,
          latitude: projectData.latitude ?? null,
          longitude: projectData.longitude ?? null,
          description: projectData.description || null,
          status: projectData.status as any, // Cast until types regenerate
          total_units: projectData.total_units || null,
          available_units: projectData.available_units || null,
          price_from: projectData.price_from || null,
          price_to: projectData.price_to || null,
          completion_date: projectData.completion_date || null,
          construction_start: projectData.construction_start || null,
          construction_progress_percent: projectData.construction_progress_percent || null,
          amenities: projectData.amenities || null,
          images: projectData.images || null,
          floor_plans: projectData.floor_plans || null,
          verification_status: verificationStatus,
          submitted_at: submittedAt,
          is_published: false,
          is_featured: false,
          views_count: 0,
        } as any)
        .select()
        .single();

      if (error) throw error;

      // Insert unit types as project_units
      if (projectData.unit_types && projectData.unit_types.length > 0) {
        const unitsToInsert = projectData.unit_types.map(unitType => ({
          project_id: data.id,
          unit_type: unitType.name,
          bedrooms: unitType.bedrooms,
          bathrooms: unitType.bathrooms,
          size_sqm: unitType.sizeMin || null,
          floor: unitType.floorMin || null,
          price: unitType.priceMin || null,
          floor_plan_url: unitType.floorPlanUrl || null,
          status: 'available',
        }));

        const { error: unitsError } = await supabase
          .from('project_units')
          .insert(unitsToInsert as any);

        if (unitsError) {
          console.error('Failed to insert project units:', unitsError);
          // Don't throw - project was created successfully
        }
      }

      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['developerProjects'] });
      if (variables.submitForReview) {
        toast.success('Project submitted for review!');
      } else {
        toast.success('Project draft saved!');
      }
    },
    onError: (error) => {
      toast.error('Failed to create project: ' + error.message);
    },
  });
}

export function useUpdateProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<DeveloperProject> & { id: string }) => {
      const { data, error } = await supabase
        .from('projects')
        .update(updates as any) // Cast until types regenerate
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['developerProjects'] });
      toast.success('Project updated!');
    },
    onError: (error) => {
      toast.error('Failed to update project: ' + error.message);
    },
  });
}

export function useDeleteProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['developerProjects'] });
      toast.success('Project deleted');
    },
    onError: (error) => {
      toast.error('Failed to delete project: ' + error.message);
    },
  });
}

export function useSubmitProjectForReview() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('projects')
        .update({
          verification_status: 'pending_review',
          submitted_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['developerProjects'] });
      toast.success('Project submitted for review!');
    },
    onError: (error) => {
      toast.error('Failed to submit: ' + error.message);
    },
  });
}
