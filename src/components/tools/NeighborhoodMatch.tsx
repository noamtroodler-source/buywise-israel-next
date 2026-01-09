import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  MapPin, ChevronRight, ChevronLeft, Home, TrendingUp, Plane, 
  Users, Wallet, Building, Train, Sun, TreePine, Heart, 
  GraduationCap, Shield, Clock, Star, ArrowRight, Calculator,
  RotateCcw, Sparkles
} from 'lucide-react';
import { useCities } from '@/hooks/useCities';
import { useBuyerProfile, getEffectiveBuyerType } from '@/hooks/useBuyerProfile';
import { City } from '@/types/content';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

// Quiz question types
interface QuizOption {
  id: string;
  label: string;
  description?: string;
  icon?: React.ReactNode;
}

interface QuizQuestion {
  id: string;
  section: string;
  question: string;
  subtitle?: string;
  options: QuizOption[];
}

// All 15 questions organized by section
const quizQuestions: QuizQuestion[] = [
  // Section 1: Your Buyer Profile
  {
    id: 'buyerIntent',
    section: 'Your Buyer Profile',
    question: "What's driving this purchase?",
    subtitle: 'This helps us understand your priorities',
    options: [
      { id: 'primary', label: 'Primary residence for my family', icon: <Home className="h-5 w-5" /> },
      { id: 'investment', label: 'Investment property for rental income', icon: <TrendingUp className="h-5 w-5" /> },
      { id: 'vacation', label: 'Vacation / second home in Israel', icon: <Sun className="h-5 w-5" /> },
      { id: 'aliyah', label: 'Making Aliyah soon', icon: <Plane className="h-5 w-5" /> },
    ],
  },
  {
    id: 'currentLocation',
    section: 'Your Buyer Profile',
    question: 'Where are you currently based?',
    subtitle: 'This affects community and practical recommendations',
    options: [
      { id: 'israel', label: 'Already living in Israel' },
      { id: 'moving', label: 'Moving from abroad within a year' },
      { id: 'remote', label: 'Buying remotely, may visit occasionally' },
      { id: 'split', label: 'Split time between Israel and abroad' },
    ],
  },
  {
    id: 'household',
    section: 'Your Buyer Profile',
    question: 'Who will be living in this property?',
    subtitle: 'Different life stages have different needs',
    options: [
      { id: 'single', label: 'Just me (or me + partner)', icon: <Users className="h-5 w-5" /> },
      { id: 'young-family', label: 'Family with young children' },
      { id: 'teens', label: 'Family with teenagers' },
      { id: 'retirement', label: 'Parents / retirement' },
    ],
  },
  
  // Section 2: Budget & Finances
  {
    id: 'budget',
    section: 'Budget & Finances',
    question: "What's your total budget including all fees?",
    subtitle: 'Be realistic - include purchase tax and legal fees',
    options: [
      { id: 'under-1.5m', label: 'Under ₪1.5M', description: 'Starter markets' },
      { id: '1.5-2.5m', label: '₪1.5M - ₪2.5M', description: 'Entry to mid-range' },
      { id: '2.5-4m', label: '₪2.5M - ₪4M', description: 'Mid to premium' },
      { id: '4-6m', label: '₪4M - ₪6M', description: 'Premium markets' },
      { id: '6m+', label: '₪6M+', description: 'Luxury segment' },
    ],
  },
  {
    id: 'financing',
    section: 'Budget & Finances',
    question: 'How will you finance this purchase?',
    subtitle: 'This affects which cities make financial sense',
    options: [
      { id: 'cash', label: 'Mostly cash (over 50% down)', icon: <Wallet className="h-5 w-5" /> },
      { id: 'standard', label: 'Standard mortgage (25-30% down)' },
      { id: 'max', label: 'Maximum financing I can get' },
      { id: 'unsure', label: "Haven't figured this out yet" },
    ],
  },
  {
    id: 'rentalImportance',
    section: 'Budget & Finances',
    question: 'How important is rental income potential?',
    subtitle: 'Even for primary homes, this affects value',
    options: [
      { id: 'essential', label: 'Essential - this is an investment', icon: <TrendingUp className="h-5 w-5" /> },
      { id: 'nice', label: 'Nice to have for when I\'m not using it' },
      { id: 'not-important', label: 'Not important - purely for my use' },
    ],
  },
  
  // Section 3: Location & Commute
  {
    id: 'workLocation',
    section: 'Location & Commute',
    question: "If you'll be working, where will you commute to?",
    subtitle: 'Location relative to work is a major quality-of-life factor',
    options: [
      { id: 'tlv', label: 'Tel Aviv / Gush Dan', icon: <Building className="h-5 w-5" /> },
      { id: 'jerusalem', label: 'Jerusalem' },
      { id: 'north', label: 'Haifa / Northern region' },
      { id: 'remote', label: 'I work remotely - anywhere works' },
      { id: 'retired', label: "I'm retired / not working" },
    ],
  },
  {
    id: 'maxCommute',
    section: 'Location & Commute',
    question: "What's the maximum commute time you'd accept?",
    subtitle: 'Be honest - commutes add up over the years',
    options: [
      { id: '20', label: 'Under 20 minutes', icon: <Clock className="h-5 w-5" /> },
      { id: '30', label: 'Up to 30 minutes' },
      { id: '45', label: 'Up to 45 minutes' },
      { id: '60', label: 'Up to 60 minutes' },
      { id: 'flexible', label: "I don't mind - location matters more" },
    ],
  },
  {
    id: 'transitImportance',
    section: 'Location & Commute',
    question: 'How important is public transit access?',
    subtitle: 'Train access significantly impacts property values',
    options: [
      { id: 'essential', label: "Essential - I won't have a car", icon: <Train className="h-5 w-5" /> },
      { id: 'important', label: 'Important - prefer train access' },
      { id: 'nice', label: 'Nice to have but not critical' },
      { id: 'not-important', label: "Not important - I'll drive" },
    ],
  },
  
  // Section 4: Lifestyle & Community
  {
    id: 'lifestyle',
    section: 'Lifestyle & Community',
    question: 'What neighborhood vibe fits you best?',
    subtitle: 'Think about your day-to-day life',
    options: [
      { id: 'urban', label: 'Urban buzz (walkable, cafes, nightlife)', icon: <Building className="h-5 w-5" /> },
      { id: 'suburban', label: 'Quiet suburban (parks, space, family-oriented)' },
      { id: 'coastal', label: 'Coastal / beach lifestyle', icon: <Sun className="h-5 w-5" /> },
      { id: 'nature', label: 'Nature-focused (hiking, green spaces)', icon: <TreePine className="h-5 w-5" /> },
      { id: 'community', label: 'Close-knit religious community' },
    ],
  },
  {
    id: 'angloImportance',
    section: 'Lifestyle & Community',
    question: 'How important is an English-speaking community?',
    subtitle: 'Be honest about your Hebrew level and social needs',
    options: [
      { id: 'essential', label: 'Essential - I need strong Anglo presence', icon: <Users className="h-5 w-5" /> },
      { id: 'important', label: 'Important - prefer established Anglo communities' },
      { id: 'nice', label: 'Nice to have, but not required' },
      { id: 'not-important', label: 'Not important - I want to fully integrate' },
    ],
  },
  {
    id: 'socioLevel',
    section: 'Lifestyle & Community',
    question: 'What socioeconomic level feels right for you?',
    subtitle: 'This affects community culture and amenities',
    options: [
      { id: 'luxury', label: 'Upscale / luxury neighborhoods', description: 'Top tier' },
      { id: 'upper-middle', label: 'Upper-middle class areas' },
      { id: 'middle', label: 'Middle-class, good value neighborhoods' },
      { id: 'affordable', label: 'Affordable areas, best bang for buck' },
    ],
  },
  
  // Section 5: Property & Future
  {
    id: 'propertyType',
    section: 'Property & Future',
    question: 'What type of property are you looking for?',
    subtitle: 'This affects which cities have the right inventory',
    options: [
      { id: 'apartment', label: 'Apartment in a building', icon: <Building className="h-5 w-5" /> },
      { id: 'garden', label: 'Garden apartment (ground floor + outdoor)' },
      { id: 'penthouse', label: 'Penthouse or duplex' },
      { id: 'house', label: 'Private house / cottage', icon: <Home className="h-5 w-5" /> },
    ],
  },
  {
    id: 'timeframe',
    section: 'Property & Future',
    question: 'Is this a long-term home or stepping stone?',
    subtitle: 'This affects how we weigh appreciation potential',
    options: [
      { id: 'forever', label: 'Forever home - planning to stay 10+ years', icon: <Heart className="h-5 w-5" /> },
      { id: 'medium', label: 'Medium term - 5-10 years' },
      { id: 'short', label: 'Short term - may sell in 3-5 years' },
      { id: 'uncertain', label: 'Uncertain - depends on circumstances' },
    ],
  },
  {
    id: 'priority',
    section: 'Property & Future',
    question: 'What matters most in a neighborhood?',
    subtitle: 'If you had to pick one thing...',
    options: [
      { id: 'community', label: 'Strong community and social life', icon: <Users className="h-5 w-5" /> },
      { id: 'schools', label: 'Best schools and education', icon: <GraduationCap className="h-5 w-5" /> },
      { id: 'safety', label: 'Safety and quiet environment', icon: <Shield className="h-5 w-5" /> },
      { id: 'convenience', label: 'Convenience (shops, restaurants, services)' },
      { id: 'appreciation', label: 'Future appreciation potential', icon: <TrendingUp className="h-5 w-5" /> },
    ],
  },
];

