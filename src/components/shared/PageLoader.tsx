import { forwardRef } from 'react';

export const PageLoader = forwardRef<HTMLDivElement>(function PageLoader(_, ref) {
  return (
    <div ref={ref} className="min-h-screen bg-background" aria-busy="true" aria-label="Loading page">
      <div className="h-0.5 w-full overflow-hidden bg-muted">
        <div className="h-full w-1/3 animate-pulse bg-primary" />
      </div>
    </div>
  );
});
