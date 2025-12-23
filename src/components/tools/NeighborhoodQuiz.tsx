import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowRight, ArrowLeft, CheckCircle2, MapPin, 
  Train, Sun, Users, Wallet, Building2, Heart
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';

interface Question {
  id: string;
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  options: { value: string; label: string; description: string }[];
}

interface NeighborhoodScore {
  name: string;
  city: string;
  score: number;
  highlights: string[];
  priceRange: string;
}

const QUESTIONS: Question[] = [
  {
    id: 'budget',
    title: 'What\'s your budget range?',
    icon: Wallet,
    options: [
      { value: 'low', label: 'Under 2M ₪', description: 'Looking for value' },
      { value: 'medium', label: '2-3.5M ₪', description: 'Mid-range options' },
      { value: 'high', label: '3.5-5M ₪', description: 'Premium properties' },
      { value: 'luxury', label: '5M+ ₪', description: 'Luxury segment' },
    ],
  },
  {
    id: 'commute',
    title: 'Where do you work / need to commute?',
    icon: Train,
    options: [
      { value: 'tlv', label: 'Tel Aviv', description: 'Central business district' },
      { value: 'jerusalem', label: 'Jerusalem', description: 'Capital city' },
      { value: 'haifa', label: 'Haifa / North', description: 'Northern region' },
      { value: 'remote', label: 'Work from home', description: 'Location flexible' },
    ],
  },
  {
    id: 'lifestyle',
    title: 'What lifestyle do you prefer?',
    icon: Sun,
    options: [
      { value: 'urban', label: 'Urban buzz', description: 'Walkable, cafes, nightlife' },
      { value: 'suburban', label: 'Suburban family', description: 'Quiet, parks, space' },
      { value: 'coastal', label: 'Beach life', description: 'Near the sea' },
      { value: 'community', label: 'Strong community', description: 'Religious or close-knit' },
    ],
  },
  {
    id: 'anglo',
    title: 'How important is an English-speaking community?',
    icon: Users,
    options: [
      { value: 'essential', label: 'Essential', description: 'Need strong Anglo presence' },
      { value: 'preferred', label: 'Preferred', description: 'Would be nice but not required' },
      { value: 'indifferent', label: 'Not important', description: 'Happy to integrate fully' },
    ],
  },
  {
    id: 'property',
    title: 'What type of property are you looking for?',
    icon: Building2,
    options: [
      { value: 'apartment', label: 'Apartment', description: 'Standard multi-family building' },
      { value: 'garden', label: 'Garden apartment', description: 'Ground floor with outdoor space' },
      { value: 'penthouse', label: 'Penthouse / Duplex', description: 'Top floors with views' },
      { value: 'house', label: 'House / Cottage', description: 'Private home' },
    ],
  },
];

const NEIGHBORHOODS: NeighborhoodScore[] = [
  { name: 'Raanana Center', city: 'Raanana', score: 0, highlights: ['Strong Anglo community', 'Excellent schools', 'Park HaYarkon nearby'], priceRange: '3.5-5M' },
  { name: 'Katamon', city: 'Jerusalem', score: 0, highlights: ['Historic charm', 'Diverse community', 'Central location'], priceRange: '2.5-4M' },
  { name: 'Florentine', city: 'Tel Aviv', score: 0, highlights: ['Urban vibe', 'Nightlife', 'Young professionals'], priceRange: '3-4.5M' },
  { name: 'Buchman', city: 'Modiin', score: 0, highlights: ['Family-friendly', 'New construction', 'Good value'], priceRange: '2-3M' },
  { name: 'Ramat Beit Shemesh', city: 'Beit Shemesh', score: 0, highlights: ['Strong community', 'Affordable', 'Growing area'], priceRange: '1.5-2.5M' },
  { name: 'Neve Tzedek', city: 'Tel Aviv', score: 0, highlights: ['Prestigious', 'Historic', 'Near beach'], priceRange: '5M+' },
  { name: 'German Colony', city: 'Jerusalem', score: 0, highlights: ['Upscale', 'Anglo presence', 'Cafes and shops'], priceRange: '4-6M' },
  { name: 'Kfar Saba Center', city: 'Kfar Saba', score: 0, highlights: ['Suburban feel', 'Good schools', 'Train access'], priceRange: '2.5-4M' },
  { name: 'Herzliya Pituach', city: 'Herzliya', score: 0, highlights: ['Luxury living', 'Beach proximity', 'Hi-tech hub'], priceRange: '5M+' },
  { name: 'Haifa Port Area', city: 'Haifa', score: 0, highlights: ['Affordable', 'Improving', 'Cultural scene'], priceRange: '1-2M' },
  { name: 'Netanya South Beach', city: 'Netanya', score: 0, highlights: ['Beachfront', 'Anglo community', 'Value for coast'], priceRange: '2-3.5M' },
  { name: 'Efrat', city: 'Gush Etzion', score: 0, highlights: ['Strong community', 'Nature', 'Anglo presence'], priceRange: '2-3.5M' },
];

