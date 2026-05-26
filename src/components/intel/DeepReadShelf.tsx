import { Link } from 'react-router-dom';
import { BookOpen } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useIntelDeepReads } from '@/hooks/useIntelDeepRead';
import { CATEGORY_BY_ID } from '@/lib/intel/categories';

export function DeepReadShelf() {
  const { data: items = [], isLoading } = useIntelDeepReads(5);
  if (isLoading || !items.length) return null;

  return (
    <section>
      <header className="mb-5 flex items-end justify-between border-b border-border pb-2">
        <div className="flex items-center gap-2">
          <BookOpen className="h-4 w-4 text-primary" />
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-foreground">
            Deep Reads
          </p>
        </div>
        <p className="hidden text-xs text-muted-foreground sm:block">
          Longer analyses on stories that materially move buyers.
        </p>
      </header>

      <div className="-mx-4 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0">
        <div className="flex gap-5 sm:grid sm:grid-cols-2 lg:grid-cols-3">
          {items.map((d) => {
            const cat = CATEGORY_BY_ID[d.category] ?? CATEGORY_BY_ID.general;
            const headline = d.headline_en || d.headline;
            let when = '';
            try { when = formatDistanceToNow(new Date(d.published_at), { addSuffix: true }); } catch {}
            return (
              <Link
                key={d.take_id}
                to={`/intel/deep/${d.slug}`}
                className="group flex w-[260px] flex-shrink-0 flex-col rounded-md border border-border bg-card p-4 transition-colors hover:border-primary/50 sm:w-auto"
              >
                <div className="mb-2 flex items-center gap-2">
                  <span className="inline-flex items-center gap-1 rounded-sm bg-primary px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-primary-foreground">
                    <BookOpen className="h-2.5 w-2.5" />
                    Deep Read
                  </span>
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                    {cat.label}
                  </span>
                </div>
                <h3 className="text-[17px] font-bold leading-snug text-foreground transition-colors group-hover:text-primary">
                  {headline}
                </h3>
                {d.signal && (
                  <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-muted-foreground">
                    {d.signal}
                  </p>
                )}
                <div className="mt-auto pt-3 text-[11px] uppercase tracking-wider text-muted-foreground tabular-nums">
                  {d.source_name}{when && ` · ${when}`}
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
