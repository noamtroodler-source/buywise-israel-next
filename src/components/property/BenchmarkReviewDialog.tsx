import { useState } from 'react';
import type { ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { BENCHMARK_REVIEW_REASONS, useRequestBenchmarkReview } from '@/hooks/useBenchmarkReview';

interface BenchmarkReviewDialogProps {
  propertyId: string;
  propertyTitle?: string | null;
  benchmarkReviewStatus?: string | null;
  existingReason?: string | null;
  existingNotes?: string | null;
  trigger?: ReactNode;
}

export function BenchmarkReviewDialog({ propertyId, propertyTitle, benchmarkReviewStatus, existingReason, existingNotes, trigger }: BenchmarkReviewDialogProps) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [notes, setNotes] = useState('');
  const requestReview = useRequestBenchmarkReview();
  const hasOpenReview = benchmarkReviewStatus === 'requested' || benchmarkReviewStatus === 'under_review';

  const submit = () => {
    if (!reason || hasOpenReview) return;
    requestReview.mutate({ propertyId, reason, notes }, {
      onSuccess: () => {
        setOpen(false);
        setReason('');
        setNotes('');
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button variant="outline" size="sm" className="gap-2 rounded-lg" disabled={hasOpenReview}>
            <AlertTriangle className="h-4 w-4" /> {hasOpenReview ? 'Context under review' : 'Request benchmark review'}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Request benchmark review</DialogTitle>
          <DialogDescription>
            Tell BuyWise why the current Price Context may not reflect {propertyTitle ? `“${propertyTitle}”` : 'this listing'} accurately.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          {hasOpenReview && (
            <div className="rounded-lg border border-semantic-amber/30 bg-semantic-amber/10 p-3 text-sm text-semantic-amber">
              This listing already has an open benchmark review{existingReason ? ` for “${existingReason}”` : ''}. Buyer-facing context will stay cautious until it is resolved.
              {existingNotes && <p className="mt-2 text-xs opacity-90">Notes: {existingNotes}</p>}
            </div>
          )}
          <div className="space-y-2">
            <Label>Review reason</Label>
            <Select value={reason} onValueChange={setReason} disabled={hasOpenReview}>
              <SelectTrigger>
                <SelectValue placeholder="Select a reason" />
              </SelectTrigger>
              <SelectContent>
                {BENCHMARK_REVIEW_REASONS.map((option) => (
                  <SelectItem key={option} value={option}>{option}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Notes</Label>
            <Textarea
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="Add comparable sale details, missing premium context, or the correction you recommend."
              maxLength={1000}
              disabled={hasOpenReview}
              rows={4}
            />
            <p className="text-xs text-muted-foreground text-right">{notes.length}/1000</p>
          </div>
          <div className="rounded-lg border border-primary/15 bg-primary/5 p-3 text-sm text-muted-foreground">
            Buyer-facing context will show as under review until an admin resolves the request.
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={submit} disabled={!reason || hasOpenReview || requestReview.isPending}>
            {requestReview.isPending ? 'Submitting…' : 'Submit review request'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}