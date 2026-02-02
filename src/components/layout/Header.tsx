import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { WindowControls } from '../common/WindowControls';
import { usePlatform } from '../../hooks/usePlatform';
import { useAuth } from '../../context/AuthContext';
import { Search, Film, Tv, X, LogOut, Settings } from 'lucide-react';

interface SearchResult {
    id: number;
    title: string;
    series_name: string | null;
    media_type: string;
    poster_url: string | null;
    stream_url?: string;
    year: number | null;
}

export const Header: React.FC = () => {
    const { isTauri } = usePlatform();
    const navigate = useNavigate();
    const { user, logout } = useAuth();

    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const searchRef = useRef<HTMLDivElement>(null);
    const profileRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Debounced search
    useEffect(() => {
        if (!searchQuery.trim()) {
            setSearchResults([]);
            return;
        }

        const timer = setTimeout(async () => {
            setIsLoading(true);
            try {
                const response = await fetch(`/api/v1/library/search?query=${encodeURIComponent(searchQuery)}`);
                if (response.ok) {
                    const data = await response.json();
                    setSearchResults(data.slice(0, 8)); // Limit to 8 results
                }
            } catch (error) {
                console.error('Search failed:', error);
            } finally {
                setIsLoading(false);
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [searchQuery]);

    // Close dropdown on outside click
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
                setIsSearchOpen(false);
            }
            if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleResultClick = (result: SearchResult) => {
        setIsSearchOpen(false);
        setSearchQuery('');
        navigate(`/media/${result.id}`);
    };

    return (
        <header className="h-16 flex-shrink-0 px-4 pt-4 flex items-center justify-between z-50">
            {/* Left: Logo */}
            <div className="flex items-center space-x-3 cursor-pointer" onClick={() => navigate('/')}>
                <div className="text-2xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">
                    Vortex
                </div>
            </div>

            {/* Center: Search Bar */}
            <div
                ref={searchRef}
                className="absolute left-1/2 -translate-x-1/2 w-full max-w-[320px]"
            >
                <div className="relative">
                    <div className="flex items-center gap-3 bg-white/5 hover:bg-white/10 text-gray-400 rounded-full px-4 py-2 transition-all border border-white/10 focus-within:border-cyan-500/50 focus-within:bg-white/10">
                        <Search size={18} className="text-gray-400 flex-shrink-0" />
                        <input
                            ref={inputRef}
                            type="text"
                            placeholder="Search movies, shows..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onFocus={() => setIsSearchOpen(true)}
                            className="bg-transparent outline-none text-sm text-gray-200 placeholder-gray-500 w-full"
                        />
                        {searchQuery && (
                            <button
                                onClick={() => { setSearchQuery(''); inputRef.current?.focus(); }}
                                className="text-gray-500 hover:text-gray-300"
                            >
                                <X size={16} />
                            </button>
                        )}
                    </div>

                    {/* Dropdown Results */}
                    {isSearchOpen && (searchQuery.trim() || isLoading) && (
                        <div className="absolute top-full left-0 right-0 mt-2 bg-[#1a1a1a] border border-white/10 rounded-xl overflow-hidden shadow-2xl z-50 max-h-[400px] overflow-y-auto">
                            {isLoading ? (
                                <div className="p-4 text-center text-gray-500 text-sm">
                                    <div className="w-5 h-5 border-2 border-cyan-500 rounded-full animate-spin border-t-transparent mx-auto" />
                                </div>
                            ) : searchResults.length > 0 ? (
                                searchResults.map((result) => (
                                    <button
                                        key={result.id}
                                        onClick={() => handleResultClick(result)}
                                        className="w-full flex items-center gap-3 p-3 hover:bg-white/5 transition-colors text-left"
                                    >
                                        {/* Poster */}
                                        <div className="w-10 h-14 rounded bg-gray-800 overflow-hidden flex-shrink-0">
                                            {result.poster_url ? (
                                                <img src={result.poster_url} alt="" className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-gray-600">
                                                    {result.media_type === 'series' ? <Tv size={16} /> : <Film size={16} />}
                                                </div>
                                            )}
                                        </div>
                                        {/* Info */}
                                        <div className="flex-1 min-w-0">
                                            <div className="text-sm text-gray-200 truncate font-medium">
                                                {result.title || result.series_name}
                                            </div>
                                            <div className="text-xs text-gray-500 flex items-center gap-2">
                                                <span className="capitalize">{result.media_type}</span>
                                                {result.year && <span>• {result.year}</span>}
                                            </div>
                                        </div>
                                    </button>
                                ))
                            ) : searchQuery.trim() ? (
                                <div className="p-4 text-center text-gray-500 text-sm">
                                    No results found
                                </div>
                            ) : null}
                        </div>
                    )}
                </div>
            </div>

            {/* Right: User Profile & Controls */}
            <div className="flex items-center space-x-4">
                {/* User Profile Hook */}
                <div className="relative" ref={profileRef}>
                    <div
                        className="flex items-center space-x-3 bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-full transition-colors cursor-pointer border border-white/5 select-none"
                        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    >
                        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-500 to-pink-500 flex items-center justify-center text-xs font-bold text-white shadow-lg">
                            {user?.username?.charAt(0).toUpperCase() || 'U'}
                        </div>
                        <span className="text-sm font-medium text-gray-200 hidden md:block">{user?.username || 'Guest'}</span>
                    </div>

                    {/* Dropdown Menu */}
                    {isDropdownOpen && (
                        <div className="absolute top-full right-0 mt-2 w-48 bg-[#1a1a1a] border border-white/10 rounded-xl overflow-hidden shadow-2xl z-50 py-1">
                            <button
                                onClick={() => {
                                    navigate('/profile');
                                    setIsDropdownOpen(false);
                                }}
                                className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-300 hover:bg-white/5 hover:text-white transition-colors"
                            >
                                <Settings size={16} />
                                Account Settings
                            </button>
                            <div className="h-px bg-white/5 my-1" />
                            <button
                                onClick={() => {
                                    logout();
                                    setIsDropdownOpen(false);
                                }}
                                className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
                            >
                                <LogOut size={16} />
                                Sign Out
                            </button>
                        </div>
                    )}
                </div>

                {/* Window Controls (Tauri only) */}
                {isTauri && (
                    <div className="pl-4 border-l border-white/10">
                        <WindowControls />
                    </div>
                )}
            </div>
        </header>
    );
};
