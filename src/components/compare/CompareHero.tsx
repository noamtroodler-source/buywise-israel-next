import { Link } from 'react-router-dom';
import { ArrowLeft, Share2, Trash2, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

interface CompareHeroProps {
  propertyCount: number;
  maxProperties: number;
  investorView: boolean;
  onInvestorViewChange: (checked: boolean) => void;
  onShare: () => void;
  onClearAll: () => void;
}

export function CompareHero({
  propertyCount,
  maxProperties,
  investorView,
  onInvestorViewChange,
  onShare,
  onClearAll,
}: CompareHeroProps) {
  return (
    <div className="bg-gradient-to-b from-primary/5 via-primary/3 to-background border-b border-border/50">
      <div className="container py-8 md:py-12 space-y-6">
        {/* Back Link */}
        <Link 
          to="/listings?status=for_sale" 
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Listings
        </Link>

        {/* Title Section */}
        <div className="space-y-2">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
            Compare Properties
          </h1>
          <p className="text-muted-foreground text-lg">
            See what matters most — side by side
          </p>
        </div>

        {/* Actions Row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
          {/* Property Count Indicator */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              {Array.from({ length: maxProperties }).map((_, i) => (
                <div
                  key={i}
                  className={`w-2.5 h-2.5 rounded-full transition-colors ${
                    i < propertyCount ? 'bg-primary' : 'bg-muted-foreground/30'
                  }`}
                />
              ))}
            </div>
            <span className="text-sm font-medium text-muted-foreground">
              {propertyCount} of {maxProperties} properties
            </span>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Investor View Toggle */}
            <div className="flex items-center gap-2 bg-background/80 backdrop-blur-sm rounded-lg px-3 py-2 border border-border/50">
              <TrendingUp className="h-4 w-4 text-primary" />
              <Label 
                htmlFor="investor-view" 
                className="text-sm font-medium cursor-pointer select-none"
              >
                Investor View
              </Label>
              <Switch
                id="investor-view"
                checked={investorView}
                onCheckedChange={onInvestorViewChange}
              />
            </div>

            <Button variant="outline" size="sm" onClick={onShare}>
              <Share2 className="h-4 w-4 mr-2" />
              Share
            </Button>

            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onClearAll}
              className="text-muted-foreground hover:text-destructive"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Clear All
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
