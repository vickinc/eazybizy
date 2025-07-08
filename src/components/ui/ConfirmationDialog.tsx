import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';

interface ConfirmationDialogProps {
  // Dialog state
  open: boolean;
  onOpenChange: (open: boolean) => void;
  
  // Content
  title: string;
  description: string;
  confirmText: string;
  cancelText?: string;
  
  // Actions
  onConfirm: () => void;
  onCancel?: () => void;
  
  // Styling
  confirmButtonVariant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  confirmButtonClassName?: string;
  
  // Optional content
  children?: React.ReactNode;
}

export const ConfirmationDialog: React.FC<ConfirmationDialogProps> = ({
  open,
  onOpenChange,
  title,
  description,
  confirmText,
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
  confirmButtonVariant = 'destructive',
  confirmButtonClassName = 'bg-red-600 hover:bg-red-700 text-white',
  children
}) => {
  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    } else {
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2 text-red-600">
            <AlertTriangle className="h-5 w-5" />
            <span>{title}</span>
          </DialogTitle>
          <DialogDescription>
            {description}
          </DialogDescription>
        </DialogHeader>

        {children && (
          <div>
            {children}
          </div>
        )}

        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={handleCancel}
          >
            {cancelText}
          </Button>
          <Button 
            onClick={onConfirm}
            className={confirmButtonClassName}
          >
            {confirmText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};