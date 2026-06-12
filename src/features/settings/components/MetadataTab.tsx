import React from 'react';
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
