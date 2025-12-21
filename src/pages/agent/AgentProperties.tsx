import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plus, Edit, Trash2, Eye, EyeOff, Loader2 } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useAgentProperties, useDeleteProperty, useUpdateProperty } from '@/hooks/useAgentProperties';

export default function AgentProperties() {
  const { data: properties = [], isLoading } = useAgentProperties();
  const deleteProperty = useDeleteProperty();
  const updateProperty = useUpdateProperty();

  const togglePublish = (id: string, currentStatus: boolean) => {
    updateProperty.mutate({ id, is_published: !currentStatus });
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'for_sale': return 'For Sale';
      case 'for_rent': return 'For Rent';
      case 'sold': return 'Sold';
      case 'rented': return 'Rented';
      default: return status;
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-foreground">My Properties</h1>
            <Button asChild>
              <Link to="/agent/properties/new">
                <Plus className="h-4 w-4 mr-2" />
                Add Property
              </Link>
            </Button>
          </div>

          {properties.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <p className="text-muted-foreground mb-4">You haven't added any properties yet</p>
                <Button asChild>
                  <Link to="/agent/properties/new">Add Your First Property</Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>{properties.length} Properties</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {properties.map((property) => (
                    <div
                      key={property.id}
                      className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-lg border border-border"
                    >
                      <div className="flex items-center gap-4">
                        <img
                          src={property.images?.[0] || 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=100'}
                          alt={property.title}
                          className="h-16 w-16 rounded-lg object-cover"
                        />
                        <div>
                          <h3 className="font-semibold line-clamp-1">{property.title}</h3>
                          <p className="text-sm text-muted-foreground">{property.address}, {property.city}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline">{getStatusLabel(property.listing_status)}</Badge>
                            <span className="text-sm font-medium">
                              ₪{property.price.toLocaleString()}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => togglePublish(property.id, property.is_published || false)}
                          disabled={updateProperty.isPending}
                        >
                          {property.is_published ? (
                            <>
                              <EyeOff className="h-4 w-4 mr-1" />
                              Unpublish
                            </>
                          ) : (
                            <>
                              <Eye className="h-4 w-4 mr-1" />
                              Publish
                            </>
                          )}
                        </Button>

                        <Button variant="ghost" size="sm" asChild>
                          <Link to={`/agent/properties/${property.id}/edit`}>
                            <Edit className="h-4 w-4 mr-1" />
                            Edit
                          </Link>
                        </Button>

                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Property</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete "{property.title}"? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => deleteProperty.mutate(property.id)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </motion.div>
      </div>
    </Layout>
  );
}
