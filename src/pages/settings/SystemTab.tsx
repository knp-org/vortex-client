import React, { useState } from 'react';
import { Button } from '@/components/common/Button';
import { ConfirmModal } from '@/components/common/ConfirmModal';
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
                <h3 className="text-2xl font-bold text-primary font-heading">System Actions</h3>
                <p className="text-outline-variant text-sm font-body">Manage server state and data. Use with caution.</p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl">
                    <div className="p-6 rounded-2xl bg-surface/50 backdrop-blur-surface border border-outline shadow-[0_0_20px_rgba(255,255,255,0.05)] space-y-4">
                        <div className="flex items-center space-x-3 text-error">
                            <Database size={24} />
                            <h4 className="text-lg font-semibold font-heading">Database Management</h4>
                        </div>
                        <p className="text-outline-variant text-sm leading-relaxed font-body">
                            Reset your library data. This clears all media entries, libraries, and watch progress.
                            <br /><strong className="text-error">Your physical files are NOT deleted.</strong>
                            <br />Users and Settings are preserved.
                        </p>
                        <Button
                            variant="danger"
                            className="w-full justify-center"
                            onClick={() => setSystemAction('clear')}
                        >
                            Clear Database
                        </Button>
                    </div>

                    <div className="p-6 rounded-2xl bg-surface/50 backdrop-blur-surface border border-outline shadow-[0_0_20px_rgba(255,255,255,0.05)] space-y-4">
                        <div className="flex items-center space-x-3 text-primary">
                            <Power size={24} />
                            <h4 className="text-lg font-semibold font-heading">Server Control</h4>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <p className="text-outline-variant text-sm mb-3 font-body">
                                    Restart the Vortex server application.
                                </p>
                                <Button
                                    variant="secondary"
                                    className="w-full justify-center"
                                    onClick={() => setSystemAction('restart')}
                                >
                                    Restart Server
                                </Button>
                            </div>
                            <div className="pt-2 border-t border-outline">
                                <p className="text-outline-variant text-sm mb-3 mt-2 font-body">
                                    Shut down the server process completely.
                                </p>
                                <Button
                                    variant="secondary"
                                    className="w-full justify-center text-error hover:text-error-container hover:bg-error/20"
                                    onClick={() => setSystemAction('shutdown')}
                                >
                                    Shutdown
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};
