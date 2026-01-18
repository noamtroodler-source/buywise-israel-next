import { createContext, useContext, useState, ReactNode } from 'react';
import { PropertyType, ListingStatus } from '@/types/database';

export interface PropertyWizardData {
  // Step 1: Basics
  title: string;
  property_type: PropertyType;
  listing_status: ListingStatus;
  price: number;
  city: string;
  neighborhood: string;
  address: string;
  latitude: number | null;
  longitude: number | null;
  place_id: string;
  
  // Step 2: Details
  bedrooms: number;
  bathrooms: number;
  size_sqm: number | undefined;
  floor: number | undefined;
  total_floors: number | undefined;
  year_built: number | undefined;
  parking: number;
  
  // Step 3: Features
  condition: string;
  ac_type: string;
  entry_date: string | undefined;
  is_immediate_entry: boolean;
  vaad_bayit_monthly: number | undefined;
  features: string[];
  
  // Step 4: Photos
  images: string[];
  
  // Step 5: Description
  description: string;
  highlights: string[];
}

interface PropertyWizardContextType {
  data: PropertyWizardData;
  updateData: (updates: Partial<PropertyWizardData>) => void;
  currentStep: number;
  setCurrentStep: (step: number) => void;
  goNext: () => void;
  goBack: () => void;
  canGoNext: boolean;
  isLastStep: boolean;
}

const defaultData: PropertyWizardData = {
  title: '',
  property_type: 'apartment',
  listing_status: 'for_sale',
  price: 0,
  city: '',
  neighborhood: '',
  address: '',
  latitude: null,
  longitude: null,
  place_id: '',
  bedrooms: 0,
  bathrooms: 0,
  size_sqm: undefined,
  floor: undefined,
  total_floors: undefined,
  year_built: undefined,
  parking: 0,
  condition: 'good',
  ac_type: 'split',
  entry_date: undefined,
  is_immediate_entry: true,
  vaad_bayit_monthly: undefined,
  features: [],
  images: [],
  description: '',
  highlights: [],
};

const PropertyWizardContext = createContext<PropertyWizardContextType | undefined>(undefined);

const TOTAL_STEPS = 6;

export function PropertyWizardProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<PropertyWizardData>(defaultData);
  const [currentStep, setCurrentStep] = useState(0);

  const updateData = (updates: Partial<PropertyWizardData>) => {
    setData(prev => ({ ...prev, ...updates }));
  };

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
        return !!(data.title && data.price > 0 && data.city && data.address && data.latitude && data.longitude);
      case 1: // Details
        return data.bedrooms >= 0 && data.bathrooms >= 0;
      case 2: // Features
        return true; // Optional step
      case 3: // Photos
        return data.images.length >= 1; // At least 1 photo required
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
    <PropertyWizardContext.Provider
      value={{
        data,
        updateData,
        currentStep,
        setCurrentStep,
        goNext,
        goBack,
        canGoNext,
        isLastStep,
      }}
    >
      {children}
    </PropertyWizardContext.Provider>
  );
}

export function usePropertyWizard() {
  const context = useContext(PropertyWizardContext);
  if (!context) {
    throw new Error('usePropertyWizard must be used within PropertyWizardProvider');
  }
  return context;
}
