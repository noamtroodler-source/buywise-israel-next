import { Link } from 'react-router-dom';
import { Plus, PencilLine } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

/**
 * Admin shortcut: open the standard agency listing wizard to add a property
 * manually for the agency being provisioned. Useful when an URL import isn't
 * available (no public listing yet, off-market, demo data, etc.).
 */
export function ManualAddListingSection({ agencyName }: { agencyId: string; agencyName?: string }) {
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
          pricing context, and amenities.
        </p>
        <Button asChild>
          <Link to="/agency/properties/new">
            <Plus className="h-4 w-4 mr-2" />
            New listing
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
