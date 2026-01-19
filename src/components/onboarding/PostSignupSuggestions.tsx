import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  Calculator, MapPin, Heart, Bell, ArrowRight, 
  Sparkles, Home, TrendingUp, BookOpen 
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useBuyerProfile, getBuyerTaxCategory } from '@/hooks/useBuyerProfile';

interface PostSignupSuggestionsProps {
  open: boolean;
  onClose: () => void;
}

interface SuggestionCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  action: string;
  onClick: () => void;
  highlight?: boolean;
  delay?: number;
}

function SuggestionCard({ icon, title, description, action, onClick, highlight, delay = 0 }: SuggestionCardProps) {
  return (
    <motion.button
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      onClick={onClick}
      className={`w-full text-left p-4 rounded-xl border transition-all group ${
        highlight 
          ? 'border-primary/40 bg-primary/5 hover:border-primary hover:bg-primary/10' 
          : 'border-border hover:border-primary/40 hover:bg-muted/50'
      }`}
    >
      <div className="flex gap-3">
        <div className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center ${
          highlight ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
        }`}>
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-medium text-foreground">{title}</h3>
            {highlight && (
              <span className="text-xs bg-primary/20 text-primary px-1.5 py-0.5 rounded font-medium">
                Recommended
              </span>
            )}
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">{description}</p>
        </div>
        <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all flex-shrink-0 mt-3" />
      </div>
    </motion.button>
  );
}

export function PostSignupSuggestions({ open, onClose }: PostSignupSuggestionsProps) {
  const navigate = useNavigate();
  const { data: buyerProfile } = useBuyerProfile();

  // Trigger celebratory confetti when dialog opens
  useEffect(() => {
    if (open) {
      const duration = 3000;
      const end = Date.now() + duration;
      const colors = ['#3b82f6', '#60a5fa', '#93c5fd', '#1d4ed8', '#2563eb'];

      (function frame() {
        confetti({
          particleCount: 3,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors: colors,
        });
        confetti({
          particleCount: 3,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors: colors,
        });

        if (Date.now() < end) {
          requestAnimationFrame(frame);
        }
      })();
    }
  }, [open]);
  
  // Get personalized suggestions based on profile
  const buyerCategory = buyerProfile ? getBuyerTaxCategory(buyerProfile) : 'first_time';
  const isInvestor = buyerProfile?.purchase_purpose === 'investment';
  const isOleh = buyerCategory === 'oleh';
  
  const handleAction = (path: string) => {
    onClose();
    navigate(path);
  };

  // Build personalized suggestions
  const suggestions = [
    // Primary recommendation based on profile
    isInvestor ? {
      icon: <TrendingUp className="h-5 w-5" />,
      title: 'Investment Return Calculator',
      description: 'See projected yields and cash flow for Israeli properties',
      action: 'Calculate Returns',
      path: '/tools?tool=investment',
      highlight: true,
    } : {
      icon: <Calculator className="h-5 w-5" />,
      title: 'See What You Can Afford',
      description: 'Get your personalized budget based on Israeli bank limits',
      action: 'Calculate Now',
      path: '/tools?tool=affordability',
      highlight: true,
    },
    // Location exploration
    {
      icon: <MapPin className="h-5 w-5" />,
      title: 'Explore Areas',
      description: 'Discover cities that match your lifestyle and budget',
      action: 'Browse Areas',
      path: '/areas',
      highlight: false,
    },
    // Listings
    {
      icon: <Home className="h-5 w-5" />,
      title: 'Browse Properties',
      description: 'See what\'s available in your price range',
      action: 'View Listings',
      path: '/listings?status=for_sale',
      highlight: false,
    },
    // Oleh-specific guide
    ...(isOleh ? [{
      icon: <BookOpen className="h-5 w-5" />,
      title: 'Oleh Buyer Guide',
      description: 'Everything you need to know about buying as a new Oleh',
      action: 'Read Guide',
      path: '/guides/oleh-buyer',
      highlight: false,
    }] : [{
      icon: <Bell className="h-5 w-5" />,
      title: 'Set Up Alerts',
      description: 'Get notified when properties match your criteria',
      action: 'Create Alert',
      path: '/listings?status=for_sale&createAlert=true',
      highlight: false,
    }]),
  ];

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader className="text-center pb-2">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="mx-auto w-14 h-14 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center mb-3"
          >
            <Sparkles className="h-7 w-7 text-primary" />
          </motion.div>
          <DialogTitle className="text-xl">You're all set!</DialogTitle>
          <DialogDescription className="text-base">
            Your profile is personalized. Here's what to do next:
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 mt-4">
          {suggestions.map((suggestion, index) => (
            <SuggestionCard
              key={suggestion.path}
              icon={suggestion.icon}
              title={suggestion.title}
              description={suggestion.description}
              action={suggestion.action}
              onClick={() => handleAction(suggestion.path)}
              highlight={suggestion.highlight}
              delay={0.1 + index * 0.05}
            />
          ))}
        </div>

        <div className="mt-6 pt-4 border-t border-border">
          <Button 
            variant="ghost" 
            className="w-full text-muted-foreground hover:text-foreground"
            onClick={onClose}
          >
            I'll explore on my own
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
