import { motion } from 'framer-motion';
import { TrendingUp, Train, Users, MapPin, Building2, BarChart3 } from 'lucide-react';

interface CityOpenerProps {
  cityName: string;
  identitySentence: string;
  hasTrainStation?: boolean;
  angloPresence?: string;
  yoyPriceChange?: number;
}

export function CityOpener({ 
  cityName, 
  identitySentence,
  hasTrainStation,
  angloPresence,
  yoyPriceChange
}: CityOpenerProps) {
  // Generate dynamic pain point cards based on city data
  const getContextCards = () => {
    const cards = [];

    // Card 1: Market position
    const marketContext = yoyPriceChange 
      ? yoyPriceChange > 0 
        ? `prices grew ${yoyPriceChange.toFixed(1)}% last year`
        : `prices adjusted ${Math.abs(yoyPriceChange).toFixed(1)}% last year`
      : 'market trends and pricing';
    
    cards.push({
      icon: TrendingUp,
      title: 'Market Position',
      description: `Understanding ${cityName}'s ${marketContext} and how it compares to the national average.`
    });

    // Card 2: Connectivity or commute
    if (hasTrainStation) {
      cards.push({
        icon: Train,
        title: 'Connectivity',
        description: `How ${cityName}'s train connectivity affects property values and daily commute options.`
      });
    } else {
      cards.push({
        icon: Building2,
        title: 'Location Dynamics',
        description: `Understanding ${cityName}'s position in the broader market and commute considerations.`
      });
    }

    // Card 3: Community
    const angloContext = angloPresence === 'High' 
      ? 'a strong English-speaking'
      : angloPresence === 'Medium'
        ? 'a growing English-speaking'
        : 'the local';
    
    cards.push({
      icon: Users,
      title: 'Community & Lifestyle',
      description: `What ${angloContext} community and ${cityName}'s character mean for your experience.`
    });

    return cards;
  };

  const contextCards = getContextCards();

  return (
    <section id="overview" className="py-12 bg-background">
      <div className="container">
        {/* Three Context Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8"
        >
          {contextCards.map((card, index) => (
            <motion.div
              key={card.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 + index * 0.05 }}
              className="p-5 rounded-xl bg-muted/50 border border-border/50"
            >
              <card.icon className="h-5 w-5 text-primary mb-3" />
              <h3 className="font-semibold text-foreground mb-2">{card.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {card.description}
              </p>
            </motion.div>
          ))}
        </motion.div>

        {/* Gradient CTA Box */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="p-8 rounded-2xl bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/10"
        >
          <div className="max-w-3xl mx-auto text-center">
            <p className="text-lg sm:text-xl font-medium text-foreground mb-4 leading-relaxed">
              {identitySentence}
            </p>
            <p className="text-muted-foreground mb-4">
              This guide covers market data, price trends, what to watch, and how to explore listings — 
              so you can understand {cityName} before making decisions.
            </p>
            <p className="text-sm font-medium text-primary">
              Use this page to build context and confidence.
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
