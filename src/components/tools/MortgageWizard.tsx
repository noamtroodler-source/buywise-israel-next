import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { 
  ArrowRight, ArrowLeft, CheckCircle2, HelpCircle, 
  Landmark, TrendingUp, Shield, AlertTriangle, Calculator
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { GlossaryTooltip } from '@/components/shared/GlossaryTooltip';

interface Step {
  id: string;
  title: string;
  content: React.ReactNode;
}

const TRACK_INFO = [
  {
    name: 'Prime (ריבית פריים)',
    description: 'Variable rate linked to Bank of Israel prime rate',
    riskLevel: 'Medium',
    bestFor: 'Short-term holders or those expecting rate drops',
    pros: ['Low current rates', 'Easy to exit', 'Benefits from rate cuts'],
    cons: ['Payment can increase', 'Unpredictable long-term', 'Risk in rising rate environment'],
  },
  {
    name: 'Fixed Unlinked (קבועה לא צמודה)',
    description: 'Fixed interest rate, not linked to inflation',
    riskLevel: 'Low',
    bestFor: 'Conservative buyers wanting payment certainty',
    pros: ['Predictable payments', 'No inflation risk', 'Peace of mind'],
    cons: ['Higher initial rate', 'Penalty for early repayment', 'Miss out if rates drop'],
  },
  {
    name: 'CPI-Linked Fixed (צמודה למדד)',
    description: 'Fixed rate plus inflation adjustment',
    riskLevel: 'Medium-High',
    bestFor: 'Long-term holders in low inflation environment',
    pros: ['Lower base rate', 'Good if inflation stays low', 'Historically popular'],
    cons: ['Payment grows with inflation', 'Unpredictable total cost', 'Risky in high inflation'],
  },
  {
    name: 'Variable Unlinked (משתנה לא צמודה)',
    description: 'Rate changes every 5 years based on government bonds',
    riskLevel: 'Medium',
    bestFor: 'Medium-term flexibility',
    pros: ['Lower than fixed', 'Known adjustment periods', 'Not daily volatility'],
    cons: ['Rate can increase at reset', 'Less predictable than fixed'],
  },
];

export function MortgageWizard() {
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [showResults, setShowResults] = useState(false);

  const setAnswer = (question: string, answer: string) => {
    setAnswers(prev => ({ ...prev, [question]: answer }));
  };

  const steps: Step[] = [
    {
      id: 'intro',
      title: 'Understanding Israeli Mortgages',
      content: (
        <div className="space-y-4">
          <p className="text-muted-foreground">
            Israeli mortgages (<GlossaryTooltip term="משכנתא">Mashkanta</GlossaryTooltip>) are unique. 
            Unlike many countries where you get one loan type, Israeli mortgages are typically 
            split into multiple "tracks" with different characteristics.
          </p>
          <div className="grid sm:grid-cols-2 gap-4 mt-6">
            <div className="bg-primary/5 rounded-lg p-4">
              <Landmark className="h-5 w-5 text-primary mb-2" />
              <h4 className="font-semibold text-sm">Bank of Israel Rules</h4>
              <p className="text-xs text-muted-foreground mt-1">
                Regulations control how much you can borrow and in what track types
              </p>
            </div>
            <div className="bg-primary/5 rounded-lg p-4">
              <TrendingUp className="h-5 w-5 text-primary mb-2" />
              <h4 className="font-semibold text-sm">Multi-Track System</h4>
              <p className="text-xs text-muted-foreground mt-1">
                Diversify your loan across different rate types to manage risk
              </p>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'tracks',
      title: 'The 4 Main Mortgage Tracks',
      content: (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground mb-4">
            Each track has different risk/reward characteristics:
          </p>
          <div className="space-y-3">
            {TRACK_INFO.map((track, i) => (
              <div key={i} className="border border-border rounded-lg p-3">
                <div className="flex justify-between items-start">
                  <h4 className="font-semibold text-sm">{track.name}</h4>
                  <span className={`text-xs px-2 py-0.5 rounded ${
                    track.riskLevel === 'Low' ? 'bg-primary/10 text-primary' :
                    track.riskLevel === 'Medium' ? 'bg-muted text-muted-foreground' :
                    'bg-muted text-foreground'
                  }`}>
                    {track.riskLevel} Risk
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">{track.description}</p>
              </div>
            ))}
          </div>
        </div>
      ),
    },
    {
      id: 'quiz1',
      title: 'Your Risk Tolerance',
      content: (
        <div className="space-y-4">
          <p className="text-muted-foreground">
            How do you feel about your monthly payment potentially changing?
          </p>
          <RadioGroup 
            value={answers['risk'] || ''} 
            onValueChange={(v) => setAnswer('risk', v)}
            className="space-y-3 mt-4"
          >
            <div className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-muted/50 cursor-pointer">
              <RadioGroupItem value="low" id="risk-low" />
              <Label htmlFor="risk-low" className="flex-1 cursor-pointer">
                <span className="font-medium">I want certainty</span>
                <p className="text-xs text-muted-foreground">Fixed payments, even if they cost more</p>
              </Label>
            </div>
            <div className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-muted/50 cursor-pointer">
              <RadioGroupItem value="medium" id="risk-medium" />
              <Label htmlFor="risk-medium" className="flex-1 cursor-pointer">
                <span className="font-medium">Some flexibility is okay</span>
                <p className="text-xs text-muted-foreground">I can handle moderate changes</p>
              </Label>
            </div>
            <div className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-muted/50 cursor-pointer">
              <RadioGroupItem value="high" id="risk-high" />
              <Label htmlFor="risk-high" className="flex-1 cursor-pointer">
                <span className="font-medium">I'll take the risk for savings</span>
                <p className="text-xs text-muted-foreground">Willing to accept variability for lower rates</p>
              </Label>
            </div>
          </RadioGroup>
        </div>
      ),
    },
    {
      id: 'quiz2',
      title: 'Your Timeline',
      content: (
        <div className="space-y-4">
          <p className="text-muted-foreground">
            How long do you plan to keep this mortgage?
          </p>
          <RadioGroup 
            value={answers['timeline'] || ''} 
            onValueChange={(v) => setAnswer('timeline', v)}
            className="space-y-3 mt-4"
          >
            <div className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-muted/50 cursor-pointer">
              <RadioGroupItem value="short" id="time-short" />
              <Label htmlFor="time-short" className="flex-1 cursor-pointer">
                <span className="font-medium">Less than 10 years</span>
                <p className="text-xs text-muted-foreground">Might sell or refinance soon</p>
              </Label>
            </div>
            <div className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-muted/50 cursor-pointer">
              <RadioGroupItem value="medium" id="time-medium" />
              <Label htmlFor="time-medium" className="flex-1 cursor-pointer">
                <span className="font-medium">10-20 years</span>
                <p className="text-xs text-muted-foreground">This is a long-term home</p>
              </Label>
            </div>
            <div className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-muted/50 cursor-pointer">
              <RadioGroupItem value="long" id="time-long" />
              <Label htmlFor="time-long" className="flex-1 cursor-pointer">
                <span className="font-medium">Full term (20-30 years)</span>
                <p className="text-xs text-muted-foreground">Planning to pay off completely</p>
              </Label>
            </div>
          </RadioGroup>
        </div>
      ),
    },
    {
      id: 'boi-rules',
      title: 'Bank of Israel Regulations',
      content: (
        <div className="space-y-4">
          <p className="text-muted-foreground">
            The Bank of Israel sets mandatory rules for mortgage composition:
          </p>
          <div className="space-y-3 mt-4">
            <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
              <Shield className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <h4 className="font-semibold text-sm">Prime Track Limit</h4>
                <p className="text-xs text-muted-foreground">Maximum ⅓ (33%) of loan can be Prime-linked</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
              <Shield className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <h4 className="font-semibold text-sm">Variable Rate Limit</h4>
                <p className="text-xs text-muted-foreground">Maximum ⅓ of loan can be in any single variable track</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
              <Shield className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <h4 className="font-semibold text-sm">CPI-Linked Limit</h4>
                <p className="text-xs text-muted-foreground">Maximum ⅓ of loan can be CPI-linked</p>
              </div>
            </div>
          </div>
          <div className="bg-amber-500/10 p-3 rounded-lg border border-amber-500/20 mt-4">
            <p className="text-xs flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
              <span>These rules protect borrowers from excessive exposure to any single risk factor.</span>
            </p>
          </div>
        </div>
      ),
    },
  ];

  const getRecommendation = () => {
    const risk = answers['risk'];
    const timeline = answers['timeline'];

    if (risk === 'low') {
      return {
        primary: 'Fixed Unlinked',
        allocation: 'Consider 60-70% fixed unlinked, 30-40% split between variable tracks',
        explanation: 'Your preference for certainty means fixed rates will give you the predictable payments you want.',
      };
    } else if (risk === 'high' && timeline === 'short') {
      return {
        primary: 'Prime-Heavy Mix',
        allocation: 'Consider 33% prime (max allowed), 33% variable unlinked, 34% fixed',
        explanation: 'With high risk tolerance and short timeline, you can benefit from lower variable rates.',
      };
    } else {
      return {
        primary: 'Balanced Mix',
        allocation: 'Consider 40% fixed unlinked, 30% prime, 30% variable',
        explanation: 'A balanced approach gives you some rate protection while capturing potential savings.',
      };
    }
  };

  const progress = ((currentStep + 1) / steps.length) * 100;

  if (showResults) {
    const recommendation = getRecommendation();
    
    return (
      <Card>
        <CardHeader>
        <CardTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-primary" />
            Your Mortgage Track Recommendation
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-primary/5 rounded-xl p-6">
            <h3 className="text-xl font-bold text-primary mb-2">{recommendation.primary}</h3>
            <p className="text-muted-foreground">{recommendation.explanation}</p>
          </div>

          <div className="space-y-3">
            <h4 className="font-semibold">Suggested Allocation:</h4>
            <p className="text-sm text-muted-foreground">{recommendation.allocation}</p>
          </div>

          <div className="bg-muted/50 rounded-lg p-4">
            <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
              <HelpCircle className="h-4 w-4" />
              Next Steps
            </h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Consult with a mortgage advisor for personalized advice</li>
              <li>• Get quotes from multiple banks</li>
              <li>• Use our full Mortgage Calculator to model scenarios</li>
            </ul>
          </div>

          <div className="flex gap-3">
            <Button variant="outline" onClick={() => { setShowResults(false); setCurrentStep(0); }}>
              Start Over
            </Button>
            <Link to="/tools?tool=mortgage">
              <Button className="gap-2">
                <Calculator className="h-4 w-4" />
                Full Mortgage Calculator
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Understanding Your Mortgage</CardTitle>
          <span className="text-sm text-muted-foreground">
            Step {currentStep + 1} of {steps.length}
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
            <h3 className="text-lg font-semibold mb-4">{steps[currentStep].title}</h3>
            {steps[currentStep].content}
          </motion.div>
        </AnimatePresence>

        <div className="flex justify-between mt-6 pt-4 border-t">
          <Button
            variant="outline"
            onClick={() => { setCurrentStep(prev => prev - 1); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
            disabled={currentStep === 0}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          
          {currentStep === steps.length - 1 ? (
            <Button 
              onClick={() => setShowResults(true)}
              className="gap-2"
            >
              See Recommendations
              <CheckCircle2 className="h-4 w-4" />
            </Button>
          ) : (
            <Button
              onClick={() => setCurrentStep(prev => prev + 1)}
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
