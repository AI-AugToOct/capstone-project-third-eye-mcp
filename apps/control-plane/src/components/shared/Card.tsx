import type { HTMLAttributes } from 'react';
import type { HTMLMotionProps } from 'framer-motion';
import { motion } from 'framer-motion';
import clsx from 'clsx';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'elevated' | 'outlined' | 'glass';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  hover?: boolean;
  animated?: boolean;
}

const variantClasses = {
  default: 'bg-surface-raised border border-surface-border',
  elevated: 'bg-surface-raised border border-surface-border shadow-glass',
  outlined: 'bg-transparent border-2 border-brand-orange-400/30 hover:border-brand-orange-400/60',
  glass: 'bg-surface-raised/80 backdrop-blur-sm border border-brand-orange-400/20 shadow-glow',
};

const paddingClasses = {
  none: '',
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
};

export function Card({
  variant = 'default',
  padding = 'md',
  hover = false,
  animated = true,
  className,
  children,
  ...props
}: CardProps) {
  const Component = animated ? motion.div : 'div';
  const motionProps: Partial<HTMLMotionProps<'div'>> = animated
    ? {
        initial: { opacity: 0, y: 20 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.3 },
        ...(hover && {
          whileHover: { y: -4, transition: { duration: 0.2 } },
        }),
      }
    : {};

  return (
    <Component
      className={clsx(
        'rounded-xl transition-all duration-200',
        variantClasses[variant],
        paddingClasses[padding],
        hover && 'hover:shadow-glow cursor-pointer',
        className
      )}
      {...(motionProps as any)}
      {...props}
    >
      {children}
    </Component>
  );
}

interface CardHeaderProps extends HTMLAttributes<HTMLDivElement> {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  icon?: React.ReactNode;
}

export function CardHeader({ title, subtitle, action, icon, className, ...props }: CardHeaderProps) {
  return (
    <div className={clsx('flex items-start justify-between gap-4 mb-4', className)} {...props}>
      <div className="flex items-start gap-3 flex-1 min-w-0">
        {icon && (
          <div className="shrink-0 rounded-lg bg-brand-orange-400/10 p-2 text-brand-orange-400">
            {icon}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold text-white truncate">{title}</h3>
          {subtitle && (
            <p className="mt-1 text-sm text-slate-400 line-clamp-2">{subtitle}</p>
          )}
        </div>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

export function CardBody({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={clsx('text-sm text-slate-300', className)} {...props}>
      {children}
    </div>
  );
}

export function CardFooter({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={clsx(
        'mt-4 flex items-center justify-between gap-4 border-t border-surface-border pt-4',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
