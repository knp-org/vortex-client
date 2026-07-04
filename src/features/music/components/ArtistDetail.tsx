import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MainLayout } from '@/app/layout/MainLayout';
import {
    GlassButton, GlassHeading, GlassSpinner,
    IconArrowLeft, IconAlbums, IconUser,
} from '@knp-org/liquid-glass-ui';
import { resolveImageUrl, mediaService } from '@/services';
import type { ArtistDetail as ArtistDetailT } from '@/types';

export const ArtistDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [artist, setArtist] = useState<ArtistDetailT | null>(null);

    useEffect(() => {
        if (id) mediaService.artist(id).then(setArtist).catch(console.error);
    }, [id]);

    if (!artist) {
        return (
            <MainLayout>
                <div className="min-h-[50vh] flex items-center justify-center">
                    <GlassSpinner size={40} />
                </div>
            </MainLayout>
        );
    }

    return (
        <MainLayout>
            <div className="p-6 md:p-8 space-y-8 animate-fade-in">
                <GlassButton shape="circle" onClick={() => navigate(-1)} aria-label="Back">
                    <IconArrowLeft size={20} glow={false} />
                </GlassButton>

                <div className="flex items-center gap-6">
                    <div className="w-32 h-32 rounded-full overflow-hidden bg-white/5 border border-outline shrink-0 flex items-center justify-center">
                        {artist.image_url ? (
                            <img src={resolveImageUrl(artist.image_url)} alt={artist.name} className="w-full h-full object-cover" />
                        ) : (
                            <IconUser size={48} glow={false} className="text-outline-variant" />
                        )}
                    </div>
                    <div>
                        <p className="text-xs uppercase tracking-wider text-outline-variant font-label">Artist</p>
                        <GlassHeading as="h1" size="large" className="text-3xl md:text-5xl">{artist.name}</GlassHeading>
                        <p className="text-outline-variant font-body mt-1">{artist.albums.length} albums</p>
                    </div>
                </div>

                <div>
                    <GlassHeading as="h2" size="small" className="mb-4">Albums</GlassHeading>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                        {artist.albums.map(al => (
                            <button
                                key={al.id}
                                onClick={() => navigate(`/albums/${al.id}`)}
                                className="group text-left space-y-2"
                            >
                                <div className="aspect-square rounded-xl overflow-hidden bg-white/5 border border-outline flex items-center justify-center group-hover:scale-105 transition-transform">
                                    {al.poster_url ? (
                                        <img src={resolveImageUrl(al.poster_url)} alt={al.title || ''} className="w-full h-full object-cover" />
                                    ) : (
                                        <IconAlbums size={40} glow={false} className="text-outline-variant" />
                                    )}
                                </div>
                                <div className="px-1">
                                    <div className="text-primary text-sm font-heading truncate">{al.title}</div>
                                    {al.year && <div className="text-xs text-outline-variant font-label">{al.year}</div>}
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </MainLayout>
    );
};
