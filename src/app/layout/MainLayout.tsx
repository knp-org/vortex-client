import React from 'react';
import { useLocation } from 'react-router-dom';
import { Header } from './Header';
import { Sidebar } from './Sidebar';

interface MainLayoutProps {
    children: React.ReactNode;
}

export const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
    const location = useLocation();
    const isSettingsPage = location.pathname.startsWith('/settings');
    // Movie/TV detail pages show a glass scrollbar; everything else hides it.
    const isDetailPage = location.pathname.startsWith('/media/') || location.pathname.startsWith('/series/');

    return (
        <div className="relative flex h-screen w-screen overflow-hidden bg-background">
            {/* Top Navigation - Floating Dock */}
            <div className="absolute top-6 left-0 right-0 z-50 flex justify-center pointer-events-none">
                <div className="pointer-events-auto w-full flex justify-center">
                    <Header />
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex flex-1 w-full h-full overflow-hidden relative pt-28 pb-8 px-6">
                {!isSettingsPage && <Sidebar />}

                <main className="flex-1 min-w-0 h-full relative">
                    <div className={`${isSettingsPage ? '' : 'bg-surface backdrop-blur-surface border border-t-[rgba(255,255,255,0.3)] border-l-[rgba(255,255,255,0.3)] border-b-[rgba(255,255,255,0.05)] border-r-[rgba(255,255,255,0.05)] shadow-[0_0_20px_rgba(255,255,255,0.05)] rounded-2xl p-6'} h-full w-full overflow-y-auto relative ${isDetailPage ? 'glass-scrollbar' : 'scrollbar-hide'}`}>
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
};

