import React, { useState, useEffect, useCallback } from 'react';
import { providerService } from '../../services';
import type { ProviderInfo, ConfigField } from '../../types/providers';
import { Select } from '../../components/common/Select';

// ── Dynamic Config Field ───────────────────────────────────────────────

interface ConfigFieldInputProps {
    field: ConfigField;
    value: unknown;
    onChange: (key: string, value: unknown) => void;
}

const ConfigFieldInput: React.FC<ConfigFieldInputProps> = ({ field, value, onChange }) => {
    const baseClass = "w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-gray-100 placeholder-gray-500 focus:outline-none focus:border-cyan-500/40 focus:ring-1 focus:ring-cyan-500/20 transition-colors";

    switch (field.field_type) {
        case 'secret':
            return (
                <input
                    type="password"
                    className={baseClass}
                    placeholder={field.label}
                    value={(value as string) || ''}
                    onChange={(e) => onChange(field.key, e.target.value)}
                />
            );
        case 'bool':
            return (
                <button
                    onClick={() => onChange(field.key, !value)}
                    className="flex items-center gap-3"
                >
                    <div className={`w-11 h-6 rounded-full relative transition-colors ${value ? 'bg-cyan-500/30 border-cyan-500/40' : 'bg-white/10 border-white/10'} border`}>
                        <div className={`absolute top-1 w-4 h-4 rounded-full shadow-md transition-all ${value ? 'right-1 bg-cyan-400' : 'left-1 bg-gray-500'}`} />
                    </div>
                    <span className="text-sm text-gray-300">{value ? 'Enabled' : 'Disabled'}</span>
                </button>
            );
        case 'select': {
            const selectOptions = field.options?.map(([val, label]) => ({ id: val, label })) || [];
            return (
                <Select
                    options={selectOptions}
                    value={(value as string) || (field.default as string) || ''}
                    onChange={(val) => onChange(field.key, val)}
                />
            );
        }
        case 'number':
            return (
                <input
                    type="number"
                    className={baseClass}
                    placeholder={field.label}
                    value={(value as number) ?? ''}
                    onChange={(e) => onChange(field.key, e.target.value ? Number(e.target.value) : null)}
                />
            );
        default: // 'text'
            return (
                <input
                    type="text"
                    className={baseClass}
                    placeholder={field.label}
                    value={(value as string) || ''}
                    onChange={(e) => onChange(field.key, e.target.value)}
                />
            );
    }
};

// ── Provider Card ──────────────────────────────────────────────────────

interface ProviderCardProps {
    provider: ProviderInfo;
    index: number;
    total: number;
    onToggle: (id: string, enabled: boolean) => void;
    onMoveUp: (id: string) => void;
    onMoveDown: (id: string) => void;
    onSaveConfig: (id: string, config: Record<string, unknown>) => void;
    onTest: (id: string) => void;
    testResult: { success: boolean; message: string } | null;
    isTesting: boolean;
}

