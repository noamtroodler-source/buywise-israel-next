import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useDeveloperProfile } from './useDeveloperProfile';
import { toast } from 'sonner';
import { UnitTypeData } from '@/components/developer/wizard/ProjectWizardContext';

// Interface for project units from database
export interface ProjectUnit {
  id: string;
  project_id: string;
  unit_type: string;
  bedrooms: number | null;
  bathrooms: number | null;
  size_sqm: number | null;
  floor: number | null;
  price: number | null;
  floor_plan_url: string | null;
  status: string | null;
  display_order: number | null;
  created_at: string;
}

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
  featured_highlight: string | null;
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
      featured_highlight?: string;
      submitForReview?: boolean;
    }) => {
      // Fetch developer profile fresh at mutation time to avoid stale closure issues
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('You must be logged in to create a project');
      
      const { data: developerProfile, error: profileError } = await supabase
        .from('developers')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (profileError) throw new Error('Failed to fetch developer profile');
      if (!developerProfile?.id) throw new Error('Developer profile not found. Please complete developer registration first.');

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
          featured_highlight: projectData.featured_highlight || null,
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

// Hook to fetch project units for a developer's project
export function useDeveloperProjectUnits(projectId: string | undefined) {
  return useQuery({
    queryKey: ['developerProjectUnits', projectId],
    queryFn: async (): Promise<ProjectUnit[]> => {
      if (!projectId) return [];

      const { data, error } = await supabase
        .from('project_units')
        .select('*')
        .eq('project_id', projectId)
        .order('display_order', { ascending: true });

      if (error) throw error;
      return data as ProjectUnit[];
    },
    enabled: !!projectId,
  });
}

// Hook to update project with unit types
export function useUpdateProjectWithUnits() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      id, 
      unit_types,
      ...projectUpdates 
    }: Partial<DeveloperProject> & { 
      id: string; 
      unit_types?: UnitTypeData[];
    }) => {
      // 1. Update project data
      const { error: projectError } = await supabase
        .from('projects')
        .update(projectUpdates as any)
        .eq('id', id);
      
      if (projectError) throw projectError;

      // 2. Sync unit types if provided
      if (unit_types !== undefined) {
        // Delete existing units for this project
        const { error: deleteError } = await supabase
          .from('project_units')
          .delete()
          .eq('project_id', id);

        if (deleteError) throw deleteError;

        // Insert updated units with display_order
        if (unit_types.length > 0) {
          const unitsToInsert = unit_types.map((ut, index) => ({
            project_id: id,
            unit_type: ut.name,
            bedrooms: ut.bedrooms,
            bathrooms: ut.bathrooms,
            size_sqm: ut.sizeMin || null,
            floor: ut.floorMin || null,
            price: ut.priceMin || null,
            floor_plan_url: ut.floorPlanUrl || null,
            display_order: index,
            status: 'available',
          }));

          const { error: unitsError } = await supabase
            .from('project_units')
            .insert(unitsToInsert as any);

          if (unitsError) throw unitsError;
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['developerProjects'] });
      queryClient.invalidateQueries({ queryKey: ['developerProjectUnits'] });
      toast.success('Project updated!');
    },
    onError: (error) => {
      toast.error('Failed to update project: ' + error.message);
    },
  });
}
