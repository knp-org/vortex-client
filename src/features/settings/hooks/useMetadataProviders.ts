import { useState, useEffect, useCallback } from 'react';
import { providerService } from '@/services';
import type { ProviderInfo } from '@/types/providers';

/** Loads, reorders, toggles, configures, and tests metadata providers. */
export function useMetadataProviders() {
    const [providers, setProviders] = useState<ProviderInfo[]>([]);
    const [loadingProviders, setLoadingProviders] = useState(true);
    const [testResults, setTestResults] = useState<Record<string, { success: boolean; message: string }>>({});
    const [testingId, setTestingId] = useState<string | null>(null);

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

    return {
        providers, loadingProviders, testResults, testingId,
        handleToggle, handleMoveUp, handleMoveDown, handleSaveConfig, handleTest,
    };
}
