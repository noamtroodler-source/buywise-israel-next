import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Building2, Globe, Phone, CheckCircle, Loader2 } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useDevelopers } from '@/hooks/useProjects';

export default function Developers() {
  const { data: developers = [], isLoading } = useDevelopers();

  return (
    <Layout>
      <div className="container py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-8"
        >
          {/* Header */}
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center gap-2">
              <Building2 className="h-8 w-8 text-primary" />
              <h1 className="text-4xl font-bold text-foreground">Developers</h1>
            </div>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Explore Israel's leading real estate developers and their new construction projects.
            </p>
          </div>

          {/* Developers Grid */}
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : developers.length === 0 ? (
            <div className="text-center py-12">
              <Building2 className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-foreground mb-2">No developers yet</h2>
              <p className="text-muted-foreground">
                Developer profiles will be available soon.
              </p>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {developers.map((developer, index) => (
                <motion.div
                  key={developer.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Link to={`/developers/${developer.slug}`}>
                    <Card className="h-full hover:shadow-card-hover transition-all duration-300 group">
                      <CardContent className="p-6 space-y-4">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-4">
                            {developer.logo_url ? (
                              <img
                                src={developer.logo_url}
                                alt={developer.name}
                                className="h-16 w-16 object-contain rounded-lg bg-muted p-2"
                              />
                            ) : (
                              <div className="h-16 w-16 rounded-lg bg-primary/10 flex items-center justify-center">
                                <Building2 className="h-8 w-8 text-primary" />
                              </div>
                            )}
                            <div>
                              <div className="flex items-center gap-2">
                                <h2 className="font-semibold text-lg text-foreground group-hover:text-primary transition-colors">
                                  {developer.name}
                                </h2>
                                {developer.is_verified && (
                                  <CheckCircle className="h-4 w-4 text-primary" />
                                )}
                              </div>
                              {developer.founded_year && (
                                <p className="text-sm text-muted-foreground">
                                  Est. {developer.founded_year}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>

                        {developer.description && (
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {developer.description}
                          </p>
                        )}

                        <div className="flex items-center justify-between pt-2 border-t border-border">
                          <Badge variant="secondary">
                            {developer.total_projects} Projects
                          </Badge>
                          <div className="flex items-center gap-3 text-muted-foreground">
                            {developer.website && (
                              <Globe className="h-4 w-4" />
                            )}
                            {developer.phone && (
                              <Phone className="h-4 w-4" />
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </Layout>
  );
}
