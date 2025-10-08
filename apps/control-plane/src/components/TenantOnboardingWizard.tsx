import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { TenantCreatePayload } from '../types/admin';
import { SmartDropdown, SmartMultiSelect } from './shared';

interface TenantOnboardingWizardProps {
  onComplete: (payload: TenantCreatePayload) => Promise<void>;
  onCancel: () => void;
  disabled?: boolean;
}

type Step = 'basics' | 'config' | 'review';

export function TenantOnboardingWizard({ onComplete, onCancel, disabled = false }: TenantOnboardingWizardProps) {
  const [currentStep, setCurrentStep] = useState<Step>('basics');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [tenantId, setTenantId] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState('');

  const steps: Step[] = ['basics', 'config', 'review'];
  const stepIndex = steps.indexOf(currentStep);

  const handleNext = () => {
    if (currentStep === 'basics') {
      if (!tenantId.trim() || !displayName.trim()) {
        setError('Tenant ID and display name are required');
        return;
      }
      setError(null);
      setCurrentStep('config');
    } else if (currentStep === 'config') {
      setCurrentStep('review');
    }
  };

  const handleBack = () => {
    setError(null);
    if (currentStep === 'config') {
      setCurrentStep('basics');
    } else if (currentStep === 'review') {
      setCurrentStep('config');
    }
  };

  const handleSubmit = async () => {
    if (busy || disabled) return;
    try {
      setBusy(true);
      setError(null);
      const tagList = tags
        .split(',')
        .map((t) => t.trim())
        .filter((t) => t.length > 0);
      await onComplete({
        id: tenantId.trim(),
        display_name: displayName.trim(),
        description: description.trim() || undefined,
        tags: tagList,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create tenant');
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative w-full max-w-2xl rounded-2xl border border-surface-outline/60 bg-surface-raised/95 p-8 shadow-2xl"
      >
        <header className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white">Tenant Onboarding</h2>
            <p className="mt-1 text-sm text-slate-400">
              Step {stepIndex + 1} of {steps.length}
            </p>
          </div>
          <button
            type="button"
            onClick={onCancel}
            disabled={busy}
            className="text-slate-400 transition hover:text-slate-200 disabled:opacity-50"
          >
            ✕
          </button>
        </header>

        <div className="mb-6 flex gap-2">
          {steps.map((step, idx) => (
            <div
              key={step}
              className={`h-2 flex-1 rounded-full transition ${
                idx <= stepIndex ? 'bg-accent-primary' : 'bg-surface-outline/30'
              }`}
            />
          ))}
        </div>

        {error && (
          <div className="mb-4 rounded-lg border border-accent-danger/40 bg-accent-danger/10 p-3 text-sm text-accent-danger">
            {error}
          </div>
        )}

        <AnimatePresence mode="wait">
          {currentStep === 'basics' && (
            <motion.div
              key="basics"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              <h3 className="text-lg font-semibold text-white">Basic Information</h3>
              <div className="space-y-4">
                <SmartDropdown
                  value={tenantId}
                  options={[]}
                  onChange={setTenantId}
                  placeholder="e.g., acme-corp, org-name"
                  allowCustom={true}
                  searchable={true}
                  disabled={busy}
                  label="Tenant ID"
                  description="Unique identifier for API key scoping"
                  icon="🆔"
                  required={true}
                />
                <SmartDropdown
                  value={displayName}
                  options={[]}
                  onChange={setDisplayName}
                  placeholder="e.g., ACME Corporation"
                  allowCustom={true}
                  searchable={true}
                  disabled={busy}
                  label="Display Name"
                  description="Human-readable name shown in UI"
                  icon="🏢"
                  required={true}
                />
              </div>
            </motion.div>
          )}

          {currentStep === 'config' && (
            <motion.div
              key="config"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              <h3 className="text-lg font-semibold text-white">Configuration</h3>
              <div className="space-y-4">
                <SmartDropdown
                  value={description}
                  options={[]}
                  onChange={setDescription}
                  placeholder="Brief description of this tenant"
                  allowCustom={true}
                  searchable={true}
                  disabled={busy}
                  label="Description"
                  description="Optional context about this tenant"
                  icon="📝"
                />
                <SmartMultiSelect
                  value={tags ? tags.split(',').map(t => t.trim()).filter(Boolean) : []}
                  options={[
                    { value: 'production', label: 'Production', icon: '🚀' },
                    { value: 'staging', label: 'Staging', icon: '🧪' },
                    { value: 'development', label: 'Development', icon: '💻' },
                    { value: 'enterprise', label: 'Enterprise', icon: '🏢' },
                    { value: 'beta', label: 'Beta', icon: '🔬' },
                    { value: 'trial', label: 'Trial', icon: '⏱️' },
                  ]}
                  onChange={(values) => setTags(values.join(', '))}
                  placeholder="Select tags..."
                  allowCustom={true}
                  showSelectAll={true}
                  disabled={busy}
                  label="Tags"
                  description="Organize tenants with searchable tags"
                  icon="🏷️"
                />
              </div>
            </motion.div>
          )}

          {currentStep === 'review' && (
            <motion.div
              key="review"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              <h3 className="text-lg font-semibold text-white">Review & Create</h3>
              <div className="space-y-3 rounded-lg border border-surface-outline/40 bg-surface-base/50 p-4">
                <div>
                  <p className="text-xs text-slate-500">Tenant ID</p>
                  <p className="font-mono text-sm text-accent-primary">{tenantId}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Display Name</p>
                  <p className="text-sm text-slate-200">{displayName}</p>
                </div>
                {description && (
                  <div>
                    <p className="text-xs text-slate-500">Description</p>
                    <p className="text-sm text-slate-300">{description}</p>
                  </div>
                )}
                {tags && (
                  <div>
                    <p className="text-xs text-slate-500">Tags</p>
                    <div className="mt-1 flex flex-wrap gap-2">
                      {tags
                        .split(',')
                        .map((t) => t.trim())
                        .filter((t) => t.length > 0)
                        .map((tag) => (
                          <span
                            key={tag}
                            className="rounded-full bg-accent-primary/20 px-2 py-1 text-xs text-accent-primary"
                          >
                            {tag}
                          </span>
                        ))}
                    </div>
                  </div>
                )}
              </div>
              <div className="rounded-lg border border-accent-success/30 bg-accent-success/10 p-3 text-sm text-slate-300">
                <p className="font-semibold text-accent-success">Ready to create tenant</p>
                <p className="mt-1 text-xs">You can create API keys for this tenant after creation</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <footer className="mt-6 flex justify-between">
          <button
            type="button"
            onClick={handleBack}
            disabled={currentStep === 'basics' || busy}
            className="rounded-full border border-surface-outline/50 px-4 py-2 text-sm text-slate-300 transition hover:border-accent-primary hover:text-accent-primary disabled:opacity-30"
          >
            Back
          </button>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onCancel}
              disabled={busy}
              className="rounded-full border border-surface-outline/50 px-4 py-2 text-sm text-slate-300 transition hover:border-slate-400 hover:text-slate-200 disabled:opacity-50"
            >
              Cancel
            </button>
            {currentStep === 'review' ? (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={busy}
                className="rounded-full bg-accent-primary px-6 py-2 text-sm font-semibold text-surface-base transition hover:bg-accent-primary/90 disabled:opacity-50"
              >
                {busy ? 'Creating...' : 'Create Tenant'}
              </button>
            ) : (
              <button
                type="button"
                onClick={handleNext}
                disabled={busy}
                className="rounded-full bg-accent-primary px-6 py-2 text-sm font-semibold text-surface-base transition hover:bg-accent-primary/90 disabled:opacity-50"
              >
                Next
              </button>
            )}
          </div>
        </footer>
      </motion.div>
    </div>
  );
}

export default TenantOnboardingWizard;
