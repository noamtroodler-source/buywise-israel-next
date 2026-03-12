import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { scrollToTopInstant } from '@/lib/scrollToTop';
import { AuthorType } from '@/hooks/useProfessionalBlog';

export interface BlogWizardData {
  // Step 1: Basics
  title: string;
  categoryIds: string[];
  city: string;
  audiences: string[];
  
  // Step 2: Content
  content: string;
  excerpt: string;
  
  // Step 3: Cover Image
  coverImage: string;
  
  // Metadata
  authorType: AuthorType;
  authorProfileId: string;
}

interface BlogWizardContextType {
  data: BlogWizardData;
  currentStep: number;
  updateData: (updates: Partial<BlogWizardData>) => void;
  resetWizard: () => void;
  loadFromSaved: (savedData: Partial<BlogWizardData>) => void;
  goNext: () => void;
  goBack: () => void;
  setCurrentStep: (step: number) => void;
  canGoNext: boolean;
  isLastStep: boolean;
}

const defaultBlogData: BlogWizardData = {
  title: '',
  categoryIds: [],
  city: '',
  audiences: [],
  content: '',
  excerpt: '',
  coverImage: '',
  authorType: 'agent',
  authorProfileId: '',
};

const BlogWizardContext = createContext<BlogWizardContextType | undefined>(undefined);

export function BlogWizardProvider({ 
  children,
  initialData,
}: { 
  children: ReactNode;
  initialData?: Partial<BlogWizardData>;
}) {
  const [data, setData] = useState<BlogWizardData>({
    ...defaultBlogData,
    ...initialData,
  });
  const [currentStep, setCurrentStep] = useState(1);

  const updateData = useCallback((updates: Partial<BlogWizardData>) => {
    setData(prev => ({ ...prev, ...updates }));
  }, []);

  const resetWizard = useCallback(() => {
    setData(defaultBlogData);
    setCurrentStep(1);
  }, []);

  const loadFromSaved = useCallback((savedData: Partial<BlogWizardData>) => {
    setData(prev => ({ ...prev, ...savedData }));
  }, []);

  const goNext = useCallback(() => {
    if (currentStep < 4) {
      setCurrentStep(prev => prev + 1);
      scrollToTopInstant();
    }
  }, [currentStep]);

  const goBack = useCallback(() => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [currentStep]);

  // Validation for each step
  const canGoNext = (() => {
    switch (currentStep) {
      case 1: // Basics
        return data.title.trim().length > 0 && (data.categoryIds?.length || 0) > 0;
      case 2: // Content
        return data.content.trim().length >= 100; // Min 100 chars
      case 3: // Cover Image (optional but encouraged)
        return true;
      case 4: // Preview
        return true;
      default:
        return false;
    }
  })();

  const isLastStep = currentStep === 4;

  return (
    <BlogWizardContext.Provider
      value={{
        data,
        currentStep,
        updateData,
        resetWizard,
        loadFromSaved,
        goNext,
        goBack,
        setCurrentStep,
        canGoNext,
        isLastStep,
      }}
    >
      {children}
    </BlogWizardContext.Provider>
  );
}

export function useBlogWizard() {
  const context = useContext(BlogWizardContext);
  if (!context) {
    throw new Error('useBlogWizard must be used within BlogWizardProvider');
  }
  return context;
}
