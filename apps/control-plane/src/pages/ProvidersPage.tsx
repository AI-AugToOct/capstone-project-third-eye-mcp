import { useEffect, useState } from 'react';
import { fetchGroqConfig, configureGroqProvider } from '../lib/api';
import type { ProviderConfigResponse } from '../types/admin';

export interface ProvidersPageProps {
  apiKey: string;
  disabled?: boolean;
}

export function ProvidersPage({ apiKey, disabled = false }: ProvidersPageProps) {
  const [groqConfig, setGroqConfig] = useState<ProviderConfigResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [configuring, setConfiguring] = useState(false);
  const [groqApiKey, setGroqApiKey] = useState('');
  const [testConnection, setTestConnection] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    if (!apiKey || disabled) return;

    const loadGroqConfig = async () => {
      try {
        setLoading(true);
        const config = await fetchGroqConfig(apiKey);
        setGroqConfig(config);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load provider configuration');
      } finally {
        setLoading(false);
      }
    };

    loadGroqConfig();
  }, [apiKey, disabled]);

  const handleConfigureGroq = async () => {
    if (!groqApiKey.trim()) {
      setError('Please enter a Groq API key');
      return;
    }

    setConfiguring(true);
    setError(null);
    setFeedback(null);

    try {
      const result = await configureGroqProvider(apiKey, {
        api_key: groqApiKey.trim(),
        test_connection: testConnection,
      });

      setGroqConfig(result);
      setGroqApiKey('');

      if (result.connection_test === true) {
        setFeedback(`✅ Groq API key configured successfully! Found ${result.models_available} available models.`);
      } else if (result.connection_test === false) {
        setFeedback('⚠️ Groq API key saved but connection test failed. Please verify the key is correct.');
      } else {
        setFeedback('✅ Groq API key configured successfully!');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to configure Groq API key');
    } finally {
      setConfiguring(false);
    }
  };

  const formatLastUpdated = (timestamp?: number | null) => {
    if (!timestamp) return null;
    return new Date(timestamp * 1000).toLocaleString();
  };

  return (
    <section className="space-y-6">
      <header className="space-y-2">
        <p className="text-xs uppercase tracking-[0.3em] text-accent-primary">Provider Configuration</p>
        <h1 className="text-3xl font-semibold text-white">LLM Provider Settings</h1>
        <p className="text-sm text-slate-300">
          Configure API keys for external LLM providers. These settings enable Third Eye MCP to connect to AI services.
        </p>
      </header>

      {error && (
        <div className="rounded-xl border border-accent-danger/40 bg-accent-danger/10 p-3 text-sm text-accent-danger">
          {error}
        </div>
      )}

      {feedback && (
        <div className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-3 text-sm text-emerald-400">
          {feedback}
        </div>
      )}

      {/* Groq Configuration */}
      <div className="rounded-2xl border border-surface-outline/60 bg-surface-raised/70 p-6">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-white">Groq</h2>
            <p className="text-sm text-slate-400">Ultra-fast inference for all Third Eye personas</p>
          </div>
          <div className="flex items-center gap-2">
            {loading ? (
              <div className="h-6 w-20 animate-pulse rounded-full bg-surface-outline/30" />
            ) : (
              <span className={`rounded-full px-3 py-1 text-xs font-medium ${
                groqConfig?.configured
                  ? 'bg-emerald-500/20 text-emerald-400'
                  : 'bg-amber-500/20 text-amber-400'
              }`}>
                {groqConfig?.configured ? 'Configured' : 'Not Configured'}
              </span>
            )}
          </div>
        </div>

        {groqConfig?.configured && (
          <div className="mb-4 rounded-lg border border-surface-outline/30 bg-surface-base/50 p-4">
            <div className="grid grid-cols-1 gap-2 text-sm md:grid-cols-3">
              <div>
                <span className="text-slate-400">Connection:</span>
                <span className={`ml-2 ${
                  groqConfig.connection_test === true ? 'text-emerald-400' :
                  groqConfig.connection_test === false ? 'text-amber-400' : 'text-slate-300'
                }`}>
                  {groqConfig.connection_test === true ? 'Active' :
                   groqConfig.connection_test === false ? 'Failed' : 'Unknown'}
                </span>
              </div>
              <div>
                <span className="text-slate-400">Models:</span>
                <span className="ml-2 text-slate-200">
                  {groqConfig.models_available || 'Unknown'}
                </span>
              </div>
              <div>
                <span className="text-slate-400">Updated:</span>
                <span className="ml-2 text-slate-200">
                  {formatLastUpdated(groqConfig.last_updated) || 'Unknown'}
                </span>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label htmlFor="groq-api-key" className="block text-sm font-medium text-slate-300 mb-2">
              API Key
            </label>
            <input
              id="groq-api-key"
              type="password"
              value={groqApiKey}
              onChange={(e) => setGroqApiKey(e.target.value)}
              placeholder="gsk_..."
              disabled={disabled || configuring}
              className="w-full rounded-lg border border-surface-outline/50 bg-surface-base px-3 py-2 text-sm text-slate-100 focus:border-accent-primary focus:outline-none focus:ring-2 focus:ring-accent-primary/40 disabled:opacity-50"
            />
            <p className="mt-1 text-xs text-slate-400">
              Enter your Groq API key. Get one from{' '}
              <a
                href="https://console.groq.com/keys"
                target="_blank"
                rel="noopener noreferrer"
                className="text-accent-primary hover:underline"
              >
                console.groq.com
              </a>
            </p>
          </div>

          <div className="flex items-center gap-2">
            <input
              id="test-connection"
              type="checkbox"
              checked={testConnection}
              onChange={(e) => setTestConnection(e.target.checked)}
              disabled={disabled || configuring}
              className="rounded border-surface-outline/50 bg-surface-base text-accent-primary focus:ring-accent-primary/40"
            />
            <label htmlFor="test-connection" className="text-sm text-slate-300">
              Test connection after configuring
            </label>
          </div>

          <div className="flex justify-end">
            <button
              onClick={handleConfigureGroq}
              disabled={disabled || configuring || !groqApiKey.trim()}
              className="inline-flex items-center rounded-full bg-accent-primary px-4 py-2 text-xs font-semibold text-surface-base transition hover:bg-sky-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary/50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {configuring ? 'Configuring...' : 'Configure Groq'}
            </button>
          </div>
        </div>
      </div>

      {/* Information Section */}
      <div className="rounded-2xl border border-surface-outline/60 bg-surface-raised/70 p-6">
        <h3 className="text-lg font-semibold text-white mb-3">About Provider Configuration</h3>
        <div className="space-y-3 text-sm text-slate-300">
          <p>
            <strong className="text-slate-200">Groq:</strong> Ultra-fast inference engine powering all Third Eye personas.
            Required for real-time AI orchestration and smart decision-making.
          </p>
          <p>
            <strong className="text-slate-200">Security:</strong> API keys are stored securely and used only for
            authenticated requests to the respective providers.
          </p>
          <p>
            <strong className="text-slate-200">Testing:</strong> Connection tests verify your API key works and
            can access available models before saving the configuration.
          </p>
        </div>
      </div>
    </section>
  );
}

export default ProvidersPage;