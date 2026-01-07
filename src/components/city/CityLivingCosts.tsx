import { motion } from 'framer-motion';
import { Receipt, Clock, Users, Train } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface CityLivingCostsProps {
  arnonaRateSqm?: number | null;
  commuteTelAviv?: number | null;
  hasTrainStation?: boolean | null;
  angloPresence?: string | null;
  cityName: string;
}

export function CityLivingCosts({
  arnonaRateSqm,
  commuteTelAviv,
  hasTrainStation,
  angloPresence,
  cityName,
}: CityLivingCostsProps) {
  // Calculate monthly arnona for typical 80m² apartment
  const monthlyArnona = arnonaRateSqm ? Math.round(arnonaRateSqm * 80) : null;

  const formatCommute = (minutes: number | null | undefined) => {
    if (!minutes && minutes !== 0) return null;
    if (minutes === 0) return 'In Tel Aviv';
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  const getAngloLevel = (presence: string | null | undefined) => {
    if (!presence) return null;
    const lower = presence.toLowerCase();
    if (lower.includes('high') || lower.includes('very')) return 'High';
    if (lower.includes('medium') || lower.includes('moderate')) return 'Medium';
    if (lower.includes('low') || lower.includes('small')) return 'Low';
    return presence;
  };

  const cards = [
    {
      title: 'Arnona (Tax)',
      value: monthlyArnona ? `₪${monthlyArnona.toLocaleString()}` : null,
      subtitle: 'Monthly for 80m²',
      icon: Receipt,
      show: !!monthlyArnona,
    },
    {
      title: 'Commute to TLV',
      value: formatCommute(commuteTelAviv),
      subtitle: hasTrainStation ? 'Train available' : 'By car',
      icon: hasTrainStation ? Train : Clock,
      show: commuteTelAviv !== null && commuteTelAviv !== undefined,
    },
    {
      title: 'Anglo Community',
      value: getAngloLevel(angloPresence),
      subtitle: 'English presence',
      icon: Users,
      show: !!angloPresence,
    },
  ].filter(card => card.show);

  // Don't render if no data available
  if (cards.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="space-y-4"
    >
      <h2 className="text-xl font-semibold text-foreground">Living in {cityName}</h2>
      <div className={`grid gap-4 ${
        cards.length === 1 ? 'grid-cols-1 max-w-sm' : 
        cards.length === 2 ? 'grid-cols-1 sm:grid-cols-2' : 
        'grid-cols-1 sm:grid-cols-3'
      }`}>
        {cards.map((card, index) => {
          const Icon = card.icon;
          return (
            <Card key={index} className="border-border/50">
              <CardContent className="p-5">
                <div className="flex items-start gap-4">
                  <div className="p-2.5 rounded-lg bg-primary/10 text-primary shrink-0">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{card.title}</p>
                    <p className="text-2xl font-bold text-foreground">{card.value}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{card.subtitle}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </motion.div>
  );
}
