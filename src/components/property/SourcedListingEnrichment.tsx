/**
 * SourcedListingEnrichment
 *
 * The "secret weapon" for unclaimed sourced listings.
 * Makes a listing with no photos, no agent, no verified details
 * genuinely useful for international buyers by pulling from
 * our rich data sources.
 *
 * Sections:
 * 1. Price Intelligence — vs neighborhood avg, vs city avg, price per sqm
 * 2. True Cost Estimate — purchase tax, lawyer, agent fees using calculator_constants
 * 3. Arnona & Running Costs — from city data
 * 4. Rental Yield (if for sale) — from city gross_yield_percent
 * 5. City Anglo Community Signal — from anglo_presence field
 * 6. "What to verify" checklist — tailored to what's MISSING from this listing
 */

import { useCityDetails } from '@/hooks/useCityDetails';
import { useNeighborhoodProfile } from '@/hooks/useNeighborhoodProfile';
import { useFormatPrice, useFormatPricePerArea } from '@/contexts/PreferencesContext';
import {
  TrendingUp, TrendingDown, Minus, Calculator, Home, Users,
  AlertCircle, CheckCircle2, Info, Building2, DollarSign, Percent
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';

interface SourcedListingEnrichmentProps {
  property: {
    id: string;
    price: number;
    currency?: string;
    city: string;
    neighborhood?: string | null;
    size_sqm?: number | null;
    bedrooms?: number | null;
    listing_status: string;
    floor?: number | null;
    year_built?: number | null;
    bathrooms?: number | null;
    address?: string | null;
    features?: string[] | null;
    source_rooms?: number | null;
    import_source?: string | null;
    is_claimed?: boolean;
  };
  citySlug: string;
  className?: string;
}

// Purchase tax brackets for foreign buyers (2026 rates)
function calcPurchaseTax(price: number, isForeigner = true): number {
  if (!isForeigner) return 0;
  // Foreign buyer rates (no exemptions)
  const brackets = [
    { upTo: 6_000_000, rate: 0.08 },
    { upTo: Infinity, rate: 0.10 },
  ];
  let tax = 0;
  let remaining = price;
  let prev = 0;
  for (const bracket of brackets) {
    const slice = Math.min(remaining, bracket.upTo - prev);
    tax += slice * bracket.rate;
    remaining -= slice;
    prev = bracket.upTo;
    if (remaining <= 0) break;
  }
  return Math.round(tax);
}

export function SourcedListingEnrichment({
  property,
  citySlug,
  className,
}: SourcedListingEnrichmentProps) {
  const formatPrice = useFormatPrice();
  const formatPriceSqm = useFormatPricePerArea();
  const { data: city } = useCityDetails(citySlug);
  const { data: neighborhood } = useNeighborhoodProfile(property.city, property.neighborhood);

  // Only show for unclaimed sourced listings
  if (!property.import_source || property.is_claimed) return null;
  if (!city) return null;

  const hasPrice = property.price > 0;
  const hasSizeSqm = !!property.size_sqm && property.size_sqm > 0;
  const isForSale = property.listing_status === 'for_sale';

  // Price intelligence
  const priceSqm = hasPrice && hasSizeSqm ? property.price / property.size_sqm! : null;
  const cityAvgSqm = city.average_price_sqm;
  const vsAvgSqmPct = priceSqm && cityAvgSqm
    ? Math.round(((priceSqm - cityAvgSqm) / cityAvgSqm) * 100)
    : null;

  // True cost (foreign buyer)
  const purchaseTax = hasPrice ? calcPurchaseTax(property.price) : null;
  const lawyerFee = hasPrice ? Math.round(property.price * 0.007) : null; // ~0.7%
  const agentFee = hasPrice ? Math.round(property.price * 0.02 * 1.17) : null; // 2% + VAT
  const totalExtraCosts = purchaseTax && lawyerFee && agentFee
    ? purchaseTax + lawyerFee + agentFee
    : null;

  // Running costs
  const arnonaMonthly = city.arnona_monthly_avg
    ? (hasSizeSqm && city.arnona_rate_sqm
      ? Math.round(city.arnona_rate_sqm * property.size_sqm!)
      : city.arnona_monthly_avg)
    : null;
  const vaadBayit = city.average_vaad_bayit;

  // Rental yield
  const grossYield = city.gross_yield_percent;
  const impliedMonthlyRent = hasPrice && grossYield
    ? Math.round((property.price * (grossYield / 100)) / 12)
    : null;

  // What's missing from this listing — generate a smart checklist
  const missing: { label: string; why: string; severity: 'high' | 'medium' }[] = [];
  if (!property.address || property.address.trim().length < 3) {
    missing.push({ label: 'Exact address', why: 'Needed to verify building condition, check Tabu, and get real arnona rates', severity: 'high' });
  }
  if (!property.bathrooms) {
    missing.push({ label: 'Bathroom count', why: 'Affects livability — some Israeli apartments have only one bathroom', severity: 'medium' });
  }
  if (!property.floor) {
    missing.push({ label: 'Floor number', why: 'Top floors may need elevator; ground floor can mean noise/security tradeoffs', severity: 'medium' });
  }
  if (!property.year_built) {
    missing.push({ label: 'Year built', why: 'Buildings pre-1980 may need TAMA 38 reinforcement — affects cost and timeline', severity: 'high' });
  }
  if (!property.features?.length) {
    missing.push({ label: 'Features list', why: 'Parking, mamad (safe room), storage — these significantly affect value', severity: 'medium' });
  }

  return (
    <div className={cn('space-y-5', className)}>

      {/* Price Intelligence */}
      {hasPrice && (
        <div className="rounded-xl border border-border bg-card p-4 space-y-3">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-primary" />
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Price Intelligence</p>
            <Badge variant="secondary" className="text-xs ml-auto font-normal">BuyWise data</Badge>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {priceSqm && (
              <div className="rounded-lg bg-muted/40 p-3">
                <p className="text-xs text-muted-foreground">This listing</p>
                <p className="text-base font-bold text-foreground">
                  {formatPriceSqm(priceSqm)}/m²
                </p>
              </div>
            )}
            {cityAvgSqm && (
              <div className="rounded-lg bg-muted/40 p-3">
                <p className="text-xs text-muted-foreground">{property.city} avg</p>
                <p className="text-base font-bold text-foreground">
                  {formatPriceSqm(cityAvgSqm)}/m²
                </p>
              </div>
            )}
          </div>

          {vsAvgSqmPct !== null && (
            <div className={cn(
              'flex items-center gap-2 rounded-lg px-3 py-2 text-sm',
              vsAvgSqmPct > 10 ? 'bg-destructive/10 text-destructive' :
              vsAvgSqmPct < -10 ? 'bg-semantic-green/10 text-semantic-green' :
              'bg-muted/60 text-muted-foreground'
            )}>
              {vsAvgSqmPct > 0
                ? <TrendingUp className="w-4 h-4 flex-shrink-0" />
                : vsAvgSqmPct < 0
                ? <TrendingDown className="w-4 h-4 flex-shrink-0" />
                : <Minus className="w-4 h-4 flex-shrink-0" />}
              <span>
                Price per m² is <strong>{Math.abs(vsAvgSqmPct)}% {vsAvgSqmPct > 0 ? 'above' : 'below'}</strong> the {property.city} city average
                {property.neighborhood ? ` (neighborhood data not available for unclaimed listings)` : ''}
              </span>
            </div>
          )}

          {city.yoy_price_change !== null && (
            <p className="text-xs text-muted-foreground flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5" />
              {property.city} prices {city.yoy_price_change >= 0 ? 'up' : 'down'}{' '}
              <strong>{Math.abs(city.yoy_price_change)}%</strong> year-over-year
            </p>
          )}
        </div>
      )}

      {/* True Cost for Foreign Buyer */}
      {isForSale && hasPrice && totalExtraCosts && (
        <div className="rounded-xl border border-border bg-card p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Calculator className="w-4 h-4 text-primary" />
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">True Cost (Foreign Buyer)</p>
          </div>

          <div className="space-y-2">
            {[
              { label: 'Asking price', amount: property.price, note: null },
              { label: 'Purchase tax (~8%)', amount: purchaseTax!, note: 'Foreigners pay 8% on first ₪6M' },
              { label: 'Lawyer fees (~0.7%)', amount: lawyerFee!, note: 'Notary + lawyer + Tabu registration' },
              { label: 'Agent commission (~2% + VAT)', amount: agentFee!, note: 'Standard in Israel' },
              { label: 'Total cost', amount: property.price + totalExtraCosts, note: null, isTotal: true },
            ].map(({ label, amount, note, isTotal }) => (
              <div key={label} className={cn(
                'flex items-center justify-between text-sm py-1',
                isTotal ? 'border-t border-border pt-2 font-semibold' : ''
              )}>
                <div className="flex items-center gap-1.5">
                  <span className={isTotal ? 'text-foreground' : 'text-muted-foreground'}>{label}</span>
                  {note && (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger><Info className="w-3 h-3 text-muted-foreground/60" /></TooltipTrigger>
                        <TooltipContent className="text-xs max-w-xs">{note}</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
                </div>
                <span className={isTotal ? 'text-foreground' : 'text-muted-foreground'}>
                  {formatPrice(amount, property.currency || 'ILS')}
                </span>
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">Estimates only. Purchase tax rates vary by buyer status. Consult a lawyer before proceeding.</p>
        </div>
      )}

      {/* Monthly Running Costs */}
      {(arnonaMonthly || vaadBayit) && (
        <div className="rounded-xl border border-border bg-card p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Home className="w-4 h-4 text-primary" />
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Estimated Monthly Costs</p>
            <Badge variant="secondary" className="text-xs ml-auto font-normal">{property.city} averages</Badge>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {arnonaMonthly && (
              <div className="rounded-lg bg-muted/40 p-3">
                <p className="text-xs text-muted-foreground">Arnona (municipal tax)</p>
                <p className="text-base font-bold text-foreground">
                  ~₪{arnonaMonthly.toLocaleString()}/mo
                </p>
                {hasSizeSqm && city.arnona_rate_sqm && (
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Based on {property.size_sqm}m² × ₪{city.arnona_rate_sqm}/m²
                  </p>
                )}
              </div>
            )}
            {vaadBayit && (
              <div className="rounded-lg bg-muted/40 p-3">
                <p className="text-xs text-muted-foreground">Vaad bayit (building)</p>
                <p className="text-base font-bold text-foreground">
                  ~₪{vaadBayit.toLocaleString()}/mo
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">{property.city} average</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Rental Yield (for sale listings) */}
      {isForSale && hasPrice && grossYield && impliedMonthlyRent && (
        <div className="rounded-xl border border-border bg-card p-4 space-y-2">
          <div className="flex items-center gap-2">
            <Percent className="w-4 h-4 text-primary" />
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Investment Snapshot</p>
            <Badge variant="secondary" className="text-xs ml-auto font-normal">{property.city} avg</Badge>
          </div>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="rounded-lg bg-muted/40 p-2">
              <p className="text-xs text-muted-foreground">Gross yield</p>
              <p className="text-base font-bold text-foreground">{grossYield.toFixed(1)}%</p>
            </div>
            <div className="rounded-lg bg-muted/40 p-2">
              <p className="text-xs text-muted-foreground">Implied rent/mo</p>
              <p className="text-base font-bold text-foreground">~₪{impliedMonthlyRent.toLocaleString()}</p>
            </div>
            {city.investment_score && (
              <div className="rounded-lg bg-muted/40 p-2">
                <p className="text-xs text-muted-foreground">Investment score</p>
                <p className="text-base font-bold text-foreground">{city.investment_score}/10</p>
              </div>
            )}
          </div>
          <p className="text-xs text-muted-foreground">Based on {property.city} city-wide rental market data.</p>
        </div>
      )}

      {/* Anglo community signal */}
      {city.anglo_presence && (
        <div className="rounded-xl border border-border bg-card p-4 space-y-2">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-primary" />
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">International Community</p>
          </div>
          <p className="text-sm text-foreground/80 leading-relaxed">{city.anglo_presence}</p>
          {neighborhood?.anglo_community && (
            <div className="rounded-lg bg-primary/5 px-3 py-2 mt-1">
              <p className="text-xs font-medium text-primary">In {property.neighborhood}:</p>
              <p className="text-sm text-foreground/80 mt-0.5">{neighborhood.anglo_community}</p>
            </div>
          )}
        </div>
      )}

      {/* What to verify checklist */}
      {missing.length > 0 && (
        <div className="rounded-xl border border-semantic-amber/30 bg-semantic-amber/5 p-4 space-y-3">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600" />
            <p className="text-sm font-semibold text-foreground">Verify before proceeding</p>
          </div>
          <p className="text-xs text-muted-foreground">
            This listing is missing key details. Ask the agent or a vetted professional about:
          </p>
          <div className="space-y-2">
            {missing.map(({ label, why, severity }) => (
              <div key={label} className="flex items-start gap-2">
                <div className={cn(
                  'w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0',
                  severity === 'high' ? 'bg-red-500' : 'bg-amber-500'
                )} />
                <div>
                  <span className="text-xs font-medium text-foreground">{label}</span>
                  <span className="text-xs text-muted-foreground"> — {why}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
