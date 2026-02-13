import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

import { Building, MapPin, Loader2, Home, Bell, RotateCcw, Compass } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { SEOHead } from '@/components/seo/SEOHead';
import { Button } from '@/components/ui/button';

import { usePaginatedProjects } from '@/hooks/usePaginatedProjects';

import { ProjectFilters, ProjectFiltersType } from '@/components/filters/ProjectFilters';
import { CreateAlertDialog } from '@/components/filters/CreateAlertDialog';
import { useAuth } from '@/hooks/useAuth';
import { ListingsGrid } from '@/components/listings/ListingsGrid';

import { ProjectCard } from '@/components/project/ProjectCard';
import { BackToTopButton } from '@/components/shared/BackToTopButton';
import { PullToRefresh } from '@/components/shared/PullToRefresh';
import { MobileProjectsSkeletonGrid } from '@/components/shared/MobileProjectSkeleton';
import { EnhancedEmptyState } from '@/components/shared/EnhancedEmptyState';
import { useSearchTracking } from '@/hooks/useSearchTracking';
import { useEventTracking } from '@/hooks/useEventTracking';
import { useIsMobile } from '@/hooks/use-mobile';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { cn } from '@/lib/utils';
import { useQueryClient } from '@tanstack/react-query';

export default function Projects() {
  const [filters, setFilters] = useState<ProjectFiltersType>({});
  const [alertDialogOpen, setAlertDialogOpen] = useState(false);
  const [isSticky, setIsSticky] = useState(false);
  const filterBarRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const isDesktop = useMediaQuery('(min-width: 1024px)');
  const showStickyFilters = !isDesktop;
  const queryClient = useQueryClient();

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

  // Sticky filter bar detection
  useEffect(() => {
    if (isDesktop) return;
    
    const handleScroll = () => {
      if (filterBarRef.current) {
        const rect = filterBarRef.current.getBoundingClientRect();
        setIsSticky(rect.top <= 64); // 64px is header height
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isDesktop]);

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

  const handleCreateAlert = () => {
    if (!user) {
      navigate('/auth?redirect=/projects&intent=create_alert');
      return;
    }
    setAlertDialogOpen(true);
  };


  // Pull-to-refresh handler
  const handleRefresh = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: ['projects'] });
  }, [queryClient]);

  return (
    <Layout>
      <SEOHead
        title="New Development Projects in Israel | BuyWise Israel"
        description="Explore new construction projects and off-plan developments in Israel. Find new apartments and buildings with timelines, pricing, and developer information."
        canonicalUrl="https://buywiseisrael.com/projects"
      />
      
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

          {/* Filters - Sticky on mobile */}
          <div 
            ref={filterBarRef}
            className={cn(
              "transition-all duration-200",
              showStickyFilters && "sticky top-16 z-40 py-3 bg-background",
              showStickyFilters && isMobile && "-mx-4 px-4",
              showStickyFilters && isSticky && "shadow-md backdrop-blur-sm bg-background/95 border-b border-border/50"
            )}
          >
            <ProjectFilters filters={filters} onFiltersChange={setFilters} onCreateAlert={handleCreateAlert} />
          </div>

          {/* Results Count */}
          {!isLoading && (
            <p className="text-sm text-muted-foreground">
              Showing {projects.length} of {totalCount} project{totalCount !== 1 ? 's' : ''}
            </p>
          )}

          {/* Projects Grid */}
          {isLoading ? (
            <MobileProjectsSkeletonGrid count={isMobile ? 4 : 6} />
          ) : projects.length === 0 ? (
            <EnhancedEmptyState
              icon={Building}
              title="No projects found"
              description={
                totalCount > 0 
                  ? 'Try adjusting your filters to see more results.'
                  : 'New construction projects will be available soon.'
              }
              primaryAction={totalCount > 0 ? {
                label: 'Reset Filters',
                onClick: () => setFilters({}),
                icon: RotateCcw,
              } : {
                label: 'Create Alert',
                onClick: handleCreateAlert,
                icon: Bell,
              }}
              secondaryAction={totalCount > 0 ? {
                label: 'Create Alert',
                onClick: handleCreateAlert,
                icon: Bell,
              } : {
                label: 'Explore Areas',
                href: '/areas',
                icon: Compass,
              }}
              suggestions={totalCount > 0 ? [
                { icon: MapPin, text: 'Try searching in nearby cities' },
                { icon: Home, text: 'Expand your price range for more options' },
              ] : undefined}
            />
          ) : (
            <>
              <PullToRefresh onRefresh={handleRefresh} disabled={!isMobile}>
                <ListingsGrid isFetching={isFetching && !isLoading}>
                  <div className="grid gap-4 md:gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {projects.map((project) => (
                    <ProjectCard
                      key={project.id}
                      project={project}
                      onClick={() => handleProjectClick(project.id)}
                    />
                  ))}
                </div>
              </ListingsGrid>
            </PullToRefresh>

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
