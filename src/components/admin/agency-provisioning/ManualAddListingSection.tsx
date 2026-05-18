import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, PencilLine, Sparkles } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AiListingKickstartDialog } from './AiListingKickstartDialog';

/**
 * Admin shortcut: open the standard agency listing wizard to add a property
 * manually for the agency being provisioned. Two entry points:
 *   1. "Kickstart with AI" — drop screenshots + notes, AI pre-fills the wizard.
 *   2. "New listing" — open the empty wizard.
 */
export function ManualAddListingSection({ agencyId, agencyName }: { agencyId: string; agencyName?: string }) {
  const [aiOpen, setAiOpen] = useState(false);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <PencilLine className="h-4 w-4 text-primary" />
          Add a listing manually
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          Skip the URL import and create a listing by hand for
          {agencyName ? ` ${agencyName}` : ' this agency'} — full wizard with photos,
          pricing context, and amenities. Use AI Kickstart to pre-fill from screenshots
          and notes.
        </p>
        <div className="flex flex-col sm:flex-row gap-2 shrink-0">
          <Button onClick={() => setAiOpen(true)}>
            <Sparkles className="h-4 w-4 mr-2" />
            Kickstart with AI
          </Button>
          <Button variant="outline" asChild>
            <Link to="/agency/properties/new">
              <Plus className="h-4 w-4 mr-2" />
              New listing
            </Link>
          </Button>
        </div>
      </CardContent>

      <AiListingKickstartDialog
        open={aiOpen}
        onOpenChange={setAiOpen}
        agencyId={agencyId}
      />
    </Card>
  );
}
