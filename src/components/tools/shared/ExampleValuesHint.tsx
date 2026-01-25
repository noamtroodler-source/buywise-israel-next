import { Lightbulb } from 'lucide-react';

export function ExampleValuesHint() {
  return (
    <p className="text-xs text-muted-foreground flex items-center gap-1.5 mb-3">
      <Lightbulb className="h-3 w-3 shrink-0" />
      <span>Example values shown — adjust for your situation</span>
    </p>
  );
}
