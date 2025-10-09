import { motion } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import clsx from 'clsx';
import type { TenantEntry } from '../../types/admin';

export interface TenantCardProps {
  tenant: TenantEntry;
  onEdit?: () => void;
  onArchive?: () => void;
  onRestore?: () => void;
  disabled?: boolean;
}

function formatTimestamp(value?: number | null): string {
  if (!value) return 'Never';
  try {
    return formatDistanceToNow(new Date(value * 1000), { addSuffix: true });
  } catch (error) {
    console.error(error);
    return new Date(value * 1000).toLocaleString();
  }
}

function getHealthStatus(tenant: TenantEntry) {
  const isArchived = Boolean(tenant.archived_at);
  if (isArchived) return { status: 'archived', color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/30' };

  const hasActivity = tenant.last_key_used_at && tenant.last_key_used_at > (Date.now() / 1000) - 86400 * 7; // 7 days
  const hasActiveKeys = (tenant.active_keys || 0) > 0;

  if (hasActivity && hasActiveKeys) return { status: 'healthy', color: 'text-green-400', bg: 'bg-green-500/10', border: 'border-green-500/30' };
  if (hasActiveKeys) return { status: 'idle', color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/30' };
  return { status: 'inactive', color: 'text-slate-400', bg: 'bg-slate-500/10', border: 'border-slate-500/30' };
}

function getStatusIcon(status: string) {
  switch (status) {
    case 'healthy': return '💚';
    case 'idle': return '💛';
    case 'inactive': return '⚪';
    case 'archived': return '🗑️';
    default: return '❓';
  }
}

export function TenantCard({ tenant, onEdit, onArchive, onRestore, disabled = false }: TenantCardProps) {
  const health = getHealthStatus(tenant);
  const isArchived = Boolean(tenant.archived_at);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.95 }}
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2 }}
      className={clsx(
        'group relative rounded-2xl border p-6 shadow-lg transition-all duration-200',
        'bg-surface-raised/80 backdrop-blur-sm',
        health.border,
        'hover:shadow-xl hover:border-accent-primary/50',
        isArchived && 'opacity-60'
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={clsx('p-2 rounded-full', health.bg)}>
            <span className="text-lg">{getStatusIcon(health.status)}</span>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">
              {tenant.display_name}
            </h3>
            <p className="font-mono text-xs text-slate-400">
              {tenant.id}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className={clsx(
              'inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold capitalize',
              health.color,
              health.bg,
              'border',
              health.border
            )}
          >
            {health.status}
          </motion.span>
        </div>
      </div>

      {/* Description */}
      {tenant.description && (
        <p className="text-sm text-slate-300 mb-4 line-clamp-2">
          {tenant.description}
        </p>
      )}

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="text-center p-3 rounded-lg bg-surface-base/40">
          <div className="text-xl font-bold text-white">
            {tenant.active_keys || 0}
          </div>
          <div className="text-xs text-slate-400 uppercase tracking-wide">
            Active Keys
          </div>
        </div>
        <div className="text-center p-3 rounded-lg bg-surface-base/40">
          <div className="text-xl font-bold text-white">
            {tenant.total_keys || 0}
          </div>
          <div className="text-xs text-slate-400 uppercase tracking-wide">
            Total Keys
          </div>
        </div>
      </div>

      {/* Activity Timeline */}
      <div className="space-y-2 mb-4">
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-400">Last Activity</span>
          <span className={clsx(
            'font-medium',
            tenant.last_key_used_at ? 'text-slate-200' : 'text-slate-500'
          )}>
            {formatTimestamp(tenant.last_key_used_at)}
          </span>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-400">Last Rotation</span>
          <span className={clsx(
            'font-medium',
            tenant.last_key_rotated_at ? 'text-slate-200' : 'text-slate-500'
          )}>
            {formatTimestamp(tenant.last_key_rotated_at)}
          </span>
        </div>
      </div>

      {/* Tags */}
      {tenant.tags && tenant.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-4">
          {tenant.tags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center rounded-full bg-accent-primary/20 px-2 py-1 text-xs font-medium text-accent-primary"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between pt-4 border-t border-surface-outline/30">
        <div className="flex gap-2">
          {onEdit && (
            <button
              type="button"
              onClick={onEdit}
              disabled={disabled}
              className="inline-flex items-center gap-1 rounded-full border border-surface-outline/60 px-3 py-1 text-xs text-slate-200 transition hover:border-accent-primary hover:text-accent-primary disabled:opacity-50"
            >
              ✏️ Edit
            </button>
          )}
        </div>

        <div className="flex gap-2">
          {isArchived ? (
            onRestore && (
              <button
                type="button"
                onClick={onRestore}
                disabled={disabled}
                className="inline-flex items-center gap-1 rounded-full border border-green-500/40 px-3 py-1 text-xs text-green-400 transition hover:bg-green-500/10 disabled:opacity-50"
              >
                ↻ Restore
              </button>
            )
          ) : (
            onArchive && (
              <button
                type="button"
                onClick={onArchive}
                disabled={disabled}
                className="inline-flex items-center gap-1 rounded-full border border-red-500/40 px-3 py-1 text-xs text-red-400 transition hover:bg-red-500/10 disabled:opacity-50"
              >
                🗑️ Archive
              </button>
            )
          )}
        </div>
      </div>

      {/* Hover Effects */}
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-accent-primary/5 to-transparent opacity-0 transition-opacity duration-200 group-hover:opacity-100 pointer-events-none" />
    </motion.div>
  );
}

export default TenantCard;