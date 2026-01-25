import { useState } from 'react';
import { Loader2, Info } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

interface DeleteAccountDialogProps {
  hasProfessionalRole?: boolean;
}

export function DeleteAccountDialog({ hasProfessionalRole = false }: DeleteAccountDialogProps) {
  const [open, setOpen] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const { deleteAccount } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const isConfirmed = confirmText.toUpperCase() === 'DELETE';

  const handleDelete = async () => {
    if (!isConfirmed) return;

    setIsDeleting(true);
    try {
      const { error, message } = await deleteAccount();

      if (error) {
        toast({
          title: 'Unable to delete account',
          description: message || 'Please try again or contact support.',
          variant: 'destructive',
        });
        setIsDeleting(false);
        return;
      }

      toast({
        title: 'Account deleted',
        description: 'Your account has been permanently deleted.',
      });

      setOpen(false);
      navigate('/');
    } catch (err) {
      toast({
        title: 'Error',
        description: 'An unexpected error occurred. Please try again.',
        variant: 'destructive',
      });
      setIsDeleting(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <button className="text-xs text-muted-foreground hover:text-foreground transition-colors mt-4 w-full text-center">
          Delete my account
        </button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Account</AlertDialogTitle>
          <AlertDialogDescription className="space-y-3">
            <p>
              This action is <strong>permanent and irreversible</strong>. All your data will be deleted, including:
            </p>
            <ul className="list-disc list-inside text-sm space-y-1 text-muted-foreground">
              <li>Your profile and account settings</li>
              <li>Saved properties and favorites</li>
              <li>Search alerts and notifications</li>
              <li>Property inquiries you've made</li>
              <li>All preferences and activity history</li>
            </ul>
            {hasProfessionalRole && (
              <div className="flex items-start gap-2 bg-primary/10 text-primary border border-primary/20 p-3 rounded-md text-sm">
                <Info className="h-4 w-4 mt-0.5 shrink-0" />
                <p className="font-medium">
                  You have a professional account. Please ensure you've transferred or closed any active listings before proceeding.
                </p>
              </div>
            )}
            <div className="pt-2">
              <Label htmlFor="confirm-delete" className="text-foreground font-medium">
                Type DELETE to confirm
              </Label>
              <Input
                id="confirm-delete"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder="DELETE"
                className="mt-1.5"
                disabled={isDeleting}
              />
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={!isConfirmed || isDeleting}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            {isDeleting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Deleting...
              </>
            ) : (
              'Delete Account'
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
