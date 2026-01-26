import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Building, Phone, Mail, Globe, CheckCircle, ChevronRight, Calendar } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Developer } from '@/types/projects';

interface ProjectDeveloperCardProps {
  developer: Developer;
}

export function ProjectDeveloperCard({ developer }: ProjectDeveloperCardProps) {
  const [logoError, setLogoError] = useState(false);
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <Building className="h-5 w-5 text-primary" />
          Developer
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Developer Info */}
        <div className="flex items-start gap-4">
          <Link to={`/developers/${developer.slug}`} className="shrink-0">
            {developer.logo_url && !logoError ? (
              <img
                src={developer.logo_url}
                alt={developer.name}
                className="w-16 h-16 object-contain rounded-lg bg-muted p-2 hover:ring-2 hover:ring-primary/20 transition-all"
                onError={() => setLogoError(true)}
              />
            ) : (
              <div className="w-16 h-16 rounded-lg bg-primary/10 flex items-center justify-center hover:ring-2 hover:ring-primary/20 transition-all">
                <Building className="h-8 w-8 text-primary" />
              </div>
            )}
          </Link>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <Link to={`/developers/${developer.slug}`}>
                <h3 className="font-semibold hover:text-primary hover:underline transition-colors">{developer.name}</h3>
              </Link>
              {developer.is_verified && (
                <Badge variant="secondary" className="gap-1 text-xs bg-primary/10 text-primary border-primary/20">
                  <CheckCircle className="h-3 w-3" />
                  Verified
                </Badge>
              )}
            </div>
            <div className="flex flex-wrap gap-3 mt-1 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Building className="h-3.5 w-3.5" />
                {developer.total_projects || 0} Projects
              </span>
              {developer.founded_year && (
                <span className="flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" />
                  Since {developer.founded_year}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Description */}
        {developer.description && (
          <p className="text-sm text-muted-foreground line-clamp-3">
            {developer.description}
          </p>
        )}

        {/* Contact Actions */}
        <div className="flex flex-wrap gap-2">
          {developer.phone && (
            <Button variant="outline" size="sm" className="flex-1" asChild>
              <a href={`tel:${developer.phone}`}>
                <Phone className="h-4 w-4 mr-1.5" />
                Call
              </a>
            </Button>
          )}
          {developer.email && (
            <Button size="sm" className="flex-1" asChild>
              <a href={`mailto:${developer.email}`}>
                <Mail className="h-4 w-4 mr-1.5" />
                Email
              </a>
            </Button>
          )}
        </div>

        {developer.website && (
          <Button variant="ghost" size="sm" className="w-full justify-between" asChild>
            <a href={developer.website} target="_blank" rel="noopener noreferrer">
              <span className="flex items-center gap-1.5">
                <Globe className="h-4 w-4" />
                Visit Website
              </span>
              <ChevronRight className="h-4 w-4" />
            </a>
          </Button>
        )}

        {/* View All Projects Link */}
        <Link to={`/developers/${developer.slug}`}>
          <Button variant="secondary" size="sm" className="w-full justify-between">
            <span>View All {developer.name} Projects</span>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}