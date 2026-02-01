import { motion, AnimatePresence } from 'framer-motion';
import { Star, StarOff, ChevronDown, Lightbulb } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { CATEGORY_CONFIG } from './CategoryNav';
import type { GlossaryTerm } from '@/hooks/useGlossary';

interface GlossaryTermCardProps {
  term: GlossaryTerm;
  isSaved: boolean;
  isExpanded: boolean;
  onToggleSave: () => void;
  onToggleExpand: () => void;
  index?: number;
}

export function GlossaryTermCard({ 
  term, 
  isSaved, 
  isExpanded, 
  onToggleSave, 
  onToggleExpand,
  index = 0,
}: GlossaryTermCardProps) {
  const categoryConfig = term.category ? CATEGORY_CONFIG[term.category] : null;
  const CategoryIcon = categoryConfig?.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03 }}
    >
      <Card className="overflow-hidden hover:shadow-md hover:border-primary/30 transition-all">
        <Collapsible open={isExpanded} onOpenChange={onToggleExpand}>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-muted/30 transition-colors py-4 px-5">
              <div className="flex items-start gap-4">
                {/* Icon */}
                {CategoryIcon && (
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    <CategoryIcon className="h-5 w-5 text-primary" />
                  </div>
                )}
                
                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 flex-wrap mb-1">
                    <h3 className="text-xl font-bold text-primary" dir="rtl">
                      {term.hebrew_term}
                    </h3>
                    {term.transliteration && (
                      <span className="text-sm text-muted-foreground italic">
                        ({term.transliteration})
                      </span>
                    )}
                  </div>
                  
                  <p className="text-base font-medium text-foreground mb-1">
                    {term.english_term}
                  </p>
                  
                  {term.simple_explanation && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {term.simple_explanation}
                    </p>
                  )}
                </div>
                
                {/* Actions */}
                <div className="flex items-center gap-1 shrink-0">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleSave();
                    }}
                    className={`h-9 w-9 ${isSaved ? 'text-yellow-500 hover:text-yellow-600' : 'text-muted-foreground hover:text-foreground'}`}
                  >
                    {isSaved ? (
                      <Star className="h-5 w-5 fill-current" />
                    ) : (
                      <StarOff className="h-5 w-5" />
                    )}
                  </Button>
                  <ChevronDown className={`h-5 w-5 text-muted-foreground transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
                </div>
              </div>
            </CardHeader>
          </CollapsibleTrigger>

          <CollapsibleContent>
            <AnimatePresence>
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
              >
                <CardContent className="pt-0 pb-5 px-5 space-y-4 border-t border-border/50">
                  {term.detailed_explanation && (
                    <div className="pt-4">
                      <h4 className="text-sm font-semibold text-foreground mb-1.5">What It Means</h4>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {term.detailed_explanation}
                      </p>
                    </div>
                  )}

                  {term.usage_context && (
                    <div>
                      <h4 className="text-sm font-semibold text-foreground mb-1.5">When You'll See This</h4>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {term.usage_context}
                      </p>
                    </div>
                  )}

                  {term.pro_tip && (
                    <div className="p-4 bg-primary/5 border border-primary/15 rounded-xl">
                      <div className="flex items-start gap-2">
                        <Lightbulb className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                        <div>
                          <h4 className="text-sm font-semibold text-primary mb-1">Pro Tip</h4>
                          <p className="text-sm text-muted-foreground leading-relaxed">
                            {term.pro_tip}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {term.category && (
                    <div className="pt-2">
                      <Badge variant="secondary" className="bg-primary/10 text-primary hover:bg-primary/15">
                        {categoryConfig?.label || term.category}
                      </Badge>
                    </div>
                  )}
                </CardContent>
              </motion.div>
            </AnimatePresence>
          </CollapsibleContent>
        </Collapsible>
      </Card>
    </motion.div>
  );
}
