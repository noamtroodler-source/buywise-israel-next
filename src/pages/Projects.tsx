import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { Building, MapPin, Calendar, Loader2, Home, TrendingDown } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';

import { usePaginatedProjects } from '@/hooks/usePaginatedProjects';

import { ProjectFilters, ProjectFiltersType } from '@/components/filters/ProjectFilters';
import { CreateAlertDialog } from '@/components/filters/CreateAlertDialog';
import { useAuth } from '@/hooks/useAuth';
import { ListingsGrid } from '@/components/listings/ListingsGrid';
import { ProjectFavoriteButton } from '@/components/project/ProjectFavoriteButton';
import { ProjectShareButton } from '@/components/project/ProjectShareButton';
import { BackToTopButton } from '@/components/shared/BackToTopButton';
import { useSearchTracking } from '@/hooks/useSearchTracking';
import { useEventTracking } from '@/hooks/useEventTracking';
import { PropertyThumbnail } from '@/components/shared/PropertyThumbnail';

export default function Projects() {
  const [filters, setFilters] = useState<ProjectFiltersType>({});
  const [alertDialogOpen, setAlertDialogOpen] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  // Use paginated projects hook
  const { 
    projects, 
    totalCount, 
    isLoading, 
    isFetching, 
    hasNextPage, 
    loadMore 
  } = usePaginatedProjects(filters);

  // Search tracking
  const { trackSearchStart, trackSearch, trackSearchResultClick } = useSearchTracking();
  const { trackEvent, trackClick } = useEventTracking();
  const hasTrackedInitialSearch = useRef(false);

  // Track search start on mount
  useEffect(() => {
    if (!hasTrackedInitialSearch.current) {
      trackSearchStart();
      hasTrackedInitialSearch.current = true;
    }
  }, [trackSearchStart]);

  // Track search results when data changes
  useEffect(() => {
    if (!isLoading && projects) {
      trackSearch({
        listingType: 'projects',
        filters: {
          city: filters.city,
          min_price: filters.min_price,
          max_price: filters.max_price,
        },
        resultsCount: totalCount,
        resultsShown: projects.length,
        pageNumber: 1,
      });
    }
  }, [isLoading, projects, filters, totalCount, trackSearch]);

  const handleProjectClick = (projectId: string) => {
    trackSearchResultClick(projectId);
    trackClick('project_card', 'ProjectCard', { project_id: projectId });
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'planning': return 'Planning';
      case 'pre_sale': return 'Pre-Sale';
      case 'foundation': return 'Foundation';
      case 'structure': return 'Structure';
      case 'finishing': return 'Finishing';
      case 'delivery': return 'Delivery';
      default: return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'planning': return 'bg-primary/70 text-primary-foreground';
      case 'pre_sale': return 'bg-primary text-primary-foreground';
      case 'foundation': return 'bg-amber-500 text-white';
      case 'structure': return 'bg-orange-500 text-white';
      case 'finishing': return 'bg-yellow-500 text-white';
      case 'delivery': return 'bg-green-500 text-white';
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

  const handleCreateAlert = () => {
    if (!user) {
      navigate('/auth?redirect=/projects');
      return;
    }
    setAlertDialogOpen(true);
  };

  // Extract unit type ranges from project data (mock based on price range)
  const getUnitTypeLabel = (project: typeof projects[0]) => {
    const priceFrom = project.price_from || 0;
    if (priceFrom < 2000000) return '2-3 Room';
    if (priceFrom < 3500000) return '3-4 Room';
    return '4-5 Room';
  };

  // Check for price reduction
  const isPriceReduced = (project: typeof projects[0]) => {
    const originalPrice = (project as any).original_price_from;
    return originalPrice && project.price_from && project.price_from < originalPrice;
  };

  const getPriceDropPercent = (project: typeof projects[0]) => {
    const originalPrice = (project as any).original_price_from;
    if (!originalPrice || !project.price_from) return 0;
    return Math.round(((originalPrice - project.price_from) / originalPrice) * 100);
  };

  return (
    <Layout>
      {/* Page Header */}
      <div className="bg-gradient-to-b from-muted/60 to-background border-b border-border/50">
        <div className="container py-8 md:py-10 text-center">
          <div className="animate-fade-in">
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">New Development Projects in <span className="text-primary">Israel</span></h1>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              New development projects in Israel — with timelines, pricing, and what to expect.
            </p>
          </div>
        </div>
      </div>

      <div className="container py-6">
        <div className="space-y-6">

          {/* Filters */}
          <ProjectFilters filters={filters} onFiltersChange={setFilters} onCreateAlert={handleCreateAlert} />

          {/* Results Count */}
          {!isLoading && (
            <p className="text-sm text-muted-foreground">
              Showing {projects.length} of {totalCount} project{totalCount !== 1 ? 's' : ''}
            </p>
          )}

          {/* Projects Grid */}
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : projects.length === 0 ? (
            <div className="text-center py-12">
              <Building className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-foreground mb-2">No projects found</h2>
              <p className="text-muted-foreground">
                {totalCount > 0 
                  ? 'Try adjusting your filters to see more results.'
                  : 'New construction projects will be available soon.'
                }
              </p>
            </div>
          ) : (
            <>
              <ListingsGrid isFetching={isFetching && !isLoading}>
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {projects.map((project) => (
                    <div key={project.id} className="animate-fade-in">
                      <Link to={`/projects/${project.slug}`} onClick={() => handleProjectClick(project.id)}>
                        <Card className="h-full overflow-hidden border border-border/60 shadow-sm hover:shadow-card-hover hover:border-primary/30 transition-all duration-300 group">
                        <div className="aspect-[16/10] overflow-hidden relative">
                            <PropertyThumbnail
                              src={project.images?.[0]}
                              alt={project.name}
                              type="project"
                              className="w-full h-full group-hover:scale-105 transition-transform duration-300"
                            />
                            
                            {/* Badges - Top Left */}
                            <div className="absolute top-3 left-3 flex flex-wrap gap-1.5 z-10">
                              {isPriceReduced(project) && getPriceDropPercent(project) >= 2 && (
                                <Badge className="bg-green-600 text-white text-xs font-medium gap-1">
                                  <TrendingDown className="h-3 w-3" />
                                  -{getPriceDropPercent(project)}%
                                </Badge>
                              )}
                            </div>

                            {/* Action Buttons - Top Right */}
                            <div className="absolute top-3 right-3 flex items-center gap-1.5 z-10">
                              {/* Share - visible on hover */}
                              <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                <ProjectShareButton projectSlug={project.slug} projectName={project.name} />
                              </div>
                              {/* Favorite - always visible */}
                              <ProjectFavoriteButton projectId={project.id} />
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

                            {/* Project Status Progress Bar */}
                            <div className="space-y-1.5">
                              <div className="flex items-center justify-between text-xs">
                                <span className="text-muted-foreground">
                                  {project.status === 'planning' && 'Planning Phase'}
                                  {project.status === 'pre_sale' && 'Pre-Sale'}
                                  {project.status === 'foundation' && 'Foundation'}
                                  {project.status === 'structure' && 'Structure'}
                                  {project.status === 'finishing' && 'Finishing'}
                                  {project.status === 'delivery' && 'Ready for Move-In'}
                                </span>
                                <span className="font-medium text-primary">
                                  {project.status === 'planning' && 'Coming Soon'}
                                  {project.status === 'pre_sale' && 'Starting Soon'}
                                  {['foundation', 'structure', 'finishing'].includes(project.status) && `${(project as any).construction_progress_percent || 0}%`}
                                  {project.status === 'delivery' && '100%'}
                                </span>
                              </div>
                              <Progress 
                                value={
                                  project.status === 'delivery' ? 100 :
                                  ['foundation', 'structure', 'finishing'].includes(project.status) ? ((project as any).construction_progress_percent || 0) :
                                  0
                                } 
                                className="h-1.5" 
                              />
                            </div>

                            <div className="pt-3 border-t border-border">
                              <p className="text-xs text-muted-foreground">Starting from</p>
                              <p className="text-xl font-bold text-primary">
                                {formatPrice(project.price_from)}
                              </p>
                            </div>
                          </CardContent>
                        </Card>
                      </Link>
                    </div>
                  ))}
                </div>
              </ListingsGrid>

              {/* Load More Button */}
              {hasNextPage && (
                <div className="flex justify-center mt-8">
                  <Button 
                    onClick={loadMore} 
                    disabled={isFetching}
                    variant="outline"
                    size="lg"
                  >
                    {isFetching ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Loading...
                      </>
                    ) : (
                      <>Load More Projects</>
                    )}
                  </Button>
                </div>
              )}
            </>
          )}
        </div>

        {/* Back to Top Button */}
        <BackToTopButton />

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
