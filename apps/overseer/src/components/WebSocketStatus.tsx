import { motion, AnimatePresence } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import clsx from 'clsx';

export interface WebSocketStatusProps {
  connected: boolean;
  connectionAttempts: number;
  lastEventTime?: Date;
  reconnectingIn?: number;
  className?: string;
}

function ConnectionPulse({ connected }: { connected: boolean }) {
  if (!connected) return null;

  return (
    <motion.div
      className="absolute inset-0 bg-green-500 rounded-full"
      animate={{
        scale: [1, 1.2, 1],
        opacity: [0.7, 0.3, 0.7]
      }}
      transition={{
        duration: 2,
        repeat: Infinity,
        ease: "easeInOut"
      }}
    />
  );
}

function getStatusColor(connected: boolean, connectionAttempts: number) {
  if (connected) return 'bg-green-500';
  if (connectionAttempts > 3) return 'bg-red-500';
  return 'bg-yellow-500';
}

function getStatusText(
  connected: boolean,
  connectionAttempts: number,
  reconnectingIn?: number,
  lastEventTime?: Date
) {
  if (connected) {
    if (lastEventTime) {
      const timeAgo = formatDistanceToNow(lastEventTime, { addSuffix: true });
      return `Connected • Last update ${timeAgo}`;
    }
    return 'Connected • Monitoring live';
  }

  if (reconnectingIn && reconnectingIn > 0) {
    return `Reconnecting in ${reconnectingIn}s`;
  }

  if (connectionAttempts > 3) {
    return `Connection failed (${connectionAttempts} attempts)`;
  }

  return `Connecting${'.'.repeat((connectionAttempts % 3) + 1)}`;
}

export function WebSocketStatus({
  connected,
  connectionAttempts,
  lastEventTime,
  reconnectingIn,
  className
}: WebSocketStatusProps) {
  const statusColor = getStatusColor(connected, connectionAttempts);
  const statusText = getStatusText(connected, connectionAttempts, reconnectingIn, lastEventTime);

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className={clsx(
        'flex items-center gap-3 px-4 py-2 rounded-lg border transition-all duration-300',
        connected
          ? 'border-green-500/30 bg-green-500/10'
          : connectionAttempts > 3
          ? 'border-red-500/30 bg-red-500/10'
          : 'border-yellow-500/30 bg-yellow-500/10',
        className
      )}
    >
      {/* Status Indicator */}
      <div className="relative">
        <div className={clsx('w-3 h-3 rounded-full', statusColor)} />
        <ConnectionPulse connected={connected} />
      </div>

      {/* Status Text */}
      <div className="flex-1">
        <motion.span
          key={statusText}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className={clsx(
            'text-sm font-medium',
            connected
              ? 'text-green-400'
              : connectionAttempts > 3
              ? 'text-red-400'
              : 'text-yellow-400'
          )}
        >
          {statusText}
        </motion.span>
      </div>

      {/* Connection Quality Indicator */}
      {connected && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="flex items-center gap-1"
        >
          {Array.from({ length: 3 }).map((_, i) => (
            <motion.div
              key={i}
              className={clsx(
                'w-1 h-3 rounded-full',
                i === 0 ? 'bg-green-500' : 'bg-green-500/60'
              )}
              animate={{
                height: [8, 12, 8],
                opacity: [0.6, 1, 0.6]
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                delay: i * 0.2
              }}
            />
          ))}
        </motion.div>
      )}

      {/* Reconnecting Spinner */}
      <AnimatePresence>
        {!connected && reconnectingIn && reconnectingIn > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0 }}
            className="w-4 h-4"
          >
            <motion.div
              className="w-full h-full border-2 border-yellow-400/30 border-t-yellow-400 rounded-full"
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default WebSocketStatus;