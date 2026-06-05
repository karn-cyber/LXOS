"use client";

import React from 'react';

function Dot({ className = '' }) {
  return <span className={`h-2.5 w-2.5 rounded-full bg-current ${className}`} />;
}

export default function Loader({ size = 'md', label = 'Loading', fullWidth = false, className = '' }) {
  const sizeMap = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8',
    xl: 'h-10 w-10',
  };

  const spinnerSize = sizeMap[size] || sizeMap.md;

  return (
    <div
      className={`flex ${fullWidth ? 'w-full flex-col items-center justify-center text-center' : 'items-center'} gap-3 ${className}`}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="relative flex items-center justify-center">
        <span className={`absolute inline-flex ${spinnerSize} rounded-full bg-primary/20 animate-ping`} />
        <svg
          className={`${spinnerSize} animate-spin text-primary drop-shadow-sm`}
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="10" className="opacity-15" stroke="currentColor" strokeWidth="4" />
          <path
            className="opacity-90"
            fill="currentColor"
            d="M12 2a10 10 0 0 1 9.95 9h-4.02A5.98 5.98 0 0 0 12 6a6 6 0 0 0-6 6H2A10 10 0 0 1 12 2Z"
          />
        </svg>
      </div>

      {label !== null ? (
        <div className={`flex ${fullWidth ? 'flex-col items-center' : 'items-center'} gap-2`}>
          <span className="text-sm font-semibold tracking-wide text-zinc-700 dark:text-zinc-300">{label}</span>
          <span className="flex items-center gap-1 text-primary/80">
            <Dot className="animate-bounce [animation-delay:-0.2s]" />
            <Dot className="animate-bounce [animation-delay:-0.1s]" />
            <Dot className="animate-bounce" />
          </span>
        </div>
      ) : null}
    </div>
  );
}
