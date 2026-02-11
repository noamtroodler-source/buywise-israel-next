import { useMemo } from 'react';
import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown, Minus, Star, BarChart3, Home, Percent, Calendar } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useCityDetails } from '@/hooks/useCityDetails';
import { useHistoricalPrices } from '@/hooks/useHistoricalPrices';

interface PropertyInvestmentScoreProps {
  price: number;
  city: string;
  sizeSqm?: number;
  bedrooms?: number;
  neighborhood?: string;
  yearBuilt?: number | null;
}

interface InvestmentMetrics {
  overallScore: number;
  yieldScore: number;
  appreciationScore: number;
  demandScore: number;
  estimatedGrossYield: number;
  estimatedNetYield: number;
  cityAvgYield: number;
  priceVsCityAvg: number; // % difference from city average
  appreciationPotential: 'high' | 'medium' | 'low';
  recommendation: string;
}

export function PropertyInvestmentScore({
  price,
  city,
  sizeSqm,
  bedrooms = 3,
  neighborhood,
  yearBuilt,
}: PropertyInvestmentScoreProps) {
  const { data: cityData } = useCityDetails(city.toLowerCase().replace(/\s+/g, '-'));
  const { data: historicalPrices } = useHistoricalPrices(city);

  const metrics = useMemo((): InvestmentMetrics => {
    // Default estimates if no city data
    const cityGrossYield = cityData?.gross_yield_percent || 3.5;
    const cityNetYield = cityData?.net_yield_percent || 2.5;
    const cityAvgPriceSqm = cityData?.average_price_sqm || 35000;
    const cityInvestmentScore = cityData?.investment_score || 5;
    const yoyChange = cityData?.yoy_price_change || 5;

    // Calculate price per sqm
    const pricePerSqm = sizeSqm && sizeSqm > 0 ? price / sizeSqm : price / 80; // Default 80sqm

    // Compare to city average
    const priceVsCityAvg = cityAvgPriceSqm > 0 
      ? ((pricePerSqm - cityAvgPriceSqm) / cityAvgPriceSqm) * 100 
      : 0;

    // Estimate rental income based on bedrooms and city
    const roomsForRent = bedrooms || 3;
    let estimatedMonthlyRent = 0;
    
    if (cityData) {
      if (roomsForRent <= 3) {
        estimatedMonthlyRent = ((cityData.rental_3_room_min || 4000) + (cityData.rental_3_room_max || 6000)) / 2;
      } else {
        estimatedMonthlyRent = ((cityData.rental_4_room_min || 5000) + (cityData.rental_4_room_max || 8000)) / 2;
      }
    } else {
      // Default estimates
      estimatedMonthlyRent = roomsForRent <= 3 ? 5000 : 7000;
    }

    // Calculate yields
    const annualRent = estimatedMonthlyRent * 12;
    const estimatedGrossYield = price > 0 ? (annualRent / price) * 100 : 0;
    
    // Net yield after expenses (arnona, vaad, maintenance, vacancy)
    const annualExpenses = (cityData?.arnona_monthly_avg || 350) * 12 + 
                           (cityData?.average_vaad_bayit || 300) * 12 +
                           price * 0.01 + // 1% maintenance
                           annualRent * 0.08; // 8% vacancy
    const estimatedNetYield = price > 0 ? ((annualRent - annualExpenses) / price) * 100 : 0;

    // Score calculations (1-10 scale)
    
    // Yield score: Higher yield = higher score
    const yieldDiff = estimatedGrossYield - cityGrossYield;
    let yieldScore = 5 + (yieldDiff * 2); // Each 0.5% above avg adds 1 point
    yieldScore = Math.max(1, Math.min(10, yieldScore));

    // Appreciation score based on city investment score and price vs avg
    let appreciationScore = cityInvestmentScore;
    // Bonus if buying below city average
    if (priceVsCityAvg < -10) appreciationScore += 1;
    if (priceVsCityAvg < -20) appreciationScore += 1;
    appreciationScore = Math.max(1, Math.min(10, appreciationScore));

    // Demand score based on historical trends
    let demandScore = 5;
    if (yoyChange > 8) demandScore = 8;
    else if (yoyChange > 5) demandScore = 7;
    else if (yoyChange > 2) demandScore = 6;
    else if (yoyChange < 0) demandScore = 3;
    demandScore = Math.max(1, Math.min(10, demandScore));

    // Overall score (weighted average)
    const overallScore = Math.round(
      (yieldScore * 0.35) + 
      (appreciationScore * 0.4) + 
      (demandScore * 0.25)
    );

    // Appreciation potential
    let appreciationPotential: 'high' | 'medium' | 'low' = 'medium';
    if (appreciationScore >= 7 && demandScore >= 6) appreciationPotential = 'high';
    else if (appreciationScore <= 4 || demandScore <= 3) appreciationPotential = 'low';

    // Generate recommendation
    let recommendation = '';
    if (overallScore >= 7) {
      recommendation = 'Strong investment opportunity with good yield and growth potential.';
    } else if (overallScore >= 5) {
      recommendation = 'Solid investment with average returns for the area.';
    } else {
      recommendation = 'Consider negotiating price or exploring other options.';
    }

    if (priceVsCityAvg < -15) {
      recommendation += ' Below-market pricing detected.';
    } else if (priceVsCityAvg > 20) {
      recommendation += ' Premium pricing - verify justification.';
    }

    return {
      overallScore,
      yieldScore: Math.round(yieldScore),
      appreciationScore: Math.round(appreciationScore),
      demandScore: Math.round(demandScore),
      estimatedGrossYield: Math.round(estimatedGrossYield * 100) / 100,
      estimatedNetYield: Math.round(estimatedNetYield * 100) / 100,
      cityAvgYield: cityGrossYield,
      priceVsCityAvg: Math.round(priceVsCityAvg),
      appreciationPotential,
      recommendation,
    };
  }, [price, city, sizeSqm, bedrooms, cityData, historicalPrices]);

  const getScoreColor = (score: number) => {
    if (score >= 7) return 'text-semantic-green';
    if (score >= 5) return 'text-semantic-amber';
    return 'text-semantic-red';
  };

  const getScoreBg = (score: number) => {
    if (score >= 7) return 'bg-semantic-green';
    if (score >= 5) return 'bg-semantic-amber';
    return 'bg-semantic-red';
  };

  const getTrendIcon = (value: number) => {
    if (value > 0) return <TrendingUp className="h-4 w-4 text-semantic-green" />;
    if (value < 0) return <TrendingDown className="h-4 w-4 text-semantic-red" />;
    return <Minus className="h-4 w-4 text-muted-foreground" />;
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <BarChart3 className="h-5 w-5 text-primary" />
          Investment Analysis
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Overall Score */}
        <div className="flex items-center justify-between p-4 rounded-lg bg-muted/30">
          <div>
            <p className="text-sm text-muted-foreground">Investment Score</p>
            <div className="flex items-center gap-2 mt-1">
              <span className={`text-3xl font-bold ${getScoreColor(metrics.overallScore)}`}>
                {metrics.overallScore}
              </span>
              <span className="text-lg text-muted-foreground">/10</span>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1">
            <Badge 
              variant="outline"
              className={cn(
                metrics.appreciationPotential === 'high' ? 'bg-semantic-green/10 text-semantic-green border-semantic-green/20' :
                metrics.appreciationPotential === 'medium' ? 'bg-semantic-amber/10 text-semantic-amber border-semantic-amber/20' :
                'bg-semantic-red/10 text-semantic-red border-semantic-red/20'
              )}
            >
              {metrics.appreciationPotential.charAt(0).toUpperCase() + metrics.appreciationPotential.slice(1)} Potential
            </Badge>
          </div>
        </div>

        {/* Score Breakdown */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium flex items-center gap-2">
            <Star className="h-4 w-4" />
            Score Breakdown
          </h4>
          
          <div className="space-y-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center justify-between cursor-help">
                  <span className="text-sm text-muted-foreground">Yield Potential</span>
                  <div className="flex items-center gap-2">
                    <Progress value={metrics.yieldScore * 10} className="w-24 h-2" />
                    <span className="text-sm font-medium w-8">{metrics.yieldScore}/10</span>
                  </div>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Based on estimated rental income vs. purchase price</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center justify-between cursor-help">
                  <span className="text-sm text-muted-foreground">Appreciation</span>
                  <div className="flex items-center gap-2">
                    <Progress value={metrics.appreciationScore * 10} className="w-24 h-2" />
                    <span className="text-sm font-medium w-8">{metrics.appreciationScore}/10</span>
                  </div>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Based on city investment score and price position</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center justify-between cursor-help">
                  <span className="text-sm text-muted-foreground">Market Demand</span>
                  <div className="flex items-center gap-2">
                    <Progress value={metrics.demandScore * 10} className="w-24 h-2" />
                    <span className="text-sm font-medium w-8">{metrics.demandScore}/10</span>
                  </div>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Based on historical price trends and transaction volume</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 rounded-lg border border-border/50 bg-background">
            <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
              <Percent className="h-3.5 w-3.5" />
              <span className="text-xs">Est. Gross Yield</span>
            </div>
            <p className="font-semibold">{metrics.estimatedGrossYield}%</p>
            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
              <span>City avg: {metrics.cityAvgYield}%</span>
              {getTrendIcon(metrics.estimatedGrossYield - metrics.cityAvgYield)}
            </div>
          </div>

          <div className="p-3 rounded-lg border border-border/50 bg-background">
            <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
              <Percent className="h-3.5 w-3.5" />
              <span className="text-xs">Est. Net Yield</span>
            </div>
            <p className="font-semibold">{metrics.estimatedNetYield}%</p>
            <p className="text-xs text-muted-foreground mt-1">After expenses</p>
          </div>

          <div className="p-3 rounded-lg border border-border/50 bg-background">
            <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
              <Home className="h-3.5 w-3.5" />
              <span className="text-xs">Price vs City Avg</span>
            </div>
            <p className={`font-semibold ${metrics.priceVsCityAvg < 0 ? 'text-semantic-green' : metrics.priceVsCityAvg > 10 ? 'text-semantic-red' : ''}`}>
              {metrics.priceVsCityAvg > 0 ? '+' : ''}{metrics.priceVsCityAvg}%
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {metrics.priceVsCityAvg < 0 ? 'Below market' : 'Above market'}
            </p>
          </div>

          <div className="p-3 rounded-lg border border-border/50 bg-background">
            <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
              <Calendar className="h-3.5 w-3.5" />
              <span className="text-xs">Payback Period</span>
            </div>
            <p className="font-semibold">
              {metrics.estimatedNetYield > 0 
                ? `~${Math.round(100 / metrics.estimatedNetYield)} years`
                : 'N/A'
              }
            </p>
            <p className="text-xs text-muted-foreground mt-1">At current yields</p>
          </div>
        </div>

        {/* Recommendation */}
        <div className={cn(
          "p-3 rounded-lg border",
          metrics.overallScore >= 7 ? "bg-semantic-green/5 border-semantic-green/20" :
          metrics.overallScore >= 5 ? "bg-semantic-amber/5 border-semantic-amber/20" :
          "bg-semantic-red/5 border-semantic-red/20"
        )}>
          <p className="text-sm text-foreground">{metrics.recommendation}</p>
        </div>

        <p className="text-xs text-muted-foreground">
          * Estimates based on city averages and may vary. Not financial advice.
        </p>
      </CardContent>
    </Card>
  );
}
