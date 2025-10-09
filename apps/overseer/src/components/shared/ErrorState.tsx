import { motion } from 'framer-motion';
import { Button } from './Button';

interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  onDismiss?: () => void;
  showDetails?: boolean;
  details?: string;
}

export function ErrorState({
  title = 'Something went wrong',
  message,
  onRetry,
  onDismiss,
  showDetails = false,
  details,
}: ErrorStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="rounded-xl border-2 border-error bg-error/10 p-6"
    >
      <div className="flex items-start gap-4">
        <motion.div
          initial={{ rotate: -180, scale: 0 }}
          animate={{ rotate: 0, scale: 1 }}
          transition={{ type: 'spring', stiffness: 200 }}
          className="shrink-0 rounded-full bg-error/20 p-3 text-error text-xl font-bold"
        >
          ✕
        </motion.div>
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold text-error-light mb-2">{title}</h3>
          <p className="text-sm text-slate-300 mb-4">{message}</p>

          {showDetails && details && (
            <details className="mb-4">
              <summary className="cursor-pointer text-sm font-medium text-slate-400 hover:text-slate-300">
                Technical details
              </summary>
              <pre className="mt-2 rounded-lg bg-surface-overlay border border-surface-border p-3 text-xs text-slate-400 overflow-x-auto">
                {details}
              </pre>
            </details>
          )}

          <div className="flex flex-wrap gap-2">
            {onRetry && (
              <Button
                variant="primary"
                size="sm"
                onClick={onRetry}
                leftIcon={
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                    />
                  </svg>
                }
              >
                Try Again
              </Button>
            )}
            {onDismiss && (
              <Button variant="ghost" size="sm" onClick={onDismiss}>
                Dismiss
              </Button>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

interface InlineErrorProps {
  message: string;
}

export function InlineError({ message }: InlineErrorProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      className="flex items-center gap-2 text-error-light text-sm"
    >
      <span className="font-bold">✕</span>
      <span>{message}</span>
    </motion.div>
  );
}
