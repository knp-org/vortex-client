import React, { useState } from 'react';
import { GlassCard, GlassButton, GlassHeading, GlassText } from '@knp-org/liquid-glass-ui';
import { ConfirmModal } from '@/shared/ui/ConfirmModal';
import { Power, Database } from 'lucide-react';
import { systemService, SystemAction } from '@/services';

export const SystemTab: React.FC = () => {
    const [systemAction, setSystemAction] = useState<SystemAction | null>(null);
    const [isProcessingSystem, setIsProcessingSystem] = useState(false);

    const executeSystemAction = async () => {
        if (!systemAction) return;
        setIsProcessingSystem(true);
        try {
            await systemService.execute(systemAction);
            if (systemAction === 'clear') {
                window.location.reload();
            }
        } catch (error) {
            console.error("System action error", error);
        } finally {
            setIsProcessingSystem(false);
            setSystemAction(null);
        }
    };

    return (
        <>
            <ConfirmModal
                isOpen={systemAction !== null}
                onClose={() => setSystemAction(null)}
                onConfirm={executeSystemAction}
                title={
                    systemAction === 'shutdown' ? "Shutdown Server" :
                        systemAction === 'restart' ? "Restart Server" :
                            "Clear Database"
                }
                message={
                    systemAction === 'shutdown' ? "Are you sure you want to shutdown the server? You will need to manually start it again." :
                        systemAction === 'restart' ? "Are you sure you want to restart the server?" :
                            "DANGER: This will delete ALL libraries, media, and playback progress. Files on disk will NOT be touched. Users and Settings will be preserved. This action cannot be undone."
                }
                confirmText={
                    systemAction === 'shutdown' ? "Shutdown" :
                        systemAction === 'restart' ? "Restart" :
                            "Clear Everything"
                }
                variant="danger"
                isLoading={isProcessingSystem}
            />

            <div className="space-y-6 animate-fade-in">
                <GlassHeading size="medium" className="font-heading">System Actions</GlassHeading>
                <GlassText variant="muted" className="text-sm font-body">Manage server state and data. Use with caution.</GlassText>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl">
                    <GlassCard className="p-6 space-y-4">
                        <div className="flex items-center space-x-3 text-error">
                            <Database size={24} />
                            <GlassHeading size="small" className="font-heading">Database Management</GlassHeading>
                        </div>
                        <p className="text-outline-variant text-sm leading-relaxed font-body">
                            Reset your library data. This clears all media entries, libraries, and watch progress.
                            <br /><strong className="text-error">Your physical files are NOT deleted.</strong>
                            <br />Users and Settings are preserved.
                        </p>
                        <GlassButton
                            variant="danger"
                            className="w-full justify-center"
                            onClick={() => setSystemAction('clear')}
                        >
                            Clear Database
                        </GlassButton>
                    </GlassCard>

                    <GlassCard className="p-6 space-y-4">
                        <div className="flex items-center space-x-3 text-primary">
                            <Power size={24} />
                            <GlassHeading size="small" className="font-heading">Server Control</GlassHeading>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <p className="text-outline-variant text-sm mb-3 font-body">
                                    Restart the Vortex server application.
                                </p>
                                <GlassButton
                                    className="w-full justify-center"
                                    onClick={() => setSystemAction('restart')}
                                >
                                    Restart Server
                                </GlassButton>
                            </div>
                            <div className="pt-2 border-t border-outline">
                                <p className="text-outline-variant text-sm mb-3 mt-2 font-body">
                                    Shut down the server process completely.
                                </p>
                                <GlassButton
                                    className="w-full justify-center text-error hover:text-error-container hover:bg-error/20"
                                    onClick={() => setSystemAction('shutdown')}
                                >
                                    Shutdown
                                </GlassButton>
                            </div>
                        </div>
                    </GlassCard>
                </div>
            </div>
        </>
    );
};
