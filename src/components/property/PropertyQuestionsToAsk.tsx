import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, Copy, Check, HelpCircle, Sparkles, Mail, ChevronDown } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useListingQuestions, ListingData } from '@/hooks/useListingQuestions';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { QuestionCategoryBadge } from './QuestionCategoryBadge';
import { Skeleton } from '@/components/ui/skeleton';

interface PropertyQuestionsToAskProps {
  listing: ListingData;
  className?: string;
}

const VISIBLE_COUNT = 3;

export function PropertyQuestionsToAsk({ listing, className }: PropertyQuestionsToAskProps) {
  const { data, isLoading, error } = useListingQuestions(listing);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  const questions = data?.questions || [];
  const isAiGenerated = data?.source === 'ai';
  
  // Determine if this is a rental listing
  const isRental = listing.type === 'rent';
  
  // Split questions into visible and hidden
  const visibleQuestions = questions.slice(0, VISIBLE_COUNT);
  const hiddenQuestions = questions.slice(VISIBLE_COUNT);
  const hasMoreQuestions = hiddenQuestions.length > 0;

  const formatQuestionsForCopy = () => {
    const title = isRental ? 'Questions for Landlord' : 'Questions for Agent';
    const intro = isRental 
      ? 'Before signing a lease, I wanted to ask about:'
      : 'Before proceeding, I wanted to ask about:';
    
    return `${title}\n\n${intro}\n\n${questions
      .map((q, i) => `${i + 1}. ${q.question_text}`)
      .join('\n')}`;
  };

  const handleCopyAll = () => {
    navigator.clipboard.writeText(formatQuestionsForCopy());
    toast.success('Questions copied to clipboard');
  };

  const handleEmailQuestions = () => {
    const subject = isRental 
      ? 'Questions about the rental property'
      : 'Questions about the property listing';
    const body = encodeURIComponent(formatQuestionsForCopy());
    window.open(`mailto:?subject=${encodeURIComponent(subject)}&body=${body}`);
  };

  const handleCopyQuestion = (index: number, questionText: string) => {
    navigator.clipboard.writeText(questionText);
    setCopiedId(index.toString());
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Don't render if no questions and not loading
  if (!isLoading && questions.length === 0) {
    return null;
  }

  if (isLoading) {
    return (
      <Card className={cn("border-primary/10", className)}>
        <CardContent className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <Skeleton className="h-9 w-9 rounded-lg" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-3 w-32" />
            </div>
          </div>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex gap-3 p-3 rounded-lg bg-muted/30">
                <Skeleton className="h-6 w-6 rounded-full shrink-0" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-3 w-3/4" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return null; // Silently fail - questions are a nice-to-have
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.15 }}
    >
      <Card className={cn("border-primary/10 bg-gradient-to-br from-background to-muted/20", className)}>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                <MessageCircle className="h-4 w-4 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg">
                  {isRental ? 'Questions to Ask the Landlord' : 'Questions to Ask'}
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  {isRental 
                    ? 'Before signing a lease, consider asking:'
                    : 'Before speaking with the agent, consider asking:'
                  }
                </p>
              </div>
            </div>
            <div className="flex gap-1">
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-xs"
                onClick={handleCopyAll}
                title="Copy all questions"
              >
                <Copy className="h-3.5 w-3.5 mr-1" />
                Copy
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-xs"
                onClick={handleEmailQuestions}
                title="Email questions to yourself"
              >
                <Mail className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
          
          {/* AI-generated badge */}
          {isAiGenerated && (
            <div className="flex items-center gap-1.5 text-xs mt-2 pl-11">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              <span className="text-muted-foreground">
                Tailored for this listing
              </span>
            </div>
          )}
        </CardHeader>
        
        <CardContent className="pt-0 space-y-4">
          {/* Always visible questions */}
          <div className="space-y-3">
            <AnimatePresence mode="sync">
              {visibleQuestions.map((question, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2, delay: index * 0.05 }}
                  className="group"
                >
                  <div className="flex gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium text-primary">
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-medium text-foreground leading-relaxed">
                          "{question.question_text}"
                        </p>
                        <QuestionCategoryBadge category={question.category} className="shrink-0 mt-0.5" />
                      </div>
                      <p className="text-xs text-muted-foreground mt-1.5 flex items-start gap-1.5">
                        <HelpCircle className="h-3 w-3 shrink-0 mt-0.5" />
                        <span>{question.why_it_matters}</span>
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
                      onClick={() => handleCopyQuestion(index, question.question_text)}
                    >
                      {copiedId === index.toString() ? (
                        <Check className="h-3.5 w-3.5 text-primary" />
                      ) : (
                        <Copy className="h-3.5 w-3.5" />
                      )}
                    </Button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* Collapsible section for additional questions */}
          {hasMoreQuestions && (
            <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
              <CollapsibleTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full text-xs text-muted-foreground hover:text-foreground"
                >
                  <motion.div
                    animate={{ rotate: isExpanded ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <ChevronDown className="h-4 w-4 mr-1.5" />
                  </motion.div>
                  {isExpanded ? 'Show less' : `Show ${hiddenQuestions.length} more question${hiddenQuestions.length > 1 ? 's' : ''}`}
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-3 pt-3"
                >
                  {hiddenQuestions.map((question, hiddenIndex) => {
                    const actualIndex = VISIBLE_COUNT + hiddenIndex;
                    return (
                      <div key={actualIndex} className="group">
                        <div className="flex gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                          <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium text-primary">
                            {actualIndex + 1}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <p className="text-sm font-medium text-foreground leading-relaxed">
                                "{question.question_text}"
                              </p>
                              <QuestionCategoryBadge category={question.category} className="shrink-0 mt-0.5" />
                            </div>
                            <p className="text-xs text-muted-foreground mt-1.5 flex items-start gap-1.5">
                              <HelpCircle className="h-3 w-3 shrink-0 mt-0.5" />
                              <span>{question.why_it_matters}</span>
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
                            onClick={() => handleCopyQuestion(actualIndex, question.question_text)}
                          >
                            {copiedId === actualIndex.toString() ? (
                              <Check className="h-3.5 w-3.5 text-primary" />
                            ) : (
                              <Copy className="h-3.5 w-3.5" />
                            )}
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </motion.div>
              </CollapsibleContent>
            </Collapsible>
          )}

          {/* Footer message */}
          <div className="pt-2 border-t border-border/50">
            <p className="text-xs text-muted-foreground text-center italic">
              {isRental 
                ? "Renting is a big commitment — take time to understand the terms."
                : "Take your time — there's no rush to ask everything at once."
              }
            </p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
