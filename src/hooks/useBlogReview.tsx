import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export type BlogVerificationStatus = 'draft' | 'pending_review' | 'changes_requested' | 'approved' | 'rejected';
export type AuthorType = 'agent' | 'agency' | 'developer';

export interface BlogAuthor {
  id: string;
  type: AuthorType;
  profile_id: string;
  name: string;
  email: string;
  avatar: string | null;
  organization_name: string | null;
}

export interface BlogPostForReview {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  cover_image: string | null;
  category_ids: string[] | null;
  city: string | null;
  audiences: string[] | null;
  reading_time_minutes: number | null;
  views_count: number | null;
  verification_status: BlogVerificationStatus;
  rejection_reason: string | null;
  submitted_at: string | null;
  reviewed_at: string | null;
  created_at: string;
  is_published: boolean;
  author_type: AuthorType | null;
  author_profile_id: string | null;
  author: BlogAuthor | null;
  categories: { id: string; name: string; slug: string }[] | null;
}

// Fetch author info based on type
async function fetchAuthorInfo(authorType: AuthorType | null, authorProfileId: string | null): Promise<BlogAuthor | null> {
  if (!authorType || !authorProfileId) return null;

  try {
    if (authorType === 'agent') {
      const { data } = await supabase
        .from('agents')
        .select('id, name, email, avatar_url, agency_name')
        .eq('id', authorProfileId)
        .maybeSingle();
      
      if (data) {
        return {
          id: data.id,
          type: 'agent',
          profile_id: authorProfileId,
          name: data.name,
          email: data.email,
          avatar: data.avatar_url,
          organization_name: data.agency_name,
        };
      }
    } else if (authorType === 'agency') {
      const { data } = await supabase
        .from('agencies')
        .select('id, name, email, logo_url')
        .eq('id', authorProfileId)
        .maybeSingle();
      
      if (data) {
        return {
          id: data.id,
          type: 'agency',
          profile_id: authorProfileId,
          name: data.name,
          email: data.email || '',
          avatar: data.logo_url,
          organization_name: null,
        };
      }
    } else if (authorType === 'developer') {
      const { data } = await supabase
        .from('developers')
        .select('id, name, email, logo_url')
        .eq('id', authorProfileId)
        .maybeSingle();
      
      if (data) {
        return {
          id: data.id,
          type: 'developer',
          profile_id: authorProfileId,
          name: data.name,
          email: data.email || '',
          avatar: data.logo_url,
          organization_name: null,
        };
      }
    }
  } catch (error) {
    console.error('Error fetching author info:', error);
  }
  
  return null;
}

// Fetch categories by IDs
async function fetchCategories(categoryIds: string[] | null): Promise<{ id: string; name: string; slug: string }[] | null> {
  if (!categoryIds || categoryIds.length === 0) return null;

  const { data } = await supabase
    .from('blog_categories')
    .select('id, name, slug')
    .in('id', categoryIds);
  
  return data || null;
}

export function useBlogPostsForReview(status?: BlogVerificationStatus) {
  return useQuery({
    queryKey: ['blogPostsForReview', status],
    queryFn: async () => {
      let query = supabase
        .from('blog_posts')
        .select(`
          id,
          title,
          slug,
          excerpt,
          content,
          cover_image,
          category_ids,
          city,
          audiences,
          reading_time_minutes,
          views_count,
          verification_status,
          rejection_reason,
          submitted_at,
          reviewed_at,
          created_at,
          is_published,
          author_type,
          author_profile_id
        `)
        .order('submitted_at', { ascending: false, nullsFirst: false });

      if (status) {
        query = query.eq('verification_status', status);
      } else {
        // By default, only show posts that have been submitted (not drafts without submission)
        query = query.not('verification_status', 'eq', 'draft');
      }

      const { data, error } = await query;
      if (error) throw error;

      // Enrich each post with author info and categories
      const enrichedPosts = await Promise.all(
        (data || []).map(async (post) => {
          const [author, categories] = await Promise.all([
            fetchAuthorInfo(post.author_type as AuthorType | null, post.author_profile_id),
            fetchCategories(post.category_ids),
          ]);

          return {
            ...post,
            verification_status: post.verification_status as BlogVerificationStatus,
            author_type: post.author_type as AuthorType | null,
            author,
            categories,
          } as BlogPostForReview;
        })
      );

      return enrichedPosts;
    },
  });
}

