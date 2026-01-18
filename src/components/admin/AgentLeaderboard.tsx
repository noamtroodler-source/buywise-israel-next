import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Users, TrendingUp, MessageSquare, Eye, Home } from 'lucide-react';
import { AgentPerformanceStats } from '@/hooks/useAgentPerformance';
import { Link } from 'react-router-dom';

interface AgentLeaderboardProps {
  data: AgentPerformanceStats | undefined;
  isLoading?: boolean;
  limit?: number;
}

export function AgentLeaderboard({ data, isLoading, limit = 10 }: AgentLeaderboardProps) {
  if (isLoading) {
    return (
      <Card className="rounded-2xl border-border/50">
        <CardHeader>
          <CardTitle>Agent Leaderboard</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-14 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const agents = (data?.agents || []).slice(0, limit);

  return (
    <Card className="rounded-2xl border-border/50 overflow-hidden">
      <CardHeader className="pb-2 bg-gradient-to-r from-primary/5 to-transparent">
        <CardTitle className="text-lg flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Agent Performance
          </span>
          <Link 
            to="/admin/agents" 
            className="text-sm font-normal text-primary hover:underline"
          >
            View All
          </Link>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-4">
        {/* Summary Stats */}
        <div className="grid grid-cols-4 gap-3 mb-4 pb-4 border-b border-border/50">
          <div className="text-center p-3 rounded-xl bg-primary/5">
            <p className="text-2xl font-bold text-foreground">{data?.totalAgents || 0}</p>
            <p className="text-xs text-muted-foreground">Total Agents</p>
          </div>
          <div className="text-center p-3 rounded-xl bg-primary/10">
            <p className="text-2xl font-bold text-primary">{data?.pendingAgents || 0}</p>
            <p className="text-xs text-muted-foreground">Pending</p>
          </div>
          <div className="text-center p-3 rounded-xl bg-primary/5">
            <p className="text-2xl font-bold text-foreground">{(data?.avgListingsPerAgent || 0).toFixed(1)}</p>
            <p className="text-xs text-muted-foreground">Avg Listings</p>
          </div>
          <div className="text-center p-3 rounded-xl bg-primary/5">
            <p className="text-2xl font-bold text-foreground">{(data?.avgInquiriesPerAgent || 0).toFixed(1)}</p>
            <p className="text-xs text-muted-foreground">Avg Inquiries</p>
          </div>
        </div>

        {/* Status Breakdown */}
        <div className="flex gap-2 mb-4">
          {(data?.statusBreakdown || []).map((status) => (
            <Badge 
              key={status.status} 
              variant={status.status === 'Active' ? 'default' : 'secondary'}
              className="text-xs"
            >
              {status.status}: {status.count}
            </Badge>
          ))}
        </div>

        {/* Leaderboard */}
        {agents.length === 0 ? (
          <div className="h-[200px] flex items-center justify-center text-muted-foreground">
            No agent data available
          </div>
        ) : (
          <div className="space-y-2 max-h-[400px] overflow-y-auto">
            {agents.map((agent, index) => (
              <div
                key={agent.id}
                className="flex items-center justify-between p-3 rounded-xl bg-muted/30 hover:bg-primary/5 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                    {index + 1}
                  </div>
                  <Avatar className="h-9 w-9 border-2 border-primary/20">
                    <AvatarImage src={agent.avatarUrl || undefined} alt={agent.name} />
                    <AvatarFallback className="text-xs bg-primary/10 text-primary">
                      {agent.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium text-sm text-foreground">{agent.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {agent.agencyName || 'Independent'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-xs">
                  <div className="text-center">
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Home className="h-3 w-3" />
                      <span className="font-medium text-foreground">{agent.activeListings}</span>
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Eye className="h-3 w-3" />
                      <span className="font-medium text-foreground">{agent.totalViews.toLocaleString()}</span>
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <MessageSquare className="h-3 w-3" />
                      <span className="font-medium text-foreground">{agent.totalInquiries}</span>
                    </div>
                  </div>
                  <div className="text-center min-w-[50px]">
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <TrendingUp className="h-3 w-3 text-primary" />
                      <span className="font-medium text-primary">{agent.responseRate.toFixed(0)}%</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}