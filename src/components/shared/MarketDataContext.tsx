import { useState } from 'react';
import { Database, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface MarketDataContextProps {
  variant?: 'compact' | 'full';
  className?: string;
}

const FACTORS_COMPACT = [
  { label: 'Unreported payments', desc: 'Part of the price may be paid "under the table" — declared prices can understate the real cost.' },
  { label: 'Bundled extras', desc: 'A/C units, furniture, custom closets, and appliances often add ₪50K–200K+ but aren\'t in the official record.' },
  { label: 'Parking & storage', desc: 'In central areas, a parking spot alone can be worth ₪200K–400K — sometimes recorded as a separate transaction.' },
  { label: 'Condition & renovation', desc: 'A gut-renovated apartment vs. original 1970s condition can differ 20–30% in the same building — invisible in data.' },
  { label: 'Floor & view premium', desc: '2nd floor facing a wall vs. 12th floor sea view — 30–50% price gap, but the data just says "4 rooms, 100 sqm."' },
  { label: 'Family & non-market sales', desc: 'Inheritance transfers and family sales at "friendly" prices appear as normal transactions, pulling averages down.' },
];

const FACTORS_FULL = [
  { label: 'Unreported payments ("black" money)', desc: 'It\'s common in the secondary market for part of the sale price to be paid in unreported cash. The declared price on the contract — which is what appears in government databases — can be significantly lower than what actually changed hands. Enforcement has tightened, but the practice hasn\'t disappeared.' },
  { label: 'Bundled extras sold alongside', desc: 'Israeli apartments frequently include significant extras — air conditioning units (often 4–6 per apartment), furniture, custom closets (aronot kir), kitchen appliances, solar water heaters, and security room upgrades. These can add tens or even hundreds of thousands of shekels but may be split off the official sale price or handled in side agreements.' },
  { label: 'Parking & storage as separate transactions', desc: 'In many buildings, parking spots and storage rooms (mahsan) are registered as separate property units. A parking spot in central Tel Aviv can be worth ₪200K–400K on its own. Two identical apartments in the same building can show wildly different recorded prices simply because one included parking in the contract and the other didn\'t.' },
  { label: 'Condition, renovation & finish level', desc: 'Government data tells you square meters, floor, and price. It tells you nothing about whether the apartment was a gut renovation with an imported kitchen or a crumbling original. The gap between basic contractor standard and high-spec renovated in the same building can easily be 20–30%. Balcony enclosures (common and often unpermitted) add functional space that isn\'t in official records.' },
  { label: 'Views, floor premium & orientation', desc: 'An apartment on the 2nd floor facing a wall and one on the 12th floor with a sea view in the same building can differ by 30–50% in price. The transaction data just says "4 rooms, 100 sqm, Building X." There\'s no field for view, orientation, noise exposure, or natural light.' },
  { label: 'Non-arm\'s-length & family transactions', desc: 'Family sales, inheritance transfers, and deals between related parties appear in transaction data at prices that don\'t reflect market value — sometimes 30–50% below. There\'s no flag distinguishing these from open-market sales, and they can skew neighborhood averages.' },
];

export function MarketDataContext({ variant = 'compact', className }: MarketDataContextProps) {
  const [isOpen, setIsOpen] = useState(false);
  const factors = variant === 'full' ? FACTORS_FULL : FACTORS_COMPACT;

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className={className}>
      <div className="rounded-lg border border-border/60 bg-muted/30 overflow-hidden">
        <CollapsibleTrigger className="flex items-center gap-3 w-full px-4 py-3 text-left hover:bg-muted/50 transition-colors">
          <Database className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          <span className="text-sm font-medium text-foreground flex-1">
            Government data is powerful — but doesn't capture everything
          </span>
          <ChevronDown className={cn(
            "h-4 w-4 text-muted-foreground transition-transform duration-200",
            isOpen && "rotate-180"
          )} />
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div className="px-4 pb-4 pt-1 space-y-3">
            <ul className="space-y-2.5">
              {factors.map((f) => (
                <li key={f.label} className="text-sm">
                  <span className="font-medium text-foreground">{f.label}:</span>{' '}
                  <span className="text-muted-foreground">{f.desc}</span>
                </li>
              ))}
            </ul>

            <p className="text-sm text-foreground/80 pt-2 border-t border-border/40">
              Recorded transactions remain the best available benchmark for understanding market pricing.
              BuyWise helps you understand the factors they don't capture — so you can make informed decisions with the full picture.
            </p>
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}
