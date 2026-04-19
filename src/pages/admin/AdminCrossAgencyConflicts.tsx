/**
 * AdminCrossAgencyConflicts — /admin/cross-agency-conflicts
 *
 * Super-admin view of all cross-agency duplicate disputes.
 * Admins can resolve any conflict and apply blocklists.
 */
import { Link } from 'react-router-dom';
import { ArrowLeft, ShieldAlert } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CrossAgencyConflictsList } from '@/components/agency/CrossAgencyConflictsList';

export default function AdminCrossAgencyConflicts() {
  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <Link
          to="/admin"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6"
        >
          <ArrowLeft className="w-4 h-4" /> Back to admin
        </Link>

        <header className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <ShieldAlert className="w-6 h-6 text-amber-600" />
            <h1 className="text-3xl font-bold">Cross-Agency Conflicts</h1>
          </div>
          <p className="text-muted-foreground">
            Listings two different agencies tried to import. Resolve ownership to keep the platform clean.
          </p>
        </header>

        <Card className="rounded-2xl mb-6">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">How resolutions work</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-2">
            <p><strong>Co-listing:</strong> Both agencies legitimately represent the listing. No blocklist applied.</p>
            <p><strong>Confirm existing owner:</strong> The attempting agency is blocked from importing this URL again.</p>
            <p><strong>Transfer to attempted:</strong> The original importing agency is blocked from re-importing. Property ownership must be transferred manually.</p>
            <p><strong>Dismiss:</strong> False positive. No action taken.</p>
          </CardContent>
        </Card>

        <CrossAgencyConflictsList isAdmin={true} />
      </div>
    </Layout>
  );
}