function calculateScores(answers: Record<string, string>): NeighborhoodScore[] {
  const scored = NEIGHBORHOODS.map(n => ({ ...n, score: 0 }));

  scored.forEach(neighborhood => {
    // Budget matching
    if (answers.budget === 'low') {
      if (neighborhood.priceRange.includes('1-2') || neighborhood.priceRange.includes('1.5-2')) neighborhood.score += 30;
    } else if (answers.budget === 'medium') {
      if (neighborhood.priceRange.includes('2-3') || neighborhood.priceRange.includes('2.5-4')) neighborhood.score += 30;
    } else if (answers.budget === 'high') {
      if (neighborhood.priceRange.includes('3.5-5') || neighborhood.priceRange.includes('4-6')) neighborhood.score += 30;
    } else if (answers.budget === 'luxury') {
      if (neighborhood.priceRange.includes('5M+')) neighborhood.score += 30;
    }

    // Commute
    if (answers.commute === 'tlv') {
      if (['Tel Aviv', 'Raanana', 'Herzliya', 'Kfar Saba', 'Netanya'].includes(neighborhood.city)) neighborhood.score += 25;
    } else if (answers.commute === 'jerusalem') {
      if (['Jerusalem', 'Beit Shemesh', 'Modiin', 'Gush Etzion'].includes(neighborhood.city)) neighborhood.score += 25;
    } else if (answers.commute === 'haifa') {
      if (neighborhood.city === 'Haifa') neighborhood.score += 25;
    } else if (answers.commute === 'remote') {
      neighborhood.score += 10; // All options viable
    }

    // Lifestyle
    if (answers.lifestyle === 'urban') {
      if (neighborhood.highlights.some(h => h.includes('Urban') || h.includes('Nightlife') || h.includes('Cafes'))) neighborhood.score += 20;
    } else if (answers.lifestyle === 'suburban') {
      if (neighborhood.highlights.some(h => h.includes('Family') || h.includes('Suburban') || h.includes('parks'))) neighborhood.score += 20;
    } else if (answers.lifestyle === 'coastal') {
      if (neighborhood.highlights.some(h => h.includes('Beach') || h.includes('coast'))) neighborhood.score += 20;
    } else if (answers.lifestyle === 'community') {
      if (neighborhood.highlights.some(h => h.includes('community') || h.includes('Community'))) neighborhood.score += 20;
    }

    // Anglo preference
    if (answers.anglo === 'essential') {
      if (neighborhood.highlights.some(h => h.includes('Anglo'))) neighborhood.score += 25;
    } else if (answers.anglo === 'preferred') {
      if (neighborhood.highlights.some(h => h.includes('Anglo'))) neighborhood.score += 10;
    }
  });

  return scored.sort((a, b) => b.score - a.score);
}