const ProviderCard: React.FC<ProviderCardProps> = ({
    provider, index, total, onToggle, onMoveUp, onMoveDown, onSaveConfig, onTest, testResult, isTesting,
}) => {
    const [expanded, setExpanded] = useState(false);
    const [config, setConfig] = useState<Record<string, unknown>>({});
    const [configLoaded, setConfigLoaded] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    const loadConfig = useCallback(async () => {
        if (configLoaded) return;
        try {
            const resp = await providerService.getConfig(provider.id);
            setConfig(resp.config);
            setConfigLoaded(true);
        } catch (err) {
            console.error('Failed to load config:', err);
        }
    }, [provider.id, configLoaded]);

    useEffect(() => {
        if (expanded) loadConfig();
    }, [expanded, loadConfig]);

    const handleFieldChange = (key: string, value: unknown) => {
        setConfig(prev => ({ ...prev, [key]: value }));
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await onSaveConfig(provider.id, config);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className={`rounded-2xl border transition-all ${
            provider.enabled
                ? 'bg-white/[0.03] border-white/10 hover:border-white/15'
                : 'bg-white/[0.01] border-white/5 opacity-60'
        }`}>
            {/* Header row */}
            <div className="flex items-center gap-4 px-5 py-4">
                {/* Priority arrows */}
                <div className="flex flex-col gap-0.5">
                    <button
                        onClick={() => onMoveUp(provider.id)}
                        disabled={index === 0}
                        className="text-gray-500 hover:text-white disabled:opacity-20 transition-colors text-xs leading-none p-0.5"
                        title="Move up (higher priority)"
                    >▲</button>
                    <button
                        onClick={() => onMoveDown(provider.id)}
                        disabled={index === total - 1}
                        className="text-gray-500 hover:text-white disabled:opacity-20 transition-colors text-xs leading-none p-0.5"
                        title="Move down (lower priority)"
                    >▼</button>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                        <h4 className="text-white font-semibold">{provider.name}</h4>
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/5 text-gray-500">{provider.id}</span>
                    </div>
                    <p className="text-sm text-gray-400 mt-0.5 truncate">{provider.description}</p>
                    <div className="flex gap-1.5 mt-1.5">
                        {provider.media_types.map(mt => (
                            <span key={mt} className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/10">
                                {mt}
                            </span>
                        ))}
                    </div>
                </div>

                {/* Toggle */}
                <button
                    onClick={() => onToggle(provider.id, !provider.enabled)}
                    className="flex-shrink-0"
                    title={provider.enabled ? 'Disable' : 'Enable'}
                >
                    <div className={`w-11 h-6 rounded-full relative transition-colors ${provider.enabled ? 'bg-cyan-500/30 border-cyan-500/40' : 'bg-white/10 border-white/10'} border`}>
                        <div className={`absolute top-1 w-4 h-4 rounded-full shadow-md transition-all ${provider.enabled ? 'right-1 bg-cyan-400' : 'left-1 bg-gray-500'}`} />
                    </div>
                </button>

                {/* Expand */}
                <button
                    onClick={() => setExpanded(!expanded)}
                    className="text-gray-400 hover:text-white transition-colors text-sm px-2"
                    title="Configure"
                >
                    {expanded ? '▾ Settings' : '▸ Settings'}
                </button>
            </div>

            {/* Expanded config form */}
            {expanded && (
                <div className="border-t border-white/5 px-5 py-4 space-y-4 animate-fade-in">
                    {provider.config_schema.map(field => (
                        <div key={field.key} className="space-y-1.5">
                            <label className="block text-sm font-medium text-gray-300">
                                {field.label}
                                {field.required && <span className="text-red-400 ml-1">*</span>}
                            </label>
                            <ConfigFieldInput
                                field={field}
                                value={config[field.key]}
                                onChange={handleFieldChange}
                            />
                        </div>
                    ))}

                    <div className="flex items-center gap-3 pt-2">
                        <button
                            onClick={handleSave}
                            disabled={isSaving}
                            className="px-5 py-2 rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-500/20 hover:bg-cyan-500/30 transition-colors text-sm font-medium disabled:opacity-50"
                        >
                            {isSaving ? 'Saving...' : 'Save Configuration'}
                        </button>
                        <button
                            onClick={() => onTest(provider.id)}
                            disabled={isTesting}
                            className="px-5 py-2 rounded-xl bg-white/5 text-gray-300 border border-white/10 hover:bg-white/10 transition-colors text-sm font-medium disabled:opacity-50"
                        >
                            {isTesting ? 'Testing...' : 'Test Connection'}
                        </button>
                        {testResult && (
                            <span className={`text-sm ${testResult.success ? 'text-emerald-400' : 'text-red-400'}`}>
                                {testResult.success ? '✓ ' : '✗ '}{testResult.message}
                            </span>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

// ── Main Tab ───────────────────────────────────────────────────────────

export const MetadataTab: React.FC = () => {
    // Providers State
    const [providers, setProviders] = useState<ProviderInfo[]>([]);
    const [loadingProviders, setLoadingProviders] = useState(true);
    const [testResults, setTestResults] = useState<Record<string, { success: boolean; message: string }>>({});
    const [testingId, setTestingId] = useState<string | null>(null);

    // Load Providers
    const fetchProviders = useCallback(async () => {
        try {
            const data = await providerService.list();
            setProviders(data);
        } catch (err) {
            console.error('Failed to load providers:', err);
        } finally {
            setLoadingProviders(false);
        }
    }, []);

    useEffect(() => {
        fetchProviders();
    }, [fetchProviders]);

    // Provider Handlers
    const handleToggle = async (id: string, enabled: boolean) => {
        try {
            await providerService.toggle(id, enabled);
            setProviders(prev => prev.map(p => p.id === id ? { ...p, enabled } : p));
        } catch (err) {
            console.error('Toggle failed:', err);
        }
    };

    const handleMoveUp = async (id: string) => {
        const idx = providers.findIndex(p => p.id === id);
        if (idx <= 0) return;
        const newOrder = [...providers];
        [newOrder[idx - 1], newOrder[idx]] = [newOrder[idx], newOrder[idx - 1]];
        setProviders(newOrder);
        try {
            await providerService.reorder(newOrder.map(p => p.id));
        } catch (err) {
            console.error('Reorder failed:', err);
            fetchProviders(); // rollback
        }
    };

    const handleMoveDown = async (id: string) => {
        const idx = providers.findIndex(p => p.id === id);
        if (idx < 0 || idx >= providers.length - 1) return;
        const newOrder = [...providers];
        [newOrder[idx], newOrder[idx + 1]] = [newOrder[idx + 1], newOrder[idx]];
        setProviders(newOrder);
        try {
            await providerService.reorder(newOrder.map(p => p.id));
        } catch (err) {
            console.error('Reorder failed:', err);
            fetchProviders();
        }
    };

    const handleSaveConfig = async (id: string, config: Record<string, unknown>) => {
        try {
            await providerService.updateConfig(id, config);
            setProviders(prev => prev.map(p => p.id === id ? { ...p, configured: true } : p));
        } catch (err) {
            console.error('Save config failed:', err);
        }
    };

    const handleTest = async (id: string) => {
        setTestingId(id);
        setTestResults(prev => {
            const copy = { ...prev };
            delete copy[id];
            return copy;
        });
        try {
            const result = await providerService.test(id);
            setTestResults(prev => ({ ...prev, [id]: result }));
        } catch (err) {
            setTestResults(prev => ({
                ...prev,
                [id]: { success: false, message: 'Request failed' },
            }));
        } finally {
            setTestingId(null);
        }
    };

    return (
        <div className="space-y-10 animate-fade-in pb-12">
            
            {/* General Metadata Settings */}
            <section className="space-y-4">
                <div>
                    <h3 className="text-2xl font-bold text-white">Metadata</h3>
                    <p className="text-gray-400 text-sm mt-1">Configure how Vortex retrieves metadata for your content.</p>
                </div>
                
                <div className="space-y-6 max-w-xl">
                    <label className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5 cursor-pointer hover:bg-white/10 transition-colors">
                        <span className="text-gray-200">Prefer Local Metadata</span>
                        <div className="w-10 h-6 bg-cyan-500/20 rounded-full relative border border-cyan-500/30">
                            <div className="absolute right-1 top-1 w-4 h-4 bg-cyan-400 rounded-full shadow-md" />
                        </div>
                    </label>
                </div>
            </section>

            {/* Providers List */}
            <section className="space-y-4">
                <div>
                    <h3 className="text-xl font-bold text-white">Metadata Providers</h3>
                    <p className="text-gray-400 text-sm mt-1">
                        Configure and prioritize metadata sources. Providers are tried in order — drag to reorder.
                        The first provider that returns results wins.
                    </p>
                </div>

                {loadingProviders ? (
                    <div className="flex items-center gap-3 text-gray-400">
                        <div className="w-5 h-5 border-2 border-gray-500 border-t-cyan-400 rounded-full animate-spin" />
                        Loading providers...
                    </div>
                ) : providers.length === 0 ? (
                    <div className="text-center py-12 text-gray-500 bg-white/5 rounded-2xl border border-white/5">
                        <p className="text-lg">No providers available</p>
                        <p className="text-sm mt-1">Provider plugins will appear here once registered in the server.</p>
                    </div>
                ) : (
                    <div className="space-y-3 max-w-3xl">
                        {providers.map((provider, idx) => (
                            <ProviderCard
                                key={provider.id}
                                provider={provider}
                                index={idx}
                                total={providers.length}
                                onToggle={handleToggle}
                                onMoveUp={handleMoveUp}
                                onMoveDown={handleMoveDown}
                                onSaveConfig={handleSaveConfig}
                                onTest={handleTest}
                                testResult={testResults[provider.id] ?? null}
                                isTesting={testingId === provider.id}
                            />
                        ))}
                    </div>
                )}
            </section>

        </div>
    );
};
