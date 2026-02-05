import { useState } from 'react';
import { Flag } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ReportListingDialog } from './ReportListingDialog';

interface ReportListingButtonProps {
  propertyId?: string;
  projectId?: string;
  listingTitle?: string;
  className?: string;
}

export function ReportListingButton({
  propertyId,
  projectId,
  listingTitle,
  className,
}: ReportListingButtonProps) {
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setDialogOpen(true)}
        className={cn(
          "inline-flex items-center gap-1.5 text-xs text-muted-foreground",
          "hover:text-foreground transition-colors",
          "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          className
        )}
      >
        <Flag className="h-3.5 w-3.5" />
        <span>Report inaccurate info</span>
      </button>

      <ReportListingDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        propertyId={propertyId}
        projectId={projectId}
        listingTitle={listingTitle}
      />
    </>
  );
}