export function NeighborhoodQuiz() {
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [showResults, setShowResults] = useState(false);

  const setAnswer = (questionId: string, value: string) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }));
  };

  const progress = ((currentStep + 1) / QUESTIONS.length) * 100;
  const currentQuestion = QUESTIONS[currentStep];
  const canProceed = answers[currentQuestion?.id];

  if (showResults) {
    const results = calculateScores(answers).slice(0, 5);

    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Heart className="h-5 w-5 text-primary" />
            Your Top Neighborhood Matches
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-muted-foreground">
            Based on your preferences, here are the neighborhoods that best match your criteria:
          </p>

          <div className="space-y-4">
            {results.map((neighborhood, index) => (
              <motion.div
                key={neighborhood.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`p-4 rounded-xl border ${index === 0 ? 'border-primary bg-primary/5' : 'border-border'}`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      {index === 0 && <Badge className="bg-primary">Best Match</Badge>}
                      <h4 className="font-semibold">{neighborhood.name}</h4>
                    </div>
                    <p className="text-sm text-muted-foreground">{neighborhood.city}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-primary">{neighborhood.score}%</div>
                    <div className="text-xs text-muted-foreground">match</div>
                  </div>
                </div>
                
                <div className="flex flex-wrap gap-2 mt-3">
                  {neighborhood.highlights.map((h, i) => (
                    <Badge key={i} variant="secondary" className="text-xs">
                      {h}
                    </Badge>
                  ))}
                </div>
                
                <div className="flex justify-between items-center mt-3 pt-3 border-t">
                  <span className="text-sm text-muted-foreground">
                    Price range: {neighborhood.priceRange} ₪
                  </span>
                  <Link 
                    to={`/areas/${neighborhood.city.toLowerCase().replace(/\s+/g, '-')}`}
                    className="text-sm text-primary hover:underline"
                  >
                    Explore area →
                  </Link>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="flex gap-3">
            <Button variant="outline" onClick={() => { setShowResults(false); setCurrentStep(0); setAnswers({}); }}>
              Start Over
            </Button>
            <Link to="/areas">
              <Button className="gap-2">
                <MapPin className="h-4 w-4" />
                Browse All Areas
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    );
  }

  const CurrentIcon = currentQuestion.icon;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <CurrentIcon className="h-5 w-5 text-primary" />
            Find Your Neighborhood
          </CardTitle>
          <span className="text-sm text-muted-foreground">
            {currentStep + 1} of {QUESTIONS.length}
          </span>
        </div>
        <Progress value={progress} className="h-2 mt-2" />
      </CardHeader>
      <CardContent>
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="min-h-[300px]"
          >
            <h3 className="text-lg font-semibold mb-4">{currentQuestion.title}</h3>
            
            <RadioGroup 
              value={answers[currentQuestion.id] || ''} 
              onValueChange={(v) => setAnswer(currentQuestion.id, v)}
              className="space-y-3"
            >
              {currentQuestion.options.map((option) => (
                <div 
                  key={option.value}
                  className="flex items-center space-x-3 p-4 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                >
                  <RadioGroupItem value={option.value} id={option.value} />
                  <Label htmlFor={option.value} className="flex-1 cursor-pointer">
                    <span className="font-medium">{option.label}</span>
                    <p className="text-xs text-muted-foreground">{option.description}</p>
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </motion.div>
        </AnimatePresence>

        <div className="flex justify-between mt-6 pt-4 border-t">
          <Button
            variant="outline"
            onClick={() => setCurrentStep(prev => prev - 1)}
            disabled={currentStep === 0}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          
          {currentStep === QUESTIONS.length - 1 ? (
            <Button 
              onClick={() => setShowResults(true)}
              disabled={!canProceed}
              className="gap-2"
            >
              See Matches
              <CheckCircle2 className="h-4 w-4" />
            </Button>
          ) : (
            <Button
              onClick={() => setCurrentStep(prev => prev + 1)}
              disabled={!canProceed}
              className="gap-2"
            >
              Next
              <ArrowRight className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
