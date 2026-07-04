import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { GlassCard, GlassButton, GlassHeading } from '@knp-org/liquid-glass-ui';
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
        <GlassButton
            variant={activeTab === tab ? 'primary' : 'ghost'}
            onClick={() => setActiveTab(tab)}
            className={`w-full text-left px-4 py-3 rounded-xl font-heading ${activeTab === tab
                ? ''
                : 'text-outline-variant hover:bg-white/5 hover:text-primary'
                }`}
        >
            {label}
        </GlassButton>
    );

    return (
        <MainLayout>
            <div className="flex flex-col md:flex-row h-full gap-4">
                {/* Settings Sidebar */}
                <div className="w-full md:w-64 flex-shrink-0">
                    <GlassCard className="h-full p-4 flex flex-col space-y-2">
                        <GlassHeading size="small" className="mb-4 px-2 font-heading">Settings</GlassHeading>
                        {renderTabButton('libraries', 'Library Management')}
                        {renderTabButton('account', 'Account Settings')}
                        {isAdmin && renderTabButton('users', 'User Management')}
                        {renderTabButton('metadata', 'Metadata')}
                        {renderTabButton('transcoding', 'Transcoding')}
                        {renderTabButton('player', 'Player')}
                        {renderTabButton('system', 'System')}
                    </GlassCard>
                </div>

                {/* Tab Content */}
                <div className="flex-1 min-w-0">
                    <GlassCard className="min-h-full py-6 px-8">
                        {activeTab === 'libraries' && <LibrariesTab />}
                        {activeTab === 'account' && <AccountTab />}
                        {activeTab === 'users' && isAdmin && <UsersTab />}
                        {activeTab === 'metadata' && <MetadataTab />}
                        {activeTab === 'transcoding' && <TranscodingTab />}
                        {activeTab === 'player' && <PlayerTab />}
                        {activeTab === 'system' && <SystemTab />}
                    </GlassCard>
                </div>
            </div>
        </MainLayout>
    );
};

export default Settings;
