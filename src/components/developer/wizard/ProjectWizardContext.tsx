import { createContext, useContext, useState, ReactNode, useCallback } from 'react';

export type ProjectStatus = 'planning' | 'pre_sale' | 'foundation' | 'structure' | 'finishing' | 'delivery';

export type OutdoorSpaceType = 'balcony' | 'garden' | 'roof_terrace' | 'none';

export interface UnitTypeData {
  id: string;
  name: string;
  bedrooms: number;
  additionalRooms: number;
  bathrooms: number;
  sizeMin: number | undefined;
  sizeMax: number | undefined;
  floorMin: number | undefined;
  floorMax: number | undefined;
  priceMin: number | undefined;
  priceMax: number | undefined;
  outdoorSpace: OutdoorSpaceType;
  floorPlanUrl: string | undefined;
  quantity: number | undefined;
  displayOrder?: number; // For drag-and-drop ordering
}

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
  
  // Step 4: Unit Types (NEW)
  unit_types: UnitTypeData[];
  
  // Step 5: Photos (gallery only - floor plans are per unit type now)
  images: string[];
  floor_plans: string[]; // Legacy - kept for backward compatibility
  
  // Step 6: Description
  description: string;
  
  // Featured Selling Point
  featured_highlight: string;
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
  // Save-related properties
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
  unit_types: [],
  images: [],
  floor_plans: [],
  description: '',
  featured_highlight: '',
};

const ProjectWizardContext = createContext<ProjectWizardContextType | undefined>(undefined);

const TOTAL_STEPS = 7; // Updated from 6 to 7 with new Unit Types step
export const PROJECT_WIZARD_STORAGE_KEY = 'project-wizard-draft';

export function ProjectWizardProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<ProjectWizardData>(defaultProjectData);
  const [currentStep, setCurrentStep] = useState(0);

  const updateData = useCallback((updates: Partial<ProjectWizardData>) => {
    setData(prev => ({ ...prev, ...updates }));
  }, []);

  const handleSetCurrentStep = useCallback((step: number) => {
    setCurrentStep(step);
    window.scrollTo({ top: 0, behavior: 'smooth' });
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
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const goBack = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Validation for each step
  const canGoNext = (() => {
    switch (currentStep) {
      case 0: // Basics
        const hasValidAddress = data.address && data.latitude && data.longitude && /\d+/.test(data.address);
        return !!(data.name && data.city && data.neighborhood && hasValidAddress);
      case 1: // Details
        // If both dates are provided, completion must be after start
        if (data.construction_start && data.completion_date) {
          const startDate = new Date(data.construction_start);
          const completionDate = new Date(data.completion_date);
          if (completionDate <= startDate) {
            return false; // Invalid: completion is not after start
          }
        }
        return true; // Optional fields, but if provided, must be valid
      case 2: // Amenities
        return true; // Optional
      case 3: // Unit Types
        return true; // Optional - developers can add later
      case 4: // Photos (Gallery)
        return data.images.length >= 1;
      case 5: // Description
        return !!data.description;
      case 6: // Review
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
        setCurrentStep: handleSetCurrentStep,
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
