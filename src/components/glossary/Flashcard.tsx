import { motion } from 'framer-motion';
import { CATEGORY_CONFIG } from './CategoryNav';
import { GlossaryTerm } from '@/hooks/useGlossary';
import { RotateCcw } from 'lucide-react';

interface FlashcardProps {
  term: GlossaryTerm;
  isFlipped: boolean;
  onFlip: () => void;
}

export function Flashcard({ term, isFlipped, onFlip }: FlashcardProps) {
  const category = term.category || 'general';
  const CategoryIcon = CATEGORY_CONFIG[category]?.icon || CATEGORY_CONFIG.general.icon;
  const categoryLabel = CATEGORY_CONFIG[category]?.label || 'General';

  return (
    <div 
      className="w-full aspect-[3/4] max-w-sm mx-auto cursor-pointer perspective-1000"
      onClick={onFlip}
      role="button"
      aria-label={isFlipped ? `Showing English: ${term.english_term}` : `Hebrew term: ${term.hebrew_term}. Tap to reveal English.`}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === ' ' || e.key === 'Enter') {
          e.preventDefault();
          onFlip();
        }
      }}
    >
      <motion.div
        className="relative w-full h-full"
        initial={false}
        animate={{ rotateY: isFlipped ? 180 : 0 }}
        transition={{ duration: 0.5, type: "spring", stiffness: 300, damping: 30 }}
        style={{ transformStyle: 'preserve-3d' }}
      >
        {/* Front - Hebrew */}
        <div 
          className="absolute inset-0 rounded-2xl bg-card border border-border shadow-lg p-6 flex flex-col items-center justify-center backface-hidden"
          style={{ backfaceVisibility: 'hidden' }}
        >
          <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mb-6">
            <CategoryIcon className="h-7 w-7 text-primary" />
          </div>
          
          <h2 className="text-4xl md:text-5xl font-bold text-primary mb-3 text-center" dir="rtl">
            {term.hebrew_term}
          </h2>
          
          {term.transliteration && (
            <p className="text-lg text-muted-foreground italic mb-6">
              ({term.transliteration})
            </p>
          )}
          
          <div className="flex-1" />
          
          <p className="text-sm text-muted-foreground flex items-center gap-2 mb-4">
            <RotateCcw className="h-4 w-4" />
            Tap to reveal
          </p>
          
          <span className="px-3 py-1 rounded-full bg-muted text-muted-foreground text-sm font-medium">
            {categoryLabel}
          </span>
        </div>
        
        {/* Back - English */}
        <div 
          className="absolute inset-0 rounded-2xl bg-card border border-border shadow-lg p-6 flex flex-col backface-hidden"
          style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
        >
          <div className="text-center mb-4">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
              {term.english_term}
            </h2>
            <p className="text-sm text-muted-foreground" dir="rtl">
              {term.hebrew_term}
            </p>
          </div>
          
          {term.simple_explanation && (
            <div className="mb-4">
              <p className="text-muted-foreground leading-relaxed">
                {term.simple_explanation}
              </p>
            </div>
          )}
          
          {term.usage_context && (
            <div className="flex-1 bg-muted/30 rounded-lg p-4">
              <p className="text-xs font-medium text-primary uppercase tracking-wide mb-1">
                When You'll See This
              </p>
              <p className="text-sm text-muted-foreground">
                {term.usage_context}
              </p>
            </div>
          )}
          
          <div className="mt-4 text-center">
            <p className="text-sm text-muted-foreground flex items-center justify-center gap-2">
              <RotateCcw className="h-4 w-4" />
              Tap to flip back
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
