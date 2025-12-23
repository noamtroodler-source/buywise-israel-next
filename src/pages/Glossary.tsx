import { useState, useMemo } from 'react';
import { Search, Book, Filter, Star, StarOff, ChevronDown, Volume2, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useGlossary, useGlossarySearch, GlossaryTerm } from '@/hooks/useGlossary';
import { useAuth } from '@/hooks/useAuth';

const CATEGORY_LABELS: Record<string, { label: string; icon: string }> = {
  legal: { label: 'Legal', icon: '⚖️' },
  tax: { label: 'Tax & Finance', icon: '💰' },
  mortgage: { label: 'Mortgage', icon: '🏦' },
  property: { label: 'Property', icon: '🏠' },
  process: { label: 'Process', icon: '📋' },
  general: { label: 'General', icon: '📚' },
};

export default function Glossary() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [savedTerms, setSavedTerms] = useState<Set<string>>(() => {
    const saved = localStorage.getItem('savedGlossaryTerms');
    return saved ? new Set(JSON.parse(saved)) : new Set();
  });
  const [expandedTerms, setExpandedTerms] = useState<Set<string>>(new Set());

  const { user } = useAuth();
  const { data: allTerms, isLoading } = useGlossary();
  const { data: searchResults } = useGlossarySearch(searchQuery);

  // Use search results if searching, otherwise filter by category
  const displayTerms = useMemo(() => {
    if (searchQuery.length >= 2 && searchResults) {
      return searchResults;
    }
    
    if (!allTerms) return [];
    
    if (selectedCategory === 'all') {
      return allTerms;
    }
    
    if (selectedCategory === 'saved') {
      return allTerms.filter(term => savedTerms.has(term.id));
    }
    
    return allTerms.filter(term => term.category === selectedCategory);
  }, [allTerms, searchResults, searchQuery, selectedCategory, savedTerms]);

  // Group terms by category for "All" view
  const groupedTerms = useMemo(() => {
    if (selectedCategory !== 'all' || searchQuery.length >= 2) return null;
    
    return displayTerms.reduce((acc, term) => {
      const category = term.category || 'general';
      if (!acc[category]) acc[category] = [];
      acc[category].push(term);
      return acc;
    }, {} as Record<string, GlossaryTerm[]>);
  }, [displayTerms, selectedCategory, searchQuery]);

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

  const categories = ['all', 'saved', ...Object.keys(CATEGORY_LABELS)];

  return (
    <Layout>
      <div className="container py-8 max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Header */}
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold text-foreground flex items-center justify-center gap-3">
              <Book className="h-8 w-8 text-primary" />
              Hebrew Real Estate Glossary
            </h1>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Learn the essential Hebrew terms you'll encounter when buying property in Israel.
              Save terms to review later and hover over terms throughout the app for instant definitions.
            </p>
          </div>

          {/* Search */}
          <div className="relative max-w-md mx-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search terms in Hebrew, English, or transliteration..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Category Tabs */}
          <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="w-full">
            <TabsList className="flex flex-wrap justify-center gap-1 h-auto p-2 bg-muted/50">
              <TabsTrigger value="all" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                All Terms
              </TabsTrigger>
              <TabsTrigger value="saved" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <Star className="h-3 w-3 mr-1" />
                Saved ({savedTerms.size})
              </TabsTrigger>
              {Object.entries(CATEGORY_LABELS).map(([key, { label, icon }]) => (
                <TabsTrigger 
                  key={key} 
                  value={key}
                  className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                >
                  <span className="mr-1">{icon}</span>
                  {label}
                </TabsTrigger>
              ))}
            </TabsList>

            <div className="mt-6">
              {isLoading ? (
                <div className="text-center py-12">
                  <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
                  <p className="text-muted-foreground">Loading glossary...</p>
                </div>
              ) : displayTerms.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <Book className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="font-semibold text-lg mb-2">
                      {selectedCategory === 'saved' 
                        ? 'No saved terms yet' 
                        : 'No terms found'}
                    </h3>
                    <p className="text-muted-foreground">
                      {selectedCategory === 'saved'
                        ? 'Click the star icon on any term to save it for later.'
                        : 'Try a different search term or category.'}
                    </p>
                  </CardContent>
                </Card>
              ) : groupedTerms ? (
                // Grouped view for "All" category
                <div className="space-y-8">
                  {Object.entries(groupedTerms).map(([category, terms]) => (
                    <div key={category}>
                      <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <span>{CATEGORY_LABELS[category]?.icon || '📚'}</span>
                        {CATEGORY_LABELS[category]?.label || category}
                        <Badge variant="secondary" className="ml-2">{terms.length}</Badge>
                      </h2>
                      <div className="space-y-3">
                        {terms.map((term) => (
                          <GlossaryTermCard
                            key={term.id}
                            term={term}
                            isSaved={savedTerms.has(term.id)}
                            isExpanded={expandedTerms.has(term.id)}
                            onToggleSave={() => toggleSavedTerm(term.id)}
                            onToggleExpand={() => toggleExpanded(term.id)}
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                // Flat list for filtered view
                <div className="space-y-3">
                  {displayTerms.map((term) => (
                    <GlossaryTermCard
                      key={term.id}
                      term={term}
                      isSaved={savedTerms.has(term.id)}
                      isExpanded={expandedTerms.has(term.id)}
                      onToggleSave={() => toggleSavedTerm(term.id)}
                      onToggleExpand={() => toggleExpanded(term.id)}
                    />
                  ))}
                </div>
              )}
            </div>
          </Tabs>
        </motion.div>
      </div>
    </Layout>
  );
}

interface GlossaryTermCardProps {
  term: GlossaryTerm;
  isSaved: boolean;
  isExpanded: boolean;
  onToggleSave: () => void;
  onToggleExpand: () => void;
}

function GlossaryTermCard({ term, isSaved, isExpanded, onToggleSave, onToggleExpand }: GlossaryTermCardProps) {
  return (
    <Card className="overflow-hidden">
      <Collapsible open={isExpanded} onOpenChange={onToggleExpand}>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-muted/30 transition-colors py-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 flex-wrap">
                  <h3 className="text-xl font-bold text-primary" dir="rtl">
                    {term.hebrew_term}
                  </h3>
                  {term.transliteration && (
                    <span className="text-muted-foreground italic">
                      ({term.transliteration})
                    </span>
                  )}
                </div>
                <p className="text-lg font-medium text-foreground mt-1">
                  {term.english_term}
                </p>
                {term.simple_explanation && (
                  <p className="text-sm text-muted-foreground mt-2">
                    {term.simple_explanation}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleSave();
                  }}
                  className={isSaved ? 'text-yellow-500' : 'text-muted-foreground'}
                >
                  {isSaved ? <Star className="h-5 w-5 fill-current" /> : <StarOff className="h-5 w-5" />}
                </Button>
                <ChevronDown className={`h-5 w-5 text-muted-foreground transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
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
              <CardContent className="pt-0 pb-4 space-y-4">
                {term.detailed_explanation && (
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-1">Detailed Explanation</h4>
                    <p className="text-sm">{term.detailed_explanation}</p>
                  </div>
                )}

                {term.usage_context && (
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-1">When You'll See This</h4>
                    <p className="text-sm">{term.usage_context}</p>
                  </div>
                )}

                {term.pro_tip && (
                  <div className="p-3 bg-primary/5 border border-primary/20 rounded-lg">
                    <h4 className="text-sm font-medium text-primary mb-1">💡 Pro Tip</h4>
                    <p className="text-sm">{term.pro_tip}</p>
                  </div>
                )}

                {term.category && (
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">
                      {CATEGORY_LABELS[term.category]?.icon} {CATEGORY_LABELS[term.category]?.label || term.category}
                    </Badge>
                  </div>
                )}
              </CardContent>
            </motion.div>
          </AnimatePresence>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
