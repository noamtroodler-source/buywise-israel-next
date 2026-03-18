import { useState } from 'react';
import { useNeighborhoodProfile } from '@/hooks/useNeighborhoodProfile';
import { MapPin, Sparkles } from 'lucide-react';

interface NeighborhoodContextCardProps {
  city: string;
  neighborhood: string | null | undefined;
}

/** Truncate text to roughly the first two sentences. */
function truncateToSentences(text: string, count = 2): { truncated: string; isTruncated: boolean } {
  // Match sentence-ending punctuation followed by a space or end
  const sentenceEnds = [...text.matchAll(/[.!?](?:\s|$)/g)];
  if (sentenceEnds.length <= count) {
    return { truncated: text, isTruncated: false };
  }
  const cutoff = sentenceEnds[count - 1].index! + 1;
  return { truncated: text.slice(0, cutoff).trim(), isTruncated: true };
}

export function NeighborhoodContextCard({ city, neighborhood }: NeighborhoodContextCardProps) {
  const { data: profile, isLoading } = useNeighborhoodProfile(city, neighborhood);
  const [expanded, setExpanded] = useState(false);

  if (isLoading || !profile) return null;
  if (!profile.narrative) return null;

  const { truncated, isTruncated } = truncateToSentences(profile.narrative);
  const displayText = expanded ? profile.narrative : truncated;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <MapPin className="h-4 w-4 text-primary" />
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          Neighborhood Guide
        </p>
      </div>

      {/* Narrative — blockquote style */}
      <div className="border-l-2 border-primary/20 pl-4">
        <p className="text-sm leading-relaxed text-foreground/80">
          {displayText}
        </p>
        {isTruncated && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-xs font-medium text-primary hover:text-primary/80 mt-1.5 transition-colors"
          >
            {expanded ? 'Show less' : 'Read more'}
          </button>
        )}
      </div>

      {/* Best For callout */}
      {profile.best_for && (
        <div className="flex gap-2.5 rounded-lg bg-primary/5 px-4 py-3">
          <Sparkles className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
          <p className="text-sm text-foreground">
            <span className="font-semibold text-primary">Best for: </span>
            {profile.best_for}
          </p>
        </div>
      )}
    </div>
  );
}
