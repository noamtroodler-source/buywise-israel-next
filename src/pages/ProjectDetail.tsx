import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { useProject, useProjectUnits } from '@/hooks/useProjects';
import { PropertyLocation } from '@/components/property/PropertyLocation';
import {
  ProjectHero,
  ProjectHighlights,
  ProjectFloorPlans,
  ProjectCostBreakdown,
  ProjectTimeline,
  ProjectDeveloperCard,
  ProjectAmenities,
  ProjectStickyCard,
  ProjectMobileContactBar,
  BuyerInsightsTips,
  ProjectBuyerProtections,
} from '@/components/project';

export default function ProjectDetail() {
  const { slug } = useParams<{ slug: string }>();
  const { data: project, isLoading, error } = useProject(slug || '');
  const { data: units = [] } = useProjectUnits(project?.id || '');

  if (isLoading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  if (error || !project) {
    return (
      <Layout>
        <div className="container py-16 text-center">
          <h1 className="text-2xl font-bold mb-4">Project not found</h1>
          <Button asChild>
            <Link to="/projects">Browse All Projects</Link>
          </Button>
        </div>
      </Layout>
    );
  }

  const projectWithProgress = {
    ...project,
    construction_progress_percent: (project as any).construction_progress_percent || 0,
  };

  return (
    <Layout>
      <div className="min-h-screen pb-24 lg:pb-8">
        <div className="container py-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid gap-8 lg:grid-cols-3"
          >
            {/* Left Column - Main Content */}
            <div className="lg:col-span-2 space-y-6">
              <ProjectHero project={projectWithProgress} />
              
              {/* About */}
              {project.description && (
                <div className="space-y-2">
                  <h2 className="text-xl font-semibold">About This Project</h2>
                  <p className="text-muted-foreground whitespace-pre-line">
                    {project.description}
                  </p>
                </div>
              )}

              {/* Project Highlights - Moved from sidebar */}
              <ProjectHighlights project={projectWithProgress} />

              {/* Buyer Insights - Contextual tips */}
              <BuyerInsightsTips />
              
              {/* Floor Plans - Read-only table */}
              <ProjectFloorPlans units={units} developer={project.developer} />
              
              {/* Cost Breakdown with unit selector */}
              <ProjectCostBreakdown 
                units={units}
                defaultPrice={project.price_from || 0}
                currency={project.currency || 'ILS'}
              />

              {/* Buyer Protections - After costs to show payment security */}
              <ProjectBuyerProtections />
              
              {/* Compact Timeline */}
              <ProjectTimeline project={projectWithProgress} />
              
              <PropertyLocation
                address={project.address || ''}
                city={project.city}
                neighborhood={project.neighborhood || undefined}
                latitude={project.latitude || undefined}
                longitude={project.longitude || undefined}
              />
              
              {project.amenities && project.amenities.length > 0 && (
                <ProjectAmenities amenities={project.amenities} />
              )}
              
              {project.developer && (
                <div id="developer-section">
                  <ProjectDeveloperCard developer={project.developer} />
                </div>
              )}
            </div>

            {/* Right Column - Sticky Sidebar (Simplified) */}
            <div className="hidden lg:block">
              <div className="sticky top-6">
                <ProjectStickyCard 
                  project={project}
                  developer={project.developer}
                />
              </div>
            </div>
          </motion.div>
        </div>
      </div>
      
      <ProjectMobileContactBar project={project} developer={project.developer} />
    </Layout>
  );
}
