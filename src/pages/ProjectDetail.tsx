import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { useProject, useProjectUnits } from '@/hooks/useProjects';
import { useProjectViewTracking } from '@/hooks/useProjectViewTracking';
import { PropertyLocation } from '@/components/property/PropertyLocation';
import { GoogleMapsProvider } from '@/components/maps/GoogleMapsProvider';
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
  ProjectQuestionsToAsk,
} from '@/components/project';
import { ListingFeedback } from '@/components/listings/ListingFeedback';
import { SEOHead } from '@/components/seo/SEOHead';
import { generateProjectMeta, generateProjectJsonLd, SITE_CONFIG } from '@/lib/seo';

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

  // Generate SEO meta and JSON-LD
  const seoMeta = generateProjectMeta(project);
  const jsonLd = generateProjectJsonLd(project);

  return (
    <Layout>
      <SEOHead 
        title={seoMeta.title}
        description={seoMeta.description}
        image={project.images?.[0]}
        canonicalUrl={`${SITE_CONFIG.siteUrl}/projects/${project.slug}`}
        type="product"
        jsonLd={jsonLd}
      />
      <div className="min-h-screen pb-24 lg:pb-8">
        <div className="container py-4 md:py-6">
          {/* Breadcrumb Navigation */}
          <ProjectBreadcrumb projectName={project.name} city={project.city} />
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid gap-4 md:gap-8 lg:grid-cols-3 mt-4 md:mt-6"
          >
            {/* Left Column - Main Content */}
            <div className="lg:col-span-2 space-y-4 md:space-y-8">
            {/* Hero - Edge-to-edge on mobile */}
            <div className="-mx-4 md:mx-0">
              <ProjectHero project={project} />
            </div>
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
              
              {/* Questions to Ask the Developer - Right before cost breakdown */}
              <ProjectQuestionsToAsk 
                hasPaymentSchedule={true}
                hasBankGuarantee={true}
                deliveryYear={project.completion_date ? new Date(project.completion_date).getFullYear() : undefined}
              />
              
              {/* Cost Breakdown with buyer protections integrated */}
              <ProjectCostBreakdown 
                units={units}
                defaultPrice={project.price_from || 0}
                currency={project.currency || 'ILS'}
                city={project.city}
              />
              
              {/* Construction Timeline */}
              <ProjectTimeline project={project} />
              
              <GoogleMapsProvider>
                <PropertyLocation
                  address={project.address || ''}
                  city={project.city}
                  neighborhood={project.neighborhood || undefined}
                  latitude={project.latitude || undefined}
                  longitude={project.longitude || undefined}
                  entityId={project.id}
                  entityType="project"
                />
              </GoogleMapsProvider>
              
              {/* Next Steps - Merged CTAs */}
              <ProjectNextSteps 
                cityName={project.city}
                citySlug={citySlug}
                projectPrice={project.price_from || undefined}
              />

              {/* Listing Feedback */}
              <ListingFeedback listingType="projects" />
              
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
              <div className="sticky top-20">
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
