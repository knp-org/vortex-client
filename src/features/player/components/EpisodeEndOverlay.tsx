import React from 'react';
import { SkipForward, ListVideo } from 'lucide-react';

interface EpisodeEndOverlayProps {
    /** Title of the next episode, shown as "Up next". */
    nextTitle?: string;
    /** Play the next episode now. */
    onNextEpisode: () => void;
    /** Dismiss the prompt and let the current episode's credits play out. */
    onWatchCredits: () => void;
}

/**
 * Shown over the video near the end of a TV-show episode. Offers to jump to the
 * next episode or keep watching the credits. Rendered conditionally by the
 * player (only for TV episodes that have a next episode).
 */
export const EpisodeEndOverlay: React.FC<EpisodeEndOverlayProps> = ({
    nextTitle, onNextEpisode, onWatchCredits,
}) => (
    <div className="absolute bottom-28 right-8 z-50 flex flex-col items-end gap-3 animate-fade-in">
        {nextTitle && (
            <p className="text-white/70 text-sm font-label max-w-xs truncate">
                Up next: <span className="text-white">{nextTitle}</span>
            </p>
        )}
        <div className="flex items-center gap-3">
            <button
                onClick={onWatchCredits}
                className="h-11 px-5 gap-2 rounded-full bg-white/10 hover:bg-white/20 text-white border border-white/10 backdrop-blur-xl flex items-center justify-center transition-all hover:scale-105 font-medium font-heading"
            >
                <ListVideo size={18} />
                <span>Watch Credits</span>
            </button>
            <button
                onClick={onNextEpisode}
                className="h-11 px-6 gap-2 rounded-full bg-white text-black flex items-center justify-center transition-all hover:scale-105 hover:bg-gray-200 font-semibold font-heading shadow-[0_0_20px_rgba(255,255,255,0.25)]"
            >
                <SkipForward size={18} className="fill-current" />
                <span>Next Episode</span>
            </button>
        </div>
    </div>
);
