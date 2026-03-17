import { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import { scrollToTopInstant } from '@/lib/scrollToTop';
import { PropertyType, ListingStatus, LeaseTermOption, SublettingOption, FurnishedStatus, PetsPolicy } from '@/types/database';

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
  additional_rooms: number;
  bathrooms: number;
  size_sqm: number | undefined;
  lot_size_sqm: number | undefined;
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
  
  // Explicit amenity booleans (synced from features array)
  has_balcony: boolean;
  has_elevator: boolean;
  has_storage: boolean;
  
  // Lease reality fields (Step 3)
  lease_term: LeaseTermOption | undefined;
  subletting_allowed: SublettingOption | undefined;
  furnished_status: FurnishedStatus | undefined;
  pets_policy: PetsPolicy | undefined;
  agent_fee_required: boolean | undefined;
   
   // Furniture items for furnished properties
   furniture_items: string[];
   
   // Featured highlight - agent's standout feature
   featured_highlight: string;
   
    // Edit mode: the saved/published price for comparison
    savedPrice?: number;
    
    // Import source (e.g. 'yad2', 'website_scrape') — set for imported listings
    import_source?: string;
  
  // Step 4: Photos
  images: string[];
  
  // Step 5: Description
  description: string;
  highlights: string[];
}

export interface StepValidationError {
  step: number;
  stepName: string;
  errors: string[];
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
  /** Offset applied to currentStep before validation (e.g., 1 for agency wizard with Assign Agent step) */
  stepOffset: number;
  setStepOffset: (offset: number) => void;
  // New save-related properties
  resetWizard: () => void;
  loadFromSaved: (savedData: PropertyWizardData) => void;
  // Validation helpers for free navigation
  getStepErrors: (adjustedStep: number) => string[];
  getAllErrors: () => StepValidationError[];
}

export const defaultPropertyData: PropertyWizardData = {
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
  additional_rooms: 0,
  bathrooms: 0,
  size_sqm: undefined,
  lot_size_sqm: undefined,
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
  // Explicit amenity booleans
  has_balcony: false,
  has_elevator: false,
  has_storage: false,
  // Lease reality defaults
  lease_term: undefined,
  subletting_allowed: undefined,
  furnished_status: undefined,
  pets_policy: undefined,
  agent_fee_required: undefined,
   // Furniture items
   furniture_items: [],
   // Featured highlight
   featured_highlight: '',
  images: [],
  description: '',
  highlights: [],
};

const PropertyWizardContext = createContext<PropertyWizardContextType | undefined>(undefined);

const DEFAULT_TOTAL_STEPS = 6;
export const PROPERTY_WIZARD_STORAGE_KEY = 'property-wizard-draft';

const STEP_NAMES = ['Basics', 'Details', 'Features', 'Photos', 'Description'];

function computeStepErrors(data: PropertyWizardData, adjustedStep: number): string[] {
  const errors: string[] = [];
  switch (adjustedStep) {
    case 0: { // Basics
      if (!data.title || data.title.length < 20) errors.push('Title must be at least 20 characters');
      if (data.price <= 0) errors.push('Price is required');
      if (!data.city) errors.push('City is required');
      if (!data.neighborhood) errors.push('Neighborhood is required');
      if (!data.address || !data.latitude || !data.longitude) {
        errors.push('A valid address with map pin is required');
      } else if (!/\d+/.test(data.address)) {
        errors.push('Address must include a street number');
      }
      break;
    }
    case 1: { // Details
      if (data.property_type === 'land') {
        if ((data.lot_size_sqm ?? 0) <= 0) errors.push('Lot size is required');
      } else {
        if ((data.size_sqm ?? 0) <= 0) errors.push('Size (sqm) is required');
        const needsFloor = ['apartment', 'penthouse', 'mini_penthouse', 'duplex', 'garden_apartment'].includes(data.property_type);
        if (needsFloor && data.floor === undefined) errors.push('Floor number is required');
        if (needsFloor && data.total_floors === undefined) errors.push('Total floors is required');
      }
      break;
    }
    case 2: { // Features
      if (!data.is_immediate_entry && !data.entry_date) errors.push('Entry date is required');
      if (data.listing_status === 'for_rent') {
        if (!data.furnished_status) errors.push('Furnished status is required');
        if (!data.pets_policy) errors.push('Pets policy is required');
        if (!data.lease_term) errors.push('Lease term is required');
      }
      break;
    }
    case 3: { // Photos
      const minPhotos = Math.max(data.bedrooms + (data.additional_rooms || 0) + data.bathrooms, 3);
      if (data.images.length < minPhotos) errors.push(`At least ${minPhotos} photos required (have ${data.images.length})`);
      break;
    }
    case 4: { // Description
      if (data.description.length < 100) errors.push(`Description must be at least 100 characters (${data.description.length}/100)`);
      break;
    }
  }
  return errors;
}

export function PropertyWizardProvider({ children, totalSteps = DEFAULT_TOTAL_STEPS }: { children: ReactNode; totalSteps?: number }) {
  const [data, setData] = useState<PropertyWizardData>(defaultPropertyData);
  const [currentStep, setCurrentStep] = useState(0);
  const [stepOffset, setStepOffset] = useState(0);

  const updateData = useCallback((updates: Partial<PropertyWizardData>) => {
    setData(prev => ({ ...prev, ...updates }));
  }, []);

  const handleSetCurrentStep = useCallback((step: number) => {
    setCurrentStep(step);
    scrollToTopInstant();
  }, []);

  const resetWizard = useCallback(() => {
    setData(defaultPropertyData);
    setCurrentStep(0);
  }, []);

  const loadFromSaved = useCallback((savedData: PropertyWizardData) => {
    setData(savedData);
  }, []);

  const goNext = () => {
    if (currentStep < totalSteps - 1) {
      setCurrentStep(prev => prev + 1);
      scrollToTopInstant();
    }
  };

  const goBack = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
      scrollToTopInstant();
    }
  };

  const getStepErrors = useCallback((adjustedStep: number): string[] => {
    return computeStepErrors(data, adjustedStep);
  }, [data]);

  const getAllErrors = useCallback((): StepValidationError[] => {
    const allErrors: StepValidationError[] = [];
    for (let i = 0; i < 5; i++) {
      const errors = computeStepErrors(data, i);
      if (errors.length > 0) {
        allErrors.push({ step: i, stepName: STEP_NAMES[i], errors });
      }
    }
    return allErrors;
  }, [data]);

  // canGoNext stays for backward compat / submit gating
  const adjustedStep = currentStep - stepOffset;
  const canGoNext = computeStepErrors(data, adjustedStep).length === 0;

  const isLastStep = currentStep === totalSteps - 1;

  return (
    <PropertyWizardContext.Provider
      value={{
        data,
        updateData,
        currentStep,
        setCurrentStep: handleSetCurrentStep,
        goNext,
        goBack,
        canGoNext,
        isLastStep,
        stepOffset,
        setStepOffset,
        resetWizard,
        loadFromSaved,
        getStepErrors,
        getAllErrors,
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
