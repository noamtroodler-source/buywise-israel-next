import { Calendar, CheckCircle, Circle, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Project } from '@/types/projects';

interface ProjectTimelineProps {
  project: Project & { construction_progress_percent?: number };
}

interface TimelineStage {
  name: string;
  description: string;
  progressThreshold: number;
}

const stages: TimelineStage[] = [
  { name: 'Planning & Permits', description: 'Approvals and architectural plans', progressThreshold: 0 },
  { name: 'Pre-Sale', description: 'Sales launch and early reservations', progressThreshold: 10 },
  { name: 'Foundation', description: 'Ground work and foundations', progressThreshold: 25 },
  { name: 'Structure', description: 'Building frame and floors', progressThreshold: 50 },
  { name: 'Finishing', description: 'Interior work and systems', progressThreshold: 75 },
  { name: 'Delivery', description: 'Final inspections and handover', progressThreshold: 100 },
];

export function ProjectTimeline({ project }: ProjectTimelineProps) {
  const progress = project.construction_progress_percent || 0;
  
  const getCurrentStageIndex = () => {
    for (let i = stages.length - 1; i >= 0; i--) {
      if (progress >= stages[i].progressThreshold) {
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
        {/* Date Range */}
        <div className="flex justify-between items-center p-3 bg-muted/30 rounded-lg">
          <div className="text-center">
            <p className="text-xs text-muted-foreground">Started</p>
            <p className="font-medium">{formatDate(project.construction_start)}</p>
          </div>
          <div className="flex-1 mx-4 h-0.5 bg-border relative">
            <div 
              className="absolute inset-y-0 left-0 bg-primary transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="text-center">
            <p className="text-xs text-muted-foreground">Completion</p>
            <p className="font-medium">{formatDate(project.completion_date)}</p>
          </div>
        </div>

        {/* Timeline Stages */}
        <div className="relative">
          {/* Vertical Line */}
          <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border" />
          
          {stages.map((stage, index) => {
            const isCompleted = index < currentStageIndex;
            const isCurrent = index === currentStageIndex;
            
            return (
              <div key={index} className="relative flex items-start gap-4 pb-4 last:pb-0">
                {/* Stage Indicator */}
                <div className={`relative z-10 flex items-center justify-center w-8 h-8 rounded-full ${
                  isCompleted 
                    ? 'bg-green-100 dark:bg-green-900' 
                    : isCurrent 
                      ? 'bg-primary text-primary-foreground' 
                      : 'bg-muted'
                }`}>
                  {isCompleted ? (
                    <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                  ) : isCurrent ? (
                    <Clock className="h-4 w-4 animate-pulse" />
                  ) : (
                    <Circle className="h-4 w-4 text-muted-foreground" />
                  )}
                </div>
                
                {/* Stage Content */}
                <div className={`flex-1 pb-2 ${!isCompleted && !isCurrent ? 'opacity-50' : ''}`}>
                  <div className="flex items-center gap-2">
                    <h4 className={`font-medium ${isCurrent ? 'text-primary' : ''}`}>
                      {stage.name}
                    </h4>
                    {isCurrent && (
                      <span className="px-2 py-0.5 text-xs rounded-full bg-primary/10 text-primary font-medium">
                        Current
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mt-0.5">{stage.description}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Progress Summary */}
        <div className="pt-2 border-t border-border">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Overall Progress</span>
            <span className="font-semibold text-primary">{progress}% Complete</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}