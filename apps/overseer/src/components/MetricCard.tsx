import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import clsx from 'clsx';

export interface MetricCardProps {
  title: string;
  value: number | string;
  icon: string;
  trend?: number; // Percentage change
  suffix?: string;
  description?: string;
  isLoading?: boolean;
  variant?: 'default' | 'success' | 'warning' | 'error';
}

function AnimatedCounter({
  value,
  duration = 0.8
}: {
  value: number;
  duration?: number
}) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    let startTime: number;
    let animationFrame: number;

    function animate(currentTime: number) {
      if (!startTime) startTime = currentTime;
      const progress = Math.min((currentTime - startTime) / (duration * 1000), 1);

      // Easing function for smooth animation
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      const currentValue = Math.floor(easeOutQuart * value);

      setDisplayValue(currentValue);

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      }
    }

    animationFrame = requestAnimationFrame(animate);

    return () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
    };
  }, [value, duration]);

  return <span>{displayValue}</span>;
}

function TrendIndicator({ trend }: { trend: number }) {
  const isPositive = trend > 0;
  const isNeutral = trend === 0;

  if (isNeutral) {
    return (
      <span className="text-xs text-slate-400 flex items-center gap-1">
        <span>—</span>
        <span>0%</span>
      </span>
    );
  }

  return (
    <motion.span
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className={clsx(
        'text-xs flex items-center gap-1 font-medium',
        isPositive ? 'text-green-400' : 'text-red-400'
      )}
    >
      <motion.span
        animate={{ y: [0, -2, 0] }}
        transition={{ duration: 1, repeat: Infinity, repeatDelay: 2 }}
      >
        {isPositive ? '↗' : '↘'}
      </motion.span>
      <span>{Math.abs(trend).toFixed(1)}%</span>
    </motion.span>
  );
}

function getVariantStyles(variant: MetricCardProps['variant']) {
  switch (variant) {
    case 'success':
      return {
        border: 'border-green-500/30',
        background: 'bg-gradient-to-br from-green-500/10 to-transparent',
        glow: 'shadow-green-500/20'
      };
    case 'warning':
      return {
        border: 'border-amber-500/30',
        background: 'bg-gradient-to-br from-amber-500/10 to-transparent',
        glow: 'shadow-amber-500/20'
      };
    case 'error':
      return {
        border: 'border-red-500/30',
        background: 'bg-gradient-to-br from-red-500/10 to-transparent',
        glow: 'shadow-red-500/20'
      };
    default:
      return {
        border: 'border-brand-accent/30',
        background: 'bg-gradient-to-br from-brand-accent/10 to-transparent',
        glow: 'shadow-brand-accent/20'
      };
  }
}

export function MetricCard({
  title,
  value,
  icon,
  trend,
  suffix = '',
  description,
  isLoading = false,
  variant = 'default'
}: MetricCardProps) {
  const styles = getVariantStyles(variant);

  if (isLoading) {
    return (
      <div className="p-4 rounded-xl border border-surface-outline/40 bg-surface-raised/70">
        <div className="flex items-center justify-between mb-3">
          <div className="w-8 h-8 bg-slate-600/40 rounded-full animate-pulse" />
          <div className="w-12 h-4 bg-slate-600/40 rounded animate-pulse" />
        </div>
        <div className="w-16 h-8 bg-slate-600/40 rounded animate-pulse mb-2" />
        <div className="w-20 h-3 bg-slate-600/40 rounded animate-pulse" />
      </div>
    );
  }

  return (
    <motion.div
      whileHover={{
        scale: 1.02,
        boxShadow: `0 10px 30px -5px ${styles.glow.includes('green') ? 'rgba(34, 197, 94, 0.3)' :
                    styles.glow.includes('amber') ? 'rgba(245, 158, 11, 0.3)' :
                    styles.glow.includes('red') ? 'rgba(239, 68, 68, 0.3)' :
                    'rgba(247, 181, 0, 0.3)'}`
      }}
      whileTap={{ scale: 0.98 }}
      className={clsx(
        'p-4 rounded-xl border cursor-pointer transition-all duration-300',
        styles.border,
        styles.background,
        'backdrop-blur-sm'
      )}
    >
      <div className="flex items-center justify-between mb-3">
        <motion.span
          className="text-2xl"
          animate={{ rotate: [0, 10, -10, 0] }}
          transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
        >
          {icon}
        </motion.span>
        {trend !== undefined && <TrendIndicator trend={trend} />}
      </div>

      <div className="space-y-1">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-2xl font-bold text-white"
        >
          {typeof value === 'number' ? (
            <>
              <AnimatedCounter value={value} />
              {suffix && <span className="text-lg">{suffix}</span>}
            </>
          ) : (
            <span>{value}{suffix}</span>
          )}
        </motion.div>

        <motion.h3
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-sm font-medium text-slate-300"
        >
          {title}
        </motion.h3>

        {description && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-xs text-slate-400 mt-2 leading-relaxed"
          >
            {description}
          </motion.p>
        )}
      </div>
    </motion.div>
  );
}

export default MetricCard;