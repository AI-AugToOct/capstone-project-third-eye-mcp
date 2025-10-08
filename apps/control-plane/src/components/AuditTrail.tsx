import { formatRelative } from 'date-fns';
import type { AuditRecord } from '../types/admin';

export interface AuditTrailProps {
  records: AuditRecord[];
  loading?: boolean;
}

function formatTimestamp(value?: number | null): string {
  if (!value) return '—';
  try {
    return formatRelative(value * 1000, new Date());
  } catch (error) {
    return new Date(value * 1000).toLocaleString();
  }
}

export function AuditTrail({ records, loading = false }: AuditTrailProps) {
  if (loading) {
    return <p className="rounded-2xl border border-surface-outline/40 bg-surface-raised/70 p-6 text-sm text-slate-300">Loading audit entries…</p>;
  }
  if (!records.length) {
    return (
      <div className="rounded-2xl border border-surface-outline/40 bg-surface-raised/70 p-12 text-center">
        <div className="mx-auto max-w-md space-y-4">
          <div className="text-6xl opacity-30">📋</div>
          <h3 className="text-xl font-semibold text-slate-200">No Audit Entries</h3>
          <p className="text-sm text-slate-400">
            No audit trail entries found for the selected time range and filters.
          </p>
          <div className="mt-6 space-y-2 text-left text-xs text-slate-500">
            <p>• Adjust your date range filters</p>
            <p>• Check tenant-specific filters</p>
            <p>• Try removing all filters to see recent activity</p>
          </div>
          <p className="mt-6 text-xs text-slate-400">
            All admin operations are logged automatically when they occur
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-surface-outline/40 bg-surface-raised/70 shadow-lg">
      <table className="min-w-full divide-y divide-surface-outline/60 text-sm">
        <thead className="bg-surface-base/80 text-xs uppercase tracking-[0.2em] text-slate-400">
          <tr>
            <th className="px-4 py-3 text-left">Timestamp</th>
            <th className="px-4 py-3 text-left">Actor</th>
            <th className="px-4 py-3 text-left">Action</th>
            <th className="px-4 py-3 text-left">Target</th>
            <th className="px-4 py-3 text-left">Tenant</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-surface-outline/60 text-slate-200">
          {records.map((record, index) => (
            <tr key={record.id ?? index}>
              <td className="px-4 py-3 text-slate-300">{formatTimestamp(record.created_at)}</td>
              <td className="px-4 py-3 text-slate-200">{record.actor ?? '—'}</td>
              <td className="px-4 py-3 font-mono text-xs text-accent-primary">{record.action}</td>
              <td className="px-4 py-3 text-slate-300">{record.target ?? '—'}</td>
              <td className="px-4 py-3 text-slate-300">{record.tenant_id ?? '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default AuditTrail;
