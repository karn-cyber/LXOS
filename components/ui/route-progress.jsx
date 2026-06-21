'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';

/**
 * Minimal top progress bar. Starts when an internal link is clicked and
 * completes once the new route renders — gives instant "it's loading" feedback
 * without a heavy full-screen overlay.
 */
export default function RouteProgress() {
    const pathname = usePathname();
    const [visible, setVisible] = useState(false);
    const [progress, setProgress] = useState(0);

    // Route changed → finish the bar.
    useEffect(() => {
        setProgress(100);
        const t = setTimeout(() => { setVisible(false); setProgress(0); }, 250);
        return () => clearTimeout(t);
    }, [pathname]);

    // Start the bar on internal link clicks.
    useEffect(() => {
        const onClick = (e) => {
            const a = e.target?.closest?.('a');
            if (!a) return;
            const href = a.getAttribute('href');
            if (!href || !href.startsWith('/') || a.target === '_blank' || a.hasAttribute('download')) return;
            if (e.metaKey || e.ctrlKey || e.shiftKey) return;
            setVisible(true);
            setProgress(12);
        };
        document.addEventListener('click', onClick, true);
        return () => document.removeEventListener('click', onClick, true);
    }, []);

    // Trickle while waiting.
    useEffect(() => {
        if (!visible || progress >= 90) return;
        const t = setTimeout(() => setProgress(p => Math.min(90, p + (90 - p) * 0.25)), 220);
        return () => clearTimeout(t);
    }, [visible, progress]);

    if (!visible) return null;
    return (
        <div className="fixed top-0 left-0 right-0 z-[100] h-0.5 pointer-events-none">
            <div
                className="h-full bg-primary transition-all duration-200 ease-out shadow-[0_0_8px_var(--primary)]"
                style={{ width: `${progress}%` }}
            />
        </div>
    );
}
