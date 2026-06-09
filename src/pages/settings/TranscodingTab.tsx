import React, { useState, useEffect } from 'react';
import { Input } from '../../components/common/Input';
import { Select } from '../../components/common/Select';
import { Server, Monitor, Cpu, Activity } from 'lucide-react';
import { TranscodeSettings } from '../../types';
import { settingsService } from '../../services';

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

    return (
        <div className="space-y-6 animate-fade-in">
            <h3 className="text-2xl font-bold text-white">Transcoding</h3>
            <p className="text-gray-400 text-sm">Configure hardware acceleration for video playback.</p>

            {transcodeSettings ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
                    {transcodeSettings.available_encoders.map(encoder => (
                        <button
                            key={encoder}
                            onClick={() => handleSaveTranscode(encoder)}
                            disabled={isSavingTranscode}
                            className={`
                                relative group p-4 rounded-xl border text-left transition-all
                                ${transcodeSettings.current_encoder === encoder
                                    ? 'bg-cyan-500/20 border-cyan-500 text-cyan-200'
                                    : 'bg-white/5 border-white/10 text-gray-400 hover:border-white/20 hover:bg-white/10'}
                            `}
                        >
                            <div className="flex items-center justify-between mb-2">
                                <span className="font-medium flex items-center gap-2">
                                    {encoder.includes("NVIDIA") && <Monitor size={18} />}
                                    {encoder.includes("Intel") && <Cpu size={18} />}
                                    {encoder.includes("VAAPI") && <Server size={18} />}
                                    {encoder.includes("Software") && <Activity size={18} />}
                                    {encoder}
                                </span>
                                {transcodeSettings.current_encoder === encoder && (
                                    <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse shadow-[0_0_10px_rgba(6,182,212,0.8)]" />
                                )}
                            </div>
                            <div className="text-xs opacity-70">
                                {encoder.includes("Auto") && "Automatically select the best available hardware encoder."}
                                {encoder.includes("NVIDIA") && "High performance GPU encoding."}
                                {encoder.includes("Intel") && "Efficient CPU/iGPU encoding."}
                                {encoder.includes("VAAPI") && "Universal hardware acceleration."}
                                {encoder.includes("Software") && "High CPU usage. Use only if hardware fails."}
                            </div>
                        </button>
                    ))}
                </div>
            ) : (
                <div className="text-gray-400">Loading transcoding settings...</div>
            )}

            {transcodeSettings && (
                <div className="max-w-2xl space-y-6 pt-6 border-t border-white/5">
                    <h4 className="text-lg font-semibold text-gray-200">Advanced Configuration</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Thread Count */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-400">Encoding Threads</label>
                            <div className="flex gap-2 text-sm text-gray-500 mb-2">
                                0 = Auto
                                {transcodeSettings.system_threads > 0 && (
                                    <span className="text-cyan-500/80 ml-2">
                                        (Detected {transcodeSettings.system_threads} vCPUs)
                                    </span>
                                )}
                            </div>
                            <Input
                                value={transcodeSettings.thread_count?.toString() || '0'}
                                onChange={e => {
                                    const val = parseInt(e.target.value) || 0;
                                    handleSaveAdvanced({ thread_count: val });
                                }}
                                placeholder="0"
                                type="number"
                                min="0"
                                className="bg-white/5 border-white/10"
                            />
                        </div>

                        {/* Bitrate Limit */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-400">Bitrate Limit (Mbps)</label>
                            <div className="flex gap-2 text-sm text-gray-500 mb-2">0 = Unlimited</div>
                            <Input
                                value={transcodeSettings.max_bitrate?.toString() || '0'}
                                onChange={e => {
                                    const val = parseInt(e.target.value) || 0;
                                    handleSaveAdvanced({ max_bitrate: val });
                                }}
                                placeholder="0"
                                type="number"
                                min="0"
                                className="bg-white/5 border-white/10"
                            />
                        </div>

                        {/* Encoding Preset */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-400">Encoding Preset</label>
                            <div className="flex gap-2 text-sm text-gray-500 mb-2">Balances speed vs quality</div>
                            <Select
                                value={transcodeSettings.preset || ''}
                                onChange={val => handleSaveAdvanced({ preset: val })}
                                options={[
                                    { id: "", label: "Default (Auto)" },
                                    { id: "ultrafast", label: "Ultrafast (Lowest Quality / Low CPU)" },
                                    { id: "superfast", label: "Superfast" },
                                    { id: "veryfast", label: "Veryfast (Good Balance)" },
                                    { id: "fast", label: "Fast" },
                                    { id: "medium", label: "Medium" },
                                    { id: "slow", label: "Slow" },
                                    { id: "slower", label: "Slower" },
                                    { id: "veryslow", label: "Veryslow (Best Quality / High CPU)" }
                                ]}
                            />
                        </div>

                        {/* Throttling */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-400">Throttling</label>
                            <div className="flex gap-2 text-sm text-gray-500 mb-2">Save CPU when buffer is full</div>
                            <label className="flex items-center space-x-3 p-3 rounded-xl bg-white/5 border border-white/10 cursor-pointer hover:bg-white/10 transition-colors">
                                <input
                                    type="checkbox"
                                    checked={transcodeSettings.throttle_transcodes}
                                    onChange={e => handleSaveAdvanced({ throttle_transcodes: e.target.checked })}
                                    className="w-5 h-5 rounded border-gray-600 text-cyan-500 focus:ring-cyan-500 bg-gray-700"
                                />
                                <span className="text-gray-200">Enable Transcode Throttling</span>
                            </label>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
