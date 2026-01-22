import { useState } from 'react';
import { MapPin, Plus, Trash2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ProfileSection } from '../ProfileSection';
import { useSavedLocations, useDeleteSavedLocation } from '@/hooks/useSavedLocations';
import { AddCoreLocationDialog } from '../AddCoreLocationDialog';
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

export function LocationsSection() {
  const { data: locations = [], isLoading } = useSavedLocations();
  const deleteLocation = useDeleteSavedLocation();
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const canAddMore = locations.length < MAX_SAVED_LOCATIONS;
  const isComplete = locations.length > 0;

  const handleConfirmDelete = () => {
    if (deleteId) {
      deleteLocation.mutate(deleteId);
      setDeleteId(null);
    }
  };

  return (
    <>
      <ProfileSection
        title="Core Locations"
        icon={<MapPin className="h-5 w-5" />}
        status={isComplete ? 'complete' : 'incomplete'}
        statusText={isComplete ? `${locations.length} saved` : 'None added'}
        defaultOpen={!isComplete}
      >
        {isLoading ? (
          <div className="flex justify-center py-6">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : locations.length === 0 ? (
          <div className="text-center py-4">
            <p className="text-sm text-muted-foreground mb-3">
              Add locations like work or school to see travel times on every listing.
            </p>
            <Button onClick={() => setAddDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-1.5" />
              Add Your First Location
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

            {canAddMore && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setAddDialogOpen(true)}
                className="w-full"
              >
                <Plus className="h-3.5 w-3.5 mr-1.5" />
                Add Location ({locations.length}/{MAX_SAVED_LOCATIONS})
              </Button>
            )}
          </div>
        )}
      </ProfileSection>

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
