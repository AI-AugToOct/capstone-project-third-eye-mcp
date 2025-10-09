import { useEffect, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAdminStore } from '../store/adminStore';
import type { TenantCreatePayload, TenantEntry, TenantUpdatePayload } from '../types/admin';
import TenantCard from '../components/cards/TenantCard';
import TenantOnboardingWizard from '../components/TenantOnboardingWizard';

export interface TenantsPageProps {
  apiKey: string;
  disabled?: boolean;
}


function normalizeTags(input: string): string[] {
  return Array.from(
    new Set(
      input
        .split(',')
        .map((token) => token.trim())
        .filter((token) => token.length > 0),
    ),
  );
}

interface TenantFormState {
  id: string;
  display_name: string;
  description: string;
  tags: string;
}

const DEFAULT_FORM: TenantFormState = {
  id: '',
  display_name: '',
  description: '',
  tags: '',
};

function TenantCreateForm({ onCreate, disabled }: { onCreate: (payload: TenantCreatePayload) => Promise<void>; disabled: boolean }) {
  const [formState, setFormState] = useState<TenantFormState>(DEFAULT_FORM);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (busy || disabled) return;
    if (!formState.id.trim() || !formState.display_name.trim()) {
      setError('Tenant ID and display name are required');
      return;
    }
    try {
      setBusy(true);
      setError(null);
      await onCreate({
        id: formState.id.trim(),
        display_name: formState.display_name.trim(),
        description: formState.description.trim() || undefined,
        tags: normalizeTags(formState.tags),
      });
      setFormState(DEFAULT_FORM);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create tenant');
    } finally {
      setBusy(false);
    }
  };

  const tagPreview = normalizeTags(formState.tags);

  return (
    <motion.form
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      onSubmit={handleSubmit}
      className="space-y-6 rounded-2xl border border-surface-outline/60 bg-surface-raised/80 p-6 shadow-lg"
    >
      <header className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-white flex items-center gap-2">
            <span>🏢</span>
            Create Tenant
          </h2>
          <p className="mt-1 text-sm text-slate-300">Register a new tenant to scope API keys and reporting.</p>
        </div>
        <div className="text-right text-xs text-slate-400">
          <div>New Tenant</div>
          <div className="mt-1">Multi-tenancy Setup</div>
        </div>
      </header>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-2">
          <label className="block text-sm font-medium text-white">
            Tenant ID
          </label>
          <input
            required
            minLength={2}
            value={formState.id}
            disabled={busy || disabled}
            onChange={(event) => setFormState((prev) => ({ ...prev, id: event.target.value }))}
            className="w-full rounded-lg border border-surface-outline/50 bg-surface-base px-4 py-3 text-slate-100 focus:border-accent-primary focus:outline-none focus:ring-2 focus:ring-accent-primary/50 transition"
            placeholder="e.g., acme-corp"
          />
          <p className="text-xs text-slate-400">Unique identifier (lowercase, hyphens allowed)</p>
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-white">
            Display Name
          </label>
          <input
            required
            minLength={2}
            value={formState.display_name}
            disabled={busy || disabled}
            onChange={(event) => setFormState((prev) => ({ ...prev, display_name: event.target.value }))}
            className="w-full rounded-lg border border-surface-outline/50 bg-surface-base px-4 py-3 text-slate-100 focus:border-accent-primary focus:outline-none focus:ring-2 focus:ring-accent-primary/50 transition"
            placeholder="e.g., Acme Corporation"
          />
          <p className="text-xs text-slate-400">Human-readable name for the tenant</p>
        </div>
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-white">
          Description <span className="text-slate-400 font-normal">(optional)</span>
        </label>
        <textarea
          rows={3}
          value={formState.description}
          disabled={busy || disabled}
          onChange={(event) => setFormState((prev) => ({ ...prev, description: event.target.value }))}
          className="w-full rounded-lg border border-surface-outline/50 bg-surface-base px-4 py-3 text-slate-100 focus:border-accent-primary focus:outline-none focus:ring-2 focus:ring-accent-primary/50 transition resize-none"
          placeholder="Brief description of this tenant's purpose..."
        />
        <p className="text-xs text-slate-400">Optional notes about the tenant</p>
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-white">
          Tags <span className="text-slate-400 font-normal">(comma separated)</span>
        </label>
        <input
          value={formState.tags}
          disabled={busy || disabled}
          onChange={(event) => setFormState((prev) => ({ ...prev, tags: event.target.value }))}
          className="w-full rounded-lg border border-surface-outline/50 bg-surface-base px-4 py-3 text-slate-100 focus:border-accent-primary focus:outline-none focus:ring-2 focus:ring-accent-primary/50 transition"
          placeholder="production, primary, internal"
        />
        {tagPreview.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {tagPreview.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center rounded-full bg-accent-primary/20 px-2 py-1 text-xs font-medium text-accent-primary"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
        <p className="text-xs text-slate-400">Categorize this tenant with tags</p>
      </div>

      {error && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-lg border border-red-500/50 bg-red-500/10 p-4 text-sm text-red-200"
        >
          <div className="flex items-center gap-2">
            <span>❌</span>
            <span>{error}</span>
          </div>
        </motion.div>
      )}

      <div className="flex items-center justify-between pt-4 border-t border-surface-outline/30">
        <div className="text-xs text-slate-400">
          <div>💡 Tip: Use descriptive tenant IDs</div>
          <div className="mt-1">They'll be used in API keys and logs</div>
        </div>

        <button
          type="submit"
          disabled={busy || disabled || !formState.id.trim() || !formState.display_name.trim()}
          className="inline-flex items-center gap-2 rounded-full bg-accent-primary px-6 py-3 text-sm font-semibold text-surface-base transition hover:bg-accent-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {busy ? (
            <>
              <motion.span
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              >
                ⚙️
              </motion.span>
              Creating…
            </>
          ) : (
            <>
              <span>🏢</span>
              Create Tenant
            </>
          )}
        </button>
      </div>
    </motion.form>
  );
}

