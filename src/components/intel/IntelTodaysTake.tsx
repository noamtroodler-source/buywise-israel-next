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
import { IntelImage } from './IntelImage';

interface Props {
  article: IntelFeedItem;
}

export function IntelTodaysTake({ article }: Props) {
  const cat = CATEGORY_BY_ID[article.category] ?? CATEGORY_BY_ID.general;
  const headline = displayHeadline(article);
  const excerpt = displayExcerpt(article);
  const ltr = isDisplayedInEnglish(article);
  const translated = isTranslatedFromHebrew(article);
  let when = '';
  try {
    when = formatDistanceToNow(new Date(article.published_at), { addSuffix: true });
  } catch { /* noop */ }

  const onOpen = () => trackIntelClick(article);

  return (
    <article className="group">
      <a href={article.url} target="_blank" rel="noopener noreferrer nofollow" onClick={onOpen} className="block">
        <IntelImage src={article.image_url} alt={headline} aspect="video" rounded />
      </a>

      <p className="mt-5 text-[11px] font-semibold uppercase tracking-[0.2em] text-primary">
        Today's Take · {cat.label}
      </p>
      <a
        href={article.url}
        target="_blank"
        rel="noopener noreferrer nofollow"
        onClick={onOpen}
        className="mt-2 block"
      >
        <h2
          className="text-3xl font-bold leading-[1.1] tracking-tight text-foreground transition-colors hover:text-primary md:text-[2.5rem]"
          dir={ltr ? 'ltr' : 'rtl'}
        >
          {headline}
        </h2>
      </a>
      <div className="mt-3 flex flex-wrap items-center gap-x-2 text-xs text-muted-foreground tabular-nums">
        <span className="font-semibold text-foreground/80">{article.source_name}</span>
        {when && <span>· {when}</span>}
        {translated && (
          <Badge variant="outline" className="border-muted-foreground/30 text-[10px] uppercase tracking-wide">
            HE → EN
          </Badge>
        )}
      </div>

      {excerpt && (
        <p
          className="mt-4 text-base leading-relaxed text-muted-foreground md:text-[17px]"
          dir={ltr ? 'ltr' : 'rtl'}
        >
          {excerpt}
        </p>
      )}

      {article.take_body ? (
        <IntelTakeBlock
          label={article.take_label ?? 'BuyWise Take'}
          body={article.take_body}
          signal={article.signal}
          whyYouCare={article.why_you_care}
          ourMove={article.our_move}
        />
      ) : !ltr ? (
        <p className="mt-4 text-sm italic text-muted-foreground">
          Hebrew source — English BuyWise Take coming shortly.
        </p>
      ) : null}

      <a
        href={article.url}
        target="_blank"
        rel="noopener noreferrer nofollow"
        onClick={onOpen}
        className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
      >
        Read on {article.source_name}
        <ExternalLink className="h-3.5 w-3.5" />
      </a>
    </article>
  );
}
