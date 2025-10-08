import type { HTMLAttributes } from 'react';
import clsx from 'clsx';

type StatusType = 'success' | 'warning' | 'error' | 'info' | 'pending' | 'active' | 'archived';

interface StatusBadgeProps extends Omit<HTMLAttributes<HTMLSpanElement>, 'children'> {
  status: StatusType;
  label: string;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  pulse?: boolean;
}

const statusConfig: Record<StatusType, { colors: string; icon: string }> = {
  success: {
    colors: 'bg-success/20 text-success-light border-success/40',
    icon: '✓',
  },
  warning: {
    colors: 'bg-warning/20 text-warning-light border-warning/40',
    icon: '⚠',
  },
  error: {
    colors: 'bg-error/20 text-error-light border-error/40',
    icon: '✕',
  },
  info: {
    colors: 'bg-info/20 text-info-light border-info/40',
    icon: 'ℹ',
  },
  pending: {
    colors: 'bg-slate-500/20 text-slate-300 border-slate-500/40',
    icon: '○',
  },
  active: {
    colors: 'bg-brand-orange-400/20 text-brand-orange-300 border-brand-orange-400/40',
    icon: '●',
  },
  archived: {
    colors: 'bg-slate-700/20 text-slate-500 border-slate-700/40',
    icon: '▢',
  },
};

const sizeClasses = {
  sm: 'px-2 py-0.5 text-2xs rounded',
  md: 'px-2.5 py-1 text-xs rounded-md',
  lg: 'px-3 py-1.5 text-sm rounded-lg',
};

export function StatusBadge({
  status,
  label,
  size = 'md',
  showIcon = true,
  pulse = false,
  className,
  ...props
}: StatusBadgeProps) {
  const config = statusConfig[status];

  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1.5 font-semibold border transition-all duration-200',
        config.colors,
        sizeClasses[size],
        pulse && 'animate-pulse',
        className
      )}
      {...props}
    >
      {showIcon && (
        <span className="shrink-0 font-bold">{config.icon}</span>
      )}
      <span>{label}</span>
    </span>
  );
}
