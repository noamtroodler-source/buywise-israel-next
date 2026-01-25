import { useState } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Trash2, AlertTriangle } from 'lucide-react';

interface DeleteConfirmModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entityName: string;
  entityType: 'user' | 'agent' | 'developer' | 'agency';
  onConfirm: () => void;
  isLoading?: boolean;
  warning?: string;
}

export function DeleteConfirmModal({
  open,
  onOpenChange,
  entityName,
  entityType,
  onConfirm,
  isLoading,
  warning,
}: DeleteConfirmModalProps) {
  const [confirmText, setConfirmText] = useState('');

  const handleConfirm = () => {
    if (confirmText === 'DELETE') {
      onConfirm();
      setConfirmText('');
    }
  };

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      setConfirmText('');
    }
    onOpenChange(isOpen);
  };

  const cascadeWarnings: Record<string, string> = {
    user: 'This will delete all user data including favorites, search alerts, inquiries, and any professional profiles.',
    agent: 'This will delete the agent profile, all their listings, and associated inquiries.',
    developer: 'This will delete the developer profile, all their projects, and associated inquiries.',
    agency: 'This will delete the agency and unlink all associated agents (agents will not be deleted).',
  };

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-destructive">
            <Trash2 className="h-5 w-5" />
            Delete {entityType.charAt(0).toUpperCase() + entityType.slice(1)}
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-3">
            <span>
              Are you sure you want to permanently delete{' '}
              <span className="font-semibold">{entityName}</span>?
            </span>
            
            <div className="flex items-start gap-2 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
              <span>{warning || cascadeWarnings[entityType]}</span>
            </div>

            <div className="pt-2">
              <Label htmlFor="confirm-delete" className="text-foreground">
                Type <span className="font-mono font-bold">DELETE</span> to confirm
              </Label>
              <Input
                id="confirm-delete"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value.toUpperCase())}
                placeholder="DELETE"
                className="mt-2"
                autoComplete="off"
              />
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={confirmText !== 'DELETE' || isLoading}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isLoading ? 'Deleting...' : 'Delete Permanently'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
