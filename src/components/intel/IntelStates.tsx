export function IntelSkeleton() {
  return (
    <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="h-56 animate-pulse rounded-lg border border-border bg-muted/40" />
      ))}
    </div>
  );
}

export function IntelEmptyState({ onReset }: { onReset?: () => void }) {
  return (
    <div className="rounded-lg border border-dashed border-border bg-card/50 p-10 text-center">
      <h3 className="text-lg font-semibold text-foreground">Nothing matches that filter right now.</h3>
      <p className="mt-2 text-sm text-muted-foreground">
        Try widening it, or check back in an hour — we refresh hourly.
      </p>
      {onReset && (
        <button
          onClick={onReset}
          className="mt-4 text-sm font-medium text-primary hover:underline"
        >
          Reset filters
        </button>
      )}
    </div>
  );
}
