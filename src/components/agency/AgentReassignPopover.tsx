import { useState } from 'react';
import { ArrowLeftRight, Check, Search } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useReassignProperty } from '@/hooks/useAgentProperties';
import { cn } from '@/lib/utils';

interface TeamAgent {
  id: string;
  name: string;
  avatar_url: string | null;
}

interface AgentReassignPopoverProps {
  propertyId: string;
  currentAgentId: string | null;
  team: TeamAgent[];
}

export function AgentReassignPopover({ propertyId, currentAgentId, team }: AgentReassignPopoverProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [pendingAgent, setPendingAgent] = useState<TeamAgent | null>(null);
  const reassign = useReassignProperty();

  const currentAgent = team.find(a => a.id === currentAgentId);
  const displayName = currentAgent?.name || 'Unassigned';

  const filtered = team.filter(a =>
    a.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleSelect = (agent: TeamAgent) => {
    if (agent.id === currentAgentId) return;
    setPendingAgent(agent);
  };

  const handleConfirm = () => {
    if (!pendingAgent) return;
    reassign.mutate(
      { propertyId, newAgentId: pendingAgent.id, newAgentName: pendingAgent.name },
      { onSuccess: () => { setOpen(false); setPendingAgent(null); setSearch(''); } }
    );
  };

  const handleCancel = () => {
    setPendingAgent(null);
  };

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) { setPendingAgent(null); setSearch(''); }
  };

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <button
          className={cn(
            'group inline-flex items-center gap-1.5 px-2 py-1 rounded-lg text-sm transition-all',
            'hover:bg-primary/10 hover:underline cursor-pointer',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
          )}
          title="Click to reassign"
        >
          <span>{displayName}</span>
          <ArrowLeftRight className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-0" align="start">
        {pendingAgent ? (
          <div className="p-3 space-y-3">
            <p className="text-sm text-center">
              Reassign from <span className="font-semibold">{displayName}</span> to <span className="font-semibold">{pendingAgent.name}</span>?
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1 rounded-lg"
                onClick={handleCancel}
                disabled={reassign.isPending}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                className="flex-1 rounded-lg"
                onClick={handleConfirm}
                disabled={reassign.isPending}
              >
                {reassign.isPending ? 'Saving…' : 'Confirm'}
              </Button>
            </div>
          </div>
        ) : (
          <>
            <div className="p-2 border-b">
              <p className="text-xs font-medium text-muted-foreground mb-2 px-1">Reassign to agent</p>
              {team.length > 4 && (
                <div className="relative">
                  <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    placeholder="Search agents..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="h-8 pl-7 text-sm rounded-lg"
                    autoFocus
                  />
                </div>
              )}
            </div>
            <div className="max-h-[200px] overflow-y-auto p-1">
              {filtered.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-3">No agents found</p>
              ) : (
                filtered.map((agent) => {
                  const isCurrent = agent.id === currentAgentId;
                  return (
                    <button
                      key={agent.id}
                      onClick={() => handleSelect(agent)}
                      disabled={isCurrent}
                      className={cn(
                        'w-full flex items-center gap-2.5 px-2 py-2 rounded-lg text-sm transition-colors text-left',
                        isCurrent
                          ? 'opacity-60 cursor-default'
                          : 'hover:bg-primary/10 cursor-pointer'
                      )}
                    >
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={agent.avatar_url || undefined} className="object-cover" />
                        <AvatarFallback className="text-[10px]">
                          {agent.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="flex-1 truncate">{agent.name}</span>
                      {isCurrent && <Check className="h-3.5 w-3.5 text-primary flex-shrink-0" />}
                    </button>
                  );
                })
              )}
            </div>
          </>
        )}
      </PopoverContent>
    </Popover>
  );
}
