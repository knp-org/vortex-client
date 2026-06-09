import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, Film, Tv, Music, Settings, FileQuestion, Shield, Sliders, User, BookOpen } from 'lucide-react';
import { api } from '../../services';

interface LibraryData {
    id: number;
    name: string;
    paths: string[];
    library_type: string;
}

export const Sidebar: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const isSettingsActive = location.pathname === '/settings';
    const isProfilePage = location.pathname.startsWith('/profile');
    const [libraries, setLibraries] = useState<LibraryData[]>([]);

    useEffect(() => {
        const fetchLibraries = async () => {
            try {
                const data = await api.get<LibraryData[]>('/libraries');
                setLibraries(data);
            } catch (error) {
                console.error("Failed to fetch libraries", error);
            }
        };

        fetchLibraries();

        const handleFocus = () => fetchLibraries();
        window.addEventListener('focus', handleFocus);
        return () => window.removeEventListener('focus', handleFocus);
    }, []);

    const getIconForType = (type: string) => {
        switch (type) {
            case 'movies': return Film;
            case 'tv_shows': return Tv;
            case 'music_videos': return Music;
            case 'books': return BookOpen;
            default: return FileQuestion;
        }
    };

    return (
        <aside className="w-64 flex-shrink-0 flex flex-col p-4 pr-0">
            <div className="glass-panel h-full w-full flex flex-col p-4">
                <div className="mb-6 px-2">
                    <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Libraries</h2>
                </div>

                <nav className="space-y-1 flex-1">
                    {/* Home Link (Always visible or back link) */}
                    <div
                        onClick={() => navigate('/')}
                        className={`flex items-center space-x-3 px-3 py-2.5 rounded-xl transition-all cursor-pointer group text-gray-400 hover:bg-white/5 hover:text-white`}
                    >
                        <span className="text-lg group-hover:scale-110 transition-transform duration-200">
                            <Home size={20} />
                        </span>
                        <span className="font-medium">Home</span>
                    </div>

                    {isProfilePage ? (
                        <>
                            <div className="my-4 px-2">
                                <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Account</h2>
                            </div>

                            {/* Overview */}
                            <div
                                onClick={() => navigate('/profile')}
                                className={`flex items-center space-x-3 px-3 py-2.5 rounded-xl transition-all cursor-pointer group ${location.pathname === '/profile'
                                    ? 'bg-cyan-500/20 text-cyan-50 shadow-[0_0_15px_rgba(6,182,212,0.15)] border border-cyan-500/20'
                                    : 'text-gray-400 hover:bg-white/5 hover:text-white'
                                    }`}
                            >
                                <span className="text-lg group-hover:scale-110 transition-transform duration-200">
                                    <User size={20} />
                                </span>
                                <span className="font-medium">Overview</span>
                            </div>

                            {/* Preferences */}
                            <div
                                onClick={() => navigate('/profile/preferences')}
                                className={`flex items-center space-x-3 px-3 py-2.5 rounded-xl transition-all cursor-pointer group ${location.pathname === '/profile/preferences'
                                    ? 'bg-cyan-500/20 text-cyan-50 shadow-[0_0_15px_rgba(6,182,212,0.15)] border border-cyan-500/20'
                                    : 'text-gray-400 hover:bg-white/5 hover:text-white'
                                    }`}
                            >
                                <span className="text-lg group-hover:scale-110 transition-transform duration-200">
                                    <Sliders size={20} />
                                </span>
                                <span className="font-medium">Preferences</span>
                            </div>

                            {/* Security */}
                            <div
                                onClick={() => navigate('/profile/security')}
                                className={`flex items-center space-x-3 px-3 py-2.5 rounded-xl transition-all cursor-pointer group ${location.pathname === '/profile/security'
                                    ? 'bg-cyan-500/20 text-cyan-50 shadow-[0_0_15px_rgba(6,182,212,0.15)] border border-cyan-500/20'
                                    : 'text-gray-400 hover:bg-white/5 hover:text-white'
                                    }`}
                            >
                                <span className="text-lg group-hover:scale-110 transition-transform duration-200">
                                    <Shield size={20} />
                                </span>
                                <span className="font-medium">Security</span>
                            </div>
                        </>
                    ) : (
                        libraries.map((lib) => {
                            const Icon = getIconForType(lib.library_type);
                            const isActive = location.pathname === `/libraries/${lib.id}`;
                            return (
                                <div
                                    key={lib.id}
                                    onClick={() => navigate(`/libraries/${lib.id}`)}
                                    className={`flex items-center space-x-3 px-3 py-2.5 rounded-xl transition-all cursor-pointer group ${isActive
                                        ? 'bg-cyan-500/20 text-cyan-50 shadow-[0_0_15px_rgba(6,182,212,0.15)] border border-cyan-500/20'
                                        : 'text-gray-400 hover:bg-white/5 hover:text-white'
                                        }`}
                                >
                                    <span className="text-lg group-hover:scale-110 transition-transform duration-200">
                                        <Icon size={20} />
                                    </span>
                                    <span className="font-medium">{lib.name}</span>
                                </div>
                            );
                        })
                    )}
                </nav>

                <div className="pt-4 border-t border-white/10 mt-2">
                    <div
                        onClick={() => navigate('/settings')}
                        className={`flex items-center space-x-3 px-3 py-2.5 rounded-xl transition-colors cursor-pointer ${isSettingsActive
                            ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/10'
                            : 'text-gray-400 hover:bg-white/5 hover:text-white'
                            }`}
                    >
                        <span className="text-lg">
                            <Settings size={20} />
                        </span>
                        <span className="font-medium">Settings</span>
                    </div>
                </div>
            </div>
        </aside>
    );
};
