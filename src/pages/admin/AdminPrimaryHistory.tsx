/**
 * AdminPrimaryHistory — audit log viewer for primary-agency transitions.
 *
 * Every time a property's primary agency changes, a row lands here via
 * log_primary_transition(). Admin filters by reason, browses the trail,
 * and follows links into the affected property.
 */
import { useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { formatDistanceToNow, format } from 'date-fns';
import {
  Clock, ArrowRight, History, Search, Building2, Sparkles,
  AlertTriangle, Gavel, ShieldCheck, RefreshCw, UserCog, ArchiveRestore,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import {
  useAdminPrimaryHistory,
  type PrimaryHistoryReason,
} from '@/hooks/useAdminColisting';

const REASON_CONFIG: Record<PrimaryHistoryReason, { label: string; icon: typeof Clock; className: string }> = {
  first_import:        { label: 'First import',       icon: ArchiveRestore, className: 'bg-muted text-muted-foreground' },
  manual_upgrade:      { label: 'Manual upgrade',     icon: ShieldCheck,    className: 'bg-primary/10 text-primary' },
  boost_start:         { label: 'Boost start',        icon: Sparkles,       className: 'bg-semantic-amber/15 text-foreground' },
  boost_end:           { label: 'Boost end',          icon: Clock,          className: 'bg-muted text-muted-foreground' },
  admin_override:      { label: 'Admin override',     icon: UserCog,        className: 'bg-destructive/10 text-destructive' },
  agency_churn:        { label: 'Agency churn',       icon: AlertTriangle,  className: 'bg-destructive/10 text-destructive' },
  stale_demotion:      { label: 'Stale demotion',     icon: RefreshCw,      className: 'bg-muted text-muted-foreground' },
  dispute_resolution:  { label: 'Dispute resolved',   icon: Gavel,          className: 'bg-semantic-amber/15 text-foreground' },
  legacy_migration:    { label: 'Legacy migration',   icon: History,        className: 'bg-muted text-muted-foreground' },
};

function AgencyAvatar({ name, logoUrl, size = 'md' }: { name: string; logoUrl?: string | null; size?: 'sm' | 'md' }) {
  const dims = size === 'sm' ? 'h-6 w-6' : 'h-7 w-7';
  return (
    <Avatar className={cn(dims, 'border border-border/50')}>
      {logoUrl && <AvatarImage src={logoUrl} alt={name} />}
      <AvatarFallback className="bg-muted text-[10px]">
        <Building2 className="h-3 w-3 text-muted-foreground" />
      </AvatarFallback>
    </Avatar>
  );
}

export default function AdminPrimaryHistory() {
  const [reasonFilter, setReasonFilter] = useState<PrimaryHistoryReason | 'all'>('all');
  const [search, setSearch] = useState('');
  const { data: rows = [], isLoading } = useAdminPrimaryHistory({ reason: reasonFilter, limit: 500 });

  const filtered = search
    ? rows.filter((r) => {
        const q = search.toLowerCase();
        return (
          r.property?.title?.toLowerCase().includes(q) ||
          r.property?.city?.toLowerCase().includes(q) ||
          r.property?.address?.toLowerCase().includes(q) ||
          r.new_agency?.name.toLowerCase().includes(q) ||
          r.previous_agency?.name.toLowerCase().includes(q)
        );
      })
    : rows;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 max-w-5xl"
    >
      <div>
        <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
          <History className="w-5 h-5 text-primary" />
          Primary agency history
        </h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          Audit log of every primary-agency transition, filtered by reason. Source of truth for disputes.
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search property, city, or agency..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 rounded-xl"
          />
        </div>
        <Select value={reasonFilter} onValueChange={(v) => setReasonFilter(v as PrimaryHistoryReason | 'all')}>
          <SelectTrigger className="w-[220px] rounded-xl">
            <SelectValue placeholder="All reasons" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All reasons</SelectItem>
            {Object.entries(REASON_CONFIG).map(([key, cfg]) => (
              <SelectItem key={key} value={key}>{cfg.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* List */}
      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full rounded-xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Card className="p-10 text-center rounded-xl">
          <History className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">
            {rows.length === 0 ? 'No primary transitions recorded yet.' : 'No matches for your filters.'}
          </p>
        </Card>
      ) : (
        <div className="space-y-2">
          {filtered.map((r) => {
            const cfg = REASON_CONFIG[r.reason] ?? REASON_CONFIG.first_import;
            const Icon = cfg.icon;
            return (
              <Card key={r.id} className="rounded-xl border-border">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div className="flex items-start gap-3 min-w-0 flex-1">
                      <Badge className={cn('text-xs flex items-center gap-1 flex-shrink-0 mt-0.5', cfg.className)}>
                        <Icon className="h-3 w-3" />
                        {cfg.label}
                      </Badge>
                      <div className="min-w-0 flex-1">
                        {/* Property line */}
                        {r.property ? (
                          <Link
                            to={`/property/${r.property.id}`}
                            className="text-sm font-medium text-foreground hover:text-primary hover:underline truncate block"
                            target="_blank"
                            rel="noreferrer"
                          >
                            {r.property.title || r.property.address || 'Untitled property'}
                          </Link>
                        ) : (
                          <p className="text-sm font-medium text-muted-foreground italic">Property deleted</p>
                        )}
                        {r.property?.city && (
                          <p className="text-xs text-muted-foreground">
                            {r.property.address ? `${r.property.address}, ` : ''}{r.property.city}
                          </p>
                        )}
                        {/* Transition line */}
                        <div className="flex items-center gap-2 mt-2 flex-wrap">
                          {r.previous_agency ? (
                            <div className="flex items-center gap-1.5">
                              <AgencyAvatar name={r.previous_agency.name} logoUrl={r.previous_agency.logo_url} size="sm" />
                              <span className="text-xs text-muted-foreground">{r.previous_agency.name}</span>
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground italic">(no prior primary)</span>
                          )}
                          <ArrowRight className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                          {r.new_agency ? (
                            <div className="flex items-center gap-1.5">
                              <AgencyAvatar name={r.new_agency.name} logoUrl={r.new_agency.logo_url} size="sm" />
                              <span className="text-xs font-medium text-foreground">{r.new_agency.name}</span>
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground italic">deleted agency</span>
                          )}
                        </div>
                        {r.notes && (
                          <p className="text-xs text-muted-foreground mt-1.5 italic">"{r.notes}"</p>
                        )}
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(r.created_at), { addSuffix: true })}
                      </p>
                      <p className="text-[10px] text-muted-foreground/80 mt-0.5">
                        {format(new Date(r.created_at), 'MMM d, yyyy · HH:mm')}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}
