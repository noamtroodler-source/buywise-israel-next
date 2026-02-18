import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export type BlogVerificationStatus = 'draft' | 'pending_review' | 'approved' | 'changes_requested' | 'rejected';
export type AuthorType = 'agent' | 'agency' | 'developer' | 'admin';

export interface ProfessionalBlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  cover_image: string | null;
  category_id: string | null;
  category_ids: string[] | null;
  author_id: string | null;
  author_type: AuthorType | null;
  author_profile_id: string | null;
  is_published: boolean;
  published_at: string | null;
  views_count: number;
  created_at: string;
  updated_at: string;
  city: string | null;
  audiences: string[] | null;
  reading_time_minutes: number | null;
  verification_status: BlogVerificationStatus | null;
  submitted_at: string | null;
  reviewed_at: string | null;
  reviewed_by: string | null;
  rejection_reason: string | null;
  category?: {
    id: string;
    name: string;
    slug: string;
  } | null;
}

export interface CreateBlogPostData {
  title: string;
  slug: string;
  excerpt?: string;
  content: string;
  cover_image?: string;
  category_id?: string;
  category_ids?: string[];
  city?: string;
  audiences?: string[];
  author_type: AuthorType;
  author_profile_id: string;
}

export interface UpdateBlogPostData {
  title?: string;
  slug?: string;
  excerpt?: string;
  content?: string;
  cover_image?: string;
  category_id?: string;
  category_ids?: string[];
  city?: string;
  audiences?: string[];
}

// Fetch my blog posts as a professional
export function useMyBlogPosts(authorType: AuthorType, profileId: string | undefined) {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['my-blog-posts', authorType, profileId],
    queryFn: async () => {
      if (!user || !profileId) return [];
      
      const { data, error } = await supabase
        .from('blog_posts')
        .select(`
          *,
          category:blog_categories(id, name, slug)
        `)
        .eq('author_id', user.id)
        .eq('author_type', authorType)
        .eq('author_profile_id', profileId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as ProfessionalBlogPost[];
    },
    enabled: !!user && !!profileId,
  });
}

// Get a single blog post by ID for editing
export function useBlogPostForEdit(postId: string | undefined) {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['blog-post-edit', postId],
    queryFn: async () => {
      if (!postId) return null;
      
      const { data, error } = await supabase
        .from('blog_posts')
        .select(`
          *,
          category:blog_categories(id, name, slug)
        `)
        .eq('id', postId)
        .eq('author_id', user?.id)
        .maybeSingle();
      
      if (error) throw error;
      return data as ProfessionalBlogPost | null;
    },
    enabled: !!postId && !!user,
  });
}

// Create a new blog post
export function useCreateBlogPost() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async (data: CreateBlogPostData) => {
      if (!user) throw new Error('Not authenticated');
      
      // Calculate reading time
      const wordCount = data.content.split(/\s+/).length;
      const readingTime = Math.max(1, Math.ceil(wordCount / 200));
      
      const { data: post, error } = await supabase
        .from('blog_posts')
        .insert({
          title: data.title,
          slug: data.slug,
          excerpt: data.excerpt || null,
          content: data.content,
          cover_image: data.cover_image || null,
          category_id: data.category_ids?.[0] || data.category_id || null,
          category_ids: data.category_ids || [],
          city: data.city || null,
          audiences: data.audiences || null,
          author_id: user.id,
          author_type: data.author_type,
          author_profile_id: data.author_profile_id,
          is_published: false,
          verification_status: 'draft',
          reading_time_minutes: readingTime,
        })
        .select()
        .single();
      
      if (error) throw error;
      return post;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['my-blog-posts', variables.author_type] });
      toast.success('Draft saved successfully');
    },
    onError: (error) => {
      console.error('Failed to create blog post:', error);
      toast.error('Failed to save draft');
    },
  });
}

