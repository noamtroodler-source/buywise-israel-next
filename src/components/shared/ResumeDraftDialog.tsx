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
import { FileText, RefreshCw } from 'lucide-react';

interface ResumeDraftDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onResume: () => void;
  onStartFresh: () => void;
  savedAt?: Date | null;
  type?: 'property' | 'project';
}

export function ResumeDraftDialog({
  open,
  onOpenChange,
  onResume,
  onStartFresh,
  savedAt,
  type = 'property',
}: ResumeDraftDialogProps) {
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <FileText className="h-6 w-6 text-primary" />
            </div>
            <AlertDialogTitle className="text-xl">Resume Your Draft?</AlertDialogTitle>
          </div>
          <AlertDialogDescription className="text-base">
            You have an unfinished {type} listing
            {savedAt && ` from ${formatDate(savedAt)}`}. 
            Would you like to continue where you left off?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-col sm:flex-row gap-2 mt-4">
          <AlertDialogCancel
            onClick={onStartFresh}
            className="w-full sm:w-auto rounded-xl"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Start Fresh
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onResume}
            className="w-full sm:w-auto rounded-xl"
          >
            <FileText className="h-4 w-4 mr-2" />
            Resume Draft
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
