import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Progress } from '@/components/ui/progress';
import { Compass, ArrowRight, ArrowLeft, MapPin, Home, Users, Briefcase, TreePine } from 'lucide-react';

interface Answers {
  budget: number;
  bedrooms: number;
  lifestyle: 'urban' | 'suburban' | 'quiet';
  commute: 'car' | 'public' | 'remote';
  priority: 'schools' | 'nightlife' | 'nature' | 'shopping';
  familySize: 'single' | 'couple' | 'family' | 'extended';
}

const recommendations: Record<string, { areas: string[]; propertyTypes: string[]; tips: string[] }> = {
  'urban-single': {
    areas: ['Tel Aviv Center', 'Florentin', 'Neve Tzedek', 'Ramat Gan Diamond'],
    propertyTypes: ['Studio', '1-2 Bedroom Apartment'],
    tips: ['Look for buildings with shared amenities', 'Consider newer high-rises for convenience'],
  },
  'urban-couple': {
    areas: ['Tel Aviv North', 'Herzliya', 'Ramat HaSharon', 'Givatayim'],
    propertyTypes: ['2-3 Bedroom Apartment', 'Penthouse'],
    tips: ['Consider future family needs', 'Look for parking availability'],
  },
  'urban-family': {
    areas: ['Ramat Aviv', 'Kfar Saba', 'Hod HaSharon', 'Modiin'],
    propertyTypes: ['4+ Bedroom Apartment', 'Garden Apartment', 'Cottage'],
    tips: ['Check school districts carefully', 'Look for safe routes to schools'],
  },
  'suburban-single': {
    areas: ['Netanya', 'Bat Yam', 'Holon'],
    propertyTypes: ['1-2 Bedroom Apartment'],
    tips: ['Check public transport connections', 'Consider distance to work'],
  },
  'suburban-couple': {
    areas: ['Petah Tikva', 'Rishon LeZion', 'Rehovot'],
    propertyTypes: ['2-3 Bedroom Apartment', 'Small House'],
    tips: ['Good balance of price and quality', 'Growing areas with appreciation potential'],
  },
  'suburban-family': {
    areas: ['Modiin', 'Shoham', 'Beer Yaakov', 'Gedera'],
    propertyTypes: ['House', 'Cottage', 'Large Apartment'],
    tips: ['Check community facilities', 'Look for family-friendly neighborhoods'],
  },
  'quiet-single': {
    areas: ['Zichron Yaakov', 'Nahariya', 'Tiberias'],
    propertyTypes: ['Apartment', 'Small House'],
    tips: ['Consider work-from-home setup', 'Check internet connectivity'],
  },
  'quiet-couple': {
    areas: ['Rosh Pina', 'Ein Hod', 'Mitzpe Ramon'],
    propertyTypes: ['House', 'Villa'],
    tips: ['Perfect for remote workers', 'Consider property with land'],
  },
  'quiet-family': {
    areas: ['Kibbutzim', 'Moshavim', 'Northern Villages'],
    propertyTypes: ['House with Garden', 'Villa'],
    tips: ['Check school availability', 'Consider community atmosphere'],
  },
};

