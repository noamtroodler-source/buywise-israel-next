import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from "@/components/ui/dialog";
import {
  useAgencySources,
  useAgencySourceStats,
  useCreateAgencySource,
  useUpdateAgencySource,
  useDeleteAgencySource,
  useTriggerSourceSync,
  useTriggerNightlySync,
  type AgencySource,
} from "@/hooks/useAgencySources";
import { useAuth } from "@/hooks/useAuth";
import { SourceHealthBadge } from "@/components/agency/SourceHealthBadge";
import { Pause, Play, Trash2, RefreshCw, Plus, Globe, Zap, Building2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

function DocTitle({ title }: { title: string }) {
  if (typeof document !== "undefined") document.title = title;
  return null;
}

const SOURCE_ICONS: Record<string, typeof Globe> = {
  yad2: Zap,
  madlan: Building2,
  website: Globe,
};

const SOURCE_LABELS: Record<string, string> = {
  yad2: "Yad2",
  madlan: "Madlan",
  website: "Agency Website",
};

export default function AgencySources() {
  const { user } = useAuth();

  // Resolve current agency from the agent record
  const { data: myAgency } = useQuery({
    queryKey: ["my-agency", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from("agents")
        .select("agency_id, agencies:agency_id (id, name)")
        .eq("user_id", user.id)
        .maybeSingle();
      if (error) throw error;
      return data?.agencies as { id: string; name: string } | null;
    },
    enabled: !!user?.id,
  });

  const agencyId = myAgency?.id;
  const { data: sources, isLoading } = useAgencySources(agencyId);
  const { data: stats } = useAgencySourceStats();
  const createMutation = useCreateAgencySource();
  const updateMutation = useUpdateAgencySource();
  const deleteMutation = useDeleteAgencySource();
  const syncOne = useTriggerSourceSync();
  const syncAll = useTriggerNightlySync();

  const [addOpen, setAddOpen] = useState(false);
  const [newType, setNewType] = useState<"yad2" | "madlan" | "website">("yad2");
  const [newUrl, setNewUrl] = useState("");
  const [newNotes, setNewNotes] = useState("");

  const mySources = (sources || []).filter((s) => s.agency_id === agencyId);
  const healthy = mySources.filter((s) => s.is_active && s.consecutive_failures === 0).length;
  const failing = mySources.filter((s) => s.is_active && s.consecutive_failures >= 3).length;

  return (
    <>
      <DocTitle title="Listing Sources — Agency Portal" />

      <div className="container mx-auto max-w-5xl space-y-6 px-4 py-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Listing Sources</h1>
            <p className="text-muted-foreground">
              Connect Yad2, Madlan, and your agency website. We auto-sync nightly and merge duplicates by trust priority.
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => syncAll.mutate()}
              disabled={syncAll.isPending || mySources.length === 0}
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${syncAll.isPending ? "animate-spin" : ""}`} />
              Sync all now
            </Button>
            <Dialog open={addOpen} onOpenChange={setAddOpen}>
              <DialogTrigger asChild>
                <Button disabled={!agencyId}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add source
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add a listing source</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Source type</Label>
                    <Select value={newType} onValueChange={(v) => setNewType(v as typeof newType)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="yad2">Yad2 (highest trust)</SelectItem>
                        <SelectItem value="madlan">Madlan</SelectItem>
                        <SelectItem value="website">Agency website</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Trust priority: Yad2 → Madlan → Website. Higher-trust prices/sizes win on conflict.
                    </p>
                  </div>
                  <div>
                    <Label>URL</Label>
                    <Input
                      value={newUrl}
                      onChange={(e) => setNewUrl(e.target.value)}
                      placeholder="https://www.yad2.co.il/realestate/..."
                    />
                  </div>
                  <div>
                    <Label>Notes (optional)</Label>
                    <Input
                      value={newNotes}
                      onChange={(e) => setNewNotes(e.target.value)}
                      placeholder="e.g. Tel Aviv resale page"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setAddOpen(false)}>
                    Cancel
                  </Button>
                  <Button
                    onClick={() => {
                      if (!agencyId || !newUrl.trim()) return;
                      createMutation.mutate(
                        {
                          agency_id: agencyId,
                          source_type: newType,
                          source_url: newUrl.trim(),
                          notes: newNotes.trim() || undefined,
                        },
                        {
                          onSuccess: () => {
                            setAddOpen(false);
                            setNewUrl("");
                            setNewNotes("");
                          },
                        }
                      );
                    }}
                    disabled={createMutation.isPending || !newUrl.trim()}
                  >
                    Add
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <StatCard label="Total sources" value={mySources.length} />
          <StatCard label="Healthy" value={healthy} accent="success" />
          <StatCard label="Failing" value={failing} accent={failing > 0 ? "destructive" : "default"} />
          <StatCard label="Active globally" value={stats?.active ?? 0} />
        </div>

        {/* Sources list */}
        <Card>
          <CardHeader>
            <CardTitle>Your sources</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {isLoading && (
              <>
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
              </>
            )}
            {!isLoading && mySources.length === 0 && (
              <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
                No sources yet. Add Yad2 first (highest trust), then Madlan, then your website — we'll merge automatically.
              </div>
            )}
            {mySources.map((src) => (
              <SourceRow
                key={src.id}
                source={src}
                onSync={() => syncOne.mutate(src)}
                onTogglePause={() =>
                  updateMutation.mutate({ id: src.id, updates: { is_active: !src.is_active } })
                }
                onDelete={() => {
                  if (confirm("Remove this source? Existing listings stay.")) {
                    deleteMutation.mutate(src.id);
                  }
                }}
                isSyncing={syncOne.isPending}
              />
            ))}
          </CardContent>
        </Card>
      </div>
    </>
  );
}

function StatCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: number;
  accent?: "success" | "destructive" | "default";
}) {
  const accentClass =
    accent === "success"
      ? "text-success"
      : accent === "destructive"
      ? "text-destructive"
      : "text-foreground";
  return (
    <Card>
      <CardContent className="p-4">
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className={`text-2xl font-bold ${accentClass}`}>{value}</div>
      </CardContent>
    </Card>
  );
}

function SourceRow({
  source,
  onSync,
  onTogglePause,
  onDelete,
  isSyncing,
}: {
  source: AgencySource;
  onSync: () => void;
  onTogglePause: () => void;
  onDelete: () => void;
  isSyncing: boolean;
}) {
  const Icon = SOURCE_ICONS[source.source_type] || Globe;
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-lg border p-3">
      <Icon className="h-5 w-5 text-muted-foreground" />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary">{SOURCE_LABELS[source.source_type] || source.source_type}</Badge>
          <SourceHealthBadge
            consecutiveFailures={source.consecutive_failures}
            lastSyncedAt={source.last_synced_at}
            isActive={source.is_active}
          />
          {source.last_synced_at && (
            <span className="text-xs text-muted-foreground">
              Last synced {formatDistanceToNow(new Date(source.last_synced_at), { addSuffix: true })}
            </span>
          )}
          {source.last_sync_listings_found > 0 && (
            <span className="text-xs text-muted-foreground">
              · {source.last_sync_listings_found} listings last run
            </span>
          )}
        </div>
        <a
          href={source.source_url}
          target="_blank"
          rel="noopener noreferrer"
          className="block truncate text-sm text-muted-foreground hover:text-foreground hover:underline"
        >
          {source.source_url}
        </a>
        {source.last_failure_reason && source.consecutive_failures > 0 && (
          <p className="mt-1 text-xs text-destructive">
            Last error: {source.last_failure_reason}
          </p>
        )}
      </div>
      <div className="flex gap-1">
        <Button size="sm" variant="outline" onClick={onSync} disabled={isSyncing || !source.is_active}>
          <RefreshCw className={`h-4 w-4 ${isSyncing ? "animate-spin" : ""}`} />
        </Button>
        <Button size="sm" variant="outline" onClick={onTogglePause}>
          {source.is_active ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
        </Button>
        <Button size="sm" variant="outline" onClick={onDelete}>
          <Trash2 className="h-4 w-4 text-destructive" />
        </Button>
      </div>
    </div>
  );
}
