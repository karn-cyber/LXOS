'use client';

import { useState, useEffect } from 'react';
import { FileText, ImageIcon, X, Download, ExternalLink, Loader2 } from 'lucide-react';

// Browsers block top-level navigation to data: URLs (the black screen). Convert
// a data URL to a Blob URL, which opens/renders fine.
function dataURLToBlobURL(dataURL) {
    try {
        const [meta, b64] = dataURL.split(',');
        const mime = (meta.match(/:(.*?);/) || [])[1] || 'application/octet-stream';
        const bin = atob(b64);
        const arr = new Uint8Array(bin.length);
        for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
        return URL.createObjectURL(new Blob([arr], { type: mime }));
    } catch {
        return null;
    }
}

function isImage(bill) {
    return bill.mimeType?.startsWith('image/') || /^data:image\//.test(bill.path || '');
}

export default function BillViewer({ bills }) {
    const [active, setActive] = useState(null); // { bill, blobUrl }
    const [loading, setLoading] = useState(false);

    // Clean up any blob URL when the modal closes / unmounts.
    useEffect(() => {
        return () => { if (active?.blobUrl) URL.revokeObjectURL(active.blobUrl); };
    }, [active]);

    const open = (bill) => {
        setLoading(true);
        // For data: URLs make a blob; for normal http(s) URLs use as-is.
        const blobUrl = bill.path?.startsWith('data:') ? dataURLToBlobURL(bill.path) : bill.path;
        setActive({ bill, blobUrl });
        setLoading(false);
    };

    const close = () => {
        if (active?.blobUrl && active.bill.path?.startsWith('data:')) URL.revokeObjectURL(active.blobUrl);
        setActive(null);
    };

    return (
        <>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {bills.map((bill, i) => (
                    <button
                        key={i}
                        type="button"
                        onClick={() => open(bill)}
                        className="text-left border border-zinc-100 dark:border-zinc-800 rounded-xl overflow-hidden bg-zinc-50 dark:bg-zinc-900 hover:border-zinc-300 transition-colors"
                    >
                        {isImage(bill) ? (
                            <img src={bill.path} alt={bill.originalName} className="w-full h-36 object-cover" />
                        ) : (
                            <div className="w-full h-36 flex flex-col items-center justify-center gap-1 text-zinc-300">
                                <FileText className="h-8 w-8" />
                                <span className="text-[10px] text-zinc-400 uppercase">{(bill.mimeType || 'file').split('/').pop()}</span>
                            </div>
                        )}
                        <div className="p-2">
                            <p className="text-[10px] text-zinc-500 truncate">{bill.originalName}</p>
                        </div>
                    </button>
                ))}
            </div>

            {active && (
                <div className="fixed inset-0 z-50 bg-black/80 flex flex-col" onClick={close}>
                    <div className="flex items-center justify-between px-4 py-3 text-white shrink-0" onClick={e => e.stopPropagation()}>
                        <span className="text-sm truncate">{active.bill.originalName}</span>
                        <div className="flex items-center gap-2">
                            {active.blobUrl && (
                                <>
                                    <a href={active.blobUrl} target="_blank" rel="noopener noreferrer" className="p-1.5 rounded-md hover:bg-white/10" title="Open in new tab">
                                        <ExternalLink className="h-4 w-4" />
                                    </a>
                                    <a href={active.blobUrl} download={active.bill.originalName} className="p-1.5 rounded-md hover:bg-white/10" title="Download">
                                        <Download className="h-4 w-4" />
                                    </a>
                                </>
                            )}
                            <button onClick={close} className="p-1.5 rounded-md hover:bg-white/10" title="Close">
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                    </div>
                    <div className="flex-1 min-h-0 flex items-center justify-center p-2 sm:p-4" onClick={e => e.stopPropagation()}>
                        {loading || !active.blobUrl ? (
                            <Loader2 className="h-6 w-6 text-white animate-spin" />
                        ) : isImage(active.bill) ? (
                            <img src={active.bill.path} alt={active.bill.originalName} className="max-w-full max-h-full object-contain" />
                        ) : (
                            <iframe src={active.blobUrl} title={active.bill.originalName} className="w-full h-full bg-white rounded-lg" />
                        )}
                    </div>
                </div>
            )}
        </>
    );
}
