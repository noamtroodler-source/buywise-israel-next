import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, ChevronDown, ChevronUp, Copy, Check, HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { usePropertyQuestions, PropertyContext } from '@/hooks/usePropertyQuestions';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface PropertyQuestionsToAskProps {
  context: PropertyContext;
  className?: string;
}

export function PropertyQuestionsToAsk({ context, className }: PropertyQuestionsToAskProps) {
  const { questions, isLoading } = usePropertyQuestions(context);
  const [isExpanded, setIsExpanded] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Show first 3 questions, rest on expand
  const visibleQuestions = isExpanded ? questions : questions.slice(0, 3);
  const hasMoreQuestions = questions.length > 3;

  const handleCopyAll = () => {
    const allQuestions = questions
      .map((q, i) => `${i + 1}. ${q.question_text}`)
      .join('\n');
    
    navigator.clipboard.writeText(allQuestions);
    toast.success('Questions copied to clipboard');
  };

  const handleCopyQuestion = (questionId: string, questionText: string) => {
    navigator.clipboard.writeText(questionText);
    setCopiedId(questionId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Don't render if no questions
  if (!isLoading && questions.length === 0) {
    return null;
  }

  if (isLoading) {
    return (
      <Card className={cn("border-primary/10", className)}>
        <CardContent className="p-5">
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-muted rounded w-3/4" />
            <div className="h-3 bg-muted rounded w-1/2" />
          </div>
        </CardContent>
      </Card>
    );
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
                <CardTitle className="text-lg">Questions to Ask</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Before speaking with the agent, consider asking:
                </p>
              </div>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-xs"
              onClick={handleCopyAll}
            >
              <Copy className="h-3.5 w-3.5 mr-1" />
              Copy all
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="pt-0 space-y-4">
          <div className="space-y-3">
            <AnimatePresence mode="sync">
              {visibleQuestions.map((question, index) => (
                <motion.div
                  key={question.id}
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
                      <p className="text-sm font-medium text-foreground leading-relaxed">
                        "{question.question_text}"
                      </p>
                      <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                        <HelpCircle className="h-3 w-3 inline-block" />
                        {question.why_it_matters}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => handleCopyQuestion(question.id, question.question_text)}
                    >
                      {copiedId === question.id ? (
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

          {hasMoreQuestions && (
            <Button 
              variant="ghost" 
              className="w-full text-sm"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? (
                <>
                  Show less
                  <ChevronUp className="h-4 w-4 ml-1" />
                </>
              ) : (
                <>
                  Show {questions.length - 3} more questions
                  <ChevronDown className="h-4 w-4 ml-1" />
                </>
              )}
            </Button>
          )}

          {/* Warm, non-pushy message */}
          <div className="pt-2 border-t border-border/50">
            <p className="text-xs text-muted-foreground text-center italic">
              Take your time — there's no rush to ask everything at once.
            </p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
