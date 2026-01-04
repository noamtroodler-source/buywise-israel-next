import { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Building, MapPin, Calendar, Loader2, Home, HelpCircle } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useProjects } from '@/hooks/useProjects';
import { ProjectFilters, ProjectFiltersType } from '@/components/filters/ProjectFilters';
import { CreateAlertDialog } from '@/components/filters/CreateAlertDialog';
import { useAuth } from '@/hooks/useAuth';

export default function Projects() {
  const { data: projects = [], isLoading } = useProjects();
  const [filters, setFilters] = useState<ProjectFiltersType>({});
  const [alertDialogOpen, setAlertDialogOpen] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'planning': return 'Planning';
      case 'pre_sale': return 'Pre-Sale';
      case 'under_construction': return 'Under Construction';
      case 'completed': return 'Completed';
      default: return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'planning': return 'bg-project/70 text-project-foreground';
      case 'pre_sale': return 'bg-project text-project-foreground';
      case 'under_construction': return 'bg-project text-project-foreground';
      case 'completed': return 'bg-muted text-muted-foreground';
      default: return 'bg-secondary text-secondary-foreground';
    }
  };

  const formatPrice = (price: number | null) => {
    if (!price) return 'N/A';
    return new Intl.NumberFormat('he-IL', {
      style: 'currency',
      currency: 'ILS',
      maximumFractionDigits: 0,
    }).format(price);
  };

  // Filter and sort projects
  const filteredProjects = useMemo(() => {
    let result = [...projects];

    // Apply city filter
    if (filters.city) {
      result = result.filter(p => p.city === filters.city);
    }

    // Apply status filter
    if (filters.status) {
      result = result.filter(p => p.status === filters.status);
    }

    // Apply price filters
    if (filters.min_price) {
      result = result.filter(p => p.price_from && p.price_from >= filters.min_price!);
    }
    if (filters.max_price) {
      result = result.filter(p => p.price_from && p.price_from <= filters.max_price!);
    }

    // Apply completion year filter
    if (filters.completion_year) {
      result = result.filter(p => {
        if (!p.completion_date) return false;
        return new Date(p.completion_date).getFullYear() === filters.completion_year;
      });
    }

    // Apply developer filter
    if (filters.developer_id) {
      result = result.filter(p => p.developer_id === filters.developer_id);
    }

    // Apply sorting
    switch (filters.sort_by) {
      case 'price_asc':
        result.sort((a, b) => (a.price_from || 0) - (b.price_from || 0));
        break;
      case 'price_desc':
        result.sort((a, b) => (b.price_from || 0) - (a.price_from || 0));
        break;
      case 'completion':
        result.sort((a, b) => {
          if (!a.completion_date) return 1;
          if (!b.completion_date) return -1;
          return new Date(a.completion_date).getTime() - new Date(b.completion_date).getTime();
        });
        break;
      case 'newest':
      default:
        // Already sorted by created_at from the query
        break;
    }

    return result;
  }, [projects, filters]);

  const handleCreateAlert = () => {
    if (!user) {
      navigate('/auth?redirect=/projects');
      return;
    }
    setAlertDialogOpen(true);
  };

  // Extract unit type ranges from project data (mock based on price range)
  const getUnitTypeLabel = (project: typeof projects[0]) => {
    // This is a simplified approach - in reality you'd fetch units data
    // For now, we'll estimate based on price ranges
    const priceFrom = project.price_from || 0;
    if (priceFrom < 2000000) return '2-3 Room';
    if (priceFrom < 3500000) return '3-4 Room';
    return '4-5 Room';
  };

  return (
    <Layout>
      {/* Page Header */}
      <div className="bg-gradient-to-b from-muted/60 to-background border-b border-border/50">
        <div className="container py-8 md:py-10 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">New Projects</h1>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Explore new development projects across Israel. Buy directly from developers with flexible payment plans.
            </p>
          </motion.div>
        </div>
      </div>

      <div className="container py-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >

          {/* New Construction Info Banner */}
          <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 flex items-start gap-3">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <HelpCircle className="h-5 w-5 text-primary mt-0.5" />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p>New construction purchases in Israel include bank guarantees, staged payment schedules, and developer warranties.</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <div className="flex-1">
              <p className="text-sm text-foreground font-medium">New to buying new construction in Israel?</p>
              <p className="text-sm text-muted-foreground">
                Learn about bank guarantees, payment schedules, and buyer protections.{' '}
                <Link to="/guides/new-construction" className="text-primary font-medium hover:underline">
                  Read the Guide →
                </Link>
              </p>
            </div>
          </div>

          {/* Filters */}
          <ProjectFilters filters={filters} onFiltersChange={setFilters} onCreateAlert={handleCreateAlert} />

          {/* Results Count */}
          {!isLoading && (
            <p className="text-sm text-muted-foreground">
              {filteredProjects.length} project{filteredProjects.length !== 1 ? 's' : ''} found
            </p>
          )}

          {/* Projects Grid */}
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filteredProjects.length === 0 ? (
            <div className="text-center py-12">
              <Building className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-foreground mb-2">No projects found</h2>
              <p className="text-muted-foreground">
                {projects.length > 0 
                  ? 'Try adjusting your filters to see more results.'
                  : 'New construction projects will be available soon.'
                }
              </p>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredProjects.map((project, index) => (
                <motion.div
                  key={project.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Link to={`/projects/${project.slug}`}>
                    <Card className="h-full overflow-hidden hover:shadow-card-hover transition-all duration-300 group">
                      <div className="aspect-[16/10] overflow-hidden relative">
                        <img
                          src={project.images?.[0] || 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800'}
                          alt={project.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute top-3 left-3 flex gap-2">
                          <Badge className={getStatusColor(project.status)}>
                            {getStatusLabel(project.status)}
                          </Badge>
                          {project.is_featured && (
                            <Badge className="bg-accent text-accent-foreground">Featured</Badge>
                          )}
                        </div>
                      </div>
                      <CardContent className="p-5 space-y-3">
                        <div className="space-y-1">
                          <h2 className="font-semibold text-lg text-foreground group-hover:text-primary transition-colors line-clamp-1">
                            {project.name}
                          </h2>
                          {project.developer && (
                            <p className="text-sm text-primary font-medium">
                              by {project.developer.name}
                            </p>
                          )}
                        </div>

                        <div className="flex items-center gap-1 text-muted-foreground text-sm">
                          <MapPin className="h-4 w-4 flex-shrink-0" />
                          <span className="line-clamp-1">
                            {project.neighborhood ? `${project.neighborhood}, ` : ''}{project.city}
                          </span>
                        </div>

                        {/* Unit Types & Completion */}
                        <div className="flex items-center gap-4 text-sm">
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <Home className="h-4 w-4" />
                            <span>{getUnitTypeLabel(project)} Units</span>
                          </div>
                          {project.completion_date && (
                            <div className="flex items-center gap-1 text-muted-foreground">
                              <Calendar className="h-4 w-4" />
                              <span>{new Date(project.completion_date).getFullYear()}</span>
                            </div>
                          )}
                        </div>

                        {/* Construction Progress Bar */}
                        {project.status === 'under_construction' && (project as any).construction_progress_percent > 0 && (
                          <div className="space-y-1.5">
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-muted-foreground">Construction Progress</span>
                              <span className="font-medium text-primary">{(project as any).construction_progress_percent}%</span>
                            </div>
                            <Progress value={(project as any).construction_progress_percent} className="h-1.5" />
                          </div>
                        )}

                        <div className="pt-3 border-t border-border">
                          <p className="text-xs text-muted-foreground">Starting from</p>
                          <p className="text-xl font-bold text-primary">
                            {formatPrice(project.price_from)}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Create Alert Dialog */}
        <CreateAlertDialog 
          open={alertDialogOpen} 
          onOpenChange={setAlertDialogOpen}
          filters={{
            city: filters.city,
            min_price: filters.min_price,
            max_price: filters.max_price,
          }}
          listingType="projects"
        />
      </div>
    </Layout>
  );
}
