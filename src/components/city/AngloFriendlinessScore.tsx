import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Globe, Users, Building, Star } from 'lucide-react';

interface AngloFriendlinessScoreProps {
  angloPresence: string | null;
  socioeconomicRank: number | null;
  cityName: string;
}

export function AngloFriendlinessScore({ angloPresence, socioeconomicRank, cityName }: AngloFriendlinessScoreProps) {
  const presence = angloPresence || 'Medium';
  
  const getPresenceConfig = () => {
    switch (presence) {
      case 'High':
        return {
          stars: 5,
          color: 'bg-primary/10 text-primary border-primary/20',
          description: 'Strong Anglo community presence',
          services: 'Excellent English services',
        };
      case 'Medium':
        return {
          stars: 3,
          color: 'bg-amber-100 text-amber-700 border-amber-200',
          description: 'Growing Anglo community',
          services: 'Good English services',
        };
      default:
        return {
          stars: 1,
          color: 'bg-slate-100 text-slate-700 border-slate-200',
          description: 'Smaller Anglo community',
          services: 'Limited English services',
        };
    }
  };
  
  const config = getPresenceConfig();
  
  const getServicesLevel = () => {
    if (socioeconomicRank && socioeconomicRank >= 8) return 'High';
    if (socioeconomicRank && socioeconomicRank >= 6) return 'Medium';
    return 'Basic';
  };

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Globe className="h-4 w-4 text-primary" />
          Anglo Friendliness
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-center">
          <Badge variant="outline" className={`${config.color} text-sm px-3 py-1`}>
            {presence} Anglo Presence
          </Badge>
          <div className="flex justify-center gap-1 mt-3">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className={`h-4 w-4 ${
                  star <= config.stars 
                    ? 'fill-primary text-primary' 
                    : 'fill-muted text-muted'
                }`}
              />
            ))}
          </div>
        </div>
        
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">{config.description}</span>
          </div>
          <div className="flex items-center gap-2">
            <Building className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">{config.services}</span>
          </div>
        </div>
        
        <div className="bg-primary/5 rounded-lg p-3 text-sm">
          <p className="text-muted-foreground">
            {presence === 'High' 
              ? `${cityName} is popular with Olim and English speakers. Finding English-speaking professionals is easy.`
              : presence === 'Medium'
                ? `${cityName} has a growing English-speaking community. Some Hebrew will be helpful.`
                : `${cityName} has a smaller Anglo community. Hebrew proficiency recommended.`
            }
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
