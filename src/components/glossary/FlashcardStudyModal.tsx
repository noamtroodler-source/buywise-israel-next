import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ArrowLeft, ArrowRight, CheckCircle2, RotateCcw, Trophy, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { GlossaryTerm } from '@/hooks/useGlossary';
import { useFlashcardProgress } from '@/hooks/useFlashcardProgress';
import { Flashcard } from './Flashcard';
import { FlashcardProgress } from './FlashcardProgress';
import { FlashcardDeckSelector } from './FlashcardDeckSelector';
import { useIsMobile } from '@/hooks/use-mobile';
import confetti from 'canvas-confetti';

type StudyPhase = 'deck_selection' | 'studying' | 'complete';

interface FlashcardStudyModalProps {
  open: boolean;
  onClose: () => void;
  terms: GlossaryTerm[];
  savedTerms: Set<string>;
  getTermJourneyStage: (term: GlossaryTerm) => string;
}

export function FlashcardStudyModal({
  open,
  onClose,
  terms,
  savedTerms,
  getTermJourneyStage,
}: FlashcardStudyModalProps) {
  const isMobile = useIsMobile();
  const { masteredSet, markMastered, completeSession, isMastered } = useFlashcardProgress();
  
  const [phase, setPhase] = useState<StudyPhase>('deck_selection');
  const [deckTerms, setDeckTerms] = useState<GlossaryTerm[]>([]);
  const [originalDeckSize, setOriginalDeckSize] = useState(0);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [sessionMastered, setSessionMastered] = useState<Set<string>>(new Set());
  const [sessionLearning, setSessionLearning] = useState<Set<string>>(new Set());
  const [streak, setStreak] = useState(0);
  const [cardsReviewed, setCardsReviewed] = useState(0);

  // Reset state when modal opens
  useEffect(() => {
    if (open) {
      setPhase('deck_selection');
      setDeckTerms([]);
      setOriginalDeckSize(0);
      setCurrentIndex(0);
      setIsFlipped(false);
      setSessionMastered(new Set());
      setSessionLearning(new Set());
      setStreak(0);
      setCardsReviewed(0);
    }
  }, [open]);

  const handleSelectDeck = useCallback((deckKey: string) => {
    let selectedTerms: GlossaryTerm[] = [];

    if (deckKey === 'all') {
      selectedTerms = [...terms];
    } else if (deckKey === 'saved') {
      selectedTerms = terms.filter(t => savedTerms.has(t.id));
    } else if (deckKey === 'unmastered') {
      selectedTerms = terms.filter(t => !masteredSet.has(t.id));
    } else if (deckKey.startsWith('journey_')) {
      const stage = deckKey.replace('journey_', '');
      selectedTerms = terms.filter(t => getTermJourneyStage(t) === stage);
    } else if (deckKey.startsWith('category_')) {
      const category = deckKey.replace('category_', '');
      selectedTerms = terms.filter(t => (t.category || 'general') === category);
    }

    // Shuffle the terms
    const shuffled = [...selectedTerms].sort(() => Math.random() - 0.5);
    setDeckTerms(shuffled);
    setOriginalDeckSize(shuffled.length);
    setCurrentIndex(0);
    setCardsReviewed(0);
    setIsFlipped(false);
    setPhase('studying');
  }, [terms, savedTerms, masteredSet, getTermJourneyStage]);

  const currentTerm = useMemo(() => deckTerms[currentIndex], [deckTerms, currentIndex]);

  // Check if session is complete (when we've gone past the last card)
  useEffect(() => {
    if (phase === 'studying' && currentIndex >= deckTerms.length && deckTerms.length > 0) {
      completeSession();
      setPhase('complete');
      
      // Trigger confetti
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#3b82f6', '#60a5fa', '#93c5fd'],
      });
    }
  }, [phase, currentIndex, deckTerms.length, completeSession]);

  const handleGotIt = useCallback(() => {
    if (!currentTerm) return;
    
    markMastered(currentTerm.id);
    setSessionMastered(prev => new Set([...prev, currentTerm.id]));
    setStreak(prev => prev + 1);
    setCardsReviewed(prev => prev + 1);
    setIsFlipped(false);
    setCurrentIndex(prev => prev + 1);
  }, [currentTerm, markMastered]);

  const handleStillLearning = useCallback(() => {
    if (!currentTerm) return;

    setSessionLearning(prev => new Set([...prev, currentTerm.id]));
    setStreak(0);

    // Still Learning = go back one card (like a "left" action)
    setIsFlipped(false);
    setCurrentIndex(prev => Math.max(0, prev - 1));
  }, [currentTerm]);

  const handleExit = useCallback(() => {
    if (phase === 'studying' && currentIndex > 0) {
      // Could add confirmation dialog here
    }
    onClose();
  }, [phase, currentIndex, onClose]);

  // Keyboard navigation
  useEffect(() => {
    if (!open || phase !== 'studying') return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        setIsFlipped(prev => !prev);
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        handleStillLearning();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        handleGotIt();
      } else if (e.key === 'Escape') {
        handleExit();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, phase, handleStillLearning, handleGotIt, handleExit]);

  const handleStudyAgain = useCallback(() => {
    setPhase('deck_selection');
    setDeckTerms([]);
    setOriginalDeckSize(0);
    setCurrentIndex(0);
    setCardsReviewed(0);
    setIsFlipped(false);
    setSessionMastered(new Set());
    setSessionLearning(new Set());
    setStreak(0);
  }, []);

  if (!open) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm"
      >
        <div className={`h-full flex flex-col ${isMobile ? '' : 'max-w-lg mx-auto'}`}>
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-border">
            <h2 className="text-lg font-semibold text-foreground">
              {phase === 'deck_selection' && 'Choose a Deck'}
              {phase === 'studying' && 'Flashcard Study'}
              {phase === 'complete' && 'Session Complete!'}
            </h2>
            <Button variant="ghost" size="icon" onClick={handleExit}>
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4">
            <AnimatePresence mode="wait">
              {phase === 'deck_selection' && (
                <motion.div
                  key="deck_selection"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                >
                  <FlashcardDeckSelector
                    terms={terms}
                    savedTerms={savedTerms}
                    masteredTerms={masteredSet}
                    onSelectDeck={handleSelectDeck}
                    getTermJourneyStage={getTermJourneyStage}
                  />
                </motion.div>
              )}

              {phase === 'studying' && currentTerm && (
                <motion.div
                  key="studying"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="space-y-6"
                >
                  <FlashcardProgress
                    current={currentIndex + 1}
                    total={deckTerms.length}
                    originalTotal={originalDeckSize}
                    masteredInSession={sessionMastered.size}
                    stillLearningInSession={sessionLearning.size}
                    streak={streak}
                  />

                  <Flashcard
                    term={currentTerm}
                    isFlipped={isFlipped}
                    onFlip={() => setIsFlipped(prev => !prev)}
                  />
                </motion.div>
              )}

              {phase === 'complete' && (
                <motion.div
                  key="complete"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center py-8"
                >
                  <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
                    <Trophy className="h-10 w-10 text-primary" />
                  </div>
                  
                  <h3 className="text-2xl font-bold text-foreground mb-2">
                    Great work!
                  </h3>
                  
                  <p className="text-muted-foreground mb-8">
                    You completed {deckTerms.length} flashcards
                  </p>

                  <div className="grid grid-cols-2 gap-4 max-w-xs mx-auto mb-8">
                    <div className="bg-primary/10 rounded-xl p-4">
                      <CheckCircle2 className="h-6 w-6 text-primary mx-auto mb-2" />
                      <p className="text-2xl font-bold text-primary">{sessionMastered.size}</p>
                      <p className="text-sm text-muted-foreground">Mastered</p>
                    </div>
                    <div className="bg-muted rounded-xl p-4">
                      <RotateCcw className="h-6 w-6 text-muted-foreground mx-auto mb-2" />
                      <p className="text-2xl font-bold text-foreground">{sessionLearning.size}</p>
                      <p className="text-sm text-muted-foreground">To Review</p>
                    </div>
                  </div>

                  {sessionLearning.size > 0 && (
                    <p className="text-sm text-muted-foreground mb-6 flex items-center justify-center gap-1">
                      <Sparkles className="h-4 w-4" />
                      Keep practicing to master all terms!
                    </p>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Footer actions */}
          {phase === 'studying' && (
            <div className="p-4 border-t border-border">
              <div className="grid grid-cols-2 gap-3">
                <Button
                  variant="outline"
                  onClick={handleStillLearning}
                  className="gap-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Still Learning
                </Button>
                <Button
                  onClick={handleGotIt}
                  className="gap-2"
                >
                  Got It!
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
              {!isMobile && (
                <p className="text-xs text-muted-foreground text-center mt-3">
                  Space to flip • ← Still Learning • → Got It
                </p>
              )}
            </div>
          )}

          {phase === 'complete' && (
            <div className="p-4 border-t border-border">
              <div className="grid grid-cols-2 gap-3">
                <Button variant="outline" onClick={handleExit}>
                  Done
                </Button>
                <Button onClick={handleStudyAgain} className="gap-2">
                  <RotateCcw className="h-4 w-4" />
                  Study More
                </Button>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
