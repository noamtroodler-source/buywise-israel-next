import { useNavigate } from 'react-router-dom';
import { Heart, BookMarked, ArrowRight, Home } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useFavorites } from '@/hooks/useFavorites';
import { useSavedArticles } from '@/hooks/useSavedArticles';
import { SavedCalculatorResults } from './SavedCalculatorResults';

export function ProfileTabSaved() {
  const navigate = useNavigate();
  const { favoriteProperties } = useFavorites();
  const { savedArticles } = useSavedArticles();

  return (
    <div className="space-y-6">
      {/* Saved Properties Card */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-medium flex items-center gap-2">
            <Heart className="h-4 w-4 text-primary" />
            Saved Properties
          </CardTitle>
        </CardHeader>
        <CardContent>
          {favoriteProperties.length === 0 ? (
            <div className="text-center py-6">
              <div className="w-12 h-12 rounded-full bg-muted mx-auto mb-3 flex items-center justify-center">
                <Home className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground mb-3">
                No saved properties yet
              </p>
              <Button variant="outline" size="sm" onClick={() => navigate('/listings?status=for_sale')}>
                Browse Properties
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                You have {favoriteProperties.length} saved {favoriteProperties.length === 1 ? 'property' : 'properties'}
              </p>
              <Button 
                variant="outline" 
                className="w-full justify-between" 
                onClick={() => navigate('/favorites')}
              >
                <span className="flex items-center gap-2">
                  <Heart className="h-4 w-4" />
                  View All Saved Properties
                </span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Saved Calculator Results */}
      <SavedCalculatorResults />

      {/* Saved Articles Card */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-medium flex items-center gap-2">
            <BookMarked className="h-4 w-4 text-primary" />
            Saved Articles
          </CardTitle>
        </CardHeader>
        <CardContent>
          {savedArticles.length === 0 ? (
            <div className="text-center py-6">
              <div className="w-12 h-12 rounded-full bg-muted mx-auto mb-3 flex items-center justify-center">
                <BookMarked className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground mb-3">
                No saved articles yet
              </p>
              <Button variant="outline" size="sm" onClick={() => navigate('/blog')}>
                Explore Guides
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                You have {savedArticles.length} saved {savedArticles.length === 1 ? 'article' : 'articles'}
              </p>
              <Button 
                variant="outline" 
                className="w-full justify-between" 
                onClick={() => navigate('/blog')}
              >
                <span className="flex items-center gap-2">
                  <BookMarked className="h-4 w-4" />
                  View Saved Articles
                </span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
