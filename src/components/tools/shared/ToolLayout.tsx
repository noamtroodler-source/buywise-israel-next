import { ReactNode } from 'react';
import { Share2, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface ToolLayoutProps {
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  headerActions?: ReactNode;
  /** "Why this tool exists" intro - appears below header, above infoBanner */
  intro?: ReactNode;
  infoBanner?: ReactNode;
  leftColumn: ReactNode;
  rightColumn: ReactNode;
  bottomSection?: ReactNode;
  disclaimer?: ReactNode;
  /** Source attribution component for trust signals */
  sourceAttribution?: ReactNode;
  onBack?: () => void;
  className?: string;
}

export function ToolLayout({
  title,
  subtitle,
  icon,
  headerActions,
  intro,
  infoBanner,
  leftColumn,
  rightColumn,
  bottomSection,
  disclaimer,
  sourceAttribution,
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
      toast.success('Link copied to clipboard');
    }
  };

  return (
    <div className={cn("w-full max-w-6xl mx-auto", className)}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
        <div className="flex items-start gap-3">
          {onBack && (
            <Button variant="ghost" size="icon" onClick={onBack} className="mt-1 shrink-0">
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
        <div className="flex items-center gap-3 sm:shrink-0">
          {headerActions}
          <Button variant="outline" size="sm" onClick={handleShare} className="gap-2">
            <Share2 className="h-4 w-4" />
            <span className="hidden sm:inline">Share</span>
          </Button>
        </div>
      </div>

      {/* Tool Intro - "Why This Tool Exists" */}
      {intro && (
        <div className="mb-4">
          {intro}
        </div>
      )}

      {/* Info Banner */}
      {infoBanner && (
        <div className="mb-6">
          {infoBanner}
        </div>
      )}

      {/* Main Content - Two Column Layout */}
      <div className="grid lg:grid-cols-[1fr,420px] gap-8 items-stretch">
        {/* Left Column - Inputs */}
        <div className="flex flex-col">
          {leftColumn}
        </div>

        {/* Right Column - Results */}
        <div className="flex flex-col lg:sticky lg:top-6 lg:self-start">
          {rightColumn}
        </div>
      </div>

      {/* Bottom Section - Full Width */}
      {bottomSection && (
        <div className="mt-8">
          {bottomSection}
        </div>
      )}

      {/* Source Attribution */}
      {sourceAttribution && (
        <div className="mt-8">
          {sourceAttribution}
        </div>
      )}

      {/* Disclaimer */}
      {disclaimer && (
        <div className="mt-6">
          {disclaimer}
        </div>
      )}
    </div>
  );
}
