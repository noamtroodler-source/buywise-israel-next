import type { Property } from '@/types/database';
import { PropertyWizardData, defaultPropertyData } from '@/components/agent/wizard/PropertyWizardContext';

/**
 * Maps a saved Property to a PropertyWizardData draft for duplication.
 * Strips id, clears images, resets price-tracking, and prepends "Copy of " to title.
 */
export function propertyToWizardDraft(property: Property): PropertyWizardData {
  const features = property.features ?? [];

  return {
    ...defaultPropertyData,
    title: `Copy of ${property.title}`.slice(0, 60),
    property_type: property.property_type,
    listing_status: property.listing_status,
    price: property.price,
    city: property.city,
    neighborhood: property.neighborhood ?? '',
    address: property.address,
    latitude: property.latitude,
    longitude: property.longitude,
    place_id: '',

    bedrooms: property.bedrooms,
    additional_rooms: property.additional_rooms ?? 0,
    bathrooms: property.bathrooms,
    size_sqm: property.size_sqm ?? undefined,
    lot_size_sqm: property.lot_size_sqm ?? undefined,
    floor: property.floor ?? undefined,
    total_floors: property.total_floors ?? undefined,
    year_built: property.year_built ?? undefined,
    parking: property.parking,

    condition: property.condition ?? 'good',
    ac_type: property.ac_type ?? 'split',
    entry_date: property.entry_date ?? undefined,
    is_immediate_entry: !property.entry_date,
    vaad_bayit_monthly: property.vaad_bayit_monthly ?? undefined,
    features,

    has_balcony: features.includes('balcony'),
    has_elevator: features.includes('elevator'),
    has_storage: features.includes('storage'),

    lease_term: property.lease_term ?? undefined,
    subletting_allowed: property.subletting_allowed ?? undefined,
    furnished_status: property.furnished_status ?? undefined,
    pets_policy: property.pets_policy ?? undefined,
    agent_fee_required: property.agent_fee_required ?? undefined,

    furniture_items: property.furniture_items ?? [],
    featured_highlight: property.featured_highlight ?? '',

    // Images cleared — agent must upload fresh photos
    images: [],

    description: property.description ?? '',
    highlights: [],
  };
}
