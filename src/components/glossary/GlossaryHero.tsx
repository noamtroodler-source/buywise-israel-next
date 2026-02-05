import { motion } from 'framer-motion';
import { Book, Search, GraduationCap } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface GlossaryHeroProps {
  termCount: number;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onOpenFlashcards: () => void;
}

export function GlossaryHero({ termCount, searchQuery, onSearchChange, onOpenFlashcards }: GlossaryHeroProps) {
  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent" />
      <div className="container relative py-10 md:py-14">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-2xl mx-auto"
        >
          <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <Book className="h-7 w-7 text-primary" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-3">
            Hebrew Real Estate Glossary
          </h1>
          <p className="text-muted-foreground text-lg mb-2">
            Master the terms you'll encounter — so you feel confident in every conversation.
          </p>
          <p className="text-sm text-muted-foreground mb-6">
            {termCount} terms • Organized by your buying journey
          </p>
          
          {/* Search Input */}
          <div className="relative max-w-md mx-auto mb-4">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search in Hebrew, English, or transliteration..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-12 h-12 text-base bg-background/80 backdrop-blur-sm border-border/50 focus:border-primary/50"
            />
          </div>

          {/* Study Mode Button */}
          <Button 
            onClick={onOpenFlashcards}
            variant="outline"
            className="gap-2 border-primary/30 hover:border-primary hover:bg-primary/5"
          >
            <GraduationCap className="h-4 w-4" />
            Study with Flashcards
          </Button>
        </motion.div>
      </div>
    </section>
  );
}
