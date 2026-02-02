import React from 'react';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { usePlatform } from '../../hooks/usePlatform';

export const WindowControls: React.FC = () => {
    const { isTauri } = usePlatform();

    if (!isTauri) return null;

    const appWindow = getCurrentWindow();

    return (
        <div className="flex items-center space-x-2 p-2 z-50">
            <button
                onClick={() => appWindow.minimize()}
                className="w-3 h-3 rounded-full bg-yellow-400 hover:bg-yellow-300 transition-colors"
            />
            <button
                onClick={() => appWindow.toggleMaximize()}
                className="w-3 h-3 rounded-full bg-green-400 hover:bg-green-300 transition-colors"
            />
            <button
                onClick={() => appWindow.close()}
                className="w-3 h-3 rounded-full bg-red-400 hover:bg-red-300 transition-colors"
            />
        </div>
    );
};
