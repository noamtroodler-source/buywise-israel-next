import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Train, Car, Clock, MapPin } from 'lucide-react';

interface CityTransportInfoProps {
  commuteTimeTelAviv: number | null;
  hasTrainStation: boolean | null;
  cityName: string;
}

export function CityTransportInfo({ commuteTimeTelAviv, hasTrainStation, cityName }: CityTransportInfoProps) {
  const isTelAviv = commuteTimeTelAviv === 0;
  
  const getCommuteDescription = () => {
    if (isTelAviv) return "You're in Tel Aviv!";
    if (!commuteTimeTelAviv) return 'Commute data unavailable';
    if (commuteTimeTelAviv <= 20) return 'Quick commute to Tel Aviv';
    if (commuteTimeTelAviv <= 45) return 'Reasonable commute to Tel Aviv';
    if (commuteTimeTelAviv <= 75) return 'Moderate commute to Tel Aviv';
    return 'Long commute to Tel Aviv';
  };
  
  const formatTime = (minutes: number) => {
    if (minutes >= 60) {
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
    }
    return `${minutes} min`;
  };

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Car className="h-4 w-4 text-primary" />
          Transport & Commute
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!isTelAviv && commuteTimeTelAviv && (
          <div className="bg-muted/50 rounded-lg p-4 text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">To Tel Aviv</span>
            </div>
            <p className="text-2xl font-bold text-foreground">{formatTime(commuteTimeTelAviv)}</p>
            <p className="text-xs text-muted-foreground mt-1">by car (avg. traffic)</p>
          </div>
        )}
        
        {isTelAviv && (
          <div className="bg-primary/10 rounded-lg p-4 text-center">
            <MapPin className="h-5 w-5 text-primary mx-auto mb-2" />
            <p className="font-medium text-foreground">You're in Tel Aviv!</p>
            <p className="text-sm text-muted-foreground">Israel's business hub</p>
          </div>
        )}
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Train className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Train Station</span>
          </div>
          <Badge variant={hasTrainStation ? 'default' : 'secondary'}>
            {hasTrainStation ? 'Available' : 'No Station'}
          </Badge>
        </div>
        
        <p className="text-sm text-muted-foreground border-t pt-3">
          {getCommuteDescription()}
        </p>
      </CardContent>
    </Card>
  );
}
