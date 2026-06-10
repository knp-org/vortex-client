import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, Film, Tv, Music, Settings, FileQuestion, BookOpen } from 'lucide-react';
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
        <aside className="w-64 flex-shrink-0 flex flex-col pr-6 h-full">
            <div className="bg-surface/50 backdrop-blur-surface border border-t-[rgba(255,255,255,0.3)] border-l-[rgba(255,255,255,0.3)] border-b-[rgba(255,255,255,0.05)] border-r-[rgba(255,255,255,0.05)] shadow-[0_0_20px_rgba(255,255,255,0.05)] rounded-2xl h-full w-full flex flex-col p-4">
                <div className="mb-6 px-2">
                    <h2 className="text-xs font-semibold text-outline-variant uppercase tracking-wider font-label">Libraries</h2>
                </div>

                <nav className="space-y-1 flex-1">
                    {/* Home Link (Always visible or back link) */}
                    <div
                        onClick={() => navigate('/')}
                        className={`flex items-center space-x-3 px-3 py-2.5 rounded-xl transition-all cursor-pointer group text-outline-variant hover:bg-white/10 hover:text-primary font-heading`}
                    >
                        <span className="text-lg group-hover:scale-110 transition-transform duration-200">
                            <Home size={20} />
                        </span>
                        <span className="font-bold">Home</span>
                    </div>

                    {libraries.map((lib) => {
                        const Icon = getIconForType(lib.library_type);
                        const isActive = location.pathname === `/libraries/${lib.id}`;
                        return (
                            <div
                                key={lib.id}
                                onClick={() => navigate(`/libraries/${lib.id}`)}
                                className={`flex items-center space-x-3 px-3 py-2.5 rounded-xl transition-all cursor-pointer group ${isActive
                                    ? 'bg-white/10 text-primary shadow-inner border border-white/20'
                                    : 'text-outline-variant hover:bg-white/5 hover:text-primary'
                                    } font-heading`}
                            >
                                <span className="text-lg group-hover:scale-110 transition-transform duration-200">
                                    <Icon size={20} />
                                </span>
                                <span className="font-bold">{lib.name}</span>
                            </div>
                        );
                    })}
                </nav>

                <div className="pt-4 border-t border-white/10 mt-2">
                    <div
                        onClick={() => navigate('/settings')}
                        className={`flex items-center space-x-3 px-3 py-2.5 rounded-xl transition-colors cursor-pointer ${isSettingsActive
                            ? 'bg-white/10 text-primary border border-white/20 shadow-inner'
                            : 'text-outline-variant hover:bg-white/5 hover:text-primary'
                            } font-heading`}
                    >
                        <span className="text-lg">
                            <Settings size={20} />
                        </span>
                        <span className="font-bold">Settings</span>
                    </div>
                </div>
            </div>
        </aside>
    );
};
