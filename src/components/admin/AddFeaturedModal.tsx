import { useState } from 'react';
import { format, addDays } from 'date-fns';
import { Search, Calendar } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';

interface AddFeaturedModalProps<T> {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  items: T[];
  isLoading: boolean;
  onSelect: (item: T, expiresAt: Date | null) => void;
  renderItem: (item: T) => React.ReactNode;
  getItemId: (item: T) => string;
  getSearchableText: (item: T) => string;
  defaultExpiryDays?: number;
}

export function AddFeaturedModal<T>({
  open,
  onOpenChange,
  title,
  items,
  isLoading,
  onSelect,
  renderItem,
  getItemId,
  getSearchableText,
  defaultExpiryDays = 7,
}: AddFeaturedModalProps<T>) {
  const [search, setSearch] = useState('');
  const [selectedItem, setSelectedItem] = useState<T | null>(null);
  const [noExpiry, setNoExpiry] = useState(false);
  const [expiryDate, setExpiryDate] = useState(format(addDays(new Date(), defaultExpiryDays), 'yyyy-MM-dd'));

  const filteredItems = items.filter(item =>
    getSearchableText(item).toLowerCase().includes(search.toLowerCase())
  );

  const handleConfirm = () => {
    if (!selectedItem) return;
    const expires = noExpiry ? null : new Date(expiryDate);
    onSelect(selectedItem, expires);
    handleClose();
  };

  const handleClose = () => {
    setSearch('');
    setSelectedItem(null);
    setNoExpiry(false);
    setExpiryDate(format(addDays(new Date(), defaultExpiryDays), 'yyyy-MM-dd'));
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Items List */}
          <ScrollArea className="h-[300px] border rounded-lg">
            {isLoading ? (
              <div className="p-4 space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : filteredItems.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                {search ? 'No results found' : 'No available items'}
              </div>
            ) : (
              <div className="p-2 space-y-2">
                {filteredItems.map((item) => (
                  <div
                    key={getItemId(item)}
                    onClick={() => setSelectedItem(item)}
                    className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                      selectedItem && getItemId(selectedItem) === getItemId(item)
                        ? 'border-primary bg-primary/5'
                        : 'border-transparent hover:bg-muted'
                    }`}
                  >
                    {renderItem(item)}
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>

          {/* Expiry Date */}
          {selectedItem && (
            <div className="space-y-3 p-4 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="no-expiry"
                  checked={noExpiry}
                  onCheckedChange={(checked) => setNoExpiry(checked === true)}
                />
                <Label htmlFor="no-expiry" className="text-sm">
                  No expiry date
                </Label>
              </div>

              {!noExpiry && (
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <Input
                    type="date"
                    value={expiryDate}
                    onChange={(e) => setExpiryDate(e.target.value)}
                    min={format(new Date(), 'yyyy-MM-dd')}
                    className="w-auto"
                  />
                  <span className="text-sm text-muted-foreground">
                    ({Math.ceil((new Date(expiryDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} days)
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button onClick={handleConfirm} disabled={!selectedItem}>
              Add to Featured
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
