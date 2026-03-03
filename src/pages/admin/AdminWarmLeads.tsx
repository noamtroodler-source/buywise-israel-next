import { useState } from 'react';
import { Flame, Mail, Copy, Check, User, Heart, BookOpen, Target, MessageCircle } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { useWarmLeads, useRetentionEmailsLog, WarmUser } from '@/hooks/useWarmLeads';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

function HeatBadge({ score }: { score: number }) {
  const level = score >= 30 ? 'hot' : score >= 15 ? 'warm' : 'mild';
  return (
    <Badge className={cn(
      'font-mono text-xs',
      level === 'hot' && 'bg-destructive text-destructive-foreground',
      level === 'warm' && 'bg-accent text-accent-foreground',
      level === 'mild' && 'bg-muted text-muted-foreground',
    )}>
      <Flame className="h-3 w-3 mr-1" />
      {score}
    </Badge>
  );
}

function CopyEmailButton({ email }: { email: string | null }) {
  const [copied, setCopied] = useState(false);
  if (!email) return <span className="text-muted-foreground text-xs">—</span>;
  
  const handleCopy = () => {
    navigator.clipboard.writeText(email);
    setCopied(true);
    toast.success('Email copied');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Button variant="ghost" size="sm" onClick={handleCopy} className="h-7 px-2 text-xs">
      {copied ? <Check className="h-3 w-3 mr-1" /> : <Copy className="h-3 w-3 mr-1" />}
      {copied ? 'Copied' : 'Copy'}
    </Button>
  );
}

function WarmUsersTab() {
  const { data: users, isLoading } = useWarmLeads();

  if (isLoading) {
    return (
      <div className="space-y-3 mt-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  if (!users?.length) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <User className="h-10 w-10 mx-auto mb-3 opacity-40" />
        <p>No warm leads yet. Users will appear here as they engage with the platform.</p>
      </div>
    );
  }

  // Summary stats
  const hotCount = users.filter(u => u.heat_score >= 30).length;
  const withProfile = users.filter(u => u.has_buyer_profile).length;
  const avgScore = Math.round(users.reduce((s, u) => s + u.heat_score, 0) / users.length);

  return (
    <div className="space-y-4 mt-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Card>
          <CardContent className="py-3 px-4 flex items-center gap-3">
            <Flame className="h-5 w-5 text-destructive" />
            <div>
              <p className="text-2xl font-bold">{hotCount}</p>
              <p className="text-xs text-muted-foreground">Hot leads (30+)</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-3 px-4 flex items-center gap-3">
            <Target className="h-5 w-5 text-primary" />
            <div>
              <p className="text-2xl font-bold">{withProfile}</p>
              <p className="text-xs text-muted-foreground">With buyer profile</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-3 px-4 flex items-center gap-3">
            <Flame className="h-5 w-5 text-accent-foreground" />
            <div>
              <p className="text-2xl font-bold">{avgScore}</p>
              <p className="text-xs text-muted-foreground">Avg heat score</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>User</TableHead>
            <TableHead className="text-center"><Heart className="h-3.5 w-3.5 inline" /> Saves</TableHead>
            <TableHead className="text-center"><BookOpen className="h-3.5 w-3.5 inline" /> Guides</TableHead>
            <TableHead>Profile</TableHead>
            <TableHead>Target Cities</TableHead>
            <TableHead>Last Active</TableHead>
            <TableHead>Score</TableHead>
            <TableHead></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => (
            <TableRow key={user.id}>
              <TableCell>
                <div>
                  <p className="font-medium text-sm">{user.full_name || 'Anonymous'}</p>
                  <p className="text-xs text-muted-foreground">{user.email}</p>
                </div>
              </TableCell>
              <TableCell className="text-center font-mono">{user.favorites_count}</TableCell>
              <TableCell className="text-center font-mono">{user.guides_read}</TableCell>
              <TableCell>
                {user.has_buyer_profile ? (
                  <Badge variant="secondary" className="text-xs">Yes</Badge>
                ) : (
                  <span className="text-muted-foreground text-xs">—</span>
                )}
              </TableCell>
              <TableCell>
                <div className="flex flex-wrap gap-1">
                  {user.target_cities.slice(0, 3).map(city => (
                    <Badge key={city} variant="outline" className="text-xs">{city}</Badge>
                  ))}
                  {user.target_cities.length > 3 && (
                    <Badge variant="outline" className="text-xs">+{user.target_cities.length - 3}</Badge>
                  )}
                </div>
              </TableCell>
              <TableCell className="text-xs text-muted-foreground">
                {user.last_active_at 
                  ? formatDistanceToNow(new Date(user.last_active_at), { addSuffix: true })
                  : '—'}
              </TableCell>
              <TableCell><HeatBadge score={user.heat_score} /></TableCell>
              <TableCell><CopyEmailButton email={user.email} /></TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function EmailLogTab() {
  const { data: logs, isLoading } = useRetentionEmailsLog();

  if (isLoading) {
    return (
      <div className="space-y-3 mt-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  if (!logs?.length) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <Mail className="h-10 w-10 mx-auto mb-3 opacity-40" />
        <p>No retention emails sent yet. They'll appear here once the daily cron runs.</p>
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Recipient</TableHead>
          <TableHead>Trigger</TableHead>
          <TableHead>Sent</TableHead>
          <TableHead>Details</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {logs.map((log) => (
          <TableRow key={log.id}>
            <TableCell className="text-sm">{log.user_email || log.user_id.slice(0, 8)}</TableCell>
            <TableCell>
              <Badge variant="outline" className="text-xs capitalize">
                {log.trigger_type.replace(/_/g, ' ')}
              </Badge>
            </TableCell>
            <TableCell className="text-xs text-muted-foreground">
              {format(new Date(log.sent_at), 'MMM d, yyyy HH:mm')}
            </TableCell>
            <TableCell className="text-xs text-muted-foreground max-w-[200px] truncate">
              {log.metadata ? JSON.stringify(log.metadata).slice(0, 80) : '—'}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

export default function AdminWarmLeads() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <Flame className="h-5 w-5 text-destructive" />
          Warm Leads
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Highest-intent users ranked by engagement signals — your lightweight CRM.
        </p>
      </div>

      <Tabs defaultValue="users">
        <TabsList>
          <TabsTrigger value="users">
            <Flame className="h-4 w-4 mr-1.5" />
            Warm Users
          </TabsTrigger>
          <TabsTrigger value="emails">
            <Mail className="h-4 w-4 mr-1.5" />
            Retention Emails
          </TabsTrigger>
        </TabsList>
        <TabsContent value="users"><WarmUsersTab /></TabsContent>
        <TabsContent value="emails"><EmailLogTab /></TabsContent>
      </Tabs>
    </div>
  );
}