// Budget ranges for matching
const budgetRanges: Record<string, { min: number; max: number }> = {
  'under-1.5m': { min: 0, max: 1500000 },
  '1.5-2.5m': { min: 1500000, max: 2500000 },
  '2.5-4m': { min: 2500000, max: 4000000 },
  '4-6m': { min: 4000000, max: 6000000 },
  '6m+': { min: 6000000, max: 50000000 },
};

// Commute time thresholds
const commuteThresholds: Record<string, number> = {
  '20': 20,
  '30': 30,
  '45': 45,
  '60': 60,
  'flexible': 999,
};

type QuizAnswers = Record<string, string>;

interface CityScore {
  city: City;
  score: number;
  reasons: string[];
}

// Scoring function
function scoreCity(city: City, answers: QuizAnswers): CityScore {
  let score = 0;
  const reasons: string[] = [];
  
  // Skip cities without essential data
  if (!city.price_range_min && !city.median_apartment_price) {
    return { city, score: 0, reasons: [] };
  }

  // BUDGET (30% weight)
  const budgetRange = budgetRanges[answers.budget];
  if (budgetRange) {
    const cityMinPrice = city.price_range_min || city.median_apartment_price || 0;
    const cityMaxPrice = city.price_range_max || city.median_apartment_price || 0;
    
    // Check if budget overlaps with city price range
    if (cityMinPrice <= budgetRange.max && cityMaxPrice >= budgetRange.min) {
      // Perfect match - city's range is within budget
      if (cityMinPrice >= budgetRange.min * 0.8 && cityMaxPrice <= budgetRange.max * 1.2) {
        score += 30;
        reasons.push(`Price range aligns with your ₪${(budgetRange.min / 1000000).toFixed(1)}M-${(budgetRange.max / 1000000).toFixed(1)}M budget`);
      } else {
        score += 20;
        reasons.push('Some properties within your budget');
      }
    } else if (cityMinPrice <= budgetRange.max * 1.3) {
      score += 10; // Slightly over budget
    }
  }

  // COMMUTE (20% weight) - only if they work in TLV
  if (answers.workLocation === 'tlv' && city.commute_time_tel_aviv) {
    const maxCommute = commuteThresholds[answers.maxCommute] || 60;
    if (city.commute_time_tel_aviv <= maxCommute) {
      const commuteScore = Math.max(0, 20 - (city.commute_time_tel_aviv / maxCommute) * 10);
      score += commuteScore;
      if (city.commute_time_tel_aviv <= 30) {
        reasons.push(`${city.commute_time_tel_aviv}-min commute to Tel Aviv`);
      }
    }
  } else if (answers.workLocation === 'remote' || answers.workLocation === 'retired') {
    score += 15; // Location flexibility bonus
  }

  // ANGLO PRESENCE (15% weight)
  const angloMap: Record<string, number> = {
    'High': 15,
    'Medium': 10,
    'Low': 5,
  };
  
  if (answers.angloImportance === 'essential' || answers.angloImportance === 'important') {
    const angloScore = angloMap[city.anglo_presence || ''] || 0;
    score += angloScore;
    if (city.anglo_presence === 'High') {
      reasons.push('Strong English-speaking community');
    }
  } else {
    score += 10; // Neutral on anglo presence
  }

  // INVESTMENT POTENTIAL (15% weight)
  if (answers.rentalImportance === 'essential' && city.investment_score) {
    const investScore = (city.investment_score / 100) * 15;
    score += investScore;
    if (city.gross_yield_percent && city.gross_yield_percent >= 3) {
      reasons.push(`${city.gross_yield_percent.toFixed(1)}% gross rental yield`);
    }
  } else if (answers.rentalImportance === 'nice' && city.investment_score) {
    score += (city.investment_score / 100) * 8;
  } else {
    score += 8;
  }

  // LIFESTYLE MATCH (10% weight)
  const lifestyleMatches: Record<string, string[]> = {
    'urban': ['Tel Aviv', 'Haifa', 'Jerusalem'],
    'suburban': ['Modiin', 'Kfar Saba', 'Raanana', 'Hod HaSharon', 'Givat Shmuel'],
    'coastal': ['Herzliya', 'Netanya', 'Ashkelon', 'Ashdod', 'Nahariya', 'Caesarea'],
    'nature': ['Zichron Yaakov', 'Pardes Hanna', 'Hadera', 'Mevaseret Zion'],
    'community': ['Beit Shemesh', 'Efrat', 'Modiin', 'Givat Zeev'],
  };
  
  const matchingLifestyles = lifestyleMatches[answers.lifestyle] || [];
  if (matchingLifestyles.some(name => city.name.includes(name) || city.slug.includes(name.toLowerCase().replace(' ', '-')))) {
    score += 10;
    reasons.push('Matches your preferred lifestyle');
  } else {
    score += 5;
  }

  // SOCIOECONOMIC MATCH (10% weight)
  if (city.socioeconomic_rank) {
    const socioTargets: Record<string, { min: number; max: number }> = {
      'luxury': { min: 8, max: 10 },
      'upper-middle': { min: 6, max: 9 },
      'middle': { min: 4, max: 7 },
      'affordable': { min: 1, max: 5 },
    };
    const target = socioTargets[answers.socioLevel];
    if (target && city.socioeconomic_rank >= target.min && city.socioeconomic_rank <= target.max) {
      score += 10;
    } else if (target) {
      score += 5;
    }
  }

  // TRANSIT BONUS
  if ((answers.transitImportance === 'essential' || answers.transitImportance === 'important') && city.has_train_station) {
    score += 5;
    reasons.push('Train station access');
  }

  // BUYER TYPE BONUSES
  if (answers.buyerIntent === 'investment' && city.investment_score && city.investment_score >= 70) {
    score += 5;
  }
  if (answers.buyerIntent === 'aliyah' && city.anglo_presence === 'High') {
    score += 5;
  }
  if ((answers.household === 'young-family' || answers.household === 'teens') && city.has_train_station) {
    score += 3;
  }

  return { city, score: Math.min(100, score), reasons };
}

