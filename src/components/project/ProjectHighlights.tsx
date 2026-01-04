import { 
  Building, Shield, Sparkles, Leaf, Car, Dumbbell, 
  Baby, Dog, Waves, Sun, Lock, Wifi, TrendingUp
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Project, Developer } from '@/types/projects';

interface ProjectHighlightsProps {
  project: Project & { construction_progress_percent?: number };
}

const amenityIcons: Record<string, typeof Building> = {
  'gym': Dumbbell,
  'fitness': Dumbbell,
  'pool': Waves,
  'swimming': Waves,
  'parking': Car,
  'garden': Leaf,
  'playground': Baby,
  'pet': Dog,
  'security': Lock,
  'guard': Shield,
  'smart': Wifi,
  'rooftop': Sun,
  'lobby': Sparkles,
};

function getAmenityIcon(amenity: string) {
  const lowerAmenity = amenity.toLowerCase();
  for (const [key, Icon] of Object.entries(amenityIcons)) {
    if (lowerAmenity.includes(key)) return Icon;
  }
  return Sparkles;
}

export function ProjectHighlights({ project }: ProjectHighlightsProps) {
  const progress = project.construction_progress_percent || 0;
  
  // Get top amenities as highlights
  const topAmenities = project.amenities?.slice(0, 6) || [];

  const getProgressLabel = (progress: number) => {
    if (progress >= 100) return 'Completed';
    if (progress >= 75) return 'Finishing Phase';
    if (progress >= 50) return 'Structure Complete';
    if (progress >= 25) return 'Foundation & Structure';
    if (progress >= 10) return 'Foundation Work';
    return 'Planning & Permits';
  };

  const getProgressColor = (progress: number) => {
    if (progress >= 100) return 'bg-green-500';
    if (progress >= 50) return 'bg-primary';
    return 'bg-accent';
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          Project Highlights
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Construction Progress */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">Construction Progress</span>
            <Badge variant="secondary" className="font-semibold">
              {progress}% Complete
            </Badge>
          </div>
          <Progress 
            value={progress} 
            className="h-2.5"
          />
          <p className="text-xs text-muted-foreground">
            Current Stage: {getProgressLabel(progress)}
          </p>
        </div>

        {/* Developer Track Record */}
        {project.developer && (
          <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg border border-border/50">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Building className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium">{project.developer.name}</p>
              <p className="text-xs text-muted-foreground">
                {project.developer.total_projects || 0} projects completed
                {project.developer.founded_year && ` • Since ${project.developer.founded_year}`}
              </p>
            </div>
            {project.developer.is_verified && (
              <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                Verified
              </Badge>
            )}
          </div>
        )}

        {/* Key Selling Points / Amenities */}
        {topAmenities.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Key Features</h4>
            <div className="grid grid-cols-2 gap-2">
              {topAmenities.map((amenity, index) => {
                const Icon = getAmenityIcon(amenity);
                return (
                  <div 
                    key={index}
                    className="flex items-center gap-2 p-2 rounded-lg bg-muted/30"
                  >
                    <Icon className="h-4 w-4 text-primary shrink-0" />
                    <span className="text-sm truncate">{amenity}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Investment Potential */}
        <div className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg border border-border/50">
          <TrendingUp className="h-5 w-5 text-primary mt-0.5" />
          <div>
            <p className="text-sm font-medium">New Construction Advantage</p>
            <p className="text-xs text-muted-foreground mt-1">
              Buy at pre-completion prices with flexible payment schedules. 
              New builds typically appreciate 10-15% from pre-sale to delivery.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}