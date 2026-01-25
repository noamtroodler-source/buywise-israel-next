import { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Save, Send, Loader2 } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { BlogWizardProvider, useBlogWizard } from '@/components/blog/wizard/BlogWizardContext';
import { StepBasics } from '@/components/blog/wizard/StepBasics';
import { StepContent } from '@/components/blog/wizard/StepContent';
import { StepCoverImage } from '@/components/blog/wizard/StepCoverImage';
import { StepReview } from '@/components/blog/wizard/StepReview';
import { 
  useCreateBlogPost, 
  useUpdateBlogPost, 
  useSubmitForReview,
  useBlogPostForEdit,
  generateSlug 
} from '@/hooks/useProfessionalBlog';
import { useAgentProfile } from '@/hooks/useAgentProperties';
import { toast } from 'sonner';

const STEPS = [
  { number: 1, title: 'Basics', component: StepBasics },
  { number: 2, title: 'Content', component: StepContent },
  { number: 3, title: 'Cover Image', component: StepCoverImage },
  { number: 4, title: 'Preview', component: StepReview },
];

function WizardContent({ isEditMode, postId }: { isEditMode: boolean; postId?: string }) {
  const navigate = useNavigate();
  const { data: agentProfile } = useAgentProfile();
  const { data, currentStep, goNext, goBack, canGoNext, isLastStep, updateData } = useBlogWizard();
  
  const createPost = useCreateBlogPost();
  const updatePost = useUpdateBlogPost();
  const submitForReview = useSubmitForReview();
  const { data: existingPost, isLoading: loadingPost } = useBlogPostForEdit(postId);
  
  const [savedPostId, setSavedPostId] = useState<string | null>(postId || null);
  const [isSaving, setIsSaving] = useState(false);

  // Load existing post data
  useEffect(() => {
    if (existingPost && isEditMode) {
      updateData({
        title: existingPost.title,
        categoryIds: existingPost.category_ids || (existingPost.category_id ? [existingPost.category_id] : []),
        city: existingPost.city || '',
        audiences: existingPost.audiences || [],
        content: existingPost.content,
        excerpt: existingPost.excerpt || '',
        coverImage: existingPost.cover_image || '',
      });
    }
  }, [existingPost, isEditMode, updateData]);

  // Set author info
  useEffect(() => {
    if (agentProfile) {
      updateData({
        authorType: 'agent',
        authorProfileId: agentProfile.id,
      });
    }
  }, [agentProfile, updateData]);

  const handleSaveDraft = async () => {
    if (!agentProfile) return;
    setIsSaving(true);

    try {
      if (savedPostId) {
        // Update existing
        await updatePost.mutateAsync({
          postId: savedPostId,
          data: {
            title: data.title,
            slug: generateSlug(data.title),
            excerpt: data.excerpt,
            content: data.content,
            cover_image: data.coverImage,
            category_ids: data.categoryIds,
            city: data.city,
            audiences: data.audiences,
          },
        });
      } else {
        // Create new
        const result = await createPost.mutateAsync({
          title: data.title,
          slug: generateSlug(data.title),
          excerpt: data.excerpt,
          content: data.content,
          cover_image: data.coverImage,
          category_ids: data.categoryIds,
          city: data.city,
          audiences: data.audiences,
          author_type: 'agent',
          author_profile_id: agentProfile.id,
        });
        setSavedPostId(result.id);
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleSubmit = async () => {
    if (!agentProfile) return;
    setIsSaving(true);

    try {
      let postIdToSubmit = savedPostId;

      // Save first if not saved
      if (!postIdToSubmit) {
        const result = await createPost.mutateAsync({
          title: data.title,
          slug: generateSlug(data.title),
          excerpt: data.excerpt,
          content: data.content,
          cover_image: data.coverImage,
          category_ids: data.categoryIds,
          city: data.city,
          audiences: data.audiences,
          author_type: 'agent',
          author_profile_id: agentProfile.id,
        });
        postIdToSubmit = result.id;
      } else {
        // Update before submitting
        await updatePost.mutateAsync({
          postId: postIdToSubmit,
          data: {
            title: data.title,
            slug: generateSlug(data.title),
            excerpt: data.excerpt,
            content: data.content,
            cover_image: data.coverImage,
            category_ids: data.categoryIds,
            city: data.city,
            audiences: data.audiences,
          },
        });
      }

      // Submit for review
      await submitForReview.mutateAsync(postIdToSubmit);
      toast.success('Article submitted for review!');
      navigate('/agent/blog');
    } catch (error) {
      console.error('Submit error:', error);
    } finally {
      setIsSaving(false);
    }
  };

  if (loadingPost && isEditMode) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const CurrentStepComponent = STEPS[currentStep - 1].component;
  const progress = (currentStep / STEPS.length) * 100;

  return (
    <div className="container max-w-3xl py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild className="rounded-xl hover:bg-primary/10">
              <Link to="/agent/blog">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <div>
              <h1 className="text-xl font-bold">
                {isEditMode ? 'Edit Article' : 'Write Article'}
              </h1>
              <p className="text-sm text-muted-foreground">
                Step {currentStep} of {STEPS.length} — {STEPS[currentStep - 1].title}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleSaveDraft}
              disabled={isSaving || !data.title}
            >
              {isSaving ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Save Draft
            </Button>
          </div>
        </div>

        {/* Progress */}
        <Progress value={progress} className="h-1" />

        {/* Step Content */}
        <div className="bg-card border rounded-2xl p-6">
          <CurrentStepComponent />
        </div>

        {/* Navigation */}
        <div className="flex justify-between">
          <Button
            variant="outline"
            onClick={goBack}
            disabled={currentStep === 1}
          >
            Previous
          </Button>
          
          {isLastStep ? (
            <Button onClick={handleSubmit} disabled={isSaving}>
              {isSaving ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Send className="h-4 w-4 mr-2" />
              )}
              Submit for Review
            </Button>
          ) : (
            <Button onClick={goNext} disabled={!canGoNext}>
              Next
            </Button>
          )}
        </div>
      </motion.div>
    </div>
  );
}

export default function AgentBlogWizard() {
  const { id } = useParams();
  const isEditMode = !!id;

  return (
    <Layout>
      <BlogWizardProvider>
        <WizardContent isEditMode={isEditMode} postId={id} />
      </BlogWizardProvider>
    </Layout>
  );
}
