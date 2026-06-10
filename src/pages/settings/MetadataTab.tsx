import React, { useState, useEffect, useCallback } from 'react';
import { providerService } from '../../services';
import type { ProviderInfo, ConfigField } from '../../types/providers';
import { Select } from '../../components/common/Select';
import { Toggle } from '../../components/common/Toggle';

// ── Dynamic Config Field ───────────────────────────────────────────────

interface ConfigFieldInputProps {
    field: ConfigField;
    value: unknown;
    onChange: (key: string, value: unknown) => void;
}

const ConfigFieldInput: React.FC<ConfigFieldInputProps> = ({ field, value, onChange }) => {
    const baseClass = "w-full bg-surface/50 border border-outline rounded-xl px-4 py-2.5 text-primary placeholder-outline-variant focus:outline-none focus:border-white/40 focus:ring-1 focus:ring-white/20 transition-colors shadow-inner font-body";

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
                <Toggle
                    label={value ? 'Enabled' : 'Disabled'}
                    checked={!!value}
                    onChange={(checked) => onChange(field.key, checked)}
                />
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
                ? 'bg-surface/50 backdrop-blur-surface border-outline hover:border-white/30 shadow-[0_0_20px_rgba(255,255,255,0.05)]'
                : 'bg-surface/30 backdrop-blur-surface border-outline opacity-60'
        }`}>
            {/* Header row */}
            <div className="flex items-center gap-4 px-5 py-4">
                {/* Priority arrows */}
                <div className="flex flex-col gap-0.5">
                    <button
                        onClick={() => onMoveUp(provider.id)}
                        disabled={index === 0}
                        className="text-outline-variant hover:text-primary disabled:opacity-20 transition-colors text-xs leading-none p-0.5"
                        title="Move up (higher priority)"
                    >▲</button>
                    <button
                        onClick={() => onMoveDown(provider.id)}
                        disabled={index === total - 1}
                        className="text-outline-variant hover:text-primary disabled:opacity-20 transition-colors text-xs leading-none p-0.5"
                        title="Move down (lower priority)"
                    >▼</button>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                        <h4 className="text-primary font-semibold font-heading">{provider.name}</h4>
                        <span className="text-[10px] font-label px-1.5 py-0.5 rounded bg-surface border border-outline text-outline-variant">{provider.id}</span>
                    </div>
                    <p className="text-sm text-outline-variant mt-0.5 truncate font-body">{provider.description}</p>
                    <div className="flex gap-1.5 mt-1.5">
                        {provider.media_types.map(mt => (
                            <span key={mt} className="text-[10px] px-2 py-0.5 rounded-full bg-surface/50 text-outline-variant border border-outline font-label">
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
                    <div className={`w-11 h-6 rounded-full relative transition-colors ${provider.enabled ? 'bg-white/20 border-white/30' : 'bg-surface/50 border-outline'} border shadow-inner`}>
                        <div className={`absolute top-1 w-4 h-4 rounded-full shadow-md transition-all ${provider.enabled ? 'right-1 bg-primary' : 'left-1 bg-outline-variant'}`} />
                    </div>
                </button>

                {/* Expand */}
                <button
                    onClick={() => setExpanded(!expanded)}
                    className="text-outline-variant hover:text-primary transition-colors text-sm px-2 font-label"
                    title="Configure"
                >
                    {expanded ? '▾ Settings' : '▸ Settings'}
                </button>
            </div>

            {/* Expanded config form */}
            {expanded && (
                <div className="border-t border-outline px-5 py-4 space-y-4 animate-fade-in">
                    {provider.config_schema.map(field => (
                        <div key={field.key} className="space-y-1.5">
                            <label className="block text-sm font-medium text-outline-variant font-label">
                                {field.label}
                                {field.required && <span className="text-error ml-1">*</span>}
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
                            className="px-5 py-2 rounded-xl bg-surface/80 text-primary border border-outline hover:bg-white/10 transition-colors text-sm font-label disabled:opacity-50"
                        >
                            {isSaving ? 'Saving...' : 'Save Configuration'}
                        </button>
                        <button
                            onClick={() => onTest(provider.id)}
                            disabled={isTesting}
                            className="px-5 py-2 rounded-xl bg-surface text-outline-variant border border-outline hover:bg-white/5 transition-colors text-sm font-label disabled:opacity-50"
                        >
                            {isTesting ? 'Testing...' : 'Test Connection'}
                        </button>
                        {testResult && (
                            <span className={`text-sm font-label ${testResult.success ? 'text-primary' : 'text-error'}`}>
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
                    <h3 className="text-2xl font-bold text-primary font-heading">Metadata</h3>
                    <p className="text-outline-variant text-sm mt-1 font-body">Configure how Vortex retrieves metadata for your content.</p>
                </div>
                
                <div className="space-y-6 max-w-xl">
                    <label className="flex items-center justify-between p-4 rounded-2xl bg-surface/50 backdrop-blur-surface border border-outline cursor-pointer hover:border-white/30 transition-colors shadow-[0_0_20px_rgba(255,255,255,0.05)]">
                        <span className="text-primary font-heading">Prefer Local Metadata</span>
                        <div className="w-10 h-6 bg-white/20 rounded-full relative border border-white/30 shadow-inner">
                            <div className="absolute right-1 top-1 w-4 h-4 bg-primary rounded-full shadow-md" />
                        </div>
                    </label>
                </div>
            </section>

            {/* Providers List */}
            <section className="space-y-4">
                <div>
                    <h3 className="text-xl font-bold text-primary font-heading">Metadata Providers</h3>
                    <p className="text-outline-variant text-sm mt-1 font-body">
                        Configure and prioritize metadata sources. Providers are tried in order — drag to reorder.
                        The first provider that returns results wins.
                    </p>
                </div>

                {loadingProviders ? (
                    <div className="flex items-center gap-3 text-outline-variant font-label">
                        <div className="w-5 h-5 border-2 border-outline border-t-primary rounded-full animate-spin" />
                        Loading providers...
                    </div>
                ) : providers.length === 0 ? (
                    <div className="text-center py-12 text-outline-variant bg-surface/50 backdrop-blur-surface rounded-2xl border border-outline shadow-[0_0_20px_rgba(255,255,255,0.05)]">
                        <p className="text-lg font-heading">No providers available</p>
                        <p className="text-sm mt-1 font-body">Provider plugins will appear here once registered in the server.</p>
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
