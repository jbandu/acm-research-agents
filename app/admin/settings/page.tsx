'use client';

import { useEffect, useState } from 'react';

interface Provider {
  id: string;
  provider_key: string;
  provider_type: string;
  display_name: string;
  description: string;
  enabled: boolean;
  display_order: number;
  icon: string;
  config: any;
}

export default function AdminSettingsPage() {
  const [llmProviders, setLlmProviders] = useState<Provider[]>([]);
  const [searchSources, setSearchSources] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [adminSecret, setAdminSecret] = useState('');
  const [showSecretInput, setShowSecretInput] = useState(true);

  // Load provider settings
  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const response = await fetch('/api/admin/provider-settings');
      if (!response.ok) throw new Error('Failed to load settings');

      const data = await response.json();
      setLlmProviders(data.llmProviders || []);
      setSearchSources(data.searchSources || []);
      setLoading(false);
    } catch (error: any) {
      console.error('Error loading settings:', error);
      setMessage({ type: 'error', text: String(error.message || 'Failed to load settings') });
      setLoading(false);
    }
  };

  const toggleProvider = (providerKey: string, currentEnabled: boolean, type: 'llm' | 'search') => {
    if (type === 'llm') {
      setLlmProviders(prev =>
        prev.map(p =>
          p.provider_key === providerKey ? { ...p, enabled: !currentEnabled } : p
        )
      );
    } else {
      setSearchSources(prev =>
        prev.map(p =>
          p.provider_key === providerKey ? { ...p, enabled: !currentEnabled } : p
        )
      );
    }
  };

  const saveSettings = async () => {
    if (!adminSecret) {
      setMessage({ type: 'error', text: 'Admin secret required' });
      setShowSecretInput(true);
      return;
    }

    setSaving(true);
    setMessage(null);

    try {
      const updates = [
        ...llmProviders.map(p => ({
          provider_key: p.provider_key,
          enabled: p.enabled,
          display_order: p.display_order
        })),
        ...searchSources.map(p => ({
          provider_key: p.provider_key,
          enabled: p.enabled,
          display_order: p.display_order
        }))
      ];

      const response = await fetch('/api/admin/provider-settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-secret': adminSecret
        },
        body: JSON.stringify({ updates })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save settings');
      }

      const data = await response.json();
      setMessage({ type: 'success', text: `Successfully updated ${String(data.updated)} providers` });
      setShowSecretInput(false);

      // Reload to get fresh data
      await loadSettings();

    } catch (error: any) {
      console.error('Error saving settings:', error);
      setMessage({ type: 'error', text: String(error.message || 'Failed to save settings') });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-xl text-gray-600">Loading settings...</div>
        </div>
      </div>
    );
  }

  const enabledLlms = llmProviders.filter(p => p.enabled).length;
  const enabledSearchSources = searchSources.filter(p => p.enabled).length;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-5xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Provider Settings</h1>
          <p className="text-gray-600">
            Configure which LLM providers and search sources are enabled for queries.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm text-gray-500 mb-1">Enabled LLMs</div>
            <div className="text-3xl font-bold text-blue-600">{String(enabledLlms)}</div>
            <div className="text-xs text-gray-400 mt-1">of {String(llmProviders.length)} total</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm text-gray-500 mb-1">Enabled Search Sources</div>
            <div className="text-3xl font-bold text-green-600">{String(enabledSearchSources)}</div>
            <div className="text-xs text-gray-400 mt-1">of {String(searchSources.length)} total</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm text-gray-500 mb-1">Total Active</div>
            <div className="text-3xl font-bold text-purple-600">{String(enabledLlms + enabledSearchSources)}</div>
            <div className="text-xs text-gray-400 mt-1">providers enabled</div>
          </div>
        </div>

        {/* Message */}
        {message && (
          <div className={`mb-6 p-4 rounded-lg ${
            message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
          }`}>
            {String(message.text)}
          </div>
        )}

        {/* LLM Providers */}
        <div className="bg-white rounded-lg shadow mb-8">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">LLM Providers</h2>
            <p className="text-sm text-gray-500 mt-1">
              Enable or disable AI models for multi-LLM orchestration
            </p>
          </div>
          <div className="divide-y divide-gray-200">
            {llmProviders.map((provider) => (
              <div key={provider.provider_key} className="p-6 hover:bg-gray-50 transition">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-2xl">{String(provider.icon || '🤖')}</span>
                      <div>
                        <h3 className="text-lg font-medium text-gray-900">
                          {String(provider.display_name)}
                        </h3>
                        <p className="text-sm text-gray-500">
                          {String(provider.description)}
                        </p>
                      </div>
                    </div>
                    {provider.config && (
                      <div className="text-xs text-gray-400 ml-11 mt-2">
                        Model: {String(provider.config.model || 'N/A')}
                        {provider.config.costPer1M && (
                          <> • Cost: ${String(provider.config.costPer1M.input)}/M input, ${String(provider.config.costPer1M.output)}/M output</>
                        )}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => toggleProvider(provider.provider_key, provider.enabled, 'llm')}
                    className={`ml-4 relative inline-flex h-6 w-11 items-center rounded-full transition ${
                      provider.enabled ? 'bg-blue-600' : 'bg-gray-200'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                        provider.enabled ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Search Sources */}
        <div className="bg-white rounded-lg shadow mb-8">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Search Sources</h2>
            <p className="text-sm text-gray-500 mt-1">
              Enable or disable additional research data sources
            </p>
          </div>
          <div className="divide-y divide-gray-200">
            {searchSources.map((provider) => (
              <div key={provider.provider_key} className="p-6 hover:bg-gray-50 transition">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-2xl">{String(provider.icon || '🔍')}</span>
                      <div>
                        <h3 className="text-lg font-medium text-gray-900">
                          {String(provider.display_name)}
                        </h3>
                        <p className="text-sm text-gray-500">
                          {String(provider.description)}
                        </p>
                      </div>
                    </div>
                    {provider.config && provider.config.costPerSearch && (
                      <div className="text-xs text-gray-400 ml-11 mt-2">
                        Cost per search: ${String(provider.config.costPerSearch)}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => toggleProvider(provider.provider_key, provider.enabled, 'search')}
                    className={`ml-4 relative inline-flex h-6 w-11 items-center rounded-full transition ${
                      provider.enabled ? 'bg-green-600' : 'bg-gray-200'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                        provider.enabled ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Admin Secret Input (collapsible) */}
        {showSecretInput && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-6">
            <h3 className="text-sm font-medium text-yellow-900 mb-2">Admin Authentication Required</h3>
            <p className="text-xs text-yellow-700 mb-4">
              Enter your ADMIN_SECRET to save changes to provider settings.
            </p>
            <input
              type="password"
              value={adminSecret}
              onChange={(e) => setAdminSecret(e.target.value)}
              placeholder="Enter ADMIN_SECRET"
              className="w-full px-4 py-2 border border-yellow-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
            />
          </div>
        )}

        {/* Save Button */}
        <div className="flex justify-end gap-4">
          <button
            onClick={() => loadSettings()}
            disabled={saving}
            className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition disabled:opacity-50"
          >
            Reset Changes
          </button>
          <button
            onClick={saveSettings}
            disabled={saving}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 flex items-center gap-2"
          >
            {saving ? (
              <>
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Saving...
              </>
            ) : (
              'Save Settings'
            )}
          </button>
        </div>

        {/* Help Text */}
        <div className="mt-8 p-6 bg-blue-50 rounded-lg">
          <h3 className="text-sm font-medium text-blue-900 mb-2">💡 How it works</h3>
          <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
            <li>Changes take effect immediately after saving</li>
            <li>Query page will dynamically show only enabled providers</li>
            <li>At least one LLM must be enabled for queries to work</li>
            <li>Disabling a provider will exclude it from all new queries</li>
            <li>Search sources (like Google Patents) run automatically when enabled</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
