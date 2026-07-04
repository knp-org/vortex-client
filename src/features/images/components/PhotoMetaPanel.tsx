import React, { useEffect, useState } from 'react';
import { GlassSpinner } from '@knp-org/liquid-glass-ui';
import { mediaService } from '@/services';
import type { ImageDetail } from '@/types';

/** EXIF / camera metadata panel shown alongside a photo in the lightbox. */
export const PhotoMetaPanel: React.FC<{ photoId: number }> = ({ photoId }) => {
    const [detail, setDetail] = useState<ImageDetail | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let alive = true;
        setLoading(true);
        setDetail(null);
        mediaService.image(photoId)
            .then((d) => { if (alive) setDetail(d); })
            .catch(console.error)
            .finally(() => { if (alive) setLoading(false); });
        return () => { alive = false; };
    }, [photoId]);

    if (loading) {
        return <div className="flex justify-center py-6"><GlassSpinner size={22} /></div>;
    }
    if (!detail) return <p className="text-muted">No details available.</p>;

    const rows: Array<[string, string | undefined]> = [
        ['File', detail.file_name],
        ['Taken', detail.taken_at ? new Date(detail.taken_at).toLocaleString() : undefined],
        ['Dimensions', detail.width && detail.height ? `${detail.width} × ${detail.height}` : undefined],
        ['Camera', [detail.camera_make, detail.camera_model].filter(Boolean).join(' ') || undefined],
        ['Lens', detail.lens],
        ['ISO', detail.iso != null ? String(detail.iso) : undefined],
        ['Focal length', detail.focal_length != null ? `${detail.focal_length} mm` : undefined],
        ['Aperture', detail.aperture != null ? `ƒ/${detail.aperture}` : undefined],
        ['GPS', detail.gps_lat != null && detail.gps_lon != null
            ? `${detail.gps_lat.toFixed(5)}, ${detail.gps_lon.toFixed(5)}` : undefined],
    ];
    const shown = rows.filter(([, v]) => v);

    return (
        <div>
            <h3 className="heading-small" style={{ fontSize: '1.1rem' }}>
                {detail.title || detail.file_name || 'Photo'}
            </h3>
            {shown.length === 0 ? (
                <p className="text-muted">No EXIF metadata.</p>
            ) : (
                <dl className="mt-3 space-y-2 text-sm">
                    {shown.map(([label, value]) => (
                        <div key={label} className="flex justify-between gap-4">
                            <dt className="text-muted shrink-0">{label}</dt>
                            <dd className="text-right text-primary break-all">{value}</dd>
                        </div>
                    ))}
                </dl>
            )}
            {detail.gps_lat != null && detail.gps_lon != null && (
                <a
                    className="inline-block mt-4 text-sm text-primary hover:underline"
                    href={`https://www.openstreetmap.org/?mlat=${detail.gps_lat}&mlon=${detail.gps_lon}#map=15/${detail.gps_lat}/${detail.gps_lon}`}
                    target="_blank"
                    rel="noreferrer"
                >
                    View on map ↗
                </a>
            )}
        </div>
    );
};
