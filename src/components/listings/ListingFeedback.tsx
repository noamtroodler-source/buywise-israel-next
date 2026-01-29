import { Link } from 'react-router-dom';
import { MessageSquare, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ListingFeedbackProps {
  listingType: 'rentals' | 'buy' | 'projects';
  className?: string;
}

const FEEDBACK_CONFIG = {
  rentals: {
    title: "Have thoughts on our rental listings?",
    subtitle: "Tell us what you'd like to see — your feedback shapes what we improve next.",
  },
  buy: {
    title: "How are we doing with properties for sale?",
    subtitle: "Your feedback helps us show what matters most to buyers like you.",
  },
  projects: {
    title: "Thoughts on our new development listings?",
    subtitle: "Let us know what info would help you evaluate projects better.",
  },
};

export function ListingFeedback({ listingType, className }: ListingFeedbackProps) {
  const config = FEEDBACK_CONFIG[listingType];

  return (
    <Link
      to="/contact"
      className={cn(
        "group flex items-center gap-4 py-5 px-6 rounded-xl",
        "bg-gradient-to-r from-primary/5 to-primary/10",
        "border border-primary/20 hover:border-primary/40",
        "hover:from-primary/10 hover:to-primary/15",
        "transition-all duration-300",
        className
      )}
    >
      <div className="p-2.5 rounded-lg bg-primary/15 group-hover:bg-primary/25 transition-colors">
        <MessageSquare className="h-5 w-5 text-primary" />
      </div>
      <div className="text-left flex-1">
        <p className="text-sm font-semibold text-foreground">{config.title}</p>
        <p className="text-xs text-muted-foreground">{config.subtitle}</p>
      </div>
      <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
    </Link>
  );
}
