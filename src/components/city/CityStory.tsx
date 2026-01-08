import { motion } from 'framer-motion';
import { MapPin, Building2, Users, Train, Palmtree, GraduationCap, Heart, Briefcase } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface CityStoryProps {
  cityName: string;
  description: string | null;
  highlights: string[] | null;
  angloPresence?: string | null;
  hasTrainStation?: boolean | null;
  commuteTimeTelAviv?: number | null;
}

// Map keywords to icons
const getIconForHighlight = (highlight: string) => {
  const lowerHighlight = highlight.toLowerCase();
  if (lowerHighlight.includes('beach') || lowerHighlight.includes('coast') || lowerHighlight.includes('sea') || lowerHighlight.includes('mediterranean')) return Palmtree;
  if (lowerHighlight.includes('tech') || lowerHighlight.includes('startup') || lowerHighlight.includes('business') || lowerHighlight.includes('hub')) return Building2;
  if (lowerHighlight.includes('family') || lowerHighlight.includes('community')) return Users;
  if (lowerHighlight.includes('school') || lowerHighlight.includes('education') || lowerHighlight.includes('university')) return GraduationCap;
  if (lowerHighlight.includes('transit') || lowerHighlight.includes('train') || lowerHighlight.includes('transport')) return Train;
  if (lowerHighlight.includes('religi') || lowerHighlight.includes('spiritual')) return Heart;
  if (lowerHighlight.includes('work') || lowerHighlight.includes('job') || lowerHighlight.includes('employ')) return Briefcase;
  return MapPin;
};

// Generate a narrative description based on city characteristics
const generateNarrative = (
  cityName: string,
  description: string | null,
  highlights: string[] | null,
  angloPresence: string | null,
  hasTrainStation: boolean | null
): string => {
  if (description) return description;
  
  const parts: string[] = [];
  
  if (highlights && highlights.length > 0) {
    const highlight = highlights[0].toLowerCase();
    if (highlight.includes('beach') || highlight.includes('coast')) {
      parts.push(`${cityName} offers Mediterranean coastal living`);
    } else if (highlight.includes('tech') || highlight.includes('startup')) {
      parts.push(`${cityName} is a hub for innovation and technology`);
    } else if (highlight.includes('family')) {
      parts.push(`${cityName} is known for its family-friendly atmosphere`);
    } else {
      parts.push(`${cityName} is one of Israel's distinctive communities`);
    }
  } else {
    parts.push(`${cityName} offers a unique living experience in Israel`);
  }
  
  if (angloPresence === 'strong') {
    parts.push('with a vibrant English-speaking community');
  } else if (angloPresence === 'moderate') {
    parts.push('with a growing English-speaking presence');
  }
  
  if (hasTrainStation) {
    parts.push('and excellent rail connectivity to major cities');
  }
  
  return parts.join(' ') + '.';
};

export function CityStory({ 
  cityName, 
  description,
  highlights, 
  angloPresence, 
  hasTrainStation,
  commuteTimeTelAviv 
}: CityStoryProps) {
  // Build highlight badges
  const badges: { icon: typeof MapPin; label: string }[] = [];

  // Add highlights (max 3)
  if (highlights && highlights.length > 0) {
    highlights.slice(0, 3).forEach((highlight) => {
      badges.push({
        icon: getIconForHighlight(highlight),
        label: highlight,
      });
    });
  }

  // Add Anglo presence if significant
  if (angloPresence && angloPresence !== 'minimal') {
    const labels: Record<string, string> = {
      'strong': 'Strong Anglo community',
      'moderate': 'Growing Anglo community',
      'emerging': 'Emerging Anglo presence',
    };
    badges.push({
      icon: Users,
      label: labels[angloPresence] || 'English speakers welcome',
    });
  }

  // Add train connectivity
  if (hasTrainStation) {
    badges.push({
      icon: Train,
      label: commuteTimeTelAviv ? `${commuteTimeTelAviv} min to Tel Aviv` : 'Train connected',
    });
  }

  const narrative = generateNarrative(cityName, description, highlights, angloPresence, hasTrainStation);

  return (
    <section className="py-14 bg-background">
      <div className="container max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-8"
        >
          {/* Section Title */}
          <h2 className="text-2xl sm:text-3xl font-semibold text-foreground">
            The {cityName} Story
          </h2>

          {/* Narrative Paragraph */}
          <p className="text-lg text-muted-foreground leading-relaxed">
            {narrative}
          </p>

          {/* Highlight Badges */}
          {badges.length > 0 && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="flex flex-wrap gap-3"
            >
              {badges.slice(0, 5).map((badge, index) => (
                <Badge 
                  key={badge.label} 
                  variant="secondary" 
                  className="px-4 py-2 text-sm font-normal bg-muted/60 hover:bg-muted border-0"
                >
                  <badge.icon className="h-4 w-4 mr-2 text-primary" />
                  {badge.label}
                </Badge>
              ))}
            </motion.div>
          )}
        </motion.div>
      </div>
    </section>
  );
}
