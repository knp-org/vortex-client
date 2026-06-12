import React, { useState, useEffect, useCallback } from 'react';
import { providerService } from '@/services';
import type { ProviderInfo } from '@/types/providers';
import { ConfigFieldInput } from './ConfigFieldInput';

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

/** A single metadata provider row with priority arrows, toggle, and config form. */
export const ProviderCard: React.FC<ProviderCardProps> = ({
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