// Section names for progress
const sections = ['Your Buyer Profile', 'Budget & Finances', 'Location & Commute', 'Lifestyle & Community', 'Property & Future'];

export function NeighborhoodMatch() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<QuizAnswers>({});
  const [showResults, setShowResults] = useState(false);
  
  const { data: cities, isLoading: citiesLoading } = useCities();
  const { data: buyerProfile } = useBuyerProfile();
  
  const currentQuestion = quizQuestions[currentStep];
  const currentSectionIndex = sections.indexOf(currentQuestion?.section || '');
  const progress = ((currentStep + 1) / quizQuestions.length) * 100;

  // Calculate city scores when showing results
  const rankedCities = useMemo(() => {
    if (!cities || !showResults) return [];
    
    return cities
      .map(city => scoreCity(city, answers))
      .filter(result => result.score > 20) // Filter out poor matches
      .sort((a, b) => b.score - a.score)
      .slice(0, 5); // Top 5
  }, [cities, answers, showResults]);

  const handleAnswer = (optionId: string) => {
    setAnswers(prev => ({ ...prev, [currentQuestion.id]: optionId }));
    
    // Auto-advance after selection with slight delay
    setTimeout(() => {
      if (currentStep < quizQuestions.length - 1) {
        setCurrentStep(prev => prev + 1);
      } else {
        setShowResults(true);
      }
    }, 300);
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleRestart = () => {
    setAnswers({});
    setCurrentStep(0);
    setShowResults(false);
  };

  const formatPrice = (value: number) => {
    if (value >= 1000000) {
      return `₪${(value / 1000000).toFixed(1)}M`;
    }
    return `₪${(value / 1000).toFixed(0)}K`;
  };

  // Get buyer type label for insight
  const buyerTypeLabel = buyerProfile ? getEffectiveBuyerType(buyerProfile).label : null;

  // Loading state
  if (citiesLoading) {
    return (
      <Card className="p-8">
        <div className="flex items-center justify-center gap-3">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <span className="text-muted-foreground">Loading city data...</span>
        </div>
      </Card>
    );
  }

  // Results view
  if (showResults) {
    return (
      <div className="space-y-6">
        {/* Results Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary mb-4">
            <Sparkles className="h-4 w-4" />
            <span className="text-sm font-medium">Your Personalized Results</span>
          </div>
          <h2 className="text-2xl md:text-3xl font-bold">Where Should You Buy in Israel?</h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Based on your answers, here are the cities that best match your needs
          </p>
        </div>

        {/* Top Match Hero */}
        {rankedCities[0] && (
          <Card className="overflow-hidden border-primary/20 bg-gradient-to-br from-primary/5 to-background">
            <div className="p-6 md:p-8">
              <div className="flex flex-col md:flex-row gap-6">
                <div className="flex-1 space-y-4">
                  <div className="flex items-center gap-3">
                    <Badge className="bg-primary text-primary-foreground">
                      <Star className="h-3 w-3 mr-1 fill-current" />
                      Best Match
                    </Badge>
                    <span className="text-2xl font-bold text-primary">{rankedCities[0].score.toFixed(0)}%</span>
                  </div>
                  <h3 className="text-3xl font-bold">{rankedCities[0].city.name}</h3>
                  
                  {/* Match reasons */}
                  <div className="space-y-2">
                    {rankedCities[0].reasons.slice(0, 4).map((reason, i) => (
                      <div key={i} className="flex items-center gap-2 text-sm">
                        <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                        <span>{reason}</span>
                      </div>
                    ))}
                  </div>

                  {/* Quick stats */}
                  <div className="flex flex-wrap gap-4 pt-2">
                    {rankedCities[0].city.median_apartment_price && (
                      <div className="text-sm">
                        <span className="text-muted-foreground">Avg Price: </span>
                        <span className="font-medium">{formatPrice(rankedCities[0].city.median_apartment_price)}</span>
                      </div>
                    )}
                    {rankedCities[0].city.commute_time_tel_aviv && (
                      <div className="text-sm">
                        <span className="text-muted-foreground">To TLV: </span>
                        <span className="font-medium">{rankedCities[0].city.commute_time_tel_aviv} min</span>
                      </div>
                    )}
                    {rankedCities[0].city.anglo_presence && (
                      <div className="text-sm">
                        <span className="text-muted-foreground">Anglo: </span>
                        <Badge variant="secondary" className="text-xs">{rankedCities[0].city.anglo_presence}</Badge>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-3 pt-4">
                    <Button onClick={() => navigate(`/areas/${rankedCities[0].city.slug}`)}>
                      Explore {rankedCities[0].city.name}
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                    <Button variant="outline" onClick={() => navigate(`/listings?city=${rankedCities[0].city.name}`)}>
                      See Listings
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Other Matches */}
        {rankedCities.length > 1 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Other Great Matches</h3>
            <div className="grid md:grid-cols-2 gap-4">
              {rankedCities.slice(1, 5).map((result, index) => (
                <Card key={result.city.id} className="p-5 hover:border-primary/30 transition-colors">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="font-semibold text-lg">{result.city.name}</h4>
                      <div className="flex items-center gap-2 mt-1">
                        {result.city.median_apartment_price && (
                          <span className="text-sm text-muted-foreground">
                            {formatPrice(result.city.median_apartment_price)}
                          </span>
                        )}
                        {result.city.anglo_presence && (
                          <Badge variant="outline" className="text-xs">
                            {result.city.anglo_presence} Anglo
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-xl font-bold text-primary">{result.score.toFixed(0)}%</span>
                      <p className="text-xs text-muted-foreground">match</p>
                    </div>
                  </div>
                  
                  <Progress value={result.score} className="h-2 mb-3" />
                  
                  <div className="space-y-1 mb-4">
                    {result.reasons.slice(0, 2).map((reason, i) => (
                      <p key={i} className="text-sm text-muted-foreground flex items-center gap-2">
                        <div className="h-1 w-1 rounded-full bg-muted-foreground" />
                        {reason}
                      </p>
                    ))}
                  </div>

                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="w-full"
                    onClick={() => navigate(`/areas/${result.city.slug}`)}
                  >
                    Explore City
                    <ArrowRight className="h-3 w-3 ml-2" />
                  </Button>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Personalized Insight */}
        <Card className="p-5 bg-muted/30 border-dashed">
          <div className="flex gap-4">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <MapPin className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h4 className="font-medium mb-1">What This Means For You</h4>
              <p className="text-sm text-muted-foreground">
                {answers.buyerIntent === 'investment' 
                  ? `As an investor, focus on cities with strong rental yields and growth potential. ${rankedCities[0]?.city.name || 'Your top match'} offers a good balance of returns and stability.`
                  : answers.buyerIntent === 'aliyah'
                  ? `Making Aliyah is a big step. ${rankedCities[0]?.city.name || 'Your top match'} has an established Anglo community that can help ease your transition.`
                  : answers.household === 'young-family' || answers.household === 'teens'
                  ? `For families, school quality and safe neighborhoods matter most. ${rankedCities[0]?.city.name || 'Your top match'} is known for its family-friendly atmosphere.`
                  : `Based on your preferences, ${rankedCities[0]?.city.name || 'your top match'} aligns well with your lifestyle and budget expectations.`
                }
                {buyerTypeLabel && ` As a ${buyerTypeLabel}, you may qualify for tax benefits - use our calculators to estimate your costs.`}
              </p>
            </div>
          </div>
        </Card>

        {/* Next Steps */}
        <div className="grid sm:grid-cols-3 gap-4">
          <Button 
            variant="outline" 
            className="h-auto py-4 flex-col gap-2"
            onClick={() => navigate('/tools?tool=affordability')}
          >
            <Calculator className="h-5 w-5 text-primary" />
            <span>Check Affordability</span>
          </Button>
          <Button 
            variant="outline" 
            className="h-auto py-4 flex-col gap-2"
            onClick={() => navigate('/tools?tool=purchase-tax')}
          >
            <Wallet className="h-5 w-5 text-primary" />
            <span>Calculate Tax</span>
          </Button>
          <Button 
            variant="outline" 
            className="h-auto py-4 flex-col gap-2"
            onClick={handleRestart}
          >
            <RotateCcw className="h-5 w-5 text-primary" />
            <span>Retake Quiz</span>
          </Button>
        </div>
      </div>
    );
  }

  // Quiz view
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Progress Header */}
      <div className="space-y-4">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            Question {currentStep + 1} of {quizQuestions.length}
          </span>
          <span className="font-medium text-primary">{currentQuestion.section}</span>
        </div>
        <Progress value={progress} className="h-2" />
        
        {/* Section indicators */}
        <div className="flex justify-between">
          {sections.map((section, index) => (
            <div 
              key={section}
              className={cn(
                "text-xs hidden sm:block",
                index <= currentSectionIndex ? "text-primary font-medium" : "text-muted-foreground"
              )}
            >
              {index + 1}. {section.split(' ')[0]}
            </div>
          ))}
        </div>
      </div>

      {/* Question Card */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2 }}
        >
          <Card className="p-6 md:p-8">
            <div className="space-y-6">
              <div>
                <h2 className="text-xl md:text-2xl font-semibold mb-2">
                  {currentQuestion.question}
                </h2>
                {currentQuestion.subtitle && (
                  <p className="text-muted-foreground">{currentQuestion.subtitle}</p>
                )}
              </div>

              {/* Options */}
              <div className="space-y-3">
                {currentQuestion.options.map((option) => (
                  <button
                    key={option.id}
                    onClick={() => handleAnswer(option.id)}
                    className={cn(
                      "w-full p-4 rounded-lg border text-left transition-all",
                      "hover:border-primary hover:bg-primary/5",
                      "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
                      answers[currentQuestion.id] === option.id 
                        ? "border-primary bg-primary/10" 
                        : "border-border"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      {option.icon && (
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
                          {option.icon}
                        </div>
                      )}
                      <div className="flex-1">
                        <span className="font-medium">{option.label}</span>
                        {option.description && (
                          <p className="text-sm text-muted-foreground mt-0.5">{option.description}</p>
                        )}
                      </div>
                      {answers[currentQuestion.id] === option.id && (
                        <div className="h-5 w-5 rounded-full bg-primary flex items-center justify-center">
                          <svg className="h-3 w-3 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </Card>
        </motion.div>
      </AnimatePresence>

      {/* Navigation */}
      <div className="flex justify-between">
        <Button 
          variant="ghost" 
          onClick={handleBack}
          disabled={currentStep === 0}
        >
          <ChevronLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        
        {answers[currentQuestion.id] && (
          <Button 
            onClick={() => {
              if (currentStep < quizQuestions.length - 1) {
                setCurrentStep(prev => prev + 1);
              } else {
                setShowResults(true);
              }
            }}
          >
            {currentStep === quizQuestions.length - 1 ? 'See Results' : 'Next'}
            <ChevronRight className="h-4 w-4 ml-2" />
          </Button>
        )}
      </div>
    </div>
  );
}
