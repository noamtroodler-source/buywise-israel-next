import { useSearchParams } from 'react-router-dom';
import { Link } from 'react-router-dom';
import { Coins, AlertTriangle, Clock, ShoppingCart, History, ExternalLink } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { differenceInDays, format } from 'date-fns';
import { useSubscription } from '@/hooks/useSubscription';
import { useExpiringCredits } from '@/hooks/useExpiringCredits';
import { CreditHistoryTable } from './CreditHistoryTable';
import { BoostMarketplace } from './BoostMarketplace';

interface CreditWalletProps {
  entityType: 'agency' | 'developer';
  entityId: string | undefined;
  entityName: string;
}

export function CreditWallet({ entityType, entityId, entityName }: CreditWalletProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') === 'spend' ? 'spend' : 'history';

  const { data: sub } = useSubscription();
  const creditBalance = sub?.creditBalance ?? 0;
  const { data: expiringGroups = [] } = useExpiringCredits(entityType, entityId);

  const handleTabChange = (value: string) => {
    if (value === 'spend') {
      setSearchParams({ tab: 'spend' }, { replace: true });
    } else {
      setSearchParams({}, { replace: true });
    }
  };

  // Nearest expiry within 30 days
  const nearestExpiry = expiringGroups[0];
  const nearestDaysLeft = nearestExpiry
    ? differenceInDays(new Date(nearestExpiry.expiresAt), new Date())
    : null;
  const showExpiryWarning =
    nearestExpiry && nearestDaysLeft !== null && nearestDaysLeft <= 30;

  return (
    <div className="space-y-6">
      {/* Top cards row */}
      <div className="grid gap-4 sm:grid-cols-2">
        {/* Balance hero card */}
        <Card className="rounded-2xl border-primary/15 bg-gradient-to-br from-primary/8 via-primary/4 to-transparent">
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-11 w-11 rounded-xl bg-primary/15 flex items-center justify-center">
                <Coins className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">Credit Balance</p>
                <p className="text-3xl font-bold text-foreground">{creditBalance.toLocaleString()}</p>
              </div>
            </div>

            <p className="text-sm text-muted-foreground">
              ≈ ₪{(creditBalance * 20).toLocaleString()} in visibility value
            </p>

            {showExpiryWarning && nearestDaysLeft !== null && (
              <div
                className={`flex items-center gap-2 text-xs font-medium rounded-lg px-3 py-2 ${
                  nearestDaysLeft <= 7
                    ? 'bg-destructive/10 text-destructive'
                    : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                }`}
              >
                <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0" />
                {nearestExpiry!.amount} credits expire in {nearestDaysLeft} day{nearestDaysLeft !== 1 ? 's' : ''}
                {' '}({format(new Date(nearestExpiry!.expiresAt), 'MMM d')})
              </div>
            )}

            <div className="flex gap-2 pt-1">
              <Button size="sm" asChild className="rounded-xl flex-1">
                <Link to="/pricing#credits">
                  <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
                  Buy Credits
                </Link>
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="rounded-xl flex-1"
                onClick={() => handleTabChange('spend')}
              >
                <ShoppingCart className="h-3.5 w-3.5 mr-1.5" />
                Spend Credits
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Expiry timeline card */}
        <Card className="rounded-2xl border-border">
          <CardContent className="p-6 space-y-3">
            <div className="flex items-center gap-2 mb-1">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <p className="text-sm font-semibold text-foreground">Expiry Schedule</p>
            </div>

            {expiringGroups.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-6 text-center">
                <p className="text-sm text-muted-foreground">
                  {creditBalance === 0
                    ? 'No credits in your wallet'
                    : 'All your credits are non-expiring'}
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {expiringGroups.map((group) => {
                  const daysLeft = differenceInDays(new Date(group.expiresAt), new Date());
                  const isUrgent = daysLeft <= 7;
                  const isWarning = daysLeft <= 30;
                  return (
                    <div
                      key={group.expiresAt}
                      className={`flex items-center justify-between rounded-lg px-3 py-2.5 text-xs border ${
                        isUrgent
                          ? 'border-destructive/20 bg-destructive/5 text-destructive'
                          : isWarning
                          ? 'border-amber-500/20 bg-amber-500/5 text-amber-600 dark:text-amber-400'
                          : 'border-border/50 bg-muted/30 text-muted-foreground'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        {isUrgent ? (
                          <AlertTriangle className="h-3 w-3 flex-shrink-0" />
                        ) : (
                          <Clock className="h-3 w-3 flex-shrink-0" />
                        )}
                        <span>
                          <span className="font-semibold">{group.amount} credits</span>
                          {' — '}expires {format(new Date(group.expiresAt), 'MMMM d, yyyy')}
                        </span>
                      </div>
                      <span className="font-medium whitespace-nowrap ml-2">
                        {daysLeft <= 0 ? 'Today' : `${daysLeft}d`}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Tabbed lower section */}
      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsList className="rounded-xl">
          <TabsTrigger value="history" className="rounded-lg gap-1.5">
            <History className="h-3.5 w-3.5" />
            Transaction History
          </TabsTrigger>
          <TabsTrigger value="spend" className="rounded-lg gap-1.5">
            <ShoppingCart className="h-3.5 w-3.5" />
            Spend Credits
          </TabsTrigger>
        </TabsList>

        <TabsContent value="history" className="mt-5">
          <CreditHistoryTable />
        </TabsContent>

        <TabsContent value="spend" className="mt-5">
          <BoostMarketplace
            entityType={entityType}
            entityId={entityId}
            entityName={entityName}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
