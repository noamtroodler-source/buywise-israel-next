import { useMemo } from 'react';
import { TrendingUp, Percent, Landmark, Calculator } from 'lucide-react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  getBuyerTaxCategory, 
  getBuyerCategoryLabel,
  BuyerProfile 
} from '@/hooks/useBuyerProfile';
import { useCalculatorConstants } from '@/hooks/useCalculatorConstants';
import { calculateTaxAmount, BuyerType } from '@/lib/calculations/purchaseTax';
import { getLtvLimit } from '@/lib/calculations/constants';

// Map legacy 4-category to BuyerType
function mapCategoryToBuyerType(category: 'first_time' | 'oleh' | 'additional' | 'non_resident'): BuyerType {
  switch (category) {
    case 'oleh': return 'oleh';
    case 'non_resident': return 'foreign';
    case 'additional': return 'investor';
    default: return 'first_time';
  }
}

// Sample property price for estimates
const SAMPLE_PRICE = 2500000;

interface OnboardingTaxEstimateProps {
  profile: Partial<BuyerProfile>;
}

export function OnboardingTaxEstimate({ profile }: OnboardingTaxEstimateProps) {
  const { data: constants } = useCalculatorConstants();
  
  const buyerCategory = useMemo(() => {
    // Build a partial profile for calculation
    const tempProfile: BuyerProfile = {
      residency_status: profile.residency_status as BuyerProfile['residency_status'],
      aliyah_year: profile.aliyah_year || null,
      is_first_property: profile.is_first_property ?? true,
      purchase_purpose: profile.purchase_purpose as BuyerProfile['purchase_purpose'] || 'primary_residence',
      buyer_entity: 'individual' as const,
      id: '',
      user_id: '',
      onboarding_completed: false,
      has_existing_property: false,
      is_upgrading: profile.is_upgrading ?? false,
      upgrade_sale_date: null,
      arnona_discount_categories: [],
      created_at: '',
      updated_at: '',
    };
    return getBuyerTaxCategory(tempProfile);
  }, [profile]);

  // Use database constants with fallback (returns decimal, convert to %)
  const ltvMax = getLtvLimit(constants, buyerCategory) * 100;
  const buyerType = mapCategoryToBuyerType(buyerCategory);
  const purchaseTax = calculateTaxAmount(SAMPLE_PRICE, buyerType);
  const effectiveRate = (purchaseTax / SAMPLE_PRICE) * 100;

  // Calculate comparison with investor rate
  const investorTax = calculateTaxAmount(SAMPLE_PRICE, 'investor');
  const savings = investorTax - purchaseTax;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IL', {
      style: 'currency',
      currency: 'ILS',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-4"
    >
      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="pt-4 space-y-3">
          <div className="flex items-center gap-2">
            <Calculator className="h-4 w-4 text-primary" />
            <h4 className="font-medium text-sm">Your Estimated Benefits</h4>
            <Badge variant="secondary" className="text-xs">
              {getBuyerCategoryLabel(buyerCategory)}
            </Badge>
          </div>

          <div className="grid grid-cols-2 gap-3 text-sm">
            {/* Purchase Tax */}
            <div className="p-2 bg-background rounded-lg">
              <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
                <Percent className="h-3 w-3" />
                <span className="text-xs">Purchase Tax Rate</span>
              </div>
              <p className="font-semibold text-primary">
                ~{effectiveRate.toFixed(1)}%
              </p>
              <p className="text-xs text-muted-foreground">
                {formatCurrency(purchaseTax)} on ₪2.5M
              </p>
            </div>

            {/* LTV Limit */}
            <div className="p-2 bg-background rounded-lg">
              <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
                <Landmark className="h-3 w-3" />
                <span className="text-xs">Max Mortgage</span>
              </div>
              <p className="font-semibold">{ltvMax}% LTV</p>
              <p className="text-xs text-muted-foreground">
                Up to {formatCurrency(SAMPLE_PRICE * (ltvMax / 100))}
              </p>
            </div>
          </div>

          {/* Savings message */}
          {savings > 0 && (
            <div className="flex items-center gap-2 text-xs text-primary">
              <TrendingUp className="h-3 w-3" />
              <span>
                You save ~{formatCurrency(savings)} vs. investor rates on a ₪2.5M property!
              </span>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

// Recommended calculators based on profile
export function getRecommendedCalculators(profile: Partial<BuyerProfile>): Array<{
  id: string;
  name: string;
  description: string;
  priority: number;
}> {
  const recommendations = [];

  // Everyone should see these
  recommendations.push({
    id: 'purchase-tax',
    name: 'Purchase Tax Calculator',
    description: 'Calculate exact Mas Rechisha for your situation',
    priority: 1,
  });

  recommendations.push({
    id: 'mortgage',
    name: 'Mortgage Calculator',
    description: 'Estimate monthly payments and compare tracks',
    priority: 2,
  });

  // Olim get special recommendation
  if (profile.residency_status === 'oleh_hadash') {
    recommendations.push({
      id: 'oleh-benefits',
      name: 'Oleh Benefits Guide',
      description: 'Maximize your 7-year tax benefits',
      priority: 0,
    });
  }

  // Investment buyers
  if (profile.purchase_purpose === 'investment') {
    recommendations.push({
      id: 'rental-income',
      name: 'Rental Income Calculator',
      description: 'Project rental yields and ROI',
      priority: 1,
    });
    recommendations.push({
      id: 'roi',
      name: 'Investment ROI Calculator',
      description: 'Analyze long-term returns',
      priority: 2,
    });
  }

  // First-time buyers
  if (profile.is_first_property) {
    recommendations.push({
      id: 'affordability',
      name: 'Affordability Calculator',
      description: 'Find your comfortable price range',
      priority: 1,
    });
  }

  // Non-residents
  if (profile.residency_status === 'non_resident') {
    recommendations.push({
      id: 'total-cost',
      name: 'Total Cost Calculator',
      description: 'Full purchase costs including fees',
      priority: 1,
    });
  }

  // Sort by priority
  return recommendations.sort((a, b) => a.priority - b.priority).slice(0, 4);
}
