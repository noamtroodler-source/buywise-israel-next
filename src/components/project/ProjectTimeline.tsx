import { Calendar, Check, Circle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Project } from '@/types/projects';

interface ProjectTimelineProps {
  project: Project & { construction_progress_percent?: number };
}

const stages = [
  { name: 'Planning', threshold: 0 },
  { name: 'Pre-Sale', threshold: 10 },
  { name: 'Foundation', threshold: 25 },
  { name: 'Structure', threshold: 50 },
  { name: 'Finishing', threshold: 75 },
  { name: 'Delivery', threshold: 100 },
];

export function ProjectTimeline({ project }: ProjectTimelineProps) {
  const progress = project.construction_progress_percent || 0;
  
  const getCurrentStageIndex = () => {
    for (let i = stages.length - 1; i >= 0; i--) {
      if (progress >= stages[i].threshold) {
        return i;
      }
    }
    return 0;
  };

  const currentStageIndex = getCurrentStageIndex();

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'TBD';
    return new Date(dateString).toLocaleDateString('en-US', { 
      month: 'short', 
      year: 'numeric' 
    });
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-primary" />
          Construction Timeline
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Date Range Header */}
        <div className="flex justify-between items-center text-sm">
          <div>
            <span className="text-muted-foreground">Started: </span>
            <span className="font-medium">{formatDate(project.construction_start)}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Completion: </span>
            <span className="font-medium">{formatDate(project.completion_date)}</span>
          </div>
        </div>

        {/* Compact Horizontal Timeline */}
        <div className="relative">
          {/* Progress Line */}
          <div className="absolute top-4 left-4 right-4 h-0.5 bg-border">
            <div 
              className="absolute inset-y-0 left-0 bg-primary transition-all duration-500"
              style={{ width: `${Math.min(progress, 100)}%` }}
            />
          </div>
          
          {/* Stage Dots */}
          <div className="relative flex justify-between px-0">
            {stages.map((stage, index) => {
              const isCompleted = index < currentStageIndex;
              const isCurrent = index === currentStageIndex;
              
              return (
                <div key={index} className="flex flex-col items-center" style={{ width: '16.66%' }}>
                  <div className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center ${
                    isCompleted 
                      ? 'bg-primary text-primary-foreground' 
                      : isCurrent 
                        ? 'bg-primary text-primary-foreground ring-4 ring-primary/20' 
                        : 'bg-muted text-muted-foreground'
                  }`}>
                    {isCompleted ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <Circle className="h-3 w-3" fill={isCurrent ? 'currentColor' : 'none'} />
                    )}
                  </div>
                  <span className={`text-xs mt-2 text-center ${
                    isCurrent ? 'text-primary font-medium' : 'text-muted-foreground'
                  }`}>
                    {stage.name}
                  </span>
                  {isCurrent && (
                    <span className="text-[10px] text-primary mt-0.5">Current</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Progress Summary */}
        <div className="flex items-center justify-center pt-2">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-muted/50 rounded-full">
            <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <span className="text-sm font-medium">{progress}% Complete</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
