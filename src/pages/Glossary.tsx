import { useState, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Book } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { SEOHead } from '@/components/seo/SEOHead';
import { Card, CardContent } from '@/components/ui/card';
import { GuestSignupNudge } from '@/components/shared/GuestSignupNudge';
import { SupportFooter } from '@/components/shared/SupportFooter';
import { 
  GlossaryHero, 
  journeyStages,
  CategoryNav, 
  CATEGORY_CONFIG,
  GlossaryTermCard,
  GlossaryCarousel,
  FlashcardStudyModal,
} from '@/components/glossary';
import { useGlossary, useGlossarySearch, GlossaryTerm } from '@/hooks/useGlossary';
import { useIsMobile } from '@/hooks/use-mobile';

// Map terms to journey stages based on category and usage context
function getTermJourneyStage(term: GlossaryTerm): string {
  const category = term.category || 'general';
  const context = (term.usage_context || '').toLowerCase();
  const englishTerm = (term.english_term || '').toLowerCase();
  
  const beforeStartKeywords = ['tabu', 'registry', 'ownership', 'basic', 'start', 'general', 'property type'];
  const duringResearchKeywords = ['listing', 'viewing', 'search', 'room', 'floor', 'size', 'sqm', 'arnona', 'area'];
  const makingOfferKeywords = ['contract', 'offer', 'negotiat', 'lawyer', 'sign', 'agreement', 'warning', 'caveat'];
  const closingKeywords = ['closing', 'registration', 'after', 'payment', 'transfer', 'final'];
  
  const searchText = `${context} ${englishTerm}`;
  
  if (beforeStartKeywords.some(k => searchText.includes(k)) || category === 'general') {
    return 'before_start';
  }
  
  if (category === 'tax' || closingKeywords.some(k => searchText.includes(k))) {
    return 'closing_after';
  }
  
  if (makingOfferKeywords.some(k => searchText.includes(k)) || category === 'process') {
    return 'making_offer';
  }
  
  if (duringResearchKeywords.some(k => searchText.includes(k)) || category === 'property') {
    return 'during_research';
  }
  
  if (category === 'mortgage') {
    if (context.includes('choos') || context.includes('select') || context.includes('buying')) {
      return 'during_research';
    }
    return 'closing_after';
  }
  
  if (category === 'legal') {
    if (searchText.includes('registry') || searchText.includes('ownership') || searchText.includes('tabu')) {
      return 'before_start';
    }
    return 'making_offer';
  }
  
  return 'during_research';
}

