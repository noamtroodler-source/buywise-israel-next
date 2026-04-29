import { getPriceContext } from '@/lib/priceContext';
import type { PropertyWizardData } from '@/components/agent/wizard/PropertyWizardContext';

export function getWizardPriceContext(data: PropertyWizardData, cityAveragePriceSqm?: number | null) {
  const pricePerSqm = data.price && data.size_sqm ? Math.round(data.price / data.size_sqm) : null;
  const cityGap = pricePerSqm && cityAveragePriceSqm
    ? Math.round(((pricePerSqm - cityAveragePriceSqm) / cityAveragePriceSqm) * 100)
    : null;

  return getPriceContext({
    avgComparison: cityGap,
    compsCount: 0,
    radiusUsedM: 1000,
    benchmarkPriceSqm: cityAveragePriceSqm,
    pricePerSqm,
    property: data,
  });
}

export function getWizardPriceContextPersistence(data: PropertyWizardData, cityAveragePriceSqm?: number | null) {
  if (data.listing_status !== 'for_sale') {
    return {
      price_context_property_class: null,
      price_context_confidence_score: null,
      price_context_confidence_tier: null,
      price_context_public_label: null,
      price_context_percentage_suppressed: null,
      comp_pool_used: null,
    };
  }

  const context = getWizardPriceContext(data, cityAveragePriceSqm);
  return {
    price_context_property_class: context.propertyClass,
    price_context_confidence_score: context.confidenceScore,
    price_context_confidence_tier: context.confidenceTier,
    price_context_public_label: context.publicLabel,
    price_context_percentage_suppressed: context.percentageSuppressed,
    comp_pool_used: cityAveragePriceSqm ? 'city_benchmark_wizard_preview' : 'wizard_preview_insufficient_data',
  };
}