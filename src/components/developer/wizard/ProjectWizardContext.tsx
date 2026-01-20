import { createContext, useContext, useState, ReactNode, useCallback } from 'react';

export type ProjectStatus = 'planning' | 'pre_sale' | 'under_construction' | 'completed';

export interface ProjectWizardData {
  // Step 1: Basics
  name: string;
  city: string;
  neighborhood: string;
  address: string;
  latitude: number | undefined;
  longitude: number | undefined;
  status: ProjectStatus;
  
  // Step 2: Details
  total_units: number | undefined;
  available_units: number | undefined;
  price_from: number | undefined;
  price_to: number | undefined;
  construction_start: string | undefined;
  completion_date: string | undefined;
  construction_progress_percent: number;
  
  // Step 3: Amenities
  amenities: string[];
  
  // Step 4: Photos
  images: string[];
  floor_plans: string[];
  
  // Step 5: Description
  description: string;
}

interface ProjectWizardContextType {
  data: ProjectWizardData;
  updateData: (updates: Partial<ProjectWizardData>) => void;
  currentStep: number;
  setCurrentStep: (step: number) => void;
  goNext: () => void;
  goBack: () => void;
  canGoNext: boolean;
  isLastStep: boolean;
  // New save-related properties
  resetWizard: () => void;
  loadFromSaved: (savedData: ProjectWizardData) => void;
}

export const defaultProjectData: ProjectWizardData = {
  name: '',
  city: '',
  neighborhood: '',
  address: '',
  latitude: undefined,
  longitude: undefined,
  status: 'planning',
  total_units: undefined,
  available_units: undefined,
  price_from: undefined,
  price_to: undefined,
  construction_start: undefined,
  completion_date: undefined,
  construction_progress_percent: 0,
  amenities: [],
  images: [],
  floor_plans: [],
  description: '',
};

const ProjectWizardContext = createContext<ProjectWizardContextType | undefined>(undefined);

const TOTAL_STEPS = 6;
export const PROJECT_WIZARD_STORAGE_KEY = 'project-wizard-draft';

export function ProjectWizardProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<ProjectWizardData>(defaultProjectData);
  const [currentStep, setCurrentStep] = useState(0);

  const updateData = useCallback((updates: Partial<ProjectWizardData>) => {
    setData(prev => ({ ...prev, ...updates }));
  }, []);

  const resetWizard = useCallback(() => {
    setData(defaultProjectData);
    setCurrentStep(0);
  }, []);

  const loadFromSaved = useCallback((savedData: ProjectWizardData) => {
    setData(savedData);
  }, []);

  const goNext = () => {
    if (currentStep < TOTAL_STEPS - 1) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const goBack = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  // Validation for each step
  const canGoNext = (() => {
    switch (currentStep) {
      case 0: // Basics
        const hasValidAddress = data.address && data.latitude && data.longitude && /\d+/.test(data.address);
        return !!(data.name && data.city && hasValidAddress);
      case 1: // Details
        return true; // Optional
      case 2: // Amenities
        return true; // Optional
      case 3: // Photos
        return data.images.length >= 1;
      case 4: // Description
        return !!data.description;
      case 5: // Review
        return true;
      default:
        return false;
    }
  })();

  const isLastStep = currentStep === TOTAL_STEPS - 1;

  return (
    <ProjectWizardContext.Provider
      value={{
        data,
        updateData,
        currentStep,
        setCurrentStep,
        goNext,
        goBack,
        canGoNext,
        isLastStep,
        resetWizard,
        loadFromSaved,
      }}
    >
      {children}
    </ProjectWizardContext.Provider>
  );
}

export function useProjectWizard() {
  const context = useContext(ProjectWizardContext);
  if (!context) {
    throw new Error('useProjectWizard must be used within ProjectWizardProvider');
  }
  return context;
}
