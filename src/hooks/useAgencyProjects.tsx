import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { UnitTypeData } from '@/components/developer/wizard/ProjectWizardContext';

export function useCreateProjectForAgency() {
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
      assignedAgentId: string;
      submitForReview: boolean;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('You must be logged in');

      // Validate assigned agent exists
      const { data: agent, error: agentError } = await supabase
        .from('agents')
        .select('id')
        .eq('id', projectData.assignedAgentId)
        .maybeSingle();

      if (agentError || !agent) throw new Error('Selected agent not found');

      // Generate slug
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
          developer_id: null,
          representing_agent_id: projectData.assignedAgentId,
          name: projectData.name,
          slug,
          city: projectData.city,
          neighborhood: projectData.neighborhood || null,
          address: projectData.address || null,
          latitude: projectData.latitude ?? null,
          longitude: projectData.longitude ?? null,
          description: projectData.description || null,
          status: projectData.status as any,
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
        const unitsToInsert = projectData.unit_types.map((unitType, index) => ({
          project_id: data.id,
          unit_type: unitType.name,
          bedrooms: unitType.bedrooms,
          bathrooms: unitType.bathrooms,
          size_sqm: unitType.sizeMin || null,
          floor: unitType.floorMin || null,
          price: unitType.priceMin || null,
          floor_plan_url: unitType.floorPlanUrl || null,
          display_order: index,
          status: 'available',
        }));

        const { error: unitsError } = await supabase
          .from('project_units')
          .insert(unitsToInsert as any);

        if (unitsError) {
          console.error('Failed to insert project units:', unitsError);
        }
      }

      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['agencyProjects'] });
      queryClient.invalidateQueries({ queryKey: ['agencyListings'] });
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
