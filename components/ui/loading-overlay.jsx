"use client";

import React from 'react';
import Loader from './loader';

export default function LoadingOverlay({ message = 'Loading...', subtitle = 'Please wait while we prepare your workspace.' }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden bg-zinc-950/70 backdrop-blur-xl">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(59,130,246,0.22),transparent_45%),radial-gradient(circle_at_bottom,rgba(236,72,153,0.18),transparent_35%)]" />

      <div className="relative mx-4 w-full max-w-md rounded-[2rem] border border-white/10 bg-white/90 px-8 py-10 text-center shadow-2xl shadow-black/30 ring-1 ring-black/5 dark:bg-zinc-950/90 dark:shadow-black/60">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-linear-to-br from-primary/15 via-primary/5 to-accent/15">
          <Loader size="xl" label={null} />
        </div>

        <h2 className="text-xl font-black tracking-tight text-zinc-900 dark:text-zinc-50">
          {message}
        </h2>
        <p className="mt-2 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
          {subtitle}
        </p>

        <div className="mt-6 flex items-center justify-center gap-2 text-primary/80">
          <span className="h-2 w-2 rounded-full bg-current animate-bounce [animation-delay:-0.2s]" />
          <span className="h-2 w-2 rounded-full bg-current animate-bounce [animation-delay:-0.1s]" />
          <span className="h-2 w-2 rounded-full bg-current animate-bounce" />
        </div>
      </div>
    </div>
  );
}