export function FindYourPlaceWorkshop() {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Answers>({
    budget: 2500000,
    bedrooms: 3,
    lifestyle: 'suburban',
    commute: 'car',
    priority: 'schools',
    familySize: 'family',
  });
  const [showResults, setShowResults] = useState(false);

  const totalSteps = 6;
  const progress = ((step + 1) / totalSteps) * 100;

  const getRecommendation = () => {
    const key = `${answers.lifestyle}-${answers.familySize}`;
    return recommendations[key] || recommendations['suburban-couple'];
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('he-IL', {
      style: 'currency',
      currency: 'ILS',
      maximumFractionDigits: 0,
    }).format(value);
  };

  const renderStep = () => {
    switch (step) {
      case 0:
        return (
          <div className="space-y-4">
            <Label className="text-lg">What's your budget? {formatCurrency(answers.budget)}</Label>
            <Slider
              value={[answers.budget]}
              onValueChange={([value]) => setAnswers({ ...answers, budget: value })}
              min={500000}
              max={10000000}
              step={100000}
            />
            <p className="text-sm text-muted-foreground">
              This will help us narrow down areas that match your budget
            </p>
          </div>
        );
      case 1:
        return (
          <div className="space-y-4">
            <Label className="text-lg">How many bedrooms do you need?</Label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((num) => (
                <Button
                  key={num}
                  variant={answers.bedrooms === num ? 'default' : 'outline'}
                  onClick={() => setAnswers({ ...answers, bedrooms: num })}
                  className="flex-1"
                >
                  {num}{num === 5 ? '+' : ''}
                </Button>
              ))}
            </div>
          </div>
        );
      case 2:
        return (
          <div className="space-y-4">
            <Label className="text-lg">What's your preferred lifestyle?</Label>
            <RadioGroup
              value={answers.lifestyle}
              onValueChange={(v) => setAnswers({ ...answers, lifestyle: v as Answers['lifestyle'] })}
              className="space-y-3"
            >
              <div className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-muted/50 cursor-pointer">
                <RadioGroupItem value="urban" id="urban" />
                <Label htmlFor="urban" className="flex-1 cursor-pointer">
                  <span className="font-medium">Urban</span>
                  <p className="text-sm text-muted-foreground">City center, walkable, vibrant nightlife</p>
                </Label>
              </div>
              <div className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-muted/50 cursor-pointer">
                <RadioGroupItem value="suburban" id="suburban" />
                <Label htmlFor="suburban" className="flex-1 cursor-pointer">
                  <span className="font-medium">Suburban</span>
                  <p className="text-sm text-muted-foreground">Quiet neighborhoods, family-friendly, good schools</p>
                </Label>
              </div>
              <div className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-muted/50 cursor-pointer">
                <RadioGroupItem value="quiet" id="quiet" />
                <Label htmlFor="quiet" className="flex-1 cursor-pointer">
                  <span className="font-medium">Rural/Quiet</span>
                  <p className="text-sm text-muted-foreground">Nature, space, peaceful environment</p>
                </Label>
              </div>
            </RadioGroup>
          </div>
        );
      case 3:
        return (
          <div className="space-y-4">
            <Label className="text-lg">How do you commute to work?</Label>
            <RadioGroup
              value={answers.commute}
              onValueChange={(v) => setAnswers({ ...answers, commute: v as Answers['commute'] })}
              className="space-y-3"
            >
              <div className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-muted/50 cursor-pointer">
                <RadioGroupItem value="car" id="car" />
                <Label htmlFor="car" className="flex-1 cursor-pointer">By Car</Label>
              </div>
              <div className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-muted/50 cursor-pointer">
                <RadioGroupItem value="public" id="public" />
                <Label htmlFor="public" className="flex-1 cursor-pointer">Public Transport</Label>
              </div>
              <div className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-muted/50 cursor-pointer">
                <RadioGroupItem value="remote" id="remote" />
                <Label htmlFor="remote" className="flex-1 cursor-pointer">Work From Home</Label>
              </div>
            </RadioGroup>
          </div>
        );
      case 4:
        return (
          <div className="space-y-4">
            <Label className="text-lg">What's most important to you?</Label>
            <RadioGroup
              value={answers.priority}
              onValueChange={(v) => setAnswers({ ...answers, priority: v as Answers['priority'] })}
              className="space-y-3"
            >
              <div className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-muted/50 cursor-pointer">
                <RadioGroupItem value="schools" id="schools" />
                <Label htmlFor="schools" className="flex-1 cursor-pointer">Great Schools</Label>
              </div>
              <div className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-muted/50 cursor-pointer">
                <RadioGroupItem value="nightlife" id="nightlife" />
                <Label htmlFor="nightlife" className="flex-1 cursor-pointer">Nightlife & Entertainment</Label>
              </div>
              <div className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-muted/50 cursor-pointer">
                <RadioGroupItem value="nature" id="nature" />
                <Label htmlFor="nature" className="flex-1 cursor-pointer">Nature & Parks</Label>
              </div>
              <div className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-muted/50 cursor-pointer">
                <RadioGroupItem value="shopping" id="shopping" />
                <Label htmlFor="shopping" className="flex-1 cursor-pointer">Shopping & Convenience</Label>
              </div>
            </RadioGroup>
          </div>
        );
      case 5:
        return (
          <div className="space-y-4">
            <Label className="text-lg">What's your family situation?</Label>
            <RadioGroup
              value={answers.familySize}
              onValueChange={(v) => setAnswers({ ...answers, familySize: v as Answers['familySize'] })}
              className="space-y-3"
            >
              <div className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-muted/50 cursor-pointer">
                <RadioGroupItem value="single" id="single" />
                <Label htmlFor="single" className="flex-1 cursor-pointer">Single</Label>
              </div>
              <div className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-muted/50 cursor-pointer">
                <RadioGroupItem value="couple" id="couple" />
                <Label htmlFor="couple" className="flex-1 cursor-pointer">Couple (no kids)</Label>
              </div>
              <div className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-muted/50 cursor-pointer">
                <RadioGroupItem value="family" id="family" />
                <Label htmlFor="family" className="flex-1 cursor-pointer">Family with Kids</Label>
              </div>
              <div className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-muted/50 cursor-pointer">
                <RadioGroupItem value="extended" id="extended" />
                <Label htmlFor="extended" className="flex-1 cursor-pointer">Extended Family</Label>
              </div>
            </RadioGroup>
          </div>
        );
      default:
        return null;
    }
  };

  if (showResults) {
    const rec = getRecommendation();
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-primary" />
            Your Personalized Recommendations
          </CardTitle>
          <CardDescription>Based on your preferences</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-primary/10">
                <h4 className="font-semibold flex items-center gap-2 mb-3">
                  <MapPin className="h-4 w-4" />
                  Recommended Areas
                </h4>
                <ul className="space-y-2">
                  {rec.areas.map((area) => (
                    <li key={area} className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-primary" />
                      {area}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="p-4 rounded-lg bg-secondary">
                <h4 className="font-semibold flex items-center gap-2 mb-3">
                  <Home className="h-4 w-4" />
                  Property Types for You
                </h4>
                <ul className="space-y-2">
                  {rec.propertyTypes.map((type) => (
                    <li key={type} className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-secondary-foreground" />
                      {type}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="space-y-4">
              <div className="p-4 rounded-lg border">
                <h4 className="font-semibold mb-3">Your Profile Summary</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Budget:</span>
                    <span>{formatCurrency(answers.budget)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Bedrooms:</span>
                    <span>{answers.bedrooms}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Lifestyle:</span>
                    <span className="capitalize">{answers.lifestyle}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Priority:</span>
                    <span className="capitalize">{answers.priority}</span>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-lg bg-accent">
                <h4 className="font-semibold mb-3">Tips for You</h4>
                <ul className="space-y-2 text-sm">
                  {rec.tips.map((tip, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-primary">•</span>
                      {tip}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          <Button onClick={() => { setShowResults(false); setStep(0); }} variant="outline" className="w-full">
            Start Over
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Compass className="h-5 w-5 text-primary" />
          Find Your Place Workshop
        </CardTitle>
        <CardDescription>
          Answer a few questions and we'll recommend the perfect areas for you
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Step {step + 1} of {totalSteps}</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} />
        </div>

        <div className="min-h-[200px]">
          {renderStep()}
        </div>

        <div className="flex justify-between">
          <Button
            variant="outline"
            onClick={() => setStep(step - 1)}
            disabled={step === 0}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          
          {step < totalSteps - 1 ? (
            <Button onClick={() => setStep(step + 1)}>
              Next
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          ) : (
            <Button onClick={() => setShowResults(true)}>
              See Results
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
