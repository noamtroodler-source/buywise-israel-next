import { useState } from 'react';
import { Mail, CheckCircle2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { subscribeToBrief, useIntelSources } from '@/hooks/useIntel';
import { useToast } from '@/hooks/use-toast';
import { IntelCurationNote } from './IntelCurationNote';

export function IntelSidebar() {
  return (
    <aside className="space-y-8 lg:sticky lg:top-24 lg:self-start">
      <BriefSubscribeCard />
      <IntelCurationNote />
      <SourcesList />
    </aside>
  );
}

export function BriefSubscribeCard() {
  const [email, setEmail] = useState('');
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await subscribeToBrief(email);
      setDone(true);
      toast({ title: "You're on the list.", description: "We'll send the next BuyWise Brief your way." });
    } catch (err) {
      toast({
        title: 'Could not subscribe',
        description: err instanceof Error ? err.message : 'Try again in a moment.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="brief-subscribe" className="border border-border bg-card p-5">
      <div className="flex items-center gap-2">
        <Mail className="h-4 w-4 text-primary" />
        <h3 className="text-base font-bold tracking-tight text-foreground">BuyWise Brief</h3>
      </div>
      <p className="mt-2 text-sm text-muted-foreground">
        One email a week. What changed in Israeli property, mortgages, and tax — and what to do about it.
      </p>
      {done ? (
        <div className="mt-4 flex items-center gap-2 text-sm text-foreground">
          <CheckCircle2 className="h-4 w-4 text-primary" />
          You're subscribed.
        </div>
      ) : (
        <form onSubmit={onSubmit} className="mt-4 space-y-2">
          <Input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
          />
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Subscribing…' : 'Get the Brief'}
          </Button>
        </form>
      )}
    </div>
  );
}

function SourcesList() {
  const { data: sources = [] } = useIntelSources();
  if (!sources.length) return null;
  return (
    <div className="border-t border-border pt-5">
      <h3 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-foreground">
        Sources we read
      </h3>
      <ul className="mt-3 space-y-1.5 text-sm">
        {sources.map((s: any) => (
          <li key={s.id} className="flex items-center justify-between gap-2 text-muted-foreground">
            {s.homepage_url ? (
              <a
                href={s.homepage_url}
                target="_blank"
                rel="noopener noreferrer nofollow"
                className="hover:text-foreground hover:underline"
              >
                {s.name}
              </a>
            ) : (
              <span>{s.name}</span>
            )}
            {s.language === 'he' && (
              <span className="text-[10px] uppercase tracking-wide text-muted-foreground/70">HE</span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
