import { useState, useEffect } from 'react';

type Platform = 'web' | 'tauri';

export const usePlatform = () => {
    const [platform, setPlatform] = useState<Platform>('web');

    useEffect(() => {
        // robust check for tauri
        const isTauri = typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;
        setPlatform(isTauri ? 'tauri' : 'web');
    }, []);

    return {
        platform,
        isTauri: platform === 'tauri',
        isWeb: platform === 'web',
    };
};