export function usePendingBlogCount() {
  return useQuery({
    queryKey: ['pendingBlogCount'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('blog_posts')
        .select('*', { count: 'exact', head: true })
        .eq('verification_status', 'pending_review');
      
      if (error) throw error;
      return count || 0;
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });
}

export function useBlogReviewStats() {
  return useQuery({
    queryKey: ['blogReviewStats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('blog_posts')
        .select('verification_status');

      if (error) throw error;

      const stats = {
        draft: 0,
        pending_review: 0,
        changes_requested: 0,
        approved: 0,
        rejected: 0,
      };

      data?.forEach((p) => {
        const status = p.verification_status as BlogVerificationStatus;
        if (status && status in stats) {
          stats[status]++;
        }
      });

      return stats;
    },
  });
}

async function sendBlogNotification(payload: {
  type: string;
  authorType: AuthorType;
  authorProfileId: string;
  postTitle: string;
  message?: string;
}) {
  try {
    // Get author's email based on type
    let email: string | null = null;
    
    if (payload.authorType === 'agent') {
      const { data } = await supabase.from('agents').select('email').eq('id', payload.authorProfileId).maybeSingle();
      email = data?.email || null;
    } else if (payload.authorType === 'agency') {
      const { data } = await supabase.from('agencies').select('email').eq('id', payload.authorProfileId).maybeSingle();
      email = data?.email || null;
    } else if (payload.authorType === 'developer') {
      const { data } = await supabase.from('developers').select('email').eq('id', payload.authorProfileId).maybeSingle();
      email = data?.email || null;
    }

    if (email) {
      // For now, we'll create an in-app notification. Email integration can be added later.
      console.log(`Blog notification: ${payload.type} for ${email} - ${payload.postTitle}`);
    }
  } catch (error) {
    console.error('Failed to send blog notification:', error);
  }
}

export function useApproveBlogPost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      id, 
      adminNotes,
      authorType,
      authorProfileId,
      postTitle,
    }: { 
      id: string; 
      adminNotes?: string;
      authorType?: AuthorType;
      authorProfileId?: string;
      postTitle?: string;
    }) => {
      const { error } = await supabase
        .from('blog_posts')
        .update({
          verification_status: 'approved',
          is_published: true,
          rejection_reason: null,
          reviewed_at: new Date().toISOString(),
          published_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (error) throw error;

      // Send notification to author
      if (authorType && authorProfileId) {
        await sendBlogNotification({
          type: 'blog_approved',
          authorType,
          authorProfileId,
          postTitle: postTitle || 'Your blog post',
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blogPostsForReview'] });
      queryClient.invalidateQueries({ queryKey: ['pendingBlogCount'] });
      queryClient.invalidateQueries({ queryKey: ['blogReviewStats'] });
      toast.success('Blog post approved and published!');
    },
    onError: (error) => {
      toast.error('Failed to approve blog post: ' + error.message);
    },
  });
}

export function useRequestBlogChanges() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      id, 
      feedback, 
      authorType,
      authorProfileId,
      postTitle,
    }: { 
      id: string; 
      feedback: string;
      authorType?: AuthorType;
      authorProfileId?: string;
      postTitle?: string;
    }) => {
      const { error } = await supabase
        .from('blog_posts')
        .update({
          verification_status: 'changes_requested',
          rejection_reason: feedback,
          reviewed_at: new Date().toISOString(),
          is_published: false,
        })
        .eq('id', id);

      if (error) throw error;

      // Send notification to author
      if (authorType && authorProfileId) {
        await sendBlogNotification({
          type: 'blog_changes_requested',
          authorType,
          authorProfileId,
          postTitle: postTitle || 'Your blog post',
          message: feedback,
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blogPostsForReview'] });
      queryClient.invalidateQueries({ queryKey: ['pendingBlogCount'] });
      queryClient.invalidateQueries({ queryKey: ['blogReviewStats'] });
      toast.success('Changes requested - author will be notified');
    },
    onError: (error) => {
      toast.error('Failed to request changes: ' + error.message);
    },
  });
}

export function useRejectBlogPost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      id, 
      reason,
      authorType,
      authorProfileId,
      postTitle,
    }: { 
      id: string; 
      reason: string;
      authorType?: AuthorType;
      authorProfileId?: string;
      postTitle?: string;
    }) => {
      const { error } = await supabase
        .from('blog_posts')
        .update({
          verification_status: 'rejected',
          rejection_reason: reason,
          reviewed_at: new Date().toISOString(),
          is_published: false,
        })
        .eq('id', id);

      if (error) throw error;

      // Send notification to author
      if (authorType && authorProfileId) {
        await sendBlogNotification({
          type: 'blog_rejected',
          authorType,
          authorProfileId,
          postTitle: postTitle || 'Your blog post',
          message: reason,
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blogPostsForReview'] });
      queryClient.invalidateQueries({ queryKey: ['pendingBlogCount'] });
      queryClient.invalidateQueries({ queryKey: ['blogReviewStats'] });
      toast.success('Blog post rejected');
    },
    onError: (error) => {
      toast.error('Failed to reject blog post: ' + error.message);
    },
  });
}
