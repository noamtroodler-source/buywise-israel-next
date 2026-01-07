import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Building2, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useFeaturedProjects } from '@/hooks/useProjects';

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
      <section className="py-16 md:py-24">
        <div className="container">
          <div className="grid lg:grid-cols-5 gap-6">
            <Skeleton className="lg:col-span-3 aspect-[16/10] rounded-xl" />
            <div className="lg:col-span-2 space-y-4">
              <Skeleton className="aspect-[16/9] rounded-xl" />
              <Skeleton className="aspect-[16/9] rounded-xl" />
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
    <section className="py-16 md:py-24">
      <div className="container">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <div className="flex items-center gap-2 text-project mb-2">
              <Building2 className="h-5 w-5" />
              <span className="text-sm font-medium">New Construction</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground">
              New Developments
            </h2>
            <p className="text-muted-foreground mt-2 max-w-lg">
              Pre-construction projects with transparent pricing from vetted developers
            </p>
          </motion.div>

          <Button variant="outline" asChild>
            <Link to="/projects" className="gap-2">
              View All Projects
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>

        {/* Projects Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="grid lg:grid-cols-5 gap-6"
        >
          {/* Main Project Card */}
          {mainProject && (
            <Link
              to={`/projects/${mainProject.slug}`}
              className="lg:col-span-3 group relative overflow-hidden rounded-2xl bg-card border border-border shadow-card hover:shadow-card-hover transition-all duration-300"
            >
              <div className="aspect-[16/10] overflow-hidden">
                <img
                  src={mainProject.images?.[0] || '/placeholder.svg'}
                  alt={mainProject.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-foreground/80 via-foreground/20 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8">
                <div className="flex items-center gap-2 mb-3">
                  <Badge className="bg-project text-project-foreground">
                    New Project
                  </Badge>
                  {mainProject.developer && (
                    <span className="text-sm text-white/80 flex items-center gap-1">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      {typeof mainProject.developer === 'object' ? mainProject.developer.name : 'Verified Developer'}
                    </span>
                  )}
                </div>
                <h3 className="text-2xl md:text-3xl font-bold text-white mb-2">
                  {mainProject.name}
                </h3>
                <p className="text-white/80 mb-3">
                  {mainProject.neighborhood ? `${mainProject.neighborhood}, ` : ''}{mainProject.city}
                </p>
                <p className="text-xl font-semibold text-white">
                  From {formatPrice(mainProject.price_from, mainProject.currency || 'ILS')}
                </p>
              </div>
            </Link>
          )}

          {/* Side Projects */}
          <div className="lg:col-span-2 space-y-4">
            {sideProjects.map((project) => (
              <Link
                key={project.id}
                to={`/projects/${project.slug}`}
                className="group block relative overflow-hidden rounded-xl bg-card border border-border shadow-card hover:shadow-card-hover transition-all duration-300"
              >
                <div className="aspect-[16/9] overflow-hidden">
                  <img
                    src={project.images?.[0] || '/placeholder.svg'}
                    alt={project.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-foreground/70 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-4">
                  <Badge className="bg-project/90 text-project-foreground mb-2 text-xs">
                    New Project
                  </Badge>
                  <h3 className="text-lg font-bold text-white mb-1">
                    {project.name}
                  </h3>
                  <p className="text-sm text-white/80">
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
