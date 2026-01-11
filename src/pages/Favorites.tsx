import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Heart, MapPin, Calculator, ArrowRight, Loader2, Scale } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { useFavorites, FavoriteCategory } from '@/hooks/useFavorites';
import { usePriceDropAlerts } from '@/hooks/usePriceDropAlerts';
import { useCompare } from '@/contexts/CompareContext';
import { 
  FavoritesSectionHeader, 
  FavoritePropertyCard, 
  RuledOutReasonDialog 
} from '@/components/favorites';

const popularCities = ['Tel Aviv', 'Jerusalem', 'Herzliya', 'Ra\'anana', 'Netanya'];

export default function Favorites() {
  const navigate = useNavigate();
  const { 
    favorites, 
    favoritesByCategory, 
    isLoading,
    updateFavoriteCategory,
    removeFavorite,
  } = useFavorites();
  const { togglePriceAlert, isTogglingAlert } = usePriceDropAlerts();
  const { addToCompare, clearCompare } = useCompare();
  
  // Section collapse state
  const [expandedSections, setExpandedSections] = useState<Record<FavoriteCategory, boolean>>({
    final_list: true,
    considering: true,
    ruled_out: false,
  });
  
  // Ruled out dialog state
  const [ruledOutDialog, setRuledOutDialog] = useState<{
    open: boolean;
    propertyId: string;
    propertyTitle: string;
  }>({ open: false, propertyId: '', propertyTitle: '' });

  // Pending category changes (for optimistic UI)
  const [pendingCategories, setPendingCategories] = useState<Record<string, FavoriteCategory>>({});

  const toggleSection = (category: FavoriteCategory) => {
    setExpandedSections(prev => ({
      ...prev,
      [category]: !prev[category],
    }));
  };

  const handleCategoryChange = (propertyId: string, propertyTitle: string, newCategory: FavoriteCategory) => {
    if (newCategory === 'ruled_out') {
      setRuledOutDialog({ open: true, propertyId, propertyTitle });
    } else {
      setPendingCategories(prev => ({ ...prev, [propertyId]: newCategory }));
      updateFavoriteCategory(
        { propertyId, category: newCategory },
        {
          onSettled: () => {
            setPendingCategories(prev => {
              const { [propertyId]: _, ...rest } = prev;
              return rest;
            });
          },
        }
      );
    }
  };

  const handleRuledOutConfirm = (reason?: string) => {
    const { propertyId } = ruledOutDialog;
    setPendingCategories(prev => ({ ...prev, [propertyId]: 'ruled_out' }));
    updateFavoriteCategory(
      { propertyId, category: 'ruled_out', ruledOutReason: reason },
      {
        onSettled: () => {
          setPendingCategories(prev => {
            const { [propertyId]: _, ...rest } = prev;
            return rest;
          });
        },
      }
    );
  };

  const handleCompareFinalList = () => {
    clearCompare();
    favoritesByCategory.final_list.slice(0, 3).forEach(fav => {
      if (fav.properties?.id) {
        addToCompare(fav.properties.id);
      }
    });
    navigate('/compare');
  };

  const totalCount = favorites.length;
  const finalListCount = favoritesByCategory.final_list.length;

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
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <Heart className="h-8 w-8 text-destructive" />
              <div>
                <h1 className="text-3xl font-bold text-foreground">Saved Properties</h1>
                {totalCount > 0 && (
                  <p className="text-muted-foreground">
                    {totalCount} {totalCount === 1 ? 'property' : 'properties'} saved
                  </p>
                )}
              </div>
            </div>
            
            {/* Compare Final List button */}
            {finalListCount >= 2 && (
              <Button onClick={handleCompareFinalList} className="gap-2">
                <Scale className="h-4 w-4" />
                Compare Final List ({Math.min(finalListCount, 3)})
              </Button>
            )}
          </div>

          {totalCount === 0 ? (
            /* Empty state */
            <div className="text-center py-16 max-w-lg mx-auto">
              <div className="relative mx-auto w-24 h-24 mb-6">
                <div className="absolute inset-0 bg-destructive/10 rounded-full animate-pulse" />
                <div className="absolute inset-2 bg-destructive/5 rounded-full" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Heart className="h-10 w-10 text-destructive/60" />
                </div>
              </div>
              
              <h2 className="text-xl font-semibold text-foreground mb-2">
                No saved properties yet
              </h2>
              <p className="text-muted-foreground mb-8 leading-relaxed">
                Start exploring and save properties you love! Click the heart icon on any listing to save it here for easy comparison.
              </p>

              <div className="bg-muted/50 rounded-xl p-5 text-left space-y-4 mb-8">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <MapPin className="h-4 w-4 text-primary" />
                  Start by exploring popular cities
                </div>
                <div className="flex flex-wrap gap-2">
                  {popularCities.map((city) => (
                    <Link
                      key={city}
                      to={`/listings?status=for_sale&city=${encodeURIComponent(city)}`}
                      className="px-3 py-1.5 rounded-full bg-background border border-border text-sm hover:border-primary hover:text-primary transition-colors"
                    >
                      {city}
                    </Link>
                  ))}
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button asChild size="lg">
                  <Link to="/listings?status=for_sale">
                    Browse Properties
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg">
                  <Link to="/areas">
                    <MapPin className="h-4 w-4 mr-2" />
                    Explore Areas
                  </Link>
                </Button>
              </div>

              <div className="mt-8 pt-6 border-t border-border">
                <p className="text-sm text-muted-foreground mb-3">
                  Not sure what you can afford?
                </p>
                <Button asChild variant="ghost" size="sm">
                  <Link to="/tools?tool=affordability" className="text-primary">
                    <Calculator className="h-4 w-4 mr-2" />
                    Try our Affordability Calculator
                  </Link>
                </Button>
              </div>
            </div>
          ) : (
            /* Category sections */
            <div className="space-y-4">
              {/* Final List Section */}
              <div className="space-y-3">
                <FavoritesSectionHeader
                  category="final_list"
                  count={favoritesByCategory.final_list.length}
                  isExpanded={expandedSections.final_list}
                  onToggle={() => toggleSection('final_list')}
                />
                <AnimatePresence>
                  {expandedSections.final_list && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      {favoritesByCategory.final_list.length === 0 ? (
                        <p className="text-sm text-muted-foreground py-4 px-2">
                          Move your top choices here when you're ready to make a decision.
                        </p>
                      ) : (
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 pt-2">
                          {favoritesByCategory.final_list.map((fav) => (
                            <FavoritePropertyCard
                              key={fav.id}
                              favorite={fav}
                              pendingCategory={pendingCategories[fav.property_id]}
                              onCategoryChange={(cat) => handleCategoryChange(fav.property_id, fav.properties?.title || '', cat)}
                              onTogglePriceAlert={() => togglePriceAlert({ 
                                propertyId: fav.property_id, 
                                enabled: fav.price_alert_enabled === false 
                              })}
                              onRemove={() => removeFavorite(fav.property_id)}
                              isTogglingAlert={isTogglingAlert}
                            />
                          ))}
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Considering Section */}
              <div className="space-y-3">
                <FavoritesSectionHeader
                  category="considering"
                  count={favoritesByCategory.considering.length}
                  isExpanded={expandedSections.considering}
                  onToggle={() => toggleSection('considering')}
                />
                <AnimatePresence>
                  {expandedSections.considering && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      {favoritesByCategory.considering.length === 0 ? (
                        <p className="text-sm text-muted-foreground py-4 px-2">
                          New favorites will appear here. Move them to Final List or Ruled Out as you decide.
                        </p>
                      ) : (
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 pt-2">
                          {favoritesByCategory.considering.map((fav) => (
                            <FavoritePropertyCard
                              key={fav.id}
                              favorite={fav}
                              pendingCategory={pendingCategories[fav.property_id]}
                              onCategoryChange={(cat) => handleCategoryChange(fav.property_id, fav.properties?.title || '', cat)}
                              onTogglePriceAlert={() => togglePriceAlert({ 
                                propertyId: fav.property_id, 
                                enabled: fav.price_alert_enabled === false 
                              })}
                              onRemove={() => removeFavorite(fav.property_id)}
                              isTogglingAlert={isTogglingAlert}
                            />
                          ))}
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Ruled Out Section */}
              <div className="space-y-3">
                <FavoritesSectionHeader
                  category="ruled_out"
                  count={favoritesByCategory.ruled_out.length}
                  isExpanded={expandedSections.ruled_out}
                  onToggle={() => toggleSection('ruled_out')}
                />
                <AnimatePresence>
                  {expandedSections.ruled_out && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      {favoritesByCategory.ruled_out.length === 0 ? (
                        <p className="text-sm text-muted-foreground py-4 px-2">
                          Properties you've decided against will appear here with your notes.
                        </p>
                      ) : (
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 pt-2">
                          {favoritesByCategory.ruled_out.map((fav) => (
                            <FavoritePropertyCard
                              key={fav.id}
                              favorite={fav}
                              pendingCategory={pendingCategories[fav.property_id]}
                              onCategoryChange={(cat) => handleCategoryChange(fav.property_id, fav.properties?.title || '', cat)}
                              onTogglePriceAlert={() => togglePriceAlert({ 
                                propertyId: fav.property_id, 
                                enabled: fav.price_alert_enabled === false 
                              })}
                              onRemove={() => removeFavorite(fav.property_id)}
                              isTogglingAlert={isTogglingAlert}
                            />
                          ))}
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          )}
        </motion.div>
      </div>

      {/* Ruled Out Reason Dialog */}
      <RuledOutReasonDialog
        open={ruledOutDialog.open}
        onOpenChange={(open) => setRuledOutDialog(prev => ({ ...prev, open }))}
        onConfirm={handleRuledOutConfirm}
        propertyTitle={ruledOutDialog.propertyTitle}
      />
    </Layout>
  );
}