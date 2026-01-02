import { Phone, Mail, Calendar, Building, Shield, Clock, HelpCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useFormatPrice } from '@/contexts/PreferencesContext';
import { Project, Developer, ProjectUnit } from '@/types/projects';

interface ProjectStickyCardProps {
  project: Project;
  developer?: Developer | null;
  selectedUnit?: ProjectUnit | null;
  onContactClick?: () => void;
}

export function ProjectStickyCard({ project, developer, selectedUnit, onContactClick }: ProjectStickyCardProps) {
  const formatPrice = useFormatPrice();

  const displayPrice = selectedUnit?.price || project.price_from;
  const priceLabel = selectedUnit ? 'Selected Unit' : 'Starting From';

  const handleContactClick = () => {
    if (onContactClick) {
      onContactClick();
    } else {
      const section = document.getElementById('developer-section');
      section?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Calculate months to completion
  const monthsToCompletion = project.completion_date 
    ? Math.max(0, Math.ceil((new Date(project.completion_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24 * 30)))
    : null;

  return (
    <TooltipProvider>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="space-y-4"
      >
        {/* Main Card */}
        <Card className="shadow-lg border-primary/10">
          <CardContent className="p-5 space-y-4">
            {/* Price Summary */}
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">{priceLabel}</p>
              <p className="text-3xl font-bold text-primary">
                {formatPrice(displayPrice || 0, project.currency || 'ILS')}
              </p>
              {selectedUnit && (
                <Badge variant="outline" className="mt-1">
                  {selectedUnit.unit_type} • Floor {selectedUnit.floor}
                </Badge>
              )}
            </div>

            {/* Key Info Grid */}
            <div className="grid grid-cols-2 gap-3">
              {/* Completion Date */}
              {project.completion_date && (
                <div className="p-3 bg-muted/30 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <Calendar className="h-4 w-4 text-primary" />
                    <span className="text-xs text-muted-foreground">Completion</span>
                  </div>
                  <p className="text-sm font-medium">
                    {new Date(project.completion_date).toLocaleDateString('en-US', { 
                      month: 'short', 
                      year: 'numeric' 
                    })}
                  </p>
                  {monthsToCompletion !== null && monthsToCompletion > 0 && (
                    <p className="text-xs text-muted-foreground">~{monthsToCompletion} months</p>
                  )}
                </div>
              )}

              {/* Total Units */}
              {project.total_units && (
                <div className="p-3 bg-muted/30 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <Building className="h-4 w-4 text-primary" />
                    <span className="text-xs text-muted-foreground">Total Units</span>
                  </div>
                  <p className="text-sm font-medium">{project.total_units} Units</p>
                </div>
              )}
            </div>

            {/* CTA Buttons */}
            <div className="space-y-2 pt-2">
              <Button className="w-full" size="lg" onClick={handleContactClick}>
                <Mail className="h-4 w-4 mr-2" />
                Request Information
              </Button>
              {developer?.phone && (
                <Button variant="outline" className="w-full" size="lg" asChild>
                  <a href={`tel:${developer.phone}`}>
                    <Phone className="h-4 w-4 mr-2" />
                    Call Developer
                  </a>
                </Button>
              )}
            </div>

            {/* Developer Quick Info */}
            {developer && (
              <div className="pt-3 border-t border-border">
                <div className="flex items-center gap-3">
                  {developer.logo_url ? (
                    <img
                      src={developer.logo_url}
                      alt={developer.name}
                      className="w-10 h-10 object-contain rounded-lg bg-muted p-1"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Building className="h-5 w-5 text-primary" />
                    </div>
                  )}
                  <div className="flex-1">
                    <p className="text-sm font-medium">{developer.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {developer.total_projects || 0} Projects
                    </p>
                  </div>
                  {developer.is_verified && (
                    <Tooltip>
                      <TooltipTrigger>
                        <Shield className="h-5 w-5 text-primary" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="text-sm">Verified Developer</p>
                      </TooltipContent>
                    </Tooltip>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Buyer Protection Info */}
        <Card className="bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-900">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-green-600 dark:text-green-400" />
              <span className="font-medium text-green-800 dark:text-green-300">Buyer Protections</span>
            </div>
            <ul className="space-y-2 text-sm text-green-700 dark:text-green-400">
              <li className="flex items-start gap-2">
                <span className="text-green-600 dark:text-green-400">✓</span>
                <span>
                  Bank Guarantee
                  <Tooltip>
                    <TooltipTrigger>
                      <HelpCircle className="h-3 w-3 inline ml-1 text-green-600/60" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <p className="text-sm">Israeli law requires developers to provide bank guarantees protecting your payments until the property is registered in your name.</p>
                    </TooltipContent>
                  </Tooltip>
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600 dark:text-green-400">✓</span>
                <span>1-Year Warranty</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600 dark:text-green-400">✓</span>
                <span>
                  Staged Payments
                  <Tooltip>
                    <TooltipTrigger>
                      <HelpCircle className="h-3 w-3 inline ml-1 text-green-600/60" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <p className="text-sm">Pay in milestones as construction progresses, typically 10/15/25/50% at key stages.</p>
                    </TooltipContent>
                  </Tooltip>
                </span>
              </li>
            </ul>
            <Link 
              to="/guides/new-construction" 
              className="text-xs text-green-700 dark:text-green-400 hover:underline font-medium inline-block"
            >
              Learn more about buyer protections →
            </Link>
          </CardContent>
        </Card>
      </motion.div>
    </TooltipProvider>
  );
}

// Mobile Contact Bar
export function ProjectMobileContactBar({ project, developer }: { project: Project; developer?: Developer | null }) {
  return (
    <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/95 backdrop-blur-sm border-t border-border lg:hidden z-50">
      <div className="flex gap-3 max-w-lg mx-auto">
        <Button className="flex-1" size="lg">
          <Mail className="h-4 w-4 mr-2" />
          Request Info
        </Button>
        {developer?.phone && (
          <Button variant="outline" size="lg" asChild>
            <a href={`tel:${developer.phone}`}>
              <Phone className="h-4 w-4" />
            </a>
          </Button>
        )}
      </div>
    </div>
  );
}
