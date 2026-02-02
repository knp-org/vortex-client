import React, { useState, useEffect } from 'react';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { settingsService } from '../../services';

export const ApiKeysTab: React.FC = () => {
    const [tmdbKey, setTmdbKey] = useState('');
    const [fanartKey, setFanartKey] = useState('');
    const [isSavingKeys, setIsSavingKeys] = useState(false);

    const fetchSettings = async () => {
        try {
            const data = await settingsService.getAll();
            const tmdb = data.find(s => s.key === 'tmdb_api_key');
            const fanart = data.find(s => s.key === 'fanart_api_key');
            if (tmdb) setTmdbKey(tmdb.value);
            if (fanart) setFanartKey(fanart.value);
        } catch (error) {
            console.error("Failed to fetch settings", error);
        }
    };

    useEffect(() => {
        fetchSettings();
    }, []);

    const handleSaveKeys = async () => {
        setIsSavingKeys(true);
        try {
            await settingsService.set('tmdb_api_key', tmdbKey);
            await settingsService.set('fanart_api_key', fanartKey);
        } catch (error) {
            console.error("Failed to save keys", error);
        } finally {
            setIsSavingKeys(false);
        }
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <h3 className="text-2xl font-bold text-white">API Keys</h3>
            <div className="max-w-md space-y-4">
                <Input
                    label="TMDB API Key"
                    type="password"
                    placeholder="Enter TMDB Key..."
                    value={tmdbKey}
                    onChange={(e) => setTmdbKey(e.target.value)}
                />
                <Input
                    label="Fanart.tv API Key"
                    type="password"
                    placeholder="Enter Fanart.tv Key..."
                    value={fanartKey}
                    onChange={(e) => setFanartKey(e.target.value)}
                />
                <div className="pt-4">
                    <Button onClick={handleSaveKeys} disabled={isSavingKeys}>
                        {isSavingKeys ? 'Saving...' : 'Save Keys'}
                    </Button>
                </div>
            </div>
        </div>
    );
};
