import React, { useState, useEffect } from 'react';
import { GlassCard, GlassButton, GlassInput, GlassSelect, GlassToggle, GlassAlert, GlassHeading, GlassText } from '@knp-org/liquid-glass-ui';
import { Settings2, Subtitles, MonitorPlay, Save } from 'lucide-react';
import { api } from '@/services';
import type { Setting } from '@/types/settings';

const Row: React.FC<{ label: string; description?: string; children: React.ReactNode }> = ({ label, description, children }) => (
    <div className="flex items-center justify-between gap-4">
        <div className="flex flex-col">
            <span className="text-sm font-label text-primary">{label}</span>
            {description && <span className="text-xs text-outline-variant font-body">{description}</span>}
        </div>
        {children}
    </div>
);

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
                <GlassHeading size="medium" className="font-heading">Player Settings</GlassHeading>
                <GlassText variant="muted" className="text-sm mt-1 font-body">
                    Configure your viewing experience and playback preferences.
                </GlassText>
            </div>

            {message && (
                <GlassAlert variant={message.type === 'success' ? 'success' : 'error'}>
                    {message.text}
                </GlassAlert>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Playback Configuration */}
                <GlassCard className="p-6 space-y-6">
                    <GlassHeading size="small" className="flex items-center gap-2 font-heading">
                        <Settings2 size={18} />
                        Playback
                    </GlassHeading>

                    <div className="space-y-4">
                        <GlassSelect
                            label="Default Quality"
                            value={settings.defaultQuality}
                            onChange={(val) => handleChange('defaultQuality', val)}
                            options={[
                                { value: 'original', label: 'Original (Direct Play)' },
                                { value: '1080p', label: '1080p (High)' },
                                { value: '720p', label: '720p (Medium)' },
                                { value: '480p', label: '480p (Low)' }
                            ]}
                        />

                        <Row label="Auto-Play Next Episode" description="Automatically play the next episode in a series">
                            <GlassToggle checked={settings.autoPlayNext} onChange={(e) => handleChange('autoPlayNext', e.target.checked)} />
                        </Row>

                        <Row label="Auto-Skip Intro" description="Automatically skip TV show intros when available">
                            <GlassToggle checked={settings.skipIntro} onChange={(e) => handleChange('skipIntro', e.target.checked)} />
                        </Row>

                        <div className="grid grid-cols-2 gap-4 mt-4 border-t border-outline/50 pt-4">
                            <GlassInput
                                label="Skip Forward (s)"
                                type="number"
                                min="5"
                                max="60"
                                step="5"
                                value={settings.skipForwardTime}
                                onChange={(e) => handleChange('skipForwardTime', parseInt(e.target.value) || 10)}
                            />
                            <GlassInput
                                label="Skip Backward (s)"
                                type="number"
                                min="5"
                                max="60"
                                step="5"
                                value={settings.skipBackwardTime}
                                onChange={(e) => handleChange('skipBackwardTime', parseInt(e.target.value) || 10)}
                            />
                        </div>
                    </div>
                </GlassCard>

                {/* Subtitles & Display */}
                <GlassCard className="p-6 space-y-6">
                    <GlassHeading size="small" className="flex items-center gap-2 font-heading">
                        <Subtitles size={18} />
                        Subtitles & Display
                    </GlassHeading>

                    <div className="space-y-4">
                        <GlassSelect
                            label="Subtitle Size"
                            value={settings.subtitleSize}
                            onChange={(val) => handleChange('subtitleSize', val)}
                            options={[
                                { value: 'small', label: 'Small' },
                                { value: 'medium', label: 'Medium' },
                                { value: 'large', label: 'Large' },
                                { value: 'xlarge', label: 'Extra Large' }
                            ]}
                        />

                        <Row label="Hardware Acceleration" description="Use GPU for video decoding if supported">
                            <GlassToggle checked={settings.hardwareDecoding} onChange={(e) => handleChange('hardwareDecoding', e.target.checked)} />
                        </Row>

                        <div className="p-4 bg-black/30 rounded-xl border border-white/5 flex items-center gap-3">
                            <MonitorPlay className="text-outline-variant" size={20} />
                            <p className="text-xs text-outline-variant font-body leading-relaxed">
                                Note: Hardware acceleration depends on your browser and operating system capabilities. If you experience playback issues, try disabling this option.
                            </p>
                        </div>
                    </div>
                </GlassCard>
            </div>

            <div className="flex justify-end pt-4">
                <GlassButton
                    variant="primary"
                    onClick={handleSave}
                    disabled={isSaving}
                >
                    <Save size={16} className="mr-2" />
                    {isSaving ? 'Saving...' : 'Save Player Settings'}
                </GlassButton>
            </div>
        </div>
    );
};
