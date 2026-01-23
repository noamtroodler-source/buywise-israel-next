import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export function useSavedArticles() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: savedArticles = [], isLoading } = useQuery({
    queryKey: ['savedArticles', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('saved_articles')
        .select('post_id')
        .eq('user_id', user.id);

      if (error) throw error;
      return data.map(item => item.post_id);
    },
    enabled: !!user,
  });

  const saveArticle = useMutation({
    mutationFn: async (postId: string) => {
      if (!user) throw new Error('Must be logged in to save articles');
      
      const { error } = await supabase
        .from('saved_articles')
        .insert({ user_id: user.id, post_id: postId });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['savedArticles'] });
      queryClient.invalidateQueries({ queryKey: ['blogPosts'] });
      toast.success('Article saved!');
    },
    onError: (error) => {
      toast.error('Failed to save article: ' + (error as Error).message);
    },
  });

  const unsaveArticle = useMutation({
    mutationFn: async (postId: string) => {
      if (!user) throw new Error('Must be logged in');
      
      const { error } = await supabase
        .from('saved_articles')
        .delete()
        .eq('user_id', user.id)
        .eq('post_id', postId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['savedArticles'] });
      queryClient.invalidateQueries({ queryKey: ['blogPosts'] });
      toast.success('Article removed from saved');
    },
    onError: (error) => {
      toast.error('Failed to remove article: ' + (error as Error).message);
    },
  });

  const isArticleSaved = (postId: string) => savedArticles.includes(postId);

  const toggleSave = (postId: string) => {
    if (!user) {
      toast.error('Please log in to save articles');
      return;
    }
    
    if (isArticleSaved(postId)) {
      unsaveArticle.mutate(postId);
    } else {
      saveArticle.mutate(postId);
    }
  };

  return {
    savedArticles,
    isLoading,
    isArticleSaved,
    toggleSave,
    isSaving: saveArticle.isPending || unsaveArticle.isPending,
  };
}
