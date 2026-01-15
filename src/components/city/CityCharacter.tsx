import { motion } from 'framer-motion';
import { Sparkles, MapPin, Building2, Users, Train, Palmtree, GraduationCap, Heart } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface CityCharacterProps {
  cityName: string;
  highlights: string[] | null;
  angloPresence?: string | null;
  hasTrainStation?: boolean | null;
  commuteTimeTelAviv?: number | null;
}

// Map keywords to icons
const getIconForHighlight = (highlight: string) => {
  const lowerHighlight = highlight.toLowerCase();
  if (lowerHighlight.includes('beach') || lowerHighlight.includes('coast') || lowerHighlight.includes('sea')) return Palmtree;
  if (lowerHighlight.includes('tech') || lowerHighlight.includes('startup') || lowerHighlight.includes('business')) return Building2;
  if (lowerHighlight.includes('family') || lowerHighlight.includes('community')) return Users;
  if (lowerHighlight.includes('school') || lowerHighlight.includes('education')) return GraduationCap;
  if (lowerHighlight.includes('transit') || lowerHighlight.includes('train') || lowerHighlight.includes('transport')) return Train;
  if (lowerHighlight.includes('religi') || lowerHighlight.includes('spiritual')) return Heart;
  return MapPin;
};

export function CityCharacter({ 
  cityName, 
  highlights, 
  angloPresence, 
  hasTrainStation,
  commuteTimeTelAviv 
}: CityCharacterProps) {
  // Build character cards from highlights + additional data
  const characterCards = [];

  // Add highlights
  if (highlights && highlights.length > 0) {
    highlights.slice(0, 3).forEach((highlight) => {
      characterCards.push({
        icon: getIconForHighlight(highlight),
        title: highlight,
        description: null,
      });
    });
  }

  // Add Anglo presence if significant
  if (angloPresence && angloPresence !== 'Low') {
    const angloDescriptions: Record<string, string> = {
      'High': 'Large English-speaking community',
      'Medium': 'Growing English-speaking community',
    };
    characterCards.push({
      icon: Users,
      title: 'Anglo Community',
      description: angloDescriptions[angloPresence] || 'English speakers welcome',
    });
  }

  // Add train connectivity
  if (hasTrainStation) {
    characterCards.push({
      icon: Train,
      title: 'Train Connected',
      description: commuteTimeTelAviv ? `${commuteTimeTelAviv} min to Tel Aviv` : 'Direct rail access',
    });
  }

  // If we don't have enough cards, don't render
  if (characterCards.length < 2) return null;

  // Limit to 4 cards max
  const displayCards = characterCards.slice(0, 4);

  return (
    <section className="py-12 bg-background">
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-8"
        >
          {/* Section Header */}
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
            <h2 className="text-2xl font-semibold text-foreground">Why People Choose {cityName}</h2>
          </div>

          {/* Character Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {displayCards.map((card, index) => (
              <motion.div
                key={card.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="border-border/50 hover:shadow-md hover:border-primary/20 transition-all h-full group">
                  <CardContent className="p-5">
                    <div className="p-2.5 rounded-lg bg-primary/10 w-fit mb-4 group-hover:bg-primary/15 transition-colors">
                      <card.icon className="h-5 w-5 text-primary" />
                    </div>
                    <h3 className="font-semibold text-foreground mb-1">{card.title}</h3>
                    {card.description && (
                      <p className="text-sm text-muted-foreground">{card.description}</p>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
