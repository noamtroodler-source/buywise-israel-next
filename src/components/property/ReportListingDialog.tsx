import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useAuth } from '@/hooks/useAuth';
import { useReportListing, ReportType, REPORT_TYPE_LABELS } from '@/hooks/useReportListing';
import { CheckCircle2, Loader2 } from 'lucide-react';

interface ReportListingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  propertyId?: string;
  projectId?: string;
  listingTitle?: string;
}

export function ReportListingDialog({
  open,
  onOpenChange,
  propertyId,
  projectId,
  listingTitle,
}: ReportListingDialogProps) {
  const { user } = useAuth();
  const { submitReport, isSubmitting, isSuccess, reset } = useReportListing();
  
  const [reportType, setReportType] = useState<ReportType | ''>('');
  const [description, setDescription] = useState('');
  const [email, setEmail] = useState('');

  // Reset form when dialog closes
  useEffect(() => {
    if (!open) {
      setTimeout(() => {
        setReportType('');
        setDescription('');
        setEmail('');
        reset();
      }, 200);
    }
  }, [open, reset]);

  // Auto-close after success
  useEffect(() => {
    if (isSuccess) {
      const timer = setTimeout(() => {
        onOpenChange(false);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [isSuccess, onOpenChange]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportType) return;

    submitReport({
      propertyId,
      projectId,
      reportType,
      description: description.trim() || undefined,
      email: email.trim() || undefined,
    });
  };

  const reportTypes = Object.entries(REPORT_TYPE_LABELS) as [ReportType, string][];

  if (isSuccess) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="rounded-full bg-primary/10 p-3 mb-4">
              <CheckCircle2 className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">
              Thank you for your report
            </h3>
            <p className="text-sm text-muted-foreground">
              We'll review this listing and take appropriate action.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Report inaccurate info</DialogTitle>
          <DialogDescription>
            Help us keep listings accurate by reporting issues
            {listingTitle && (
              <span className="block mt-1 text-xs truncate">
                {listingTitle}
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-3">
            <Label>What's wrong with this listing?</Label>
            <RadioGroup
              value={reportType}
              onValueChange={(value) => setReportType(value as ReportType)}
              className="space-y-2"
            >
              {reportTypes.map(([value, label]) => (
                <div key={value} className="flex items-center space-x-3">
                  <RadioGroupItem value={value} id={value} />
                  <Label 
                    htmlFor={value} 
                    className="text-sm font-normal cursor-pointer"
                  >
                    {label}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">
              Additional details <span className="text-muted-foreground">(optional)</span>
            </Label>
            <Textarea
              id="description"
              placeholder="Provide any additional context..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              maxLength={500}
            />
          </div>

          {!user && (
            <div className="space-y-2">
              <Label htmlFor="email">
                Your email <span className="text-muted-foreground">(optional)</span>
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="email@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                We may contact you for follow-up
              </p>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!reportType || isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                'Submit Report'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
