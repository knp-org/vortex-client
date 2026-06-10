import React, { useState, useEffect } from 'react';
import { Play, Settings2, Subtitles, MonitorPlay, Save } from 'lucide-react';
import { Select } from '../../components/common/Select';
import { Toggle } from '../../components/common/Toggle';
import { Button } from '../../components/common/Button';
import { api } from '../../services';
import type { Setting } from '../../types/settings';

export const PlayerTab: React.FC = () => {
    const [settings, setSettings] = useState({
        defaultQuality: 'original',
        autoPlayNext: true,
        hardwareDecoding: true,
        subtitleSize: 'medium',
        skipIntro: false,
        skipForwardTime: 10,
        skipBackwardTime: 10,
    });

    const [isSaving, setIsSaving] = useState(false);
    const [message, setMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null);

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const data = await api.get<Setting[]>('/settings');
                const playerSettings = data.find(s => s.key === 'player_settings');
                if (playerSettings) {
                    setSettings({ ...settings, ...JSON.parse(playerSettings.value) });
                }
            } catch (e) {
                console.error("Failed to parse player settings from API", e);
            }
        };
        fetchSettings();
    }, []);

    const handleChange = (key: string, value: any) => {
        setSettings(prev => ({ ...prev, [key]: value }));
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await api.post('/settings', {
                key: 'player_settings',
                value: JSON.stringify(settings)
            });
            setMessage({ text: 'Player settings saved successfully', type: 'success' });
        } catch (e) {
            setMessage({ text: 'Failed to save settings to database', type: 'error' });
        } finally {
            setIsSaving(false);
            setTimeout(() => setMessage(null), 3000);
        }
    };

    return (
        <div className="space-y-8 animate-fade-in">
            <div>
                <h3 className="text-2xl font-bold text-primary mb-2 font-heading flex items-center gap-2">
                    <Play size={24} />
                    Player Settings
                </h3>
                <p className="text-outline-variant font-body">
                    Configure your viewing experience and playback preferences.
                </p>
            </div>

            {message && (
                <div className={`p-4 rounded-xl border ${message.type === 'success' ? 'bg-green-500/10 border-green-500/20 text-green-400' : 'bg-red-500/10 border-red-500/20 text-red-400'} animate-fade-in`}>
                    {message.text}
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Playback Configuration */}
                <div className="bg-surface/50 border border-outline rounded-2xl p-6 shadow-inner space-y-6">
                    <h4 className="text-lg font-bold text-primary border-b border-outline pb-2 flex items-center gap-2 font-heading">
                        <Settings2 size={18} />
                        Playback
                    </h4>

                    <div className="space-y-4">
                        <div className="flex flex-col space-y-2">
                            <label className="text-sm font-label text-outline-variant">Default Quality</label>
                            <Select
                                value={settings.defaultQuality}
                                onChange={(val) => handleChange('defaultQuality', val)}
                                options={[
                                    { id: 'original', label: 'Original (Direct Play)' },
                                    { id: '1080p', label: '1080p (High)' },
                                    { id: '720p', label: '720p (Medium)' },
                                    { id: '480p', label: '480p (Low)' }
                                ]}
                            />
                        </div>

                        <Toggle
                            label="Auto-Play Next Episode"
                            description="Automatically play the next episode in a series"
                            checked={settings.autoPlayNext}
                            onChange={(checked) => handleChange('autoPlayNext', checked)}
                        />
                        
                        <Toggle
                            label="Auto-Skip Intro"
                            description="Automatically skip TV show intros when available"
                            checked={settings.skipIntro}
                            onChange={(checked) => handleChange('skipIntro', checked)}
                        />
                        
                        <div className="grid grid-cols-2 gap-4 mt-4 border-t border-outline/50 pt-4">
                            <div className="flex flex-col space-y-2">
                                <label className="text-sm font-label text-outline-variant">Skip Forward (s)</label>
                                <input
                                    type="number"
                                    min="5"
                                    max="60"
                                    step="5"
                                    value={settings.skipForwardTime}
                                    onChange={(e) => handleChange('skipForwardTime', parseInt(e.target.value) || 10)}
                                    className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2 text-primary focus:outline-none focus:border-primary/50 transition-colors font-body"
                                />
                            </div>
                            <div className="flex flex-col space-y-2">
                                <label className="text-sm font-label text-outline-variant">Skip Backward (s)</label>
                                <input
                                    type="number"
                                    min="5"
                                    max="60"
                                    step="5"
                                    value={settings.skipBackwardTime}
                                    onChange={(e) => handleChange('skipBackwardTime', parseInt(e.target.value) || 10)}
                                    className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2 text-primary focus:outline-none focus:border-primary/50 transition-colors font-body"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Subtitles & Display */}
                <div className="bg-surface/50 border border-outline rounded-2xl p-6 shadow-inner space-y-6">
                    <h4 className="text-lg font-bold text-primary border-b border-outline pb-2 flex items-center gap-2 font-heading">
                        <Subtitles size={18} />
                        Subtitles & Display
                    </h4>

                    <div className="space-y-4">
                        <div className="flex flex-col space-y-2">
                            <label className="text-sm font-label text-outline-variant">Subtitle Size</label>
                            <Select
                                value={settings.subtitleSize}
                                onChange={(val) => handleChange('subtitleSize', val)}
                                options={[
                                    { id: 'small', label: 'Small' },
                                    { id: 'medium', label: 'Medium' },
                                    { id: 'large', label: 'Large' },
                                    { id: 'xlarge', label: 'Extra Large' }
                                ]}
                            />
                        </div>

                        <Toggle
                            label="Hardware Acceleration"
                            description="Use GPU for video decoding if supported"
                            checked={settings.hardwareDecoding}
                            onChange={(checked) => handleChange('hardwareDecoding', checked)}
                            className="mt-4"
                        />
                        
                        <div className="p-4 bg-black/30 rounded-xl border border-white/5 flex items-center gap-3">
                            <MonitorPlay className="text-outline-variant" size={20} />
                            <p className="text-xs text-outline-variant font-body leading-relaxed">
                                Note: Hardware acceleration depends on your browser and operating system capabilities. If you experience playback issues, try disabling this option.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex justify-end pt-4">
                <Button
                    onClick={handleSave}
                    disabled={isSaving}
                    variant="primary"
                    size="lg"
                    icon={Save}
                    className="font-bold rounded-full"
                >
                    {isSaving ? 'Saving...' : 'Save Player Settings'}
                </Button>
            </div>
        </div>
    );
};
