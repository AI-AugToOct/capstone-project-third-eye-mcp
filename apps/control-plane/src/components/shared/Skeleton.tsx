import type { HTMLAttributes } from 'react';
import clsx from 'clsx';

interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'text' | 'circular' | 'rectangular';
  width?: string | number;
  height?: string | number;
  animation?: 'pulse' | 'wave' | 'none';
}

export function Skeleton({
  variant = 'text',
  width,
  height,
  animation = 'wave',
  className,
  ...props
}: SkeletonProps) {
  return (
    <div
      className={clsx(
        'bg-surface-border overflow-hidden relative',
        variant === 'text' && 'h-4 rounded',
        variant === 'circular' && 'rounded-full',
        variant === 'rectangular' && 'rounded-lg',
        animation === 'pulse' && 'animate-pulse',
        animation === 'wave' && 'before:absolute before:inset-0 before:animate-shimmer before:bg-gradient-to-r before:from-transparent before:via-surface-raised/50 before:to-transparent',
        className
      )}
      style={{
        width: width ? (typeof width === 'number' ? `${width}px` : width) : '100%',
        height: height ? (typeof height === 'number' ? `${height}px` : height) : variant === 'text' ? '1rem' : '100%',
      }}
      {...props}
    />
  );
}

export function SkeletonCard() {
  return (
    <div className="rounded-xl border border-surface-border bg-surface-raised p-6 space-y-4">
      <div className="flex items-center gap-3">
        <Skeleton variant="circular" width={40} height={40} />
        <div className="flex-1 space-y-2">
          <Skeleton width="40%" />
          <Skeleton width="60%" />
        </div>
      </div>
      <div className="space-y-2">
        <Skeleton />
        <Skeleton width="90%" />
        <Skeleton width="75%" />
      </div>
    </div>
  );
}

export function SkeletonTable({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 rounded-lg border border-surface-border bg-surface-raised p-4">
          <Skeleton variant="circular" width={32} height={32} />
          <Skeleton className="flex-1" />
          <Skeleton width={80} />
          <Skeleton width={100} />
        </div>
      ))}
    </div>
  );
}
