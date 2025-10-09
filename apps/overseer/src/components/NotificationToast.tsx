import toast, { Toaster, type Toast } from 'react-hot-toast';
import { motion } from 'framer-motion';
import clsx from 'clsx';
import type { PipelineEvent } from '../types/pipeline';

export interface ToastProps {
  t: Toast;
  type: 'success' | 'error' | 'info' | 'warning';
  icon: string;
  title: string;
  message?: string;
}

function CustomToast({ t, type, icon, title, message }: ToastProps) {
  const getTypeStyles = () => {
    switch (type) {
      case 'success':
        return {
          bg: 'bg-green-500/90',
          border: 'border-green-400/50',
          text: 'text-green-50'
        };
      case 'error':
        return {
          bg: 'bg-red-500/90',
          border: 'border-red-400/50',
          text: 'text-red-50'
        };
      case 'warning':
        return {
          bg: 'bg-amber-500/90',
          border: 'border-amber-400/50',
          text: 'text-amber-50'
        };
      default:
        return {
          bg: 'bg-blue-500/90',
          border: 'border-blue-400/50',
          text: 'text-blue-50'
        };
    }
  };

  const styles = getTypeStyles();

  return (
    <motion.div
      initial={{ opacity: 0, y: 50, scale: 0.9 }}
      animate={{
        opacity: t.visible ? 1 : 0,
        y: t.visible ? 0 : 50,
        scale: t.visible ? 1 : 0.9
      }}
      exit={{ opacity: 0, y: 50, scale: 0.9 }}
      className={clsx(
        'max-w-md w-full shadow-lg rounded-lg p-4 border backdrop-blur-sm',
        styles.bg,
        styles.border,
        styles.text
      )}
    >
      <div className="flex items-start gap-3">
        <motion.span
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.1 }}
          className="text-xl flex-shrink-0 mt-0.5"
        >
          {icon}
        </motion.span>
        <div className="flex-1">
          <motion.h4
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="font-medium text-sm"
          >
            {title}
          </motion.h4>
          {message && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-xs opacity-90 mt-1"
            >
              {message}
            </motion.p>
          )}
        </div>
        <button
          onClick={() => toast.dismiss(t.id)}
          className="text-current opacity-60 hover:opacity-100 transition-opacity"
        >
          ✕
        </button>
      </div>
    </motion.div>
  );
}

// Toast notification functions
export const showNotification = {
  validationStarted: (eyeName: string, agentName?: string) => {
    toast.custom((t) => (
      <CustomToast
        t={t}
        type="info"
        icon="🚀"
        title="Validation Started"
        message={`${agentName || 'Agent'} is now validating with ${eyeName}`}
      />
    ), { duration: 3000 });
  },

  validationSuccess: (eyeName: string, agentName?: string) => {
    toast.custom((t) => (
      <CustomToast
        t={t}
        type="success"
        icon="✅"
        title="Validation Approved"
        message={`${agentName || 'Agent'} passed ${eyeName} validation!`}
      />
    ), { duration: 5000 });
  },

  validationError: (eyeName: string, reason?: string, agentName?: string) => {
    toast.custom((t) => (
      <CustomToast
        t={t}
        type="error"
        icon="❌"
        title="Validation Failed"
        message={`${agentName || 'Agent'} ${eyeName}: ${reason || 'Validation requirements not met'}`}
      />
    ), { duration: 8000 });
  },

  connectionLost: () => {
    toast.custom((t) => (
      <CustomToast
        t={t}
        type="warning"
        icon="📡"
        title="Connection Lost"
        message="Attempting to reconnect to validation server..."
      />
    ), { duration: 4000 });
  },

  connectionRestored: () => {
    toast.custom((t) => (
      <CustomToast
        t={t}
        type="success"
        icon="🔗"
        title="Connection Restored"
        message="Real-time updates are now active"
      />
    ), { duration: 3000 });
  },

  sessionComplete: (sessionId: string) => {
    toast.custom((t) => (
      <CustomToast
        t={t}
        type="success"
        icon="🎉"
        title="Session Complete"
        message={`All validations passed for session ${sessionId.slice(-8)}`}
      />
    ), { duration: 6000 });
  }
};

// Auto-notification from events
export function processEventNotification(event: PipelineEvent, agentName?: string) {
  const eyeName = event.eye?.replace(/^[A-Z_]+_/, '') || 'System';

  if (event.type === 'eye_update') {
    if (event.ok === true) {
      showNotification.validationSuccess(eyeName, agentName);
    } else if (event.ok === false) {
      const reason = event.md?.split('\n')[0] || 'Requirements not met';
      showNotification.validationError(eyeName, reason, agentName);
    } else {
      showNotification.validationStarted(eyeName, agentName);
    }
  }
}

// Toast container component
export function NotificationContainer() {
  return (
    <Toaster
      position="top-right"
      toastOptions={{
        duration: 4000,
        style: {
          background: 'transparent',
          boxShadow: 'none'
        }
      }}
    />
  );
}

export default NotificationContainer;