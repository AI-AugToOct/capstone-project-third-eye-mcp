import clsx from 'clsx';
import { formatRelative } from 'date-fns';
import type { ApiKeyEntry } from '../types/admin';
import { StatusBadge, EmptyState, Button } from './shared';

export interface ApiKeyTableProps {
  apiKeys: ApiKeyEntry[];
  onRotate: (keyId: string) => void;
  onRevoke: (keyId: string) => void;
  onRestore: (keyId: string) => void;
  onEdit: (key: ApiKeyEntry) => void;
  loading?: boolean;
  highlightKeyId?: string | null;
}

function formatTimestamp(value?: number | null): string {
  if (!value) return '—';
  try {
    return formatRelative(value * 1000, new Date());
  } catch (error) {
    return new Date(value * 1000).toLocaleString();
  }
}

export function ApiKeyTable({ apiKeys, onRotate, onRevoke, onRestore, onEdit, loading = false, highlightKeyId }: ApiKeyTableProps) {
  if (!apiKeys.length) {
    return (
      <EmptyState
        icon="🔑"
        title="No API Keys Yet"
        description="Create your first API key to start accessing Third Eye MCP validation services."
      >
        <div className="mt-6 space-y-2 text-left text-xs text-slate-400">
          <p>✓ Secure token-based authentication</p>
          <p>✓ Role-based access control (admin/consumer)</p>
          <p>✓ Per-key rate limiting and quotas</p>
          <p>✓ Full audit trail for all operations</p>
        </div>
      </EmptyState>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-surface-outline/60 bg-surface-raised/70 shadow-lg">
      <table className="min-w-full divide-y divide-surface-outline/60 text-sm">
        <thead className="bg-surface-base/80 text-xs uppercase tracking-[0.2em] text-slate-400">
          <tr>
            <th className="px-4 py-3 text-left">Display</th>
            <th className="px-4 py-3 text-left">Key ID</th>
            <th className="px-4 py-3 text-left">Role</th>
            <th className="px-4 py-3 text-left">Tenant</th>
            <th className="px-4 py-3 text-left">Created</th>
            <th className="px-4 py-3 text-left">Expires</th>
            <th className="px-4 py-3 text-left">Limits</th>
            <th className="px-4 py-3 text-left">Status</th>
            <th className="px-4 py-3 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-surface-outline/60 text-slate-200">
          {apiKeys.map((key) => {
            const revoked = Boolean(key.revoked_at);
            return (
              <tr
                key={key.id}
                id={`key-row-${key.id}`}
                className={clsx(
                  revoked && 'bg-red-900/20',
                  highlightKeyId === key.id && 'ring-2 ring-accent-primary/60 ring-offset-2 ring-offset-slate-900'
                )}
              >
                <td className="px-4 py-3 text-slate-200">{key.display_name || '—'}</td>
                <td className="px-4 py-3 font-mono text-xs text-slate-200">{key.id}</td>
                <td className="px-4 py-3 text-slate-200">{key.role}</td>
                <td className="px-4 py-3 text-slate-300">{key.tenant ?? '—'}</td>
                <td className="px-4 py-3 text-slate-300">{formatTimestamp(key.created_at)}</td>
                <td className="px-4 py-3 text-slate-300">{formatTimestamp(key.expires_at)}</td>
                <td className="px-4 py-3 text-slate-300 text-xs">
                  {(() => {
                    const summary: string[] = [];
                    if (Array.isArray(key.limits?.branches) && key.limits?.branches.length) {
                      summary.push(`Branches: ${key.limits.branches.join(', ')}`);
                    }
                    if (Array.isArray(key.limits?.tools) && key.limits?.tools.length) {
                      summary.push(`Tools: ${key.limits.tools.join(', ')}`);
                    }
                    if (Array.isArray(key.limits?.tenants) && key.limits?.tenants.length) {
                      summary.push(`Tenants: ${key.limits.tenants.join(', ')}`);
                    }
                    if (summary.length === 0) {
                      return '—';
                    }
                    return summary.join(' | ');
                  })()}
                </td>
                <td className="px-4 py-3">
                  <StatusBadge
                    status={revoked ? 'error' : 'active'}
                    label={revoked ? 'Revoked' : 'Active'}
                  />
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onEdit(key)}
                      disabled={loading}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onRotate(key.id)}
                      disabled={loading}
                    >
                      Rotate
                    </Button>
                    {revoked ? (
                      <Button
                        variant="success"
                        size="sm"
                        onClick={() => onRestore(key.id)}
                        disabled={loading}
                      >
                        Restore
                      </Button>
                    ) : (
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => onRevoke(key.id)}
                        disabled={loading}
                      >
                        Revoke
                      </Button>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default ApiKeyTable;
