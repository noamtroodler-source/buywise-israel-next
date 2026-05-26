import { useMemo } from 'react';

export function IntelDateline() {
  const label = useMemo(() => {
    try {
      const fmt = new Intl.DateTimeFormat('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        timeZone: 'Asia/Jerusalem',
      });
      return fmt.format(new Date());
    } catch {
      return '';
    }
  }, []);

  return (
    <div className="flex items-center justify-between border-y border-border/70 py-2.5 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
      <span className="tabular-nums">{label} · Tel Aviv</span>
      <a href="#brief-subscribe" className="hidden text-primary transition-colors hover:text-primary/80 sm:inline">
        Get the weekly Brief →
      </a>
    </div>
  );
}
