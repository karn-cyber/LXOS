'use client';

import { useEffect } from 'react';
import { useToast } from '@/components/ui/use-toast';

export default function NotificationProvider({ children }) {
    const { toast } = useToast();

    useEffect(() => {
        // Listen for custom notification events
        const handleNotification = (event) => {
            const { title, description, variant = 'default' } = event.detail;
            toast({
                title,
                description,
                variant,
            });
        };

        window.addEventListener('notification', handleNotification);

        return () => {
            window.removeEventListener('notification', handleNotification);
        };
    }, [toast]);

    return <>{children}</>;
}

// Helper function to trigger notifications
export function showNotification({ title, description, variant = 'default' }) {
    if (typeof window !== 'undefined') {
        window.dispatchEvent(
            new CustomEvent('notification', {
                detail: { title, description, variant },
            })
        );
    }
}
