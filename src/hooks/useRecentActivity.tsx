import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { formatDistanceToNow } from 'date-fns';

export interface ActivityItem {
  id: string;
  type: 'agent_registration' | 'listing_submission' | 'inquiry' | 'project_submission' | 'user_signup';
  title: string;
  description: string;
  timestamp: string;
  relativeTime: string;
}

export function useRecentActivity(limit: number = 20) {
  return useQuery({
    queryKey: ['admin-recent-activity', limit],
    queryFn: async (): Promise<ActivityItem[]> => {
      const activities: ActivityItem[] = [];

      // Fetch recent agent registrations
      const { data: agents } = await supabase
        .from('agents')
        .select('id, name, created_at, status')
        .order('created_at', { ascending: false })
        .limit(5);

      (agents || []).forEach((agent) => {
        activities.push({
          id: `agent-${agent.id}`,
          type: 'agent_registration',
          title: 'Agent Registration',
          description: `${agent.name} submitted an agent application`,
          timestamp: agent.created_at,
          relativeTime: formatDistanceToNow(new Date(agent.created_at), { addSuffix: true }),
        });
      });

      // Fetch recent property submissions
      const { data: properties } = await supabase
        .from('properties')
        .select('id, title, created_at, verification_status')
        .order('created_at', { ascending: false })
        .limit(5);

      (properties || []).forEach((property) => {
        activities.push({
          id: `property-${property.id}`,
          type: 'listing_submission',
          title: 'Listing Submission',
          description: `"${property.title}" was submitted for review`,
          timestamp: property.created_at,
          relativeTime: formatDistanceToNow(new Date(property.created_at), { addSuffix: true }),
        });
      });

      // Fetch recent inquiries
      const { data: inquiries } = await supabase
        .from('property_inquiries')
        .select('id, property_id, inquiry_type, created_at, properties(title)')
        .order('created_at', { ascending: false })
        .limit(5);

      (inquiries || []).forEach((inquiry: any) => {
        activities.push({
          id: `inquiry-${inquiry.id}`,
          type: 'inquiry',
          title: 'New Inquiry',
          description: `${inquiry.inquiry_type || 'Contact'} inquiry on "${inquiry.properties?.title || 'a property'}"`,
          timestamp: inquiry.created_at,
          relativeTime: formatDistanceToNow(new Date(inquiry.created_at), { addSuffix: true }),
        });
      });

      // Fetch recent project submissions
      const { data: projects } = await supabase
        .from('projects')
        .select('id, name, created_at, verification_status')
        .order('created_at', { ascending: false })
        .limit(5);

      (projects || []).forEach((project) => {
        activities.push({
          id: `project-${project.id}`,
          type: 'project_submission',
          title: 'Project Submission',
          description: `"${project.name}" project was created`,
          timestamp: project.created_at,
          relativeTime: formatDistanceToNow(new Date(project.created_at), { addSuffix: true }),
        });
      });

      // Fetch recent user signups
      const { data: users } = await supabase
        .from('profiles')
        .select('id, full_name, email, created_at')
        .order('created_at', { ascending: false })
        .limit(5);

      (users || []).forEach((user) => {
        activities.push({
          id: `user-${user.id}`,
          type: 'user_signup',
          title: 'New User',
          description: `${user.full_name || user.email || 'A user'} signed up`,
          timestamp: user.created_at,
          relativeTime: formatDistanceToNow(new Date(user.created_at), { addSuffix: true }),
        });
      });

      // Sort all activities by timestamp and limit
      return activities
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, limit);
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });
}
