import { useState } from 'react';
import { MapPin, Plus, Trash2, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useSavedLocations, useDeleteSavedLocation } from '@/hooks/useSavedLocations';
import { AddCoreLocationDialog } from './AddCoreLocationDialog';
import { getIconEmoji, MAX_SAVED_LOCATIONS } from '@/types/savedLocation';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export function CoreLocationsCard() {
  const { data: locations = [], isLoading } = useSavedLocations();
  const deleteLocation = useDeleteSavedLocation();
  
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const canAddMore = locations.length < MAX_SAVED_LOCATIONS;

  const handleConfirmDelete = () => {
    if (deleteId) {
      deleteLocation.mutate(deleteId);
      setDeleteId(null);
    }
  };

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-4">
          <CardTitle className="text-base font-medium flex items-center gap-2">
            <MapPin className="h-4 w-4 text-primary" />
            My Core Locations
          </CardTitle>
          {canAddMore && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setAddDialogOpen(true)}
              className="h-8"
            >
              <Plus className="h-4 w-4 mr-1" />
              Add
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-6">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : locations.length === 0 ? (
            <div className="text-center py-6">
              <MapPin className="h-8 w-8 mx-auto text-muted-foreground/50 mb-2" />
              <p className="text-sm text-muted-foreground mb-3">
                No saved locations yet
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setAddDialogOpen(true)}
              >
                <Plus className="h-4 w-4 mr-1" />
                Add your first location
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {locations.map((location) => (
                <div
                  key={location.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/40 group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-lg flex-shrink-0">
                      {getIconEmoji(location.icon)}
                    </span>
                    <div className="min-w-0">
                      <p className="font-medium text-sm truncate">
                        {location.label}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {location.address}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                    onClick={() => setDeleteId(location.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}

              {/* Capacity indicator */}
              <p className="text-xs text-muted-foreground pt-2">
                {locations.length} of {MAX_SAVED_LOCATIONS} locations saved
              </p>
            </div>
          )}

          {/* Info text */}
          <p className="text-xs text-muted-foreground mt-4 border-t pt-4">
            💡 These locations will appear on every property page to show you travel times from places that matter.
          </p>
        </CardContent>
      </Card>

      <AddCoreLocationDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
      />

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove location?</AlertDialogTitle>
            <AlertDialogDescription>
              This location will be removed from your saved locations. You can always add it back later.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete}>
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
