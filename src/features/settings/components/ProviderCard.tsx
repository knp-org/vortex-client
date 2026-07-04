import React, { useState, useEffect, useCallback } from 'react';
import { GlassCard, GlassButton, GlassToggle, GlassBadge } from '@knp-org/liquid-glass-ui';
import { ChevronUp, ChevronDown } from 'lucide-react';
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
        <GlassCard className={`p-0 transition-all ${provider.enabled ? '' : 'opacity-60'}`}>
            {/* Header row */}
            <div className="flex items-center gap-4 px-5 py-4">
                {/* Priority arrows */}
                <div className="flex flex-col gap-0.5">
                    <GlassButton
                        variant="ghost"
                        onClick={() => onMoveUp(provider.id)}
                        disabled={index === 0}
                        className="text-outline-variant hover:text-primary disabled:opacity-20 p-0.5"
                        title="Move up (higher priority)"
                    ><ChevronUp size={16} /></GlassButton>
                    <GlassButton
                        variant="ghost"
                        onClick={() => onMoveDown(provider.id)}
                        disabled={index === total - 1}
                        className="text-outline-variant hover:text-primary disabled:opacity-20 p-0.5"
                        title="Move down (lower priority)"
                    ><ChevronDown size={16} /></GlassButton>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                        <h4 className="text-primary font-semibold font-heading">{provider.name}</h4>
                        <GlassBadge className="text-[10px]">{provider.id}</GlassBadge>
                    </div>
                    <p className="text-sm text-outline-variant mt-0.5 truncate font-body">{provider.description}</p>
                    <div className="flex gap-1.5 mt-1.5">
                        {provider.media_types.map(mt => (
                            <GlassBadge key={mt} className="text-[10px]">{mt}</GlassBadge>
                        ))}
                    </div>
                </div>

                {/* Toggle */}
                <GlassToggle
                    checked={provider.enabled}
                    onChange={(e) => onToggle(provider.id, e.target.checked)}
                    title={provider.enabled ? 'Disable' : 'Enable'}
                />

                {/* Expand */}
                <GlassButton
                    variant="ghost"
                    onClick={() => setExpanded(!expanded)}
                    className="text-outline-variant hover:text-primary text-sm px-2 font-label"
                    title="Configure"
                >
                    {expanded ? '▾ Settings' : '▸ Settings'}
                </GlassButton>
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
                        <GlassButton variant="primary" onClick={handleSave} disabled={isSaving}>
                            {isSaving ? 'Saving...' : 'Save Configuration'}
                        </GlassButton>
                        <GlassButton onClick={() => onTest(provider.id)} disabled={isTesting}>
                            {isTesting ? 'Testing...' : 'Test Connection'}
                        </GlassButton>
                        {testResult && (
                            <span className={`text-sm font-label ${testResult.success ? 'text-primary' : 'text-error'}`}>
                                {testResult.success ? '✓ ' : '✗ '}{testResult.message}
                            </span>
                        )}
                    </div>
                </div>
            )}
        </GlassCard>
    );
};