export default function Glossary() {
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [savedTerms, setSavedTerms] = useState<Set<string>>(() => {
    const saved = localStorage.getItem('savedGlossaryTerms');
    return saved ? new Set(JSON.parse(saved)) : new Set();
  });
  const [expandedTerms, setExpandedTerms] = useState<Set<string>>(new Set());
  const [flashcardsOpen, setFlashcardsOpen] = useState(false);

  const isMobile = useIsMobile();
  const { data: allTerms, isLoading } = useGlossary();
  const { data: searchResults } = useGlossarySearch(debouncedSearch);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Get unique categories from terms
  const categories = useMemo(() => {
    if (!allTerms) return [];
    const cats = new Set(allTerms.map(t => t.category).filter(Boolean) as string[]);
    return Array.from(cats).sort();
  }, [allTerms]);

  // Filter terms based on search and category
  const displayTerms = useMemo(() => {
    if (debouncedSearch.length >= 2 && searchResults) {
      return searchResults;
    }
    
    if (!allTerms) return [];
    
    let filtered = allTerms;
    
    if (selectedCategory === 'saved') {
      filtered = filtered.filter(term => savedTerms.has(term.id));
    } else if (selectedCategory !== 'all') {
      filtered = filtered.filter(term => term.category === selectedCategory);
    }
    
    return filtered;
  }, [allTerms, searchResults, debouncedSearch, selectedCategory, savedTerms]);

  // Group terms by journey stage for organized display
  const groupedByJourney = useMemo(() => {
    if (debouncedSearch.length >= 2 || selectedCategory !== 'all') {
      return null; // Don't group when filtering
    }
    
    const groups: Record<string, GlossaryTerm[]> = {};
    journeyStages.forEach(stage => {
      groups[stage.key] = [];
    });
    
    displayTerms.forEach(term => {
      const stage = getTermJourneyStage(term);
      if (groups[stage]) {
        groups[stage].push(term);
      }
    });
    
    return groups;
  }, [displayTerms, debouncedSearch, selectedCategory]);

  const toggleSavedTerm = (termId: string) => {
    setSavedTerms(prev => {
      const newSet = new Set(prev);
      if (newSet.has(termId)) {
        newSet.delete(termId);
      } else {
        newSet.add(termId);
      }
      localStorage.setItem('savedGlossaryTerms', JSON.stringify([...newSet]));
      return newSet;
    });
  };

  const toggleExpanded = (termId: string) => {
    setExpandedTerms(prev => {
      const newSet = new Set(prev);
      if (newSet.has(termId)) {
        newSet.delete(termId);
      } else {
        newSet.add(termId);
      }
      return newSet;
    });
  };

  return (
    <Layout>
      <SEOHead
        title="Hebrew Real Estate Terms Glossary | BuyWise Israel"
        description="Master essential Hebrew real estate terms for buying property in Israel. Translations, definitions, and pro tips organized by your buying journey."
        canonicalUrl="https://buywiseisrael.com/glossary"
      />
      
      <div className="min-h-screen bg-background">
        {/* Hero Section */}
        <GlossaryHero 
          termCount={allTerms?.length || 0}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onOpenFlashcards={() => setFlashcardsOpen(true)}
          savedCount={savedTerms.size}
        />

        {/* Flashcard Study Modal */}
        <FlashcardStudyModal
          open={flashcardsOpen}
          onClose={() => setFlashcardsOpen(false)}
          terms={allTerms || []}
          savedTerms={savedTerms}
          getTermJourneyStage={getTermJourneyStage}
        />

        {/* Category Navigation */}
        <CategoryNav 
          categories={categories}
          selectedCategory={selectedCategory}
          onCategoryChange={setSelectedCategory}
          savedCount={savedTerms.size}
        />

        {/* Main Content */}
        <div className="container py-8 space-y-8">
          {/* Guest Signup Nudge */}
          <GuestSignupNudge 
            message="Create a free account to save terms and build your personal vocabulary list."
            intent="save_glossary"
          />

          {isLoading ? (
            <div className="text-center py-16">
              <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
              <p className="text-muted-foreground">Loading glossary...</p>
            </div>
          ) : displayTerms.length === 0 ? (
            <Card>
              <CardContent className="py-16 text-center">
                <Book className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-semibold text-lg mb-2">
                  {selectedCategory === 'saved' 
                    ? 'No saved terms yet' 
                    : 'No terms found'}
                </h3>
                <p className="text-muted-foreground max-w-sm mx-auto">
                  {selectedCategory === 'saved'
                    ? 'Click the star icon on any term to save it for later review.'
                    : 'Try a different search term or category.'}
                </p>
              </CardContent>
            </Card>
          ) : groupedByJourney ? (
            // Grouped by journey stage (default view)
            <div className="space-y-10">
              {journeyStages.map((stage, stageIndex) => {
                const stageTerms = groupedByJourney[stage.key];
                if (!stageTerms || stageTerms.length === 0) return null;
                
                const Icon = stage.icon;
                
                return (
                  <motion.section
                    key={stage.key}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.05 * stageIndex }}
                    id={`stage-${stage.key}`}
                    className="scroll-mt-32"
                  >
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                        <Icon className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h2 className="text-lg font-semibold text-foreground">
                          {stage.label}
                        </h2>
                        <p className="text-sm text-muted-foreground">
                          {stage.description}
                        </p>
                      </div>
                    </div>
                    
                    {/* Mobile: Carousel, Desktop: Grid */}
                    {isMobile ? (
                      <GlossaryCarousel 
                        terms={stageTerms}
                        savedTerms={savedTerms}
                        expandedTerms={expandedTerms}
                        onToggleSave={toggleSavedTerm}
                        onToggleExpand={toggleExpanded}
                      />
                    ) : (
                      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {stageTerms.map((term, index) => (
                          <GlossaryTermCard
                            key={term.id}
                            term={term}
                            isSaved={savedTerms.has(term.id)}
                            isExpanded={expandedTerms.has(term.id)}
                            onToggleSave={() => toggleSavedTerm(term.id)}
                            onToggleExpand={() => toggleExpanded(term.id)}
                            index={stageIndex * 3 + index}
                          />
                        ))}
                      </div>
                    )}
                  </motion.section>
                );
              })}
            </div>
          ) : (
            // Flat list for filtered view
            <>
              {debouncedSearch.length >= 2 && (
                <p className="text-sm text-muted-foreground mb-4">
                  Showing {displayTerms.length} result{displayTerms.length !== 1 ? 's' : ''} for "{debouncedSearch}"
                </p>
              )}
              {isMobile ? (
                <GlossaryCarousel 
                  terms={displayTerms}
                  savedTerms={savedTerms}
                  expandedTerms={expandedTerms}
                  onToggleSave={toggleSavedTerm}
                  onToggleExpand={toggleExpanded}
                />
              ) : (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {displayTerms.map((term, index) => (
                    <GlossaryTermCard
                      key={term.id}
                      term={term}
                      isSaved={savedTerms.has(term.id)}
                      isExpanded={expandedTerms.has(term.id)}
                      onToggleSave={() => toggleSavedTerm(term.id)}
                      onToggleExpand={() => toggleExpanded(term.id)}
                      index={index}
                    />
                  ))}
                </div>
              )}
            </>
          )}

          {/* Support Footer */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="max-w-xl mx-auto mt-12"
          >
            <SupportFooter 
              message="Still confused about a term? [Ask us] — we'll explain it in plain English."
              linkText="Ask us"
              variant="card"
            />
          </motion.div>
        </div>
      </div>
    </Layout>
  );
}
