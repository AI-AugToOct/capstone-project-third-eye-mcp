import { motion, AnimatePresence } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import clsx from 'clsx';
import type { PipelineEvent } from '../types/pipeline';

export interface LiveActivityFeedProps {
  events: PipelineEvent[];
  maxItems?: number;
}

function getEventIcon(event: PipelineEvent): string {
  if (event.ok === true) return '✅';
  if (event.ok === false) return '❌';
  if (event.type === 'eye_update') return '👁️';
  if (event.type === 'settings_update') return '⚙️';
  if (event.type === 'tenseigan_claims') return '📋';
  if (event.type === 'user_input') return '👤';
  return '📄';
}

function formatEventMessage(event: PipelineEvent): string {
  const eyeName = event.eye || 'System';
  const timestamp = event.ts ? new Date(event.ts) : new Date();
  const timeAgo = formatDistanceToNow(timestamp, { addSuffix: true });

  // Convert technical codes to human-readable messages
  if (event.code) {
    if (event.code.startsWith('OK_')) {
      return `${eyeName} validation completed successfully ${timeAgo}`;
    }
    if (event.code.startsWith('E_')) {
      return `${eyeName} found validation issues ${timeAgo}`;
    }
  }

  if (event.type === 'eye_update') {
    return `${eyeName} is processing validation ${timeAgo}`;
  }

  if (event.type === 'settings_update') {
    return `Session settings were updated ${timeAgo}`;
  }

  if (event.type === 'user_input') {
    return `User provided input ${timeAgo}`;
  }

  return `${eyeName} event occurred ${timeAgo}`;
}

function getEventColor(event: PipelineEvent): string {
  if (event.ok === true) return 'text-green-400';
  if (event.ok === false) return 'text-red-400';
  return 'text-blue-400';
}

export function LiveActivityFeed({ events, maxItems = 10 }: LiveActivityFeedProps) {
  // Show most recent events first
  const recentEvents = events
    .slice(-maxItems)
    .reverse();

  if (recentEvents.length === 0) {
    return (
      <div className="rounded-xl border border-surface-outline/40 bg-surface-raised/70 p-4">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-2 h-2 bg-slate-500 rounded-full" />
          <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
            Activity Feed
          </span>
        </div>
        <p className="text-sm text-slate-400 text-center py-4">
          Waiting for validation activity...
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-surface-outline/40 bg-surface-raised/70 p-4">
      <div className="flex items-center gap-2 mb-3">
        <motion.div
          className="w-2 h-2 bg-green-500 rounded-full"
          animate={{ opacity: [1, 0.5, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
        <span className="text-xs font-medium text-green-400 uppercase tracking-wider">
          Live Activity
        </span>
        <span className="text-xs text-slate-400">
          ({recentEvents.length} recent)
        </span>
      </div>

      <div className="space-y-2 max-h-64 overflow-y-auto">
        <AnimatePresence initial={false}>
          {recentEvents.map((event, index) => (
            <motion.div
              key={`${event.session_id}-${event.ts}-${index}`}
              initial={{ x: -20, opacity: 0, height: 0 }}
              animate={{ x: 0, opacity: 1, height: 'auto' }}
              exit={{ x: 20, opacity: 0, height: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
              className={clsx(
                'flex items-start gap-3 p-3 rounded-lg transition-colors',
                'bg-surface-base/40 hover:bg-surface-base/60'
              )}
            >
              <span className="text-lg flex-shrink-0 mt-0.5">
                {getEventIcon(event)}
              </span>
              <div className="flex-1 min-w-0">
                <p className={clsx(
                  'text-sm font-medium leading-relaxed',
                  getEventColor(event)
                )}>
                  {formatEventMessage(event)}
                </p>
                {event.md && (
                  <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                    {event.md.replace(/^#{1,6}\s*/, '').substring(0, 100)}
                    {event.md.length > 100 && '...'}
                  </p>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}

export default LiveActivityFeed;