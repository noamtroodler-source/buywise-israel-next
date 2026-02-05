import { motion } from 'framer-motion';
import { BookOpen, Star, Compass, Search, FileCheck, Key } from 'lucide-react';
import { CATEGORY_CONFIG } from './CategoryNav';
import { journeyStages } from './JourneySelector';
import { GlossaryTerm } from '@/hooks/useGlossary';

interface DeckOption {
  key: string;
  label: string;
  description?: string;
  icon: React.ElementType;
  count: number;
  highlight?: boolean;
}

interface FlashcardDeckSelectorProps {
  terms: GlossaryTerm[];
  savedTerms: Set<string>;
  masteredTerms: Set<string>;
  onSelectDeck: (deckKey: string) => void;
  getTermJourneyStage: (term: GlossaryTerm) => string;
}

export function FlashcardDeckSelector({
  terms,
  savedTerms,
  masteredTerms,
  onSelectDeck,
  getTermJourneyStage,
}: FlashcardDeckSelectorProps) {
  // Calculate counts for each deck type
  const savedCount = terms.filter(t => savedTerms.has(t.id)).length;
  const unmasteredCount = terms.filter(t => !masteredTerms.has(t.id)).length;
  
  const journeyCounts = journeyStages.reduce((acc, stage) => {
    acc[stage.key] = terms.filter(t => getTermJourneyStage(t) === stage.key).length;
    return acc;
  }, {} as Record<string, number>);

  const categoryCounts = Object.keys(CATEGORY_CONFIG).reduce((acc, cat) => {
    acc[cat] = terms.filter(t => (t.category || 'general') === cat).length;
    return acc;
  }, {} as Record<string, number>);

  // Build deck options
  const primaryDecks: DeckOption[] = [
    {
      key: 'all',
      label: 'All Terms',
      description: 'Study the complete glossary',
      icon: BookOpen,
      count: terms.length,
    },
    {
      key: 'unmastered',
      label: 'Need Review',
      description: 'Terms you haven\'t mastered yet',
      icon: Search,
      count: unmasteredCount,
      highlight: unmasteredCount > 0,
    },
  ];

  if (savedCount > 0) {
    primaryDecks.push({
      key: 'saved',
      label: 'Saved Terms',
      description: 'Your bookmarked terms',
      icon: Star,
      count: savedCount,
    });
  }

  const journeyDecks: DeckOption[] = journeyStages.map(stage => ({
    key: `journey_${stage.key}`,
    label: stage.label,
    description: stage.description,
    icon: stage.icon,
    count: journeyCounts[stage.key] || 0,
  }));

  const categoryDecks: DeckOption[] = Object.entries(CATEGORY_CONFIG)
    .filter(([key]) => categoryCounts[key] > 0)
    .map(([key, config]) => ({
      key: `category_${key}`,
      label: config.label,
      icon: config.icon,
      count: categoryCounts[key] || 0,
    }));

  const renderDeckCard = (deck: DeckOption, index: number) => {
    const Icon = deck.icon;
    
    return (
      <motion.button
        key={deck.key}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.05 }}
        onClick={() => onSelectDeck(deck.key)}
        disabled={deck.count === 0}
        className={`p-4 rounded-xl border text-left transition-all group ${
          deck.count === 0
            ? 'opacity-50 cursor-not-allowed border-border bg-muted/30'
            : deck.highlight
            ? 'border-primary/50 bg-primary/5 hover:bg-primary/10 hover:border-primary'
            : 'border-border bg-card hover:border-primary/50 hover:bg-card/80'
        }`}
      >
        <div className="flex items-start gap-3">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
            deck.highlight ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary'
          }`}>
            <Icon className="h-5 w-5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <h3 className="font-medium text-foreground truncate">{deck.label}</h3>
              <span className={`text-sm font-medium px-2 py-0.5 rounded-full shrink-0 ${
                deck.highlight ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'
              }`}>
                {deck.count}
              </span>
            </div>
            {deck.description && (
              <p className="text-sm text-muted-foreground mt-0.5 truncate">
                {deck.description}
              </p>
            )}
          </div>
        </div>
      </motion.button>
    );
  };

  return (
    <div className="space-y-6">
      {/* Primary decks */}
      <div>
        <h3 className="text-sm font-medium text-muted-foreground mb-3">Quick Start</h3>
        <div className="grid gap-3">
          {primaryDecks.map((deck, i) => renderDeckCard(deck, i))}
        </div>
      </div>

      {/* Journey-based decks */}
      <div>
        <h3 className="text-sm font-medium text-muted-foreground mb-3">By Journey Stage</h3>
        <div className="grid gap-3">
          {journeyDecks.map((deck, i) => renderDeckCard(deck, primaryDecks.length + i))}
        </div>
      </div>

      {/* Category-based decks */}
      <div>
        <h3 className="text-sm font-medium text-muted-foreground mb-3">By Category</h3>
        <div className="grid grid-cols-2 gap-3">
          {categoryDecks.map((deck, i) => (
            <motion.button
              key={deck.key}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: (primaryDecks.length + journeyDecks.length + i) * 0.03 }}
              onClick={() => onSelectDeck(deck.key)}
              disabled={deck.count === 0}
              className={`p-3 rounded-lg border text-center transition-all ${
                deck.count === 0
                  ? 'opacity-50 cursor-not-allowed border-border bg-muted/30'
                  : 'border-border bg-card hover:border-primary/50 hover:bg-card/80'
              }`}
            >
              <deck.icon className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
              <p className="text-sm font-medium text-foreground">{deck.label}</p>
              <p className="text-xs text-muted-foreground">{deck.count} terms</p>
            </motion.button>
          ))}
        </div>
      </div>
    </div>
  );
}
