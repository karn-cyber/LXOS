'use client';

import { Printer } from 'lucide-react';

export default function PrintButton() {
    return (
        <button
            onClick={() => window.print()}
            className="print:hidden inline-flex items-center gap-1.5 bg-primary text-white text-sm font-medium rounded-lg px-4 h-9 hover:bg-primary/90"
        >
            <Printer className="h-4 w-4" /> Print / Save as PDF
        </button>
    );
}
