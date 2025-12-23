import { ReactNode } from 'react';
import { HelpCircle } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useGlossaryTerm } from '@/hooks/useGlossary';

interface GlossaryTooltipProps {
  term: string; // Hebrew term to look up
  children?: ReactNode;
  showIcon?: boolean;
  className?: string;
}

/**
 * GlossaryTooltip - Provides inline Hebrew term definitions
 * 
 * Usage:
 * <GlossaryTooltip term="טאבו">Tabu</GlossaryTooltip>
 * <GlossaryTooltip term="נסח טאבו" showIcon>Nesach Tabu</GlossaryTooltip>
 */
export function GlossaryTooltip({ term, children, showIcon = false, className = '' }: GlossaryTooltipProps) {
  const { data: glossaryTerm, isLoading } = useGlossaryTerm(term);

  if (!glossaryTerm && !isLoading) {
    // Term not found in glossary, just render children
    return <span className={className}>{children}</span>;
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className={`inline-flex items-center gap-1 cursor-help border-b border-dashed border-primary/40 hover:border-primary transition-colors ${className}`}>
          {children}
          {showIcon && <HelpCircle className="h-3 w-3 text-muted-foreground" />}
        </span>
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-sm p-3">
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading...</p>
        ) : glossaryTerm ? (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold text-primary" dir="rtl">
                {glossaryTerm.hebrew_term}
              </span>
              {glossaryTerm.transliteration && (
                <span className="text-xs text-muted-foreground italic">
                  ({glossaryTerm.transliteration})
                </span>
              )}
            </div>
            <p className="font-medium">{glossaryTerm.english_term}</p>
            {glossaryTerm.simple_explanation && (
              <p className="text-sm text-muted-foreground">
                {glossaryTerm.simple_explanation}
              </p>
            )}
            {glossaryTerm.pro_tip && (
              <p className="text-xs text-primary/80 mt-1">
                💡 {glossaryTerm.pro_tip}
              </p>
            )}
          </div>
        ) : null}
      </TooltipContent>
    </Tooltip>
  );
}

// Pre-defined commonly used terms for quick access
export const COMMON_TERMS = {
  TABU: 'טאבו',
  NESACH_TABU: 'נסח טאבו',
  MAS_RECHISHA: 'מס רכישה',
  HEARAT_AZHARA: 'הערת אזהרה',
  ARNONA: 'ארנונה',
  VAAD_BAYIT: 'ועד בית',
  MASHKANTA: 'משכנתא',
  ORECH_DIN: 'עורך דין',
  KABLAN: 'קבלן',
  HIYUN: 'היוון',
};

/**
 * HebrewTerm - Quick way to display a Hebrew term with English and tooltip
 */
export function HebrewTerm({ 
  hebrew, 
  english, 
  showHebrew = true 
}: { 
  hebrew: string; 
  english: string; 
  showHebrew?: boolean;
}) {
  return (
    <GlossaryTooltip term={hebrew}>
      {showHebrew ? (
        <span>
          {english} (<span dir="rtl">{hebrew}</span>)
        </span>
      ) : (
        english
      )}
    </GlossaryTooltip>
  );
}
