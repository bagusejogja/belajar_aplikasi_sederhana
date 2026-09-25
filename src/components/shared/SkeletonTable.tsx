import React from 'react';

export interface SkeletonTableProps {
  rows?: number;
  columns?: number;
  showStatCards?: boolean;
  statCardCount?: number;
  className?: string;
}

export default function SkeletonTable({
  rows = 5,
  columns = 6,
  showStatCards = false,
  statCardCount = 4,
  className = ''
}: SkeletonTableProps) {
  return (
    <div className={`space-y-4 animate-pulse ${className}`}>
      {/* Optional Stat Cards Skeleton */}
      {showStatCards && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {Array.from({ length: statCardCount }).map((_, i) => (
            <div 
              key={`stat-skel-${i}`} 
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-24"></div>
                <div className="w-8 h-8 rounded-lg bg-slate-200 dark:bg-slate-800"></div>
              </div>
              <div className="h-6 bg-slate-300 dark:bg-slate-700 rounded w-36 mb-2"></div>
              <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded w-full"></div>
            </div>
          ))}
        </div>
      )}

      {/* Table Shell Skeleton */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
        {/* Table Top Filter Bar Skeleton */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800/60 flex flex-wrap items-center justify-between gap-3 bg-slate-50/50 dark:bg-slate-800/30">
          <div className="h-9 bg-slate-200 dark:bg-slate-800 rounded-lg w-64 max-w-full"></div>
          <div className="flex items-center gap-2">
            <div className="h-9 bg-slate-200 dark:bg-slate-800 rounded-lg w-28"></div>
            <div className="h-9 bg-slate-200 dark:bg-slate-800 rounded-lg w-24"></div>
          </div>
        </div>

        {/* Header Skeleton */}
        <div className="bg-slate-100/70 dark:bg-slate-800/70 px-4 py-3 border-b border-slate-200 dark:border-slate-700/60 grid gap-4"
          style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
        >
          {Array.from({ length: columns }).map((_, colIndex) => (
            <div 
              key={`th-skel-${colIndex}`} 
              className={`h-3.5 bg-slate-300 dark:bg-slate-700 rounded ${colIndex === 0 ? 'w-10' : colIndex === columns - 1 ? 'w-16 ml-auto' : 'w-3/4'}`}
            ></div>
          ))}
        </div>

        {/* Rows Skeleton */}
        <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
          {Array.from({ length: rows }).map((_, rowIndex) => (
            <div 
              key={`tr-skel-${rowIndex}`} 
              className="px-4 py-3.5 grid gap-4 items-center"
              style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
            >
              {Array.from({ length: columns }).map((_, colIndex) => {
                // Variations in widths to simulate natural realistic text & badges
                const widths = ['w-6', 'w-40', 'w-24', 'w-32', 'w-20', 'w-16 ml-auto'];
                const selectedWidth = widths[colIndex % widths.length];

                return (
                  <div key={`td-skel-${rowIndex}-${colIndex}`} className="flex items-center">
                    <div 
                      className={`h-3 bg-slate-200 dark:bg-slate-800 rounded ${selectedWidth}`}
                      style={{ opacity: 1 - (rowIndex * 0.08) }} // subtle gradient fade down
                    ></div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>

        {/* Table Bottom / Pagination Skeleton */}
        <div className="p-3.5 bg-slate-50/70 dark:bg-slate-800/40 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-44"></div>
          <div className="flex items-center gap-1.5">
            <div className="w-8 h-8 rounded bg-slate-200 dark:bg-slate-800"></div>
            <div className="w-8 h-8 rounded bg-slate-200 dark:bg-slate-800"></div>
            <div className="w-8 h-8 rounded bg-slate-200 dark:bg-slate-800"></div>
          </div>
        </div>
      </div>
    </div>
  );
}
