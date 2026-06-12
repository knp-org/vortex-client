import React from 'react';
import { usePlatform } from '@/hooks/usePlatform';
import { WindowControls } from './WindowControls';

export const Titlebar: React.FC = () => {
    const { isTauri } = usePlatform();

    if (!isTauri) return null;

    return (
        <div 
            data-tauri-drag-region 
            className="h-8 w-full bg-[#07070a] border-b border-white/5 flex items-center justify-between pl-3 select-none z-50 shrink-0"
        >
            {/* Left: Drag Region Spacer */}
            <div data-tauri-drag-region className="flex-1 h-full pointer-events-none" />

            {/* Right: Window Controls */}
            <div className="flex items-center pr-1">
                <WindowControls />
            </div>
        </div>
    );
};
