import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { useAdminStore } from '../store/adminStore';
import type { ApiKeyCreatePayload, OptionItem } from '../types/admin';
import StepWizard, { type WizardStep } from './wizard/StepWizard';
import SmartDropdown from './forms/SmartDropdown';
import RateLimitSlider from './forms/RateLimitSlider';
import MultiSelect from './MultiSelect';
import { SmartDropdown as SharedSmartDropdown } from './shared';

export interface ApiKeyCreateFormProps {
  onSubmit: (payload: ApiKeyCreatePayload) => Promise<void>;
  disabled?: boolean;
  apiKey?: string;
}

const DEFAULT_PAYLOAD: ApiKeyCreatePayload = {
  role: 'consumer',
  tenant: '',
  display_name: '',
  limits: {
    rate: { per_minute: 60 },
    budget: { max_per_request: 2000 },
    branches: [],
    tools: [],
    tenants: [],
  },
  ttl_seconds: null,
};

export function ApiKeyCreateForm({ onSubmit, disabled = false, apiKey }: ApiKeyCreateFormProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [formState, setFormState] = useState<ApiKeyCreatePayload>(DEFAULT_PAYLOAD);
  const [ttlUnit, setTtlUnit] = useState<'hours' | 'days' | 'none'>(DEFAULT_PAYLOAD.ttl_seconds ? 'hours' : 'none');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { options, loadingOptions, fetchOptions } = useAdminStore((state) => ({
    options: state.options,
    loadingOptions: state.loadingOptions,
    fetchOptions: state.fetchOptions,
  }));

  useEffect(() => {
    if (!apiKey) return;
    fetchOptions(apiKey).catch(() => {});
  }, [apiKey, fetchOptions]);

  const branchOptions = useMemo<OptionItem[]>(() => options?.branches ?? [], [options]);
  const toolOptions = useMemo<OptionItem[]>(() => options?.tools ?? [], [options]);
  const tenantOptions = useMemo<OptionItem[]>(() => options?.tenants ?? [], [options]);

  const handleComplete = async () => {
    if (disabled || loading) return;
    try {
      setLoading(true);
      setError(null);
      const normalizedTenant = formState.tenant?.trim() || undefined;
      const normalizedDisplayName = formState.display_name?.trim() || undefined;
      const payload: ApiKeyCreatePayload = {
        role: formState.role,
        limits: formState.limits,
        tenant: normalizedTenant,
        display_name: normalizedDisplayName,
        ttl_seconds:
          ttlUnit === 'none'
            ? null
            : ttlUnit === 'hours'
              ? Number(formState.ttl_seconds ?? 0) * 3600
              : Number(formState.ttl_seconds ?? 0) * 86400,
      };
      if (!payload.tenant) delete payload.tenant;
      if (!payload.display_name) delete payload.display_name;
      await onSubmit(payload);
      setFormState(DEFAULT_PAYLOAD);
      setTtlUnit('none');
      setCurrentStep(0);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create key');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setFormState(DEFAULT_PAYLOAD);
    setTtlUnit('none');
    setCurrentStep(0);
    setError(null);
  };

  // Wizard steps definition
  const wizardSteps: WizardStep[] = [
    {
      id: 'basics',
      title: 'Basic Information',
      description: 'Set up the key identity and access level',
      icon: '👤',
      isValid: !!(formState.display_name?.trim() && formState.role),
      content: (
        <div className="space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid gap-6 md:grid-cols-2"
          >
            <div className="space-y-2">
              <label className="text-sm font-medium text-white">Role</label>
              <p className="text-xs text-slate-400 mb-3">Controls console access level for this credential.</p>
              <div className="space-y-2">
                {[
                  { value: 'consumer', label: 'Consumer', desc: 'Read-only access to playback & portal' },
                  { value: 'operator', label: 'Operator', desc: 'Manage sessions & budgets' },
                  { value: 'admin', label: 'Admin', desc: 'Full control plane access' }
                ].map((role) => (
                  <label key={role.value} className="flex items-start gap-3 p-3 rounded-lg border border-surface-outline/30 hover:border-accent-primary/50 transition cursor-pointer">
                    <input
                      type="radio"
                      name="role"
                      value={role.value}
                      checked={formState.role === role.value}
                      onChange={(e) => setFormState(prev => ({ ...prev, role: e.target.value }))}
                      className="mt-1 h-4 w-4 accent-accent-primary"
                      disabled={disabled}
                    />
                    <div>
                      <div className="font-medium text-white">{role.label}</div>
                      <div className="text-xs text-slate-400">{role.desc}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <SharedSmartDropdown
                value={formState.display_name ?? ''}
                options={[]}
                onChange={(value) => setFormState(prev => ({ ...prev, display_name: value }))}
                placeholder="e.g., Production API Key, Dev API Key"
                allowCustom={true}
                searchable={true}
                disabled={disabled}
                label="Display Name"
                description="Shown in the key directory and audit trail"
                icon="🔑"
                required={true}
              />

              <SmartDropdown
                value={formState.tenant ?? ''}
                options={tenantOptions}
                onChange={(value) => setFormState(prev => ({ ...prev, tenant: value }))}
                placeholder="Select or enter tenant..."
                allowCustom
                disabled={disabled}
                label="Default Tenant"
                description="Choose where the key belongs by default"
                icon="🏢"
              />
            </div>
          </motion.div>
        </div>
      ),
    },
    {
      id: 'limits',
      title: 'Rate Limits & Budget',
      description: 'Configure performance and cost guardrails',
      icon: '⚡',
      isValid: true,
      content: (
        <div className="space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid gap-6 lg:grid-cols-2"
          >
            <RateLimitSlider
              value={(formState.limits?.rate?.per_minute ?? 60) as number}
              onChange={(value) =>
                setFormState(prev => ({
                  ...prev,
                  limits: {
                    ...(prev.limits ?? {}),
                    rate: { per_minute: value }
                  }
                }))
              }
              disabled={disabled}
            />

            <div className="space-y-4">
              <SharedSmartDropdown
                value={(formState.limits?.budget?.max_per_request ?? 2000).toString()}
                options={[
                  { value: '500', label: '500 tokens', description: 'Small requests', meta: '💬' },
                  { value: '1000', label: '1,000 tokens', description: 'Standard', meta: '📊' },
                  { value: '2000', label: '2,000 tokens', description: 'Default', meta: '✨' },
                  { value: '5000', label: '5,000 tokens', description: 'Large', meta: '🚀' },
                  { value: '10000', label: '10,000 tokens', description: 'Extra large', meta: '🌟' },
                ]}
                onChange={(value) =>
                  setFormState(prev => ({
                    ...prev,
                    limits: {
                      ...(prev.limits ?? {}),
                      budget: { ...(prev.limits?.budget ?? {}), max_per_request: Number(value) }
                    }
                  }))
                }
                placeholder="Select budget per request"
                allowCustom={true}
                searchable={true}
                disabled={disabled}
                label="Budget per Request"
                description="Maximum tokens to spend per API call"
                icon="💰"
              />

              <SharedSmartDropdown
                value={(formState.limits?.max_budget_tokens ?? 0).toString()}
                options={[
                  { value: '0', label: 'Unlimited', description: 'No hard ceiling', icon: '♾️' },
                  { value: '10000', label: '10,000 tokens', description: 'Small budget' },
                  { value: '50000', label: '50,000 tokens', description: 'Medium budget' },
                  { value: '100000', label: '100,000 tokens', description: 'Large budget' },
                  { value: '500000', label: '500,000 tokens', description: 'Enterprise budget' },
                ]}
                onChange={(value) =>
                  setFormState(prev => ({
                    ...prev,
                    limits: {
                      ...(prev.limits ?? {}),
                      max_budget_tokens: Number(value)
                    }
                  }))
                }
                placeholder="Select total budget limit"
                allowCustom={true}
                searchable={true}
                disabled={disabled}
                label="Total Budget Limit"
                description="Optional hard ceiling for cumulative spend"
                icon="🏛️"
              />

              <div className="grid grid-cols-2 gap-3">
                <SharedSmartDropdown
                  value={formState.ttl_seconds?.toString() ?? '0'}
                  options={[
                    { value: '0', label: 'No expiry', icon: '♾️' },
                    { value: '1', label: '1' },
                    { value: '2', label: '2' },
                    { value: '3', label: '3' },
                    { value: '6', label: '6' },
                    { value: '12', label: '12' },
                    { value: '24', label: '24' },
                    { value: '48', label: '48' },
                  ]}
                  onChange={(value) => setFormState(prev => ({ ...prev, ttl_seconds: Number(value) }))}
                  placeholder="Duration"
                  allowCustom={true}
                  searchable={false}
                  disabled={disabled}
                  label="Expiration Duration"
                  icon="⏱️"
                />
                <SharedSmartDropdown
                  value={ttlUnit}
                  options={[
                    { value: 'none', label: 'No expiry', icon: '♾️' },
                    { value: 'hours', label: 'Hours', icon: '⏰' },
                    { value: 'days', label: 'Days', icon: '📅' },
                  ]}
                  onChange={(value) => setTtlUnit(value as typeof ttlUnit)}
                  placeholder="Unit"
                  searchable={false}
                  disabled={disabled}
                  label="Time Unit"
                  icon="🕒"
                />
              </div>
              <p className="text-xs text-slate-400">Zero keeps the key active until manually revoked</p>
            </div>
          </motion.div>
        </div>
      ),
    },
    {
      id: 'permissions',
      title: 'Permissions & Access',
      description: 'Configure what this key can access',
      icon: '🔐',
      isValid: true,
      content: (
        <div className="space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div>
              <label className="block text-sm font-medium text-white mb-3">
                Allowed Branches
              </label>
              <MultiSelect
                value={Array.isArray(formState.limits?.branches) ? formState.limits.branches : []}
                options={branchOptions}
                onChange={(next) =>
                  setFormState(prev => ({
                    ...prev,
                    limits: {
                      ...(prev.limits ?? {}),
                      branches: next
                    }
                  }))
                }
                placeholder={branchOptions.length ? 'Select branches...' : 'No branches configured'}
                busy={loadingOptions}
                emptyLabel="No branch options available"
                disabled={disabled}
                showSelectAll={true}
                groupBy="group"
              />
              <p className="text-xs text-slate-400 mt-2">Limit tools to specific control-plane branches</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-3">
                Allowed Tools
              </label>
              <MultiSelect
                value={Array.isArray(formState.limits?.tools) ? formState.limits.tools : []}
                options={toolOptions}
                onChange={(next) =>
                  setFormState(prev => ({
                    ...prev,
                    limits: {
                      ...(prev.limits ?? {}),
                      tools: next
                    }
                  }))
                }
                placeholder={toolOptions.length ? 'Select tools...' : 'No tools discovered'}
                busy={loadingOptions}
                emptyLabel="No tool options available"
                disabled={disabled}
                showSelectAll={true}
                groupBy="group"
              />
              <p className="text-xs text-slate-400 mt-2">Restrict key to specific tool integrations</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-3">
                Tenant Access
              </label>
              <div className="space-y-3">
                <div className="flex flex-col gap-2 text-sm">
                  <label className="flex items-center gap-3 p-3 rounded-lg border border-surface-outline/30 hover:border-accent-primary/50 transition cursor-pointer">
                    <input
                      type="checkbox"
                      checked={Array.isArray(formState.limits?.tenants) && formState.limits.tenants.includes('__all__')}
                      onChange={(e) =>
                        setFormState(prev => {
                          const checked = e.target.checked;
                          const nextLimits = { ...(prev.limits ?? {}) };
                          if (checked) {
                            nextLimits.tenants = ['__all__'];
                          } else if (Array.isArray(nextLimits.tenants)) {
                            nextLimits.tenants = nextLimits.tenants.filter(v => v !== '__all__');
                          }
                          return { ...prev, limits: nextLimits };
                        })
                      }
                      disabled={disabled}
                      className="h-4 w-4 rounded border border-surface-outline/60 bg-surface-base accent-accent-primary"
                    />
                    <div>
                      <div className="font-medium text-white">Allow All Tenants</div>
                      <div className="text-xs text-slate-400">Override tenant restrictions</div>
                    </div>
                  </label>

                  <label className="flex items-center gap-3 p-3 rounded-lg border border-surface-outline/30 hover:border-accent-primary/50 transition cursor-pointer">
                    <input
                      type="checkbox"
                      checked={Array.isArray(formState.limits?.tenants) && formState.limits.tenants.includes('__primary__')}
                      onChange={(e) =>
                        setFormState(prev => {
                          const checked = e.target.checked;
                          const nextLimits = { ...(prev.limits ?? {}) };
                          if (checked) {
                            nextLimits.tenants = ['__primary__'];
                          } else if (Array.isArray(nextLimits.tenants)) {
                            nextLimits.tenants = nextLimits.tenants.filter(v => v !== '__primary__');
                          }
                          return { ...prev, limits: nextLimits };
                        })
                      }
                      disabled={disabled}
                      className="h-4 w-4 rounded border border-surface-outline/60 bg-surface-base accent-accent-primary"
                    />
                    <div>
                      <div className="font-medium text-white">Primary Tenant Only</div>
                      <div className="text-xs text-slate-400">Single-tenant enforcement</div>
                    </div>
                  </label>
                </div>

                <MultiSelect
                  value={Array.isArray(formState.limits?.tenants) ? formState.limits.tenants : []}
                  options={tenantOptions}
                  onChange={(next) =>
                    setFormState(prev => ({
                      ...prev,
                      limits: {
                        ...(prev.limits ?? {}),
                        tenants: next
                      }
                    }))
                  }
                  placeholder={tenantOptions.length ? 'Select specific tenants...' : 'Add tenant IDs'}
                  busy={loadingOptions}
                  emptyLabel="No tenant catalog yet"
                  allowCustom
                  disabled={
                    disabled || (Array.isArray(formState.limits?.tenants) &&
                    (formState.limits.tenants.includes('__all__') || formState.limits.tenants.includes('__primary__')))
                  }
                  showSelectAll={true}
                />
                <p className="text-xs text-slate-400">Use toggles above for broad access, or select specific tenants</p>
              </div>
            </div>
          </motion.div>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-surface-outline/60 bg-surface-raised/80 p-6 shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-semibold text-white">Create API Key</h2>
            <p className="text-sm text-slate-300 mt-1">Provision tenant-scoped keys with advanced guardrails</p>
          </div>
          <div className="text-right text-xs text-slate-400">
            <div>🔑 API Key Wizard</div>
            <div className="mt-1">Step-by-step configuration</div>
          </div>
        </div>
      </div>

      <StepWizard
        steps={wizardSteps}
        currentStep={currentStep}
        onStepChange={setCurrentStep}
        onComplete={handleComplete}
        onCancel={handleCancel}
        allowStepNavigation={true}
      />

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

      {loading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="rounded-lg border border-accent-primary/50 bg-accent-primary/10 p-4 text-sm text-accent-primary"
        >
          <div className="flex items-center gap-2">
            <motion.span
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            >
              ⚙️
            </motion.span>
            <span>Provisioning API key...</span>
          </div>
        </motion.div>
      )}
    </div>
  );
}

export default ApiKeyCreateForm;
