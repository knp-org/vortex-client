import React, { useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { MonitorPlay } from 'lucide-react';
import { usePlatform } from '../hooks/usePlatform';

interface NativePlayerButtonProps {
    url: string;
}

export const NativePlayerButton: React.FC<NativePlayerButtonProps> = ({ url }) => {
    const { isTauri } = usePlatform();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    if (!isTauri) return null;

    const handlePlayNative = async () => {
        setIsLoading(true);
        setError(null);
        try {
            await invoke('play_in_mpv', { url });
        } catch (err) {
            console.error('Failed to launch MPV:', err);
            setError(`Failed to launch MPV: ${err}`);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-col items-end gap-1">
            <button
                onClick={handlePlayNative}
                disabled={isLoading}
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors text-sm font-medium"
                title="Play in native player (MPV) for better performance and format support"
            >
                <MonitorPlay size={18} />
                {isLoading ? 'Launching...' : 'Play in MPV'}
            </button>
            {error && (
                <p className="text-xs text-red-400 max-w-[200px] text-right">{error}</p>
            )}
        </div>
    );
};
