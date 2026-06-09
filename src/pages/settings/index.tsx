import React, { useState } from 'react';
import { MainLayout } from '../../layouts/MainLayout';
import { SettingsTab } from '../../types/settings';
import { LibrariesTab } from './LibrariesTab';
import { AccountTab } from './AccountTab';
import { MetadataTab } from './MetadataTab';
import { TranscodingTab } from './TranscodingTab';
import { SystemTab } from './SystemTab';

export const Settings: React.FC = () => {
    const [activeTab, setActiveTab] = useState<SettingsTab>('libraries');

    const renderTabButton = (tab: SettingsTab, label: string) => (
        <button
            onClick={() => setActiveTab(tab)}
            className={`text-left px-4 py-3 rounded-xl transition-all font-medium ${activeTab === tab
                ? 'bg-cyan-500/20 text-cyan-50 border border-cyan-500/20 shadow-lg'
                : 'text-gray-400 hover:bg-white/5 hover:text-white'
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
                        <h2 className="text-xl font-bold text-gray-200 mb-4 px-2">Settings</h2>
                        {renderTabButton('libraries', 'Library Management')}
                        {renderTabButton('account', 'Account Settings')}
                        {renderTabButton('metadata', 'Metadata')}
                        {renderTabButton('transcoding', 'Transcoding')}
                        {renderTabButton('system', 'System')}
                    </div>
                </div>

                {/* Tab Content */}
                <div className="flex-1 min-w-0">
                    <div className="glass-panel min-h-full py-6 px-8">
                        {activeTab === 'libraries' && <LibrariesTab />}
                        {activeTab === 'account' && <AccountTab />}
                        {activeTab === 'metadata' && <MetadataTab />}
                        {activeTab === 'transcoding' && <TranscodingTab />}
                        {activeTab === 'system' && <SystemTab />}
                    </div>
                </div>
            </div>
        </MainLayout>
    );
};

export default Settings;