// Update an existing blog post
export function useUpdateBlogPost() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async ({ postId, data }: { postId: string; data: UpdateBlogPostData }) => {
      if (!user) throw new Error('Not authenticated');
      
      // Calculate reading time if content changed
      const updates: Record<string, unknown> = { ...data };
      if (data.content) {
        const wordCount = data.content.split(/\s+/).length;
        updates.reading_time_minutes = Math.max(1, Math.ceil(wordCount / 200));
      }
      
      const { data: post, error } = await supabase
        .from('blog_posts')
        .update(updates)
        .eq('id', postId)
        .eq('author_id', user.id)
        .select()
        .single();
      
      if (error) throw error;
      return post;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-blog-posts'] });
      queryClient.invalidateQueries({ queryKey: ['blog-post-edit'] });
      toast.success('Changes saved');
    },
    onError: (error) => {
      console.error('Failed to update blog post:', error);
      toast.error('Failed to save changes');
    },
  });
}

// Submit a blog post for review
export function useSubmitForReview() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async (postId: string) => {
      if (!user) throw new Error('Not authenticated');

      // Fetch the post to get author info for quota check
      const { data: post, error: fetchErr } = await supabase
        .from('blog_posts')
        .select('author_profile_id, author_type, submitted_at, verification_status')
        .eq('id', postId)
        .eq('author_id', user.id)
        .single();

      if (fetchErr || !post) throw new Error('Post not found');

      // Check monthly blog quota against the subscription plan
      if (post.author_profile_id) {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

        // Count submitted/approved posts this month (excluding this post if re-submitting)
        const { count } = await supabase
          .from('blog_posts')
          .select('id', { count: 'exact', head: true })
          .eq('author_profile_id', post.author_profile_id)
          .in('verification_status', ['pending_review', 'approved'])
          .gte('submitted_at', startOfMonth)
          .neq('id', postId);

        const usedCount = count ?? 0;

        // Fetch plan limit
        // Fetch plan limit via subscription
        const entityType = post.author_type === 'developer' ? 'developer' : 'agency';
        const { data: subRow } = await supabase
          .from('subscriptions')
          .select('membership_plans(max_blogs_per_month)')
          .eq('entity_type', entityType)
          .in('status', ['active', 'trialing'])
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        const maxBlogs = (subRow as any)?.membership_plans?.max_blogs_per_month ?? null;
        if (maxBlogs !== null && usedCount >= maxBlogs) {
          throw new Error(`Blog quota reached: you've used ${usedCount}/${maxBlogs} posts this month. Upgrade your plan for more.`);
        }
      }

      const { data: updated, error } = await supabase
        .from('blog_posts')
        .update({
          verification_status: 'pending_review',
          submitted_at: new Date().toISOString(),
        })
        .eq('id', postId)
        .eq('author_id', user.id)
        .select()
        .single();
      
      if (error) throw error;
      return updated;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-blog-posts'] });
      queryClient.invalidateQueries({ queryKey: ['blog-post-edit'] });
      queryClient.invalidateQueries({ queryKey: ['blog-quota-used'] });
      toast.success('Article submitted for review');
    },
    onError: (error: any) => {
      console.error('Failed to submit for review:', error);
      toast.error(error?.message || 'Failed to submit for review');
    },
  });
}

// Delete a draft blog post
export function useDeleteBlogPost() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async (postId: string) => {
      if (!user) throw new Error('Not authenticated');
      
      const { error } = await supabase
        .from('blog_posts')
        .delete()
        .eq('id', postId)
        .eq('author_id', user.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-blog-posts'] });
      toast.success('Draft deleted');
    },
    onError: (error) => {
      console.error('Failed to delete blog post:', error);
      toast.error('Failed to delete draft');
    },
  });
}

// Generate a URL-friendly slug from title
export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
    .substring(0, 100);
}

// Fetch blog categories
export function useBlogCategories() {
  return useQuery({
    queryKey: ['blog-categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('blog_categories')
        .select('*')
        .order('name');
      
      if (error) throw error;
      return data;
    },
  });
}
