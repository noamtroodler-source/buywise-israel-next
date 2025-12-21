import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { MapPinned, Star, GraduationCap, Train, ShoppingBag, TreePine, Moon, Shield, TrendingUp, Building } from 'lucide-react';

interface Criteria {
  schools: number;
  publicTransport: number;
  shopping: number;
  parks: number;
  nightlife: number;
  safety: number;
  appreciation: number;
  density: number;
}

interface Neighborhood {
  name: string;
  city: string;
  scores: Criteria;
  avgPrice: number;
}

const neighborhoods: Neighborhood[] = [
  { name: 'Neve Tzedek', city: 'Tel Aviv', scores: { schools: 7, publicTransport: 9, shopping: 9, parks: 6, nightlife: 10, safety: 8, appreciation: 9, density: 9 }, avgPrice: 8500000 },
  { name: 'Florentin', city: 'Tel Aviv', scores: { schools: 5, publicTransport: 9, shopping: 8, parks: 5, nightlife: 10, safety: 6, appreciation: 8, density: 10 }, avgPrice: 3500000 },
  { name: 'Ramat Aviv', city: 'Tel Aviv', scores: { schools: 10, publicTransport: 7, shopping: 8, parks: 9, nightlife: 5, safety: 9, appreciation: 7, density: 6 }, avgPrice: 6000000 },
  { name: 'Herzliya Pituach', city: 'Herzliya', scores: { schools: 9, publicTransport: 5, shopping: 8, parks: 8, nightlife: 6, safety: 10, appreciation: 8, density: 4 }, avgPrice: 12000000 },
  { name: 'Kfar Saba Green', city: 'Kfar Saba', scores: { schools: 9, publicTransport: 6, shopping: 7, parks: 9, nightlife: 4, safety: 9, appreciation: 7, density: 5 }, avgPrice: 3200000 },
  { name: 'Modiin Center', city: 'Modiin', scores: { schools: 10, publicTransport: 8, shopping: 7, parks: 9, nightlife: 3, safety: 10, appreciation: 8, density: 5 }, avgPrice: 2800000 },
  { name: 'Givatayim', city: 'Givatayim', scores: { schools: 8, publicTransport: 8, shopping: 7, parks: 8, nightlife: 5, safety: 9, appreciation: 8, density: 7 }, avgPrice: 4200000 },
  { name: 'Raanana West', city: "Ra'anana", scores: { schools: 10, publicTransport: 6, shopping: 8, parks: 8, nightlife: 4, safety: 10, appreciation: 7, density: 5 }, avgPrice: 4800000 },
  { name: 'Haifa Carmel', city: 'Haifa', scores: { schools: 8, publicTransport: 7, shopping: 6, parks: 10, nightlife: 5, safety: 8, appreciation: 6, density: 4 }, avgPrice: 2200000 },
  { name: 'Beer Sheva New', city: 'Beer Sheva', scores: { schools: 7, publicTransport: 6, shopping: 7, parks: 7, nightlife: 5, safety: 7, appreciation: 8, density: 5 }, avgPrice: 1600000 },
  { name: 'Rothschild Blvd', city: 'Tel Aviv', scores: { schools: 6, publicTransport: 10, shopping: 10, parks: 7, nightlife: 10, safety: 7, appreciation: 9, density: 10 }, avgPrice: 9500000 },
  { name: 'Rishon LeZion West', city: 'Rishon LeZion', scores: { schools: 8, publicTransport: 7, shopping: 8, parks: 7, nightlife: 6, safety: 8, appreciation: 7, density: 7 }, avgPrice: 2400000 },
];

const criteriaConfig = [
  { key: 'schools' as const, label: 'Schools & Education', icon: GraduationCap },
  { key: 'publicTransport' as const, label: 'Public Transport', icon: Train },
  { key: 'shopping' as const, label: 'Shopping & Dining', icon: ShoppingBag },
  { key: 'parks' as const, label: 'Parks & Nature', icon: TreePine },
  { key: 'nightlife' as const, label: 'Nightlife & Entertainment', icon: Moon },
  { key: 'safety' as const, label: 'Safety & Security', icon: Shield },
  { key: 'appreciation' as const, label: 'Value Appreciation', icon: TrendingUp },
  { key: 'density' as const, label: 'Urban Density', icon: Building },
];

export function NeighborhoodMatch() {
  const [weights, setWeights] = useState<Criteria>({
    schools: 5,
    publicTransport: 5,
    shopping: 5,
    parks: 5,
    nightlife: 5,
    safety: 5,
    appreciation: 5,
    density: 5,
  });

  const rankedNeighborhoods = useMemo(() => {
    return neighborhoods
      .map((n) => {
        const totalWeight = Object.values(weights).reduce((a, b) => a + b, 0);
        let matchScore = 0;
        
        (Object.keys(weights) as (keyof Criteria)[]).forEach((key) => {
          const weight = weights[key] / totalWeight;
          matchScore += n.scores[key] * weight;
        });

        return { ...n, matchScore: matchScore * 10 };
      })
      .sort((a, b) => b.matchScore - a.matchScore);
  }, [weights]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('he-IL', {
      style: 'currency',
      currency: 'ILS',
      maximumFractionDigits: 0,
    }).format(value);
  };

  const updateWeight = (key: keyof Criteria, value: number) => {
    setWeights({ ...weights, [key]: value });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPinned className="h-5 w-5 text-primary" />
          Neighborhood Match
        </CardTitle>
        <CardDescription>
          Rate what matters to you and find your perfect neighborhood
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Criteria Sliders */}
          <div className="space-y-5">
            <h3 className="font-semibold">Rate Your Priorities (1-10)</h3>
            {criteriaConfig.map(({ key, label, icon: Icon }) => (
              <div key={key} className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="flex items-center gap-2">
                    <Icon className="h-4 w-4 text-muted-foreground" />
                    {label}
                  </Label>
                  <span className="text-sm font-medium w-6 text-right">{weights[key]}</span>
                </div>
                <Slider
                  value={[weights[key]]}
                  onValueChange={([value]) => updateWeight(key, value)}
                  min={1}
                  max={10}
                  step={1}
                />
              </div>
            ))}
            
            <Button 
              variant="outline" 
              className="w-full mt-4"
              onClick={() => setWeights({
                schools: 5,
                publicTransport: 5,
                shopping: 5,
                parks: 5,
                nightlife: 5,
                safety: 5,
                appreciation: 5,
                density: 5,
              })}
            >
              Reset All
            </Button>
          </div>

          {/* Results */}
          <div className="space-y-4">
            <h3 className="font-semibold">Top Matches</h3>
            <div className="space-y-3">
              {rankedNeighborhoods.slice(0, 6).map((n, index) => (
                <div 
                  key={n.name}
                  className={`p-4 rounded-lg border transition-all ${
                    index === 0 ? 'bg-primary/10 border-primary' : 'hover:bg-muted/50'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <div className="flex items-center gap-2">
                        {index === 0 && <Star className="h-4 w-4 text-primary fill-primary" />}
                        <span className="font-medium">{n.name}</span>
                      </div>
                      <span className="text-sm text-muted-foreground">{n.city}</span>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-primary">{n.matchScore.toFixed(0)}%</div>
                      <div className="text-xs text-muted-foreground">match</div>
                    </div>
                  </div>
                  <Progress value={n.matchScore} className="h-2 mb-2" />
                  <div className="text-sm text-muted-foreground">
                    Avg. price: {formatCurrency(n.avgPrice)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
