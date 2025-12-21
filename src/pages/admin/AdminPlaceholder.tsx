import { Card, CardContent } from '@/components/ui/card';
import { Construction } from 'lucide-react';

export default function AdminPlaceholder({ title }: { title: string }) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">{title}</h2>
      </div>
      <Card>
        <CardContent className="text-center py-12">
          <Construction className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">
            This admin section is available for managing {title.toLowerCase()}.
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            Full CRUD functionality can be added as needed.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
