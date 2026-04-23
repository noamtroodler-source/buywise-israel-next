/**
 * CoListingAgents
 *
 * Shown on property detail when multiple agencies list the same property.
 * Common in Israel — no exclusivity means the same apartment can appear
 * on Anglo Saxon, RE/MAX, and Yad2 simultaneously.
 *
 * Shows a tasteful "Also listed by" section under the main agent card,
 * plus a small "Not the same apartment?" report link so buyers can flag
 * bad clusters back to admin.
 */

import { useState } from 'react';
import { ChevronRight, Building2, Flag, Loader2 } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import type { CoAgent } from '@/types/database';

interface CoListingAgentsProps {
  coAgents: CoAgent[];
  propertyId?: string;
  primaryAgencyId?: string | null;
  className?: string;
}

const SOURCE_LABELS: Record<string, string> = {
  yad2: 'Yad2',
  madlan: 'Madlan',
  website: 'Agency site',
};

function ReportDialog({
  propertyId, open, onOpenChange,
}: {
  propertyId: string;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const { user } = useAuth();
  const [reason, setReason] = useState('');
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const close = () => {
    setReason('');
    setEmail('');
    onOpenChange(false);
  };

  const handleSubmit = async () => {
    if (!user && !email.trim()) {
      toast.error('Please provide an email so our team can follow up.');
      return;
    }
    setSubmitting(true);
    try {
      const { error } = await (supabase.rpc as any)('file_colisting_report', {
        p_property_id: propertyId,
        p_reason: reason.trim() || null,
        p_reporter_email: user ? null : email.trim() || null,
      });
      if (error) throw error;
      toast.success('Thanks — our team will review this cluster.');
      close();
    } catch (err) {
      toast.error(`Couldn't submit: ${(err as Error).message}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && close()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted mb-2">
            <Flag className="h-6 w-6 text-muted-foreground" />
          </div>
          <DialogTitle className="text-center">Report wrong cluster</DialogTitle>
          <DialogDescription className="text-center">
            Think these listings aren't actually the same apartment? Tell us what you noticed — our
            team reviews every report.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor="cluster-report-reason">What looks wrong? (optional)</Label>
            <Textarea
              id="cluster-report-reason"
              placeholder="e.g. different floor, different photos, different size…"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              className="rounded-xl"
              maxLength={500}
            />
          </div>
          {!user && (
            <div className="space-y-2">
              <Label htmlFor="cluster-report-email">Your email</Label>
              <Input
                id="cluster-report-email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="rounded-xl"
              />
              <p className="text-xs text-muted-foreground">
                Only used to follow up if we have questions.
              </p>
            </div>
          )}
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={close} className="rounded-xl" disabled={submitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} className="rounded-xl" disabled={submitting}>
            {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Submit report
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function CoListingAgents({ coAgents, propertyId, className }: CoListingAgentsProps) {
  const [reportOpen, setReportOpen] = useState(false);

  if (!coAgents || coAgents.length === 0) return null;

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-center gap-2 mb-2">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          Also listed by
        </p>
      </div>
      <div className="space-y-2">
        {coAgents.map((coAgent) => {
          const agencyName =
            coAgent.agent?.agency?.name ||
            coAgent.agent?.agency_name ||
            'Agency';
          const agencyLogo = coAgent.agent?.agency?.logo_url;
          const agencySlug = coAgent.agent?.agency?.slug;
          const agencyHref = agencySlug ? `/agencies/${agencySlug}` : null;

          const Identity = (
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <Avatar className="h-7 w-7 flex-shrink-0">
                <AvatarImage src={agencyLogo || undefined} alt={agencyName} />
                <AvatarFallback className="bg-muted text-xs">
                  <Building2 className="w-3.5 h-3.5 text-muted-foreground" />
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="text-xs font-medium text-foreground truncate group-hover:text-primary transition-colors">
                  {agencyName}
                </p>
                {coAgent.agent?.name && (
                  <p className="text-xs text-muted-foreground truncate">{coAgent.agent.name}</p>
                )}
              </div>
            </div>
          );

          const rowClass =
            'group flex items-center justify-between gap-3 rounded-lg border border-border bg-muted/20 px-3 py-2 hover:bg-primary/5 hover:border-primary/40 transition-colors cursor-pointer';

          return agencyHref ? (
            <a
              key={coAgent.id}
              href={agencyHref}
              className={rowClass}
              title={`View ${agencyName} on BuyWiseIsrael`}
            >
              {Identity}
              <span className="flex items-center gap-1 text-xs text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0">
                View agency
                <ChevronRight className="w-3.5 h-3.5" />
              </span>
            </a>
          ) : (
            <div key={coAgent.id} className={rowClass.replace('cursor-pointer', '')}>
              {Identity}
            </div>
          );
        })}
      </div>
      <div className="flex items-start justify-between gap-3 flex-wrap pt-1">
        <p className="text-xs text-muted-foreground max-w-[calc(100%-8rem)]">
          This property is listed by multiple agencies — common in Israel where listings aren't exclusive.
        </p>
        {propertyId && (
          <button
            type="button"
            onClick={() => setReportOpen(true)}
            className="text-xs text-muted-foreground hover:text-foreground hover:underline inline-flex items-center gap-1 flex-shrink-0"
          >
            <Flag className="w-3 h-3" />
            Not the same apartment?
          </button>
        )}
      </div>

      {propertyId && (
        <ReportDialog
          propertyId={propertyId}
          open={reportOpen}
          onOpenChange={setReportOpen}
        />
      )}
    </div>
  );
}
