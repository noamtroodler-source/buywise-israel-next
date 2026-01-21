import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Building2, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useFeaturedProjects } from '@/hooks/useProjects';
import { ProjectFavoriteButton } from '@/components/project/ProjectFavoriteButton';
import { ProjectShareButton } from '@/components/project/ProjectShareButton';

function formatPrice(price: number | null, currency: string = 'ILS') {
  if (!price) return 'Price on request';
  return new Intl.NumberFormat('en-IL', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(price);
}

export function ProjectsHighlight() {
  const { data: projects, isLoading } = useFeaturedProjects();
  
  const displayProjects = projects?.slice(0, 3) || [];
  const mainProject = displayProjects[0];
  const sideProjects = displayProjects.slice(1, 3);

  if (isLoading) {
    return (
      <section className="py-10 md:py-14">
        <div className="container">
          <div className="grid lg:grid-cols-5 gap-4">
            <Skeleton className="lg:col-span-3 aspect-[16/9] rounded-lg" />
            <div className="lg:col-span-2 space-y-3">
              <Skeleton className="aspect-[16/7] rounded-lg" />
              <Skeleton className="aspect-[16/7] rounded-lg" />
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (displayProjects.length === 0) {
    return null;
  }

  return (
    <section className="py-10 md:py-14">
      <div className="container">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <div className="flex items-center gap-2 text-primary mb-1">
              <Building2 className="h-5 w-5" />
              <span className="text-sm font-medium">New Construction</span>
            </div>
            <h2 className="text-2xl md:text-4xl font-bold text-foreground">
              New Developments
            </h2>
            <p className="text-base text-muted-foreground mt-1 max-w-lg">
              Pre-construction projects with transparent pricing
            </p>
          </motion.div>

          <Button variant="outline" asChild>
            <Link to="/projects" className="gap-2">
              View All
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </Button>
        </div>

        {/* Projects Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="grid lg:grid-cols-5 gap-4"
        >
          {/* Main Project Card */}
          {mainProject && (
            <Link
              to={`/projects/${mainProject.slug}`}
              className="lg:col-span-3 group relative overflow-hidden rounded-xl bg-card border border-border shadow-card hover:shadow-card-hover transition-all duration-300"
            >
              <div className="aspect-[16/9] overflow-hidden">
                <img
                  src={mainProject.images?.[0] || '/placeholder.svg'}
                  alt={mainProject.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-foreground/80 via-foreground/20 to-transparent" />
              
              {/* Action Buttons - Top Right */}
              <div className="absolute top-3 right-3 flex gap-1.5 z-10">
                {/* Share - visible on hover */}
                <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <ProjectShareButton
                    projectSlug={mainProject.slug}
                    projectName={mainProject.name}
                    className="h-8 w-8 rounded-full"
                  />
                </div>
                {/* Favorite - always visible */}
                <ProjectFavoriteButton
                  projectId={mainProject.id}
                  className="h-8 w-8 rounded-full bg-background/80 hover:bg-background"
                />
              </div>
              <div className="absolute bottom-0 left-0 right-0 p-4 md:p-5">
                <div className="flex items-center gap-2 mb-2">
                  <Badge className="bg-primary text-primary-foreground text-xs">
                    New Project
                  </Badge>
                  {mainProject.developer && (
                    <span className="text-xs text-white/80 flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3" />
                      {typeof mainProject.developer === 'object' ? mainProject.developer.name : 'Verified'}
                    </span>
                  )}
                </div>
                <h3 className="text-xl md:text-2xl font-bold text-white mb-1">
                  {mainProject.name}
                </h3>
                <p className="text-sm text-white/80 mb-2">
                  {mainProject.neighborhood ? `${mainProject.neighborhood}, ` : ''}{mainProject.city}
                </p>
                <p className="text-base font-semibold text-white">
                  From {formatPrice(mainProject.price_from, mainProject.currency || 'ILS')}
                </p>
              </div>
            </Link>
          )}

          {/* Side Projects */}
          <div className="lg:col-span-2 space-y-3">
            {sideProjects.map((project) => (
              <Link
                key={project.id}
                to={`/projects/${project.slug}`}
                className="group block relative overflow-hidden rounded-lg bg-card border border-border shadow-card hover:shadow-card-hover transition-all duration-300"
              >
                <div className="aspect-[16/7] overflow-hidden">
                  <img
                    src={project.images?.[0] || '/placeholder.svg'}
                    alt={project.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-foreground/70 to-transparent" />
                
                {/* Action Buttons - Top Right */}
                <div className="absolute top-2 right-2 flex gap-1.5 z-10">
                  {/* Share - visible on hover */}
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <ProjectShareButton
                      projectSlug={project.slug}
                      projectName={project.name}
                      className="h-7 w-7 rounded-full"
                    />
                  </div>
                  {/* Favorite - always visible */}
                  <ProjectFavoriteButton
                    projectId={project.id}
                    className="h-7 w-7 rounded-full bg-background/80 hover:bg-background"
                  />
                </div>
                <div className="absolute bottom-0 left-0 right-0 p-3">
                  <Badge className="bg-primary/90 text-primary-foreground mb-1.5 text-xs">
                    New Project
                  </Badge>
                  <h3 className="text-base font-bold text-white">
                    {project.name}
                  </h3>
                  <p className="text-xs text-white/80">
                    {project.city} • From {formatPrice(project.price_from, project.currency || 'ILS')}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
