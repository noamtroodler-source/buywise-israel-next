import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { useProject, useProjectUnits } from '@/hooks/useProjects';
import { useProjectViewTracking } from '@/hooks/useProjectViewTracking';
import { PropertyLocation } from '@/components/property/PropertyLocation';
import {
  ProjectHero,
  ProjectFloorPlans,
  ProjectCostBreakdown,
  ProjectTimeline,
  ProjectDeveloperCard,
  ProjectAgentCard,
  ProjectStickyCard,
  ProjectMobileContactBar,
  SimilarProjects,
  ProjectFAQ,
  ProjectBreadcrumb,
  ProjectQuickSummary,
  ProjectDescription,
  ProjectNextSteps,
} from '@/components/project';

// Helper to convert city name to slug
const cityToSlug = (city: string) => city.toLowerCase().replace(/\s+/g, '-');

export default function ProjectDetail() {
  const { slug } = useParams<{ slug: string }>();
  const { data: project, isLoading, error } = useProject(slug || '');
  const { data: units = [] } = useProjectUnits(project?.id || '');

  // Track project views
  useProjectViewTracking(project?.id);

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

  const citySlug = cityToSlug(project.city);

  return (
    <Layout>
      <div className="min-h-screen pb-24 lg:pb-8">
        <div className="container py-6">
          {/* Breadcrumb Navigation */}
          <ProjectBreadcrumb projectName={project.name} city={project.city} />
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid gap-8 lg:grid-cols-3 mt-6"
          >
            {/* Left Column - Main Content */}
            <div className="lg:col-span-2 space-y-8">
              {/* Hero - Inside Grid */}
              <ProjectHero project={project} />
              {/* Quick Summary - Price, Title, Stats */}
              <ProjectQuickSummary 
                project={project} 
                developer={project.developer}
              />
              
              {/* Description & Amenities */}
              <ProjectDescription 
                description={project.description} 
                amenities={project.amenities}
              />
              
              {/* Floor Plans - What's available */}
              <ProjectFloorPlans units={units} developer={project.developer} />
              
              {/* Cost Breakdown with buyer protections integrated */}
              <ProjectCostBreakdown 
                units={units}
                defaultPrice={project.price_from || 0}
                currency={project.currency || 'ILS'}
              />
              
              {/* Construction Timeline */}
              <ProjectTimeline project={project} />
              
              <PropertyLocation
                address={project.address || ''}
                city={project.city}
                neighborhood={project.neighborhood || undefined}
                latitude={project.latitude || undefined}
                longitude={project.longitude || undefined}
              />
              
              {/* Next Steps - Merged CTAs */}
              <ProjectNextSteps 
                cityName={project.city}
                citySlug={citySlug}
                projectPrice={project.price_from || undefined}
              />
              
              {/* FAQ Section */}
              <ProjectFAQ />
              
              {/* Sales Agent Card - if assigned */}
              {project.representing_agent && (
                <div id="agent-section">
                  <ProjectAgentCard 
                    agent={project.representing_agent} 
                    projectName={project.name}
                    projectId={project.id}
                    developerId={project.developer_id || undefined}
                  />
                </div>
              )}
              
              {project.developer && (
                <div id="developer-section">
                  <ProjectDeveloperCard developer={project.developer} />
                </div>
              )}
            </div>

            {/* Right Column - Sticky Sidebar */}
            <div className="hidden lg:block">
              <div className="sticky top-6">
                <ProjectStickyCard 
                  project={project}
                  developer={project.developer}
                  representingAgent={project.representing_agent}
                />
              </div>
            </div>
          </motion.div>
          
          {/* Similar Projects Section - Full Width */}
          <SimilarProjects currentProject={project} />
        </div>
      </div>
      
      <ProjectMobileContactBar 
        project={project} 
        developer={project.developer} 
        representingAgent={project.representing_agent}
      />
    </Layout>
  );
}
