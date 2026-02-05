import { motion } from 'framer-motion';
import { Search, GraduationCap, Star, CheckCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface GlossaryHeroProps {
  termCount: number;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onOpenFlashcards: () => void;
  savedCount: number;
}

export function GlossaryHero({ 
  termCount, 
  searchQuery, 
  onSearchChange, 
  onOpenFlashcards,
  savedCount 
}: GlossaryHeroProps) {
  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent" />
      <div className="container relative py-8 md:py-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-2xl mx-auto"
        >
          <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
            Hebrew Real Estate Glossary
          </h1>
          <p className="text-muted-foreground mb-5">
            Master the terms you'll encounter — so you feel confident in every conversation.
          </p>
          
          {/* Search + Study Button Inline */}
          <div className="flex items-center gap-2 max-w-lg mx-auto mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search Hebrew, English, or transliteration..."
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className="pl-10 h-10 text-sm bg-background/80 backdrop-blur-sm border-border/50 focus:border-primary/50"
              />
            </div>
            <Button 
              onClick={onOpenFlashcards}
              variant="outline"
              size="sm"
              className="gap-1.5 border-primary/30 hover:border-primary hover:bg-primary/5 whitespace-nowrap h-10 px-4"
            >
              <GraduationCap className="h-4 w-4" />
              <span className="hidden sm:inline">Study</span>
            </Button>
          </div>

          {/* Compact Stats */}
          <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
            <span>{termCount} terms</span>
            {savedCount > 0 && (
              <span className="flex items-center gap-1">
                <Star className="h-3.5 w-3.5 text-primary fill-primary" />
                {savedCount} saved
              </span>
            )}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
