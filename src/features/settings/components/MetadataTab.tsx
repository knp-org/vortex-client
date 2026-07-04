import React from 'react';
import { GlassCard, GlassToggle, GlassSpinner, GlassEmptyState, GlassHeading, GlassText } from '@knp-org/liquid-glass-ui';
import { ProviderCard } from './ProviderCard';
import { useMetadataProviders } from '../hooks/useMetadataProviders';

export const MetadataTab: React.FC = () => {
    const {
        providers, loadingProviders, testResults, testingId,
        handleToggle, handleMoveUp, handleMoveDown, handleSaveConfig, handleTest,
    } = useMetadataProviders();

    return (
        <div className="space-y-10 animate-fade-in pb-12">

            {/* General Metadata Settings */}
            <section className="space-y-4">
                <div>
                    <GlassHeading size="medium" className="font-heading">Metadata</GlassHeading>
                    <GlassText variant="muted" className="text-sm mt-1 font-body">Configure how Vortex retrieves metadata for your content.</GlassText>
                </div>

                <div className="space-y-6 max-w-xl">
                    <GlassCard className="flex items-center justify-between p-4">
                        <span className="text-primary font-heading">Prefer Local Metadata</span>
                        <GlassToggle defaultChecked />
                    </GlassCard>
                </div>
            </section>

            {/* Providers List */}
            <section className="space-y-4">
                <div>
                    <GlassHeading size="small" className="font-heading">Metadata Providers</GlassHeading>
                    <GlassText variant="muted" className="text-sm mt-1 font-body">
                        Configure and prioritize metadata sources. Providers are tried in order — drag to reorder.
                        The first provider that returns results wins.
                    </GlassText>
                </div>

                {loadingProviders ? (
                    <div className="flex items-center gap-3 text-outline-variant font-label">
                        <GlassSpinner size={20} />
                        Loading providers...
                    </div>
                ) : providers.length === 0 ? (
                    <GlassEmptyState
                        icon={null}
                        title="No providers available"
                        description="Provider plugins will appear here once registered in the server."
                    />
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
