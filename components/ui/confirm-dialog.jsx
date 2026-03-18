'use client';

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

export function ConfirmDialog({ open, onOpenChange, title, description, onConfirm, onCancel, confirmText = 'Confirm', cancelText = 'Cancel', variant = 'default' }) {
    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>{title}</AlertDialogTitle>
                    {description && (
                        <AlertDialogDescription>{description}</AlertDialogDescription>
                    )}
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel onClick={onCancel}>
                        {cancelText}
                    </AlertDialogCancel>
                    <AlertDialogAction
                        onClick={onConfirm}
                        className={variant === 'destructive' ? 'bg-red-600 hover:bg-red-700' : ''}
                    >
                        {confirmText}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}

export function InfoDialog({ open, onOpenChange, title, description, confirmText = 'OK' }) {
    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>{title}</AlertDialogTitle>
                    {description && (
                        <AlertDialogDescription>{description}</AlertDialogDescription>
                    )}
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogAction onClick={() => onOpenChange(false)}>
                        {confirmText}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
