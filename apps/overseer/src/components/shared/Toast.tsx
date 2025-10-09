import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import clsx from 'clsx';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastProps {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  onClose: (id: string) => void;
  duration?: number;
}

const toastConfig: Record<ToastType, { icon: string; colors: string }> = {
  success: {
    icon: '✓',
    colors: 'bg-success/10 border-success text-success-light',
  },
  error: {
    icon: '✕',
    colors: 'bg-error/10 border-error text-error-light',
  },
  warning: {
    icon: '⚠',
    colors: 'bg-warning/10 border-warning text-warning-light',
  },
  info: {
    icon: 'ℹ',
    colors: 'bg-info/10 border-info text-info-light',
  },
};

export function Toast({ id, type, title, message, action, onClose, duration = 5000 }: ToastProps) {
  const config = toastConfig[type];

  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => onClose(id), duration);
      return () => clearTimeout(timer);
    }
  }, [id, duration, onClose]);

  return (
    <motion.div
      initial={{ opacity: 0, x: 100, scale: 0.8 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 100, scale: 0.8 }}
      className={clsx(
        'pointer-events-auto w-full max-w-sm rounded-lg border-2 p-4 shadow-glow backdrop-blur-sm',
        config.colors
      )}
    >
      <div className="flex items-start gap-3">
        <div className="shrink-0 rounded-full bg-current/20 p-1 font-bold">
          {config.icon}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-white">{title}</p>
          {message && (
            <p className="mt-1 text-sm text-slate-300">{message}</p>
          )}
          {action && (
            <button
              onClick={action.onClick}
              className="mt-2 text-sm font-semibold underline hover:no-underline"
            >
              {action.label}
            </button>
          )}
        </div>
        <button
          onClick={() => onClose(id)}
          className="shrink-0 rounded-full p-1 hover:bg-surface-overlay transition-colors"
        >
          <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      </div>
    </motion.div>
  );
}

interface ToastContainerProps {
  toasts: Array<Omit<ToastProps, 'onClose'>>;
  onClose: (id: string) => void;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
}

const positionClasses = {
  'top-right': 'top-4 right-4',
  'top-left': 'top-4 left-4',
  'bottom-right': 'bottom-4 right-4',
  'bottom-left': 'bottom-4 left-4',
};

export function ToastContainer({ toasts, onClose, position = 'top-right' }: ToastContainerProps) {
  return (
    <div className={clsx('pointer-events-none fixed z-50 flex flex-col gap-2', positionClasses[position])}>
      <AnimatePresence>
        {toasts.map((toast) => (
          <Toast key={toast.id} {...toast} onClose={onClose} />
        ))}
      </AnimatePresence>
    </div>
  );
}
