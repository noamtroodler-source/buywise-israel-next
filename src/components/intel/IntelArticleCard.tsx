import { ExternalLink } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import {
  IntelFeedItem,
  displayHeadline,
  displayExcerpt,
  isDisplayedInEnglish,
  isTranslatedFromHebrew,
  trackIntelClick,
} from '@/hooks/useIntel';
import { CATEGORY_BY_ID } from '@/lib/intel/categories';
import { IntelTakeBlock } from './IntelTakeBlock';
import { cn } from '@/lib/utils';

interface Props {
  article: IntelFeedItem;
  onClick?: (a: IntelFeedItem) => void;
  variant?: 'default' | 'featured';
}

export function IntelArticleCard({ article, onClick, variant = 'default' }: Props) {
  const cat = CATEGORY_BY_ID[article.category] ?? CATEGORY_BY_ID.general;
  const Icon = cat.icon;
  const headline = displayHeadline(article);
  const excerpt = displayExcerpt(article);
  const ltr = isDisplayedInEnglish(article);
  const translated = isTranslatedFromHebrew(article);
  const isFeatured = variant === 'featured';

  let when = '';
  try {
    when = formatDistanceToNow(new Date(article.published_at), { addSuffix: true });
  } catch { /* noop */ }

  const handleClick = () => {
    trackIntelClick(article);
    onClick?.(article);
  };

  return (
    <article
      className={cn(
        'group flex flex-col rounded-lg border border-border bg-card p-5 transition-shadow hover:shadow-md',
        isFeatured && 'md:p-8',
      )}
    >
      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
        <span className="font-medium text-foreground">{article.source_name}</span>
        {when && <span>· {when}</span>}
        {translated && (
          <Badge variant="outline" className="border-muted-foreground/30 text-[10px] uppercase tracking-wide">
            HE → EN
          </Badge>
        )}
        <span className="ml-auto inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">
          <Icon className="h-3 w-3" />
          {cat.label}
        </span>
      </div>

      <h3
        className={cn(
          'mt-3 font-semibold text-foreground',
          isFeatured ? 'text-2xl md:text-3xl leading-tight' : 'text-lg leading-snug',
        )}
        dir={ltr ? 'ltr' : 'rtl'}
      >
        {headline}
      </h3>

      {excerpt && (
        <p
          className={cn(
            'mt-2 text-muted-foreground',
            isFeatured ? 'text-base md:text-lg' : 'text-sm',
          )}
          dir={ltr ? 'ltr' : 'rtl'}
        >
          {excerpt}
        </p>
      )}
      {!excerpt && !ltr && !article.take_body && (
        <p className="mt-2 text-sm italic text-muted-foreground">
          Hebrew article — we'll add an English BuyWise Take shortly.
        </p>
      )}

      {article.take_body && (
        <IntelTakeBlock label={article.take_label ?? 'BuyWise Take'} body={article.take_body} />
      )}

      <div className="mt-4 flex items-center justify-between">
        <a
          href={article.url}
          target="_blank"
          rel="noopener noreferrer nofollow"
          onClick={handleClick}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
        >
          Read on {article.source_name}
          <ExternalLink className="h-3.5 w-3.5" />
        </a>
        {isFeatured && cat.ctaHref && (
          <a
            href={cat.ctaHref}
            className="text-sm text-muted-foreground hover:text-foreground underline-offset-4 hover:underline"
          >
            {cat.ctaLabel} →
          </a>
        )}
      </div>
    </article>
  );
}
