import { Construction } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface ToolPlaceholderProps {
  toolName?: string;
}

export function ToolPlaceholder({ toolName }: ToolPlaceholderProps) {
  return (
    <Card className="max-w-2xl mx-auto">
      <CardContent className="py-16 text-center">
        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-6">
          <Construction className="h-8 w-8 text-muted-foreground" />
        </div>
        <h2 className="text-xl font-semibold text-foreground mb-2">
          Coming Soon
        </h2>
        <p className="text-muted-foreground">
          {toolName ? `The ${toolName} is currently being rebuilt.` : 'This tool is currently being rebuilt.'}
        </p>
      </CardContent>
    </Card>
  );
}
