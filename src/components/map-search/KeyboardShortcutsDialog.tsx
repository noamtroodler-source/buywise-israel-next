import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { KEYBOARD_SHORTCUTS } from '@/hooks/useMapKeyboardShortcuts';

interface KeyboardShortcutsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function KeyboardShortcutsDialog({ open, onOpenChange }: KeyboardShortcutsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Keyboard Shortcuts</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 mt-2">
          {KEYBOARD_SHORTCUTS.map((s) => (
            <div key={s.key} className="contents">
              <kbd className="inline-flex items-center justify-center h-6 min-w-[24px] px-1.5 rounded border border-border bg-muted text-xs font-mono text-muted-foreground">
                {s.key}
              </kbd>
              <span className="text-sm text-foreground self-center">{s.description}</span>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
