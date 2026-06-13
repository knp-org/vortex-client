import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { MainLayout } from '@/app/layout/MainLayout';
import { SettingsTab } from '@/types/settings';
import { useAuth } from '@/features/auth';
import { LibrariesTab } from './LibrariesTab';
import { AccountTab } from './AccountTab';
import { UsersTab } from './UsersTab';
import { MetadataTab } from './MetadataTab';
import { TranscodingTab } from './TranscodingTab';
import { SystemTab } from './SystemTab';
import { PlayerTab } from './PlayerTab';

export const Settings: React.FC = () => {
    const location = useLocation();
    const { user } = useAuth();
    const isAdmin = user?.role === 'admin';
    const initialTab = (location.state as any)?.tab as SettingsTab || 'libraries';
    const [activeTab, setActiveTab] = useState<SettingsTab>(initialTab);

    useEffect(() => {
        if ((location.state as any)?.tab) {
            setActiveTab((location.state as any).tab as SettingsTab);
        }
    }, [location.state]);

    const renderTabButton = (tab: SettingsTab, label: string) => (
        <button
            onClick={() => setActiveTab(tab)}
            className={`text-left px-4 py-3 rounded-xl transition-all font-heading ${activeTab === tab
                ? 'bg-white/10 text-primary border border-white/20 shadow-inner'
                : 'text-outline-variant hover:bg-white/5 hover:text-primary'
                }`}
        >
            {label}
        </button>
    );

    return (
        <MainLayout>
            <div className="flex flex-col md:flex-row h-full gap-4">
                {/* Settings Sidebar */}
                <div className="w-full md:w-64 flex-shrink-0">
                    <div className="glass-panel h-full p-4 flex flex-col space-y-2">
                        <h2 className="text-xl font-bold text-primary mb-4 px-2 font-heading">Settings</h2>
                        {renderTabButton('libraries', 'Library Management')}
                        {renderTabButton('account', 'Account Settings')}
                        {isAdmin && renderTabButton('users', 'User Management')}
                        {renderTabButton('metadata', 'Metadata')}
                        {renderTabButton('transcoding', 'Transcoding')}
                        {renderTabButton('player', 'Player')}
                        {renderTabButton('system', 'System')}
                    </div>
                </div>

                {/* Tab Content */}
                <div className="flex-1 min-w-0">
                    <div className="glass-panel min-h-full py-6 px-8">
                        {activeTab === 'libraries' && <LibrariesTab />}
                        {activeTab === 'account' && <AccountTab />}
                        {activeTab === 'users' && isAdmin && <UsersTab />}
                        {activeTab === 'metadata' && <MetadataTab />}
                        {activeTab === 'transcoding' && <TranscodingTab />}
                        {activeTab === 'player' && <PlayerTab />}
                        {activeTab === 'system' && <SystemTab />}
                    </div>
                </div>
            </div>
        </MainLayout>
    );
};

export default Settings;
