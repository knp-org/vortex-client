import React, { useMemo } from 'react';
import { createPortal } from 'react-dom';
import { X, FileVideo, Music, Copy, Monitor } from 'lucide-react';
import { MediaInfo } from '@/types/media';

/**
 * Minimal shape this modal needs. `media_info` is an ffprobe JSON blob; with the
 * per-type API it is no longer returned on the detail record, so the stream sections
 * degrade to "No info" until rewired to `/stream/:id/info`.
 */
interface MediaInfoData {
    title?: string;
    file_path?: string;
    runtime?: number;
    media_info?: string;
}

interface MediaInfoModalProps {
    isOpen: boolean;
    onClose: () => void;
    media: MediaInfoData;
}

export const MediaInfoModal: React.FC<MediaInfoModalProps> = ({
    isOpen,
    onClose,
    media
}) => {
    const info: MediaInfo | null = useMemo(() => {
        if (!media.media_info) return null;
        try {
            return JSON.parse(media.media_info);
        } catch (e) {
            console.error("Failed to parse media info", e);
            return null;
        }
    }, [media.media_info]);

    if (!isOpen) return null;

    const formatSize = (bytes?: number) => {
        if (!bytes) return 'Unknown';
        const units = ['B', 'KiB', 'MiB', 'GiB', 'TiB'];
        let size = bytes;
        let unitIndex = 0;
        while (size >= 1024 && unitIndex < units.length - 1) {
            size /= 1024;
            unitIndex++;
        }
        return `${size.toFixed(1)} ${units[unitIndex]}`;
    };

    const formatBitrate = (bps?: number) => {
        if (!bps) return 'Unknown';
        return `${(bps / 1000).toFixed(0)} kbps`;
    };

    const InfoRow = ({ label, value }: { label: string, value?: string | number | null }) => (
        <div className="flex justify-between py-1 border-b border-outline/50 last:border-0 hover:bg-white/5 px-2 rounded transition-colors">
            <span className="text-outline-variant text-sm font-label">{label}</span>
            <span className="text-primary text-sm font-body text-right ml-4 truncate max-w-[60%] selectable select-all">
                {value || '-'}
            </span>
        </div>
    );

    return createPortal(
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
            <div className="bg-surface/80 backdrop-blur-surface border border-outline rounded-2xl w-full max-w-4xl max-h-[85vh] flex flex-col shadow-[0_0_40px_rgba(255,255,255,0.05)] overflow-hidden">
                {/* Header */}
                <div className="p-5 border-b border-outline flex items-center justify-between bg-white/5">
                    <div className="flex items-center gap-3">
                        <h2 className="text-xl font-bold text-primary font-heading">Media Info</h2>
                        <span className="px-2 py-0.5 rounded bg-primary/20 text-primary text-xs border border-primary/20 font-mono">
                            {info?.container || media.file_path?.split('.').pop() || 'Unknown'}
                        </span>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                        <X size={20} className="text-outline-variant hover:text-primary" />
                    </button>
                </div>

                <div className="overflow-y-auto p-6 space-y-8 custom-scrollbar">

                    {/* General Section */}
                    <div className="bg-surface/50 rounded-xl p-5 border border-outline shadow-inner">
                        <h3 className="text-lg font-semibold text-primary mb-4 flex items-center gap-2 font-heading">
                            <Monitor size={18} className="text-primary" />
                            General
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2">
                            <InfoRow label="Title" value={media.title} />
                            <InfoRow label="Size" value={formatSize(info?.size)} />
                            <InfoRow label="Duration" value={`${((info?.duration || media.runtime && media.runtime * 60) || 0) / 60 | 0} min`} />
                            <InfoRow label="Bitrate" value={formatBitrate(info?.bit_rate)} />
                            <div className="col-span-1 md:col-span-2 mt-2">
                                <div className="text-outline-variant text-sm mb-1 font-label">Path</div>
                                <div className="bg-black/50 p-2 rounded-lg text-xs font-mono text-outline-variant break-all select-all border border-outline flex items-center justify-between group">
                                    {media.file_path || 'Unknown'}
                                    {media.file_path && (
                                        <button
                                            onClick={() => navigator.clipboard.writeText(media.file_path!)}
                                            className="opacity-0 group-hover:opacity-100 p-1 hover:bg-white/10 hover:text-primary rounded"
                                            title="Copy path"
                                        >
                                            <Copy size={12} />
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Video Section */}
                        <div className="bg-surface/50 rounded-xl p-5 border border-outline h-fit shadow-inner">
                            <h3 className="text-lg font-semibold text-primary mb-4 flex items-center gap-2 font-heading">
                                <FileVideo size={18} className="text-primary" />
                                Video
                            </h3>
                            {info?.video ? (
                                <div className="space-y-1">
                                    <InfoRow label="Codec" value={info.video.codec.toUpperCase()} />
                                    <InfoRow label="Profile" value={info.video.profile} />
                                    <InfoRow label="Resolution" value={`${info.video.width}x${info.video.height}`} />
                                    <InfoRow label="Aspect Ratio" value={info.video.aspect_ratio || "N/A"} />
                                    <InfoRow label="Bitrate" value={formatBitrate(info.video.bit_rate)} />
                                    <InfoRow label="Frame Rate" value={info.video.frame_rate} />
                                    <InfoRow label="Bit Depth" value={info.video.bit_depth ? `${info.video.bit_depth} bit` : '-'} />
                                    <InfoRow label="Pixel Format" value={info.video.pixel_format} />
                                    <InfoRow label="Color Space" value={info.video.color_space} />
                                    <InfoRow label="Color Primaries" value={info.video.color_primaries} />
                                    <InfoRow label="Color Transfer" value={info.video.color_transfer} />
                                    <InfoRow label="Ref Frames" value={info.video.ref_frames} />
                                    <InfoRow label="Codec Tag" value={info.video.codec_tag} />
                                </div>
                            ) : (
                                <div className="text-outline-variant font-body italic">No video stream info</div>
                            )}
                        </div>

                        {/* Audio Section */}
                        <div className="bg-surface/50 rounded-xl p-5 border border-outline h-fit shadow-inner">
                            <h3 className="text-lg font-semibold text-primary mb-4 flex items-center gap-2 font-heading">
                                <Music size={18} className="text-primary" />
                                Audio
                            </h3>
                            {info?.audio && info.audio.length > 0 ? (
                                <div className="space-y-6">
                                    {info.audio.map((track, i) => (
                                        <div key={i} className={i > 0 ? "pt-4 border-t border-outline/50" : ""}>
                                            <div className="mb-2 text-xs font-bold text-outline-variant font-label uppercase tracking-wider flex items-center gap-2">
                                                Track {i + 1}
                                                {track.default && <span className="bg-primary/20 text-primary px-1.5 py-0.5 rounded text-[10px]">Default</span>}
                                                {track.forced && <span className="bg-error/20 text-error px-1.5 py-0.5 rounded text-[10px]">Forced</span>}
                                            </div>
                                            <InfoRow label="Title" value={track.title || track.codec.toUpperCase()} />
                                            <InfoRow label="Language" value={track.language?.toUpperCase()} />
                                            <InfoRow label="Codec" value={track.codec.toUpperCase()} />
                                            <InfoRow label="Channels" value={track.channels ? `${track.channels} ch` : '-'} />
                                            <InfoRow label="Layout" value={track.channel_layout} />
                                            <InfoRow label="Sample Rate" value={track.sample_rate ? `${track.sample_rate} Hz` : '-'} />
                                            <InfoRow label="Bitrate" value={formatBitrate(track.bit_rate)} />
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-outline-variant font-body italic">No audio stream info</div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
};
