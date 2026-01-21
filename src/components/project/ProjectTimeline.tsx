import { Calendar, Check, Circle, ChevronDown, Wallet, Shield, Building } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Project } from '@/types/projects';

interface ProjectTimelineProps {
  project: Project & { construction_progress_percent?: number };
}

const stages = [
  { name: 'Planning', status: 'planning' },
  { name: 'Pre-Sale', status: 'pre_sale' },
  { name: 'Foundation', status: 'foundation' },
  { name: 'Structure', status: 'structure' },
  { name: 'Finishing', status: 'finishing' },
  { name: 'Delivery', status: 'delivery' },
];

export function ProjectTimeline({ project }: ProjectTimelineProps) {
  const progress = project.construction_progress_percent || 0;
  
  const getCurrentStageIndex = () => {
    return stages.findIndex(stage => stage.status === project.status);
  };

  const currentStageIndex = Math.max(0, getCurrentStageIndex());
  
  // Calculate visual progress based on stage index
  const stageProgress = ((currentStageIndex) / (stages.length - 1)) * 100;

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
              style={{ width: `${stageProgress}%` }}
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

        {/* Delay Transparency Note */}
        <p className="text-xs text-muted-foreground text-center pt-3">
          Most projects in Israel complete 6-12 months beyond initial estimates. 
          This is typical and accounted for in buyer protections.
        </p>

        {/* Key Dates for Buyers */}
        <Collapsible className="mt-4 pt-4 border-t">
          <CollapsibleTrigger className="flex items-center justify-between w-full text-sm group">
            <span className="font-medium">Key Dates for Buyers</span>
            <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform group-data-[state=open]:rotate-180" />
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-3 space-y-2.5">
            <div className="flex items-start gap-2.5 text-sm">
              <Wallet className="h-4 w-4 text-primary mt-0.5 shrink-0" />
              <div>
                <span className="font-medium">At Signing:</span>
                <span className="text-muted-foreground"> Initial deposit (typically 20-30%)</span>
              </div>
            </div>
            <div className="flex items-start gap-2.5 text-sm">
              <Shield className="h-4 w-4 text-primary mt-0.5 shrink-0" />
              <div>
                <span className="font-medium">Within 14 days:</span>
                <span className="text-muted-foreground"> Bank guarantee issued protecting your payments</span>
              </div>
            </div>
            <div className="flex items-start gap-2.5 text-sm">
              <Building className="h-4 w-4 text-primary mt-0.5 shrink-0" />
              <div>
                <span className="font-medium">At Delivery:</span>
                <span className="text-muted-foreground"> Final payment, mortgage funds released, VAT settled</span>
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </CardContent>
    </Card>
  );
}
