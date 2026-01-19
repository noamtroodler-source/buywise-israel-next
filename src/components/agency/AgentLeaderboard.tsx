import { useState } from 'react';
import { Trophy, TrendingUp, Eye, MessageSquare, Home, Medal } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface LeaderboardAgent {
  id: string;
  name: string;
  avatar_url: string | null;
  listings_count: number;
  views_count: number;
  inquiries_count: number;
  conversion_rate: number;
}

interface AgentLeaderboardProps {
  agents: LeaderboardAgent[];
  className?: string;
}

type SortMetric = 'listings' | 'views' | 'inquiries' | 'conversion';

const metricConfig = {
  listings: { label: 'Listings', icon: Home, key: 'listings_count' as const },
  views: { label: 'Views', icon: Eye, key: 'views_count' as const },
  inquiries: { label: 'Inquiries', icon: MessageSquare, key: 'inquiries_count' as const },
  conversion: { label: 'Conversion', icon: TrendingUp, key: 'conversion_rate' as const },
};

const rankBadges = [
  { rank: 1, icon: Trophy, color: 'text-yellow-500 bg-yellow-50 border-yellow-200' },
  { rank: 2, icon: Medal, color: 'text-gray-400 bg-gray-50 border-gray-200' },
  { rank: 3, icon: Medal, color: 'text-amber-600 bg-amber-50 border-amber-200' },
];

export function AgentLeaderboard({ agents, className }: AgentLeaderboardProps) {
  const [sortBy, setSortBy] = useState<SortMetric>('views');

  const sortedAgents = [...agents].sort((a, b) => {
    const key = metricConfig[sortBy].key;
    return (b[key] as number) - (a[key] as number);
  });

  const getMetricValue = (agent: LeaderboardAgent, metric: SortMetric) => {
    const value = agent[metricConfig[metric].key];
    if (metric === 'conversion') {
      return `${(value as number).toFixed(1)}%`;
    }
    return (value as number).toLocaleString();
  };

  return (
    <Card className={cn('', className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-500" />
            Team Leaderboard
          </CardTitle>
        </div>
        <Tabs value={sortBy} onValueChange={(v) => setSortBy(v as SortMetric)} className="mt-2">
          <TabsList className="grid grid-cols-4 h-9">
            {Object.entries(metricConfig).map(([key, config]) => (
              <TabsTrigger key={key} value={key} className="text-xs px-2">
                <config.icon className="h-3.5 w-3.5 mr-1.5" />
                {config.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </CardHeader>
      <CardContent>
        {sortedAgents.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Trophy className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No team members yet</p>
          </div>
        ) : (
          <div className="space-y-2">
            {sortedAgents.slice(0, 10).map((agent, index) => {
              const rank = index + 1;
              const rankBadge = rankBadges.find((b) => b.rank === rank);
              const Icon = metricConfig[sortBy].icon;

              return (
                <motion.div
                  key={agent.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={cn(
                    'flex items-center gap-3 p-3 rounded-xl border transition-colors',
                    rank <= 3 ? 'bg-muted/50' : 'hover:bg-muted/30'
                  )}
                >
                  {/* Rank */}
                  <div className="w-8 flex justify-center">
                    {rankBadge ? (
                      <div className={cn('p-1.5 rounded-lg border', rankBadge.color)}>
                        <rankBadge.icon className="h-4 w-4" />
                      </div>
                    ) : (
                      <span className="text-sm font-medium text-muted-foreground">
                        #{rank}
                      </span>
                    )}
                  </div>

                  {/* Agent info */}
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={agent.avatar_url || undefined} />
                    <AvatarFallback className="text-sm">
                      {agent.name?.slice(0, 2).toUpperCase() || 'AG'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{agent.name}</p>
                  </div>

                  {/* Metric value */}
                  <Badge variant="secondary" className="font-semibold">
                    <Icon className="h-3 w-3 mr-1" />
                    {getMetricValue(agent, sortBy)}
                  </Badge>
                </motion.div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
