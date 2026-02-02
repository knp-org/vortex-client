import React from 'react';

export const MetadataTab: React.FC = () => {
    return (
        <div className="space-y-6 animate-fade-in">
            <h3 className="text-2xl font-bold text-white">Metadata Agents</h3>
            <p className="text-gray-400 text-sm">Configure how Vortex retrieves metadata for your content.</p>

            <div className="space-y-6 max-w-xl">
                <div className="space-y-2">
                    <label className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5 cursor-pointer hover:bg-white/10 transition-colors">
                        <span className="text-gray-200">Prefer Local Metadata</span>
                        <div className="w-10 h-6 bg-cyan-500/20 rounded-full relative border border-cyan-500/30">
                            <div className="absolute right-1 top-1 w-4 h-4 bg-cyan-400 rounded-full shadow-md" />
                        </div>
                    </label>
                </div>
            </div>
        </div>
    );
};
