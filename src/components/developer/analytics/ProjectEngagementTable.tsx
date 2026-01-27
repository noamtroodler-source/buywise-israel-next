import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2, Eye, Heart, MousePointerClick } from 'lucide-react';

interface ProjectEngagement {
  projectId: string;
  name: string;
  city: string;
  image: string | null;
  views: number;
  saves: number;
  clicks: number;
}

interface ProjectEngagementTableProps {
  data: ProjectEngagement[];
}

export function ProjectEngagementTable({ data }: ProjectEngagementTableProps) {
  if (data.length === 0) {
    return (
      <Card className="rounded-2xl border-primary/10">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Project Engagement</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground py-8">
            No project data yet
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="rounded-2xl border-primary/10">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Project Engagement</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {/* Header */}
        <div className="hidden sm:grid grid-cols-[1fr_80px_80px_80px] gap-2 px-4 py-2 border-b border-border/50 text-xs text-muted-foreground font-medium">
          <span>Project</span>
          <span className="text-center flex items-center justify-center gap-1">
            <Eye className="h-3 w-3" /> Views
          </span>
          <span className="text-center flex items-center justify-center gap-1">
            <Heart className="h-3 w-3" /> Saves
          </span>
          <span className="text-center flex items-center justify-center gap-1">
            <MousePointerClick className="h-3 w-3" /> Clicks
          </span>
        </div>

        {/* Rows */}
        <div className="divide-y divide-border/50">
          {data.map((project) => (
            <Link
              key={project.projectId}
              to={`/projects/${project.projectId}`}
              className="grid grid-cols-[1fr_60px_60px_60px] sm:grid-cols-[1fr_80px_80px_80px] gap-2 px-4 py-3 hover:bg-muted/30 transition-colors items-center"
            >
              {/* Project Info */}
              <div className="flex items-center gap-3 min-w-0">
                {project.image ? (
                  <img
                    src={project.image}
                    alt={project.name}
                    className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                  </div>
                )}
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{project.name}</p>
                  <p className="text-xs text-muted-foreground">{project.city}</p>
                </div>
              </div>

              {/* Stats */}
              <div className="text-center">
                <span className="text-sm font-medium">{project.views}</span>
                <span className="sm:hidden text-xs text-muted-foreground block">views</span>
              </div>
              <div className="text-center">
                <span className="text-sm font-medium">{project.saves}</span>
                <span className="sm:hidden text-xs text-muted-foreground block">saves</span>
              </div>
              <div className="text-center">
                <span className="text-sm font-medium text-primary">{project.clicks}</span>
                <span className="sm:hidden text-xs text-muted-foreground block">clicks</span>
              </div>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
