import React from 'react';
import { useLocation } from 'react-router-dom';
import { Header } from '../components/layout/Header';
import { Sidebar } from '../components/layout/Sidebar';

interface MainLayoutProps {
    children: React.ReactNode;
}

export const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
    const location = useLocation();
    const isSettingsPage = location.pathname.startsWith('/settings');

    return (
        <div className="flex flex-col h-screen w-screen overflow-hidden bg-transparent">
            {/* Top Navigation */}
            <Header />

            {/* Main Content Area */}
            <div className="flex flex-1 overflow-hidden relative">
                {!isSettingsPage && <Sidebar />}

                <main className="flex-1 p-4 min-w-0">
                    <div className={`${isSettingsPage ? '' : 'glass-panel p-6'} h-full w-full overflow-y-auto relative scrollbar-hide`}>
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
};

