import React, { useState, useEffect } from 'react';
import { X, Search, Film, Tv } from 'lucide-react';
import { Button } from '../common/Button';
import { resolveImageUrl, api } from '../../services';

interface IdentifyModalProps {
    isOpen: boolean;
    onClose: () => void;
    onIdentify: (providerId: string, mediaType: 'movie' | 'series') => Promise<void>;
    currentTitle: string;
    isSeries: boolean;
}

interface SearchResult {
    title: string;
    year?: string;
    poster_url?: string;
    media_type: 'movie' | 'series';
    overview?: string;
    provider_ids?: {
        tmdb?: number | string;
        [key: string]: any;
    };
}

export const IdentifyModal: React.FC<IdentifyModalProps> = ({
    isOpen,
    onClose,
    onIdentify,
    currentTitle,
    isSeries
}) => {
    const [query, setQuery] = useState(currentTitle);
    const [results, setResults] = useState<SearchResult[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isIdentifying, setIsIdentifying] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setQuery(currentTitle);
            setResults([]);
            handleSearch(currentTitle);
        }
    }, [isOpen, currentTitle]);

    const handleSearch = async (searchQuery: string) => {
        if (!searchQuery.trim()) return;

        setIsLoading(true);
        try {
            const typeParam = isSeries ? '&media_type=series' : '&media_type=movie';
            const data = await api.get<SearchResult[]>(`/metadata/search?query=${encodeURIComponent(searchQuery)}${typeParam}`);
            setResults(data);
        } catch (error) {
            console.error("Search failed", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSelect = async (result: SearchResult) => {
        console.log("IdentifyModal: handleSelect called with:", result);

        let providerId = "";
        if (result.provider_ids && result.provider_ids.tmdb) {
            providerId = result.provider_ids.tmdb.toString();
        }

        if (!providerId) {
            console.error("IdentifyModal: No provider ID found in result", result);
            return;
        }

        setIsIdentifying(true);
        try {
            console.log("IdentifyModal: Calling onIdentify callback...", { provider_id: providerId, media_type: result.media_type });
            await onIdentify(providerId, result.media_type);
            console.log("IdentifyModal: onIdentify successful");
            onClose();
        } catch (error) {
            console.error("Identification failed", error);
        } finally {
            setIsIdentifying(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
            <div className="bg-gray-900 border border-white/10 rounded-2xl w-full max-w-2xl max-h-[80vh] flex flex-col shadow-2xl">
                {/* Header */}
                <div className="p-6 border-b border-white/10 flex items-center justify-between">
                    <h2 className="text-xl font-bold text-white">Identify {isSeries ? 'Series' : 'Movie'}</h2>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                        <X size={20} className="text-gray-400" />
                    </button>
                </div>

                {/* Search Bar */}
                <div className="p-6 pb-2">
                    <div className="relative">
                        <input
                            type="text"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSearch(query)}
                            placeholder="Search for correct title..."
                            className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 pl-12 text-white focus:outline-none focus:border-cyan-500 transition-colors"
                        />
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                        <div className="absolute right-2 top-1/2 -translate-y-1/2">
                            <Button size="sm" onClick={() => handleSearch(query)} disabled={isLoading}>
                                {isLoading ? 'Searching...' : 'Search'}
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Results List */}
                <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
                    {results.length === 0 && !isLoading && (
                        <div className="text-center py-10 text-gray-500">
                            No results found. Try a different search term.
                        </div>
                    )}

                    {results.map((result, index) => (
                        <div
                            key={result.provider_ids?.tmdb || index}
                            className="flex items-center gap-4 p-3 rounded-xl hover:bg-white/5 border border-transparent hover:border-white/10 cursor-pointer transition-all group"
                            onClick={() => handleSelect(result)}
                        >
                            <div className="w-12 h-16 bg-gray-800 rounded-md overflow-hidden flex-shrink-0">
                                {result.poster_url ? (
                                    <img src={resolveImageUrl(result.poster_url)} alt={result.title} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-white/20">
                                        {result.media_type === 'series' ? <Tv size={16} /> : <Film size={16} />}
                                    </div>
                                )}
                            </div>

                            <div className="flex-1 min-w-0">
                                <h3 className="text-white font-medium truncate group-hover:text-cyan-400 transition-colors">
                                    {result.title}
                                </h3>
                                <div className="text-sm text-gray-400 flex items-center gap-2">
                                    {result.year && <span>{result.year}</span>}
                                    <span className="capitalize px-1.5 py-0.5 rounded bg-white/5 text-xs border border-white/5">
                                        {result.media_type}
                                    </span>
                                </div>
                                {result.overview && (
                                    <p className="text-xs text-gray-500 line-clamp-1 mt-1">{result.overview}</p>
                                )}
                            </div>

                            <Button
                                size="sm"
                                variant="secondary"
                                disabled={isIdentifying}
                            >
                                Select
                            </Button>
                        </div>
                    ))}
                </div>

                {/* Footer */}
                {isIdentifying && (
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 rounded-2xl">
                        <div className="flex flex-col items-center gap-3">
                            <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
                            <p className="text-white font-medium">Updating Metadata...</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
