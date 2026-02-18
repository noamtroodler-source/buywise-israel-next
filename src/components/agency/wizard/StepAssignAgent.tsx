import { useState } from 'react';
import { Search, User, CheckCircle2, Users, ArrowRight } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';
import type { AgencyAgent } from '@/hooks/useAgencyManagement';

interface StepAssignAgentProps {
  team: AgencyAgent[];
  selectedAgentId: string | null;
  onSelect: (agentId: string) => void;
  listingCounts?: Record<string, number>;
}

export function StepAssignAgent({ team, selectedAgentId, onSelect, listingCounts = {} }: StepAssignAgentProps) {
  const [search, setSearch] = useState('');

  const filtered = team.filter(agent =>
    agent.name.toLowerCase().includes(search.toLowerCase()) ||
    agent.email.toLowerCase().includes(search.toLowerCase())
  );

  if (team.length === 0) {
    return (
      <div className="space-y-4">
        <div>
          <h2 className="text-xl font-bold text-foreground">Assign to Agent</h2>
          <p className="text-sm text-muted-foreground mt-1">Select a team member to assign this listing to</p>
        </div>
        <div className="text-center py-16 space-y-4">
          <div className="h-16 w-16 rounded-2xl bg-muted flex items-center justify-center mx-auto">
            <Users className="h-8 w-8 text-muted-foreground" />
          </div>
          <div>
            <p className="font-semibold text-foreground">No team members yet</p>
            <p className="text-sm text-muted-foreground mt-1">Invite agents to your agency first before creating listings.</p>
          </div>
          <Button asChild variant="outline" className="rounded-xl">
            <Link to="/agency">
              Go to Agency Dashboard
              <ArrowRight className="h-4 w-4 ml-2" />
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-foreground">Assign to Agent</h2>
        <p className="text-sm text-muted-foreground mt-1">Select a team member to assign this listing to</p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search agents..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10 rounded-xl"
        />
      </div>

      {/* Agent grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {filtered.map((agent) => {
          const isSelected = selectedAgentId === agent.id;
          const listingCount = listingCounts[agent.id] ?? 0;

          return (
            <button
              key={agent.id}
              type="button"
              onClick={() => onSelect(agent.id)}
              className={cn(
                'relative flex items-center gap-4 p-4 rounded-xl border-2 text-left transition-all',
                isSelected
                  ? 'border-primary bg-primary/5 shadow-sm'
                  : 'border-border bg-card hover:border-primary/40 hover:bg-muted/30'
              )}
            >
              {isSelected && (
                <CheckCircle2 className="absolute top-3 right-3 h-4 w-4 text-primary" />
              )}
              <Avatar className="h-12 w-12 flex-shrink-0">
                <AvatarImage src={agent.avatar_url || ''} alt={agent.name} />
                <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                  {agent.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-semibold text-foreground truncate">{agent.name}</p>
                  {agent.is_verified && (
                    <Badge variant="outline" className="text-xs bg-primary/5 text-primary border-primary/20 px-1.5">
                      ✓ Verified
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground truncate mt-0.5">{agent.email}</p>
                <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                  <User className="h-3 w-3" />
                  {listingCount} listing{listingCount !== 1 ? 's' : ''}
                </p>
              </div>
            </button>
          );
        })}
      </div>

      {filtered.length === 0 && search && (
        <p className="text-center text-muted-foreground text-sm py-8">No agents match "{search}"</p>
      )}
    </div>
  );
}
