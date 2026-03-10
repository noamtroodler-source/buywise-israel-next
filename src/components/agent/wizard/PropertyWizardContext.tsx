import { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
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
  /** Offset applied to currentStep before validation (e.g., 1 for agency wizard with Assign Agent step) */
  stepOffset: number;
  setStepOffset: (offset: number) => void;
  // New save-related properties
  resetWizard: () => void;
  loadFromSaved: (savedData: PropertyWizardData) => void;
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

export function PropertyWizardProvider({ children, totalSteps = DEFAULT_TOTAL_STEPS }: { children: ReactNode; totalSteps?: number }) {
  const [data, setData] = useState<PropertyWizardData>(defaultPropertyData);
  const [currentStep, setCurrentStep] = useState(0);
  const [stepOffset, setStepOffset] = useState(0);

  const updateData = useCallback((updates: Partial<PropertyWizardData>) => {
    setData(prev => ({ ...prev, ...updates }));
  }, []);

  const handleSetCurrentStep = useCallback((step: number) => {
    setCurrentStep(step);
    window.scrollTo({ top: 0, behavior: 'smooth' });
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
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const goBack = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Validation for each step — use adjusted step to account for offset (e.g., agency wizard's Assign Agent step)
  const adjustedStep = currentStep - stepOffset;
  const canGoNext = (() => {
    switch (adjustedStep) {
      case 0: // Basics
        const hasStreetNumber = /\d+/.test(data.address);
        return !!(data.title && data.title.length >= 20 && data.price > 0 && data.city && data.neighborhood && data.address && data.latitude && data.longitude && hasStreetNumber);
      case 1: { // Details
        if (data.property_type === 'land') {
          return (data.lot_size_sqm ?? 0) > 0;
        }
        const needsFloor = ['apartment', 'penthouse', 'mini_penthouse', 'duplex', 'garden_apartment'].includes(data.property_type);
        return data.bedrooms >= 0 && data.bathrooms >= 0
          && (data.size_sqm ?? 0) > 0
          && (!needsFloor || (data.floor !== undefined && data.total_floors !== undefined));
      }
      case 2: { // Features
        const baseValid = !!data.furnished_status && !!data.pets_policy;
        const rentalValid = data.listing_status !== 'for_rent' || !!data.lease_term;
        const entryValid = data.is_immediate_entry || !!data.entry_date;
        return baseValid && rentalValid && entryValid;
      }
      case 3: // Photos
        return data.images.length >= 3;
      case 4: // Description
        return data.description.length >= 100;
      case 5: // Review
        return true;
      default:
        return false;
    }
  })();

  const isLastStep = currentStep === totalSteps - 1;

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
        stepOffset,
        setStepOffset,
        resetWizard,
        loadFromSaved,
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
