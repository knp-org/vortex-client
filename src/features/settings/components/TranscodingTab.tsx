import React, { useState, useEffect } from 'react';
import { GlassButton, GlassInput, GlassSelect, GlassToggle, GlassHeading, GlassText, GlassTooltip } from '@knp-org/liquid-glass-ui';
import { Server, Monitor, Cpu, Activity } from 'lucide-react';
import { TranscodeSettings } from '@/types';
import { settingsService } from '@/services';

export const TranscodingTab: React.FC = () => {
    const [transcodeSettings, setTranscodeSettings] = useState<TranscodeSettings | null>(null);
    const [isSavingTranscode, setIsSavingTranscode] = useState(false);

    const fetchTranscodeSettings = async () => {
        try {
            const data = await settingsService.getTranscode();
            setTranscodeSettings(data);
        } catch (error) {
            console.error("Failed to fetch transcode settings", error);
        }
    };

    useEffect(() => {
        fetchTranscodeSettings();
    }, []);

    const handleSaveTranscode = async (encoder: string) => {
        setIsSavingTranscode(true);
        try {
            const updated = await settingsService.updateTranscode({
                encoder,
                thread_count: transcodeSettings?.thread_count,
                preset: transcodeSettings?.preset,
                throttle_transcodes: transcodeSettings?.throttle_transcodes,
                max_bitrate: transcodeSettings?.max_bitrate
            });
            setTranscodeSettings(updated);
        } catch (error) {
            console.error("Failed to save transcode settings", error);
        } finally {
            setIsSavingTranscode(false);
        }
    };

    const handleSaveAdvanced = async (updated: Partial<TranscodeSettings>) => {
        if (!transcodeSettings) return;
        const next = { ...transcodeSettings, ...updated };
        setIsSavingTranscode(true);
        try {
            const data = await settingsService.updateTranscode({
                encoder: next.current_encoder,
                thread_count: next.thread_count,
                preset: next.preset,
                throttle_transcodes: next.throttle_transcodes,
                max_bitrate: next.max_bitrate
            });
            setTranscodeSettings(data);
        } catch (error) {
            console.error("Failed to save advanced settings", error);
        } finally {
            setIsSavingTranscode(false);
        }
    };

    const encoderIcon = (encoder: string) =>
        encoder.includes("NVIDIA") ? <Monitor size={16} /> :
            encoder.includes("Intel") ? <Cpu size={16} /> :
                encoder.includes("VAAPI") ? <Server size={16} /> :
                    encoder.includes("Software") ? <Activity size={16} /> : null;

    const encoderDescription = (encoder: string) =>
        encoder.includes("Auto") ? "Automatically select the best available hardware encoder." :
            encoder.includes("NVIDIA") ? "High performance GPU encoding." :
                encoder.includes("Intel") ? "Efficient CPU/iGPU encoding." :
                    encoder.includes("VAAPI") ? "Universal hardware acceleration." :
                        encoder.includes("Software") ? "High CPU usage. Use only if hardware fails." : encoder;

    return (
        <div className="space-y-6 animate-fade-in">
            <GlassHeading size="medium" className="font-heading">Transcoding</GlassHeading>
            <GlassText variant="muted" className="text-sm font-body">Configure hardware acceleration for video playback.</GlassText>

            {transcodeSettings ? (
                <div className="flex flex-wrap gap-3">
                    {transcodeSettings.available_encoders.map(encoder => (
                        <GlassTooltip key={encoder} text={encoderDescription(encoder)}>
                            <GlassButton
                                variant={transcodeSettings.current_encoder === encoder ? 'primary' : 'secondary'}
                                size="sm"
                                shape="pill"
                                onClick={() => handleSaveTranscode(encoder)}
                                disabled={isSavingTranscode}
                                className="flex items-center gap-2"
                            >
                                {encoderIcon(encoder)}
                                <span className="font-medium">{encoder}</span>
                                {transcodeSettings.current_encoder === encoder && (
                                    <span className="w-2 h-2 bg-primary rounded-full animate-pulse shadow-[0_0_10px_rgba(255,255,255,0.8)]" />
                                )}
                            </GlassButton>
                        </GlassTooltip>
                    ))}
                </div>
            ) : (
                <GlassText variant="muted" className="font-body">Loading transcoding settings...</GlassText>
            )}

            {transcodeSettings && (
                <div className="max-w-2xl space-y-6 pt-6 border-t border-outline">
                    <GlassHeading size="small" className="font-heading">Advanced Configuration</GlassHeading>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Thread Count */}
                        <div className="space-y-2">
                            <div className="flex gap-2 text-sm text-outline-variant opacity-70 font-body">
                                0 = Auto
                                {transcodeSettings.system_threads > 0 && (
                                    <span className="text-primary ml-2">
                                        (Detected {transcodeSettings.system_threads} vCPUs)
                                    </span>
                                )}
                            </div>
                            <GlassInput
                                label="Encoding Threads"
                                value={transcodeSettings.thread_count?.toString() || '0'}
                                onChange={e => handleSaveAdvanced({ thread_count: parseInt(e.target.value) || 0 })}
                                placeholder="0"
                                type="number"
                                min="0"
                            />
                        </div>

                        {/* Bitrate Limit */}
                        <div className="space-y-2">
                            <div className="flex gap-2 text-sm text-outline-variant opacity-70 font-body">0 = Unlimited</div>
                            <GlassInput
                                label="Bitrate Limit (Mbps)"
                                value={transcodeSettings.max_bitrate?.toString() || '0'}
                                onChange={e => handleSaveAdvanced({ max_bitrate: parseInt(e.target.value) || 0 })}
                                placeholder="0"
                                type="number"
                                min="0"
                            />
                        </div>

                        {/* Encoding Preset */}
                        <div className="space-y-2">
                            <div className="flex gap-2 text-sm text-outline-variant opacity-70 font-body">Balances speed vs quality</div>
                            <GlassSelect
                                label="Encoding Preset"
                                value={transcodeSettings.preset || ''}
                                onChange={val => handleSaveAdvanced({ preset: val })}
                                options={[
                                    { value: "", label: "Default (Auto)" },
                                    { value: "ultrafast", label: "Ultrafast (Lowest Quality / Low CPU)" },
                                    { value: "superfast", label: "Superfast" },
                                    { value: "veryfast", label: "Veryfast (Good Balance)" },
                                    { value: "fast", label: "Fast" },
                                    { value: "medium", label: "Medium" },
                                    { value: "slow", label: "Slow" },
                                    { value: "slower", label: "Slower" },
                                    { value: "veryslow", label: "Veryslow (Best Quality / High CPU)" }
                                ]}
                            />
                        </div>

                        {/* Throttling */}
                        <div className="space-y-2 mt-4 pt-4 border-t border-outline/50">
                            <div className="flex items-center justify-between gap-4">
                                <div className="flex flex-col">
                                    <span className="text-sm font-label text-primary">Enable Transcode Throttling</span>
                                    <span className="text-xs text-outline-variant font-body">Save CPU when buffer is full</span>
                                </div>
                                <GlassToggle
                                    checked={transcodeSettings.throttle_transcodes}
                                    onChange={e => handleSaveAdvanced({ throttle_transcodes: e.target.checked })}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
