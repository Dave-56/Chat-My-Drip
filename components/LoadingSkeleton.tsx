import React from 'react';

interface SkeletonProps {
  className?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({ className = '' }) => {
  return (
    <div 
      className={`bg-drip-gray rounded ${className}`}
      style={{
        background: 'linear-gradient(90deg, #2A2A2A 25%, #3A3A3A 50%, #2A2A2A 75%)',
        backgroundSize: '200% 100%',
        animation: 'shimmer 1.5s infinite',
      }}
    />
  );
};

// Results Page Skeleton
export const ResultsSkeleton: React.FC = () => {
  return (
    <div className="flex flex-col h-full animate-slide-up overflow-y-auto">
      {/* Image Skeleton */}
      <div className="relative w-full aspect-square shrink-0">
        <Skeleton className="w-full h-full" />
        <div className="absolute bottom-0 left-0 right-0 p-6">
          <div className="flex justify-between items-end">
            <div className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-8 w-32" />
            </div>
            <Skeleton className="h-20 w-20 rounded-xl" />
          </div>
        </div>
      </div>

      {/* Cards Skeleton */}
      <div className="px-6 -mt-4 relative z-10 space-y-4 pb-6">
        {/* Verdict Card */}
        <div className="bg-drip-dark p-5 rounded-xl border border-drip-gray">
          <Skeleton className="h-3 w-24 mb-3" />
          <Skeleton className="h-6 w-full" />
          <Skeleton className="h-6 w-3/4 mt-2" />
        </div>

        {/* Chat CTA */}
        <Skeleton className="h-16 w-full rounded-xl" />

        {/* Hits Card */}
        <div className="bg-drip-dark p-5 rounded-xl border border-drip-gray">
          <Skeleton className="h-5 w-32 mb-3" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-4 w-4/5" />
          </div>
        </div>

        {/* Misses Card */}
        <div className="bg-drip-dark p-5 rounded-xl border border-drip-gray">
          <Skeleton className="h-5 w-32 mb-3" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-4/5" />
          </div>
        </div>

        {/* Suggestions Card */}
        <div className="bg-drip-dark p-5 rounded-xl border border-drip-gray">
          <Skeleton className="h-5 w-40 mb-3" />
          <div className="space-y-2">
            <Skeleton className="h-10 w-full rounded-md" />
            <Skeleton className="h-10 w-full rounded-md" />
          </div>
        </div>

        {/* Actions */}
        <div className="pt-4 space-y-3">
          <Skeleton className="h-14 w-full rounded-full" />
          <Skeleton className="h-14 w-full rounded-full" />
        </div>
      </div>
    </div>
  );
};

// Chat Message Skeleton
export const ChatMessageSkeleton: React.FC = () => {
  return (
    <div className="flex justify-start animate-pulse">
      <div className="bg-drip-gray p-4 rounded-2xl rounded-tl-sm border border-white/5 max-w-[85%]">
        <div className="flex gap-1">
          <Skeleton className="w-2 h-2 rounded-full" />
          <Skeleton className="w-2 h-2 rounded-full" />
          <Skeleton className="w-2 h-2 rounded-full" />
        </div>
      </div>
    </div>
  );
};

// MyFits Grid Skeleton
export const MyFitsSkeleton: React.FC = () => {
  return (
    <div className="flex-1 p-4">
      <div className="grid grid-cols-2 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="relative bg-drip-dark rounded-xl overflow-hidden border border-drip-gray">
            <Skeleton className="aspect-[3/4] w-full" />
            <div className="absolute top-2 right-2">
              <Skeleton className="h-8 w-12 rounded-full" />
            </div>
            <div className="absolute bottom-0 left-0 right-0 p-3">
              <Skeleton className="h-4 w-20 mb-1" />
              <Skeleton className="h-3 w-16" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Shimmer animation will be added via inline styles in the Skeleton component

