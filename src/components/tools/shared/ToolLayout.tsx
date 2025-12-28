import { ReactNode } from 'react';
import { Share2, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ToolLayoutProps {
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  infoBanner?: ReactNode;
  leftColumn: ReactNode;
  rightColumn: ReactNode;
  disclaimer?: ReactNode;
  onBack?: () => void;
  className?: string;
}

export function ToolLayout({
  title,
  subtitle,
  icon,
  infoBanner,
  leftColumn,
  rightColumn,
  disclaimer,
  onBack,
  className,
}: ToolLayoutProps) {
  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: title,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
    }
  };

  return (
    <div className={cn("w-full max-w-6xl mx-auto", className)}>
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-start gap-3">
          {onBack && (
            <Button variant="ghost" size="icon" onClick={onBack} className="mt-1">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          )}
          <div>
            <div className="flex items-center gap-2">
              {icon && <span className="text-primary">{icon}</span>}
              <h1 className="text-2xl md:text-3xl font-bold text-foreground">{title}</h1>
            </div>
            {subtitle && (
              <p className="text-muted-foreground mt-1">{subtitle}</p>
            )}
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={handleShare} className="gap-2">
          <Share2 className="h-4 w-4" />
          <span className="hidden sm:inline">Share</span>
        </Button>
      </div>

      {/* Info Banner */}
      {infoBanner && (
        <div className="mb-6">
          {infoBanner}
        </div>
      )}

      {/* Main Content - Two Column Layout */}
      <div className="grid lg:grid-cols-[1fr,400px] gap-8">
        {/* Left Column - Inputs */}
        <div className="space-y-6">
          {leftColumn}
        </div>

        {/* Right Column - Results (Sticky on desktop) */}
        <div className="lg:sticky lg:top-4 lg:self-start space-y-4">
          {rightColumn}
        </div>
      </div>

      {/* Disclaimer */}
      {disclaimer && (
        <div className="mt-8">
          {disclaimer}
        </div>
      )}
    </div>
  );
}
