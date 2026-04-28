import { Loader2 } from 'lucide-react';
import { forwardRef } from 'react';

export const PageLoader = forwardRef<HTMLDivElement>(function PageLoader(_, ref) {
  return (
    <div ref={ref} className="min-h-screen flex items-center justify-center bg-background text-foreground px-6">
      <div className="flex flex-col items-center gap-4 text-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <div>
          <p className="text-lg font-semibold">BuyWise Israel is loading</p>
          <p className="text-sm text-muted-foreground">Preparing property intelligence…</p>
        </div>
      </div>
    </div>
  );
});