interface TenantEditProps {
  tenant: TenantEntry;
  onClose: () => void;
  onSave: (tenantId: string, payload: TenantUpdatePayload) => Promise<void>;
  disabled: boolean;
}

function TenantEditDrawer({ tenant, onClose, onSave, disabled }: TenantEditProps) {
  const [displayName, setDisplayName] = useState(tenant.display_name);
  const [description, setDescription] = useState(tenant.description ?? '');
  const [tags, setTags] = useState(tenant.tags.join(', '));
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const handleSave = async () => {
    if (busy || disabled) return;
    try {
      setBusy(true);
      setError(null);
      await onSave(tenant.id, {
        display_name: displayName.trim() || tenant.display_name,
        description: description.trim() || null,
        tags: normalizeTags(tags),
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update tenant');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 backdrop-blur">
      <div className="w-full max-w-lg rounded-2xl border border-surface-outline/60 bg-surface-raised/90 p-6 text-sm text-slate-200 shadow-xl">
        <header className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-accent-primary">Edit Tenant</p>
            <h2 className="font-mono text-white">{tenant.id}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-surface-outline/50 px-3 py-1 text-xs text-slate-300 transition hover:border-accent-primary hover:text-accent-primary"
          >
            Close
          </button>
        </header>
        <div className="mt-4 space-y-4">
          <label className="flex flex-col gap-2">
            <span className="text-xs uppercase tracking-[0.2em] text-slate-400">Display name</span>
            <input
              value={displayName}
              disabled={busy || disabled}
              onChange={(event) => setDisplayName(event.target.value)}
              className="rounded-lg border border-surface-outline/50 bg-surface-base px-3 py-2 text-slate-100 focus:border-accent-primary focus:outline-none focus:ring-2 focus:ring-accent-primary/50"
            />
          </label>
          <label className="flex flex-col gap-2">
            <span className="text-xs uppercase tracking-[0.2em] text-slate-400">Description</span>
            <textarea
              rows={3}
              value={description}
              disabled={busy || disabled}
              onChange={(event) => setDescription(event.target.value)}
              className="rounded-lg border border-surface-outline/50 bg-surface-base px-3 py-2 text-slate-100 focus:border-accent-primary focus:outline-none focus:ring-2 focus:ring-accent-primary/50"
            />
          </label>
          <label className="flex flex-col gap-2">
            <span className="text-xs uppercase tracking-[0.2em] text-slate-400">Tags</span>
            <input
              value={tags}
              disabled={busy || disabled}
              onChange={(event) => setTags(event.target.value)}
              className="rounded-lg border border-surface-outline/50 bg-surface-base px-3 py-2 text-slate-100 focus:border-accent-primary focus:outline-none focus:ring-2 focus:ring-accent-primary/50"
              placeholder="primary, production"
            />
          </label>
          {error && <p className="text-sm text-accent-danger">{error}</p>}
        </div>
        <footer className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-surface-outline/60 px-4 py-2 text-xs text-slate-300 transition hover:border-accent-primary hover:text-accent-primary"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={busy || disabled}
            className="rounded-full bg-accent-primary px-4 py-2 text-xs font-semibold text-surface-base transition hover:bg-accent-primary/80 disabled:opacity-50"
          >
            {busy ? 'Saving…' : 'Save changes'}
          </button>
        </footer>
      </div>
    </div>
  );
}

export function TenantsPage({ apiKey, disabled = false }: TenantsPageProps) {
  const {
    tenants,
    loadingTenants,
    fetchTenants,
    createTenant,
    updateTenant,
    archiveTenant,
    restoreTenant,
    error,
  } = useAdminStore((state) => ({
    tenants: state.tenants,
    loadingTenants: state.loadingTenants,
    fetchTenants: state.fetchTenants,
    createTenant: state.createTenant,
    updateTenant: state.updateTenant,
    archiveTenant: state.archiveTenant,
    restoreTenant: state.restoreTenant,
    error: state.error,
  }));

  const [includeArchived, setIncludeArchived] = useState(false);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState<string | null>(null);
  const [editingTenant, setEditingTenant] = useState<TenantEntry | null>(null);
  const [showWizard, setShowWizard] = useState(false);

  useEffect(() => {
    if (!apiKey) return;
    fetchTenants(apiKey, { includeArchived, search }).catch((err) => {
      console.error(err);
    });
  }, [apiKey, includeArchived, search, fetchTenants]);

  const handleSearchSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const value = searchInput.trim();
    setSearch(value || null);
  };

  const handleCreate = async (payload: TenantCreatePayload) => {
    if (!apiKey || disabled) return;
    await createTenant(apiKey, payload);
    await fetchTenants(apiKey, { includeArchived, search });
    setShowWizard(false);
  };

  const handleUpdate = async (tenantId: string, payload: TenantUpdatePayload) => {
    if (!apiKey || disabled) return;
    await updateTenant(apiKey, tenantId, payload);
    await fetchTenants(apiKey, { includeArchived, search });
  };

  const handleArchive = async (tenantId: string) => {
    if (!apiKey || disabled) return;
    await archiveTenant(apiKey, tenantId);
    await fetchTenants(apiKey, { includeArchived, search });
  };

  const handleRestore = async (tenantId: string) => {
    if (!apiKey || disabled) return;
    await restoreTenant(apiKey, tenantId);
    await fetchTenants(apiKey, { includeArchived, search });
  };

  const sortedTenants = useMemo(() => {
    return [...tenants].sort((a, b) => a.display_name.localeCompare(b.display_name));
  }, [tenants]);

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-surface-outline/60 bg-surface-raised/70 p-6 shadow-lg">
        <header className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center justify-between w-full md:w-auto">
            <div>
              <h2 className="text-lg font-semibold text-white">Tenant Directory</h2>
              <p className="text-sm text-slate-300">Track tenant health, key usage, and lifecycle status.</p>
            </div>
            <button
              type="button"
              onClick={() => setShowWizard(true)}
              disabled={disabled}
              className="md:hidden rounded-full bg-accent-primary px-4 py-2 text-sm font-semibold text-surface-base transition hover:bg-accent-primary/90 disabled:opacity-50"
            >
              + New
            </button>
          </div>
          <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto">
            <form onSubmit={handleSearchSubmit} className="flex flex-wrap items-center gap-3 text-sm text-slate-200">
            <input
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              disabled={disabled}
              placeholder="Search tenants"
              className="w-60 rounded-lg border border-surface-outline/50 bg-surface-base px-3 py-2 text-slate-100 focus:border-accent-primary focus:outline-none focus:ring-2 focus:ring-accent-primary/50"
            />
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={includeArchived}
                disabled={disabled}
                onChange={(event) => setIncludeArchived(event.target.checked)}
                className="h-4 w-4 rounded border border-surface-outline/60 bg-surface-base accent-accent-primary"
              />
              <span>Include archived</span>
            </label>
            <button
              type="submit"
              disabled={disabled}
              className="rounded-full border border-surface-outline/50 px-4 py-2 text-xs uppercase tracking-[0.2em] text-slate-300 transition hover:border-accent-primary hover:text-accent-primary"
            >
              Filter
            </button>
          </form>
            <button
              type="button"
              onClick={() => setShowWizard(true)}
              disabled={disabled}
              className="hidden md:inline-flex rounded-full bg-accent-primary px-6 py-2 text-sm font-semibold text-surface-base transition hover:bg-accent-primary/90 disabled:opacity-50"
            >
              + New Tenant
            </button>
          </div>
        </header>
        {loadingTenants ? (
          <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="h-64 rounded-2xl border border-surface-outline/40 bg-surface-raised/80 p-6 animate-pulse"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-10 w-10 rounded-full bg-slate-600/40" />
                  <div className="space-y-2">
                    <div className="h-4 w-24 rounded bg-slate-600/40" />
                    <div className="h-3 w-16 rounded bg-slate-600/40" />
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="h-3 w-full rounded bg-slate-600/40" />
                  <div className="h-3 w-3/4 rounded bg-slate-600/40" />
                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <div className="h-12 rounded bg-slate-600/40" />
                    <div className="h-12 rounded bg-slate-600/40" />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        ) : sortedTenants.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 text-center py-16"
          >
            <div className="text-7xl mb-6 opacity-40">🏢</div>
            <h3 className="text-2xl font-bold text-white mb-3">
              {search ? 'No Matching Tenants' : 'No Tenants Yet'}
            </h3>
            <p className="text-sm text-slate-400 mb-8 max-w-md mx-auto">
              {search
                ? 'No tenants match your search criteria. Try adjusting your filters or search terms.'
                : 'Set up your first tenant to enable multi-tenancy features, isolated reporting, and per-tenant API key management.'}
            </p>
            {!search && (
              <div className="space-y-6 max-w-md mx-auto">
                <div className="grid grid-cols-2 gap-4 text-left text-xs text-slate-500">
                  <div className="space-y-2">
                    <p>✓ Isolated API key scopes</p>
                    <p>✓ Per-tenant usage tracking</p>
                  </div>
                  <div className="space-y-2">
                    <p>✓ Custom quota limits</p>
                    <p>✓ Tenant-specific audit trails</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => document.getElementById('tenant-create-form')?.scrollIntoView({ behavior: 'smooth' })}
                  className="inline-flex items-center gap-2 rounded-full bg-accent-primary px-6 py-3 text-sm font-semibold text-surface-base transition hover:bg-accent-primary/90"
                >
                  Create First Tenant
                </button>
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
          >
            <AnimatePresence mode="popLayout">
              {sortedTenants.map((tenant) => (
                <TenantCard
                  key={tenant.id}
                  tenant={tenant}
                  onEdit={() => setEditingTenant(tenant)}
                  onArchive={() => handleArchive(tenant.id)}
                  onRestore={() => handleRestore(tenant.id)}
                  disabled={disabled}
                />
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </section>

      <div id="tenant-create-form">
        <TenantCreateForm onCreate={handleCreate} disabled={disabled || !apiKey} />
      </div>

      {editingTenant && (
        <TenantEditDrawer
          tenant={editingTenant}
          disabled={disabled || !apiKey}
          onClose={() => setEditingTenant(null)}
          onSave={handleUpdate}
        />
      )}

      {showWizard && (
        <TenantOnboardingWizard
          onComplete={handleCreate}
          onCancel={() => setShowWizard(false)}
          disabled={disabled || !apiKey}
        />
      )}

      {error && <p className="text-sm text-accent-danger">{error}</p>}
    </div>
  );
}

export default TenantsPage;
