import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLocation } from 'react-router-dom';
import { MainLayout } from '../layouts/MainLayout';
import { User as UserIcon, Shield, LogOut, Calendar, Lock } from 'lucide-react';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { api } from '../services';

export const Profile: React.FC = () => {
    const { user, logout } = useAuth();
    const location = useLocation();

    // Password Change State
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isChangingPassword, setIsChangingPassword] = useState(false);
    const [passwordError, setPasswordError] = useState('');
    const [passwordSuccess, setPasswordSuccess] = useState(false);

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setPasswordError('');
        setPasswordSuccess(false);

        if (newPassword !== confirmPassword) {
            setPasswordError("New passwords don't match.");
            return;
        }

        if (newPassword.length < 6) {
            setPasswordError("New password must be at least 6 characters.");
            return;
        }

        setIsChangingPassword(true);
        try {
            await api.post('/auth/change_password', {
                current_password: currentPassword,
                new_password: newPassword,
            });
            setPasswordSuccess(true);
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } catch (error: any) {
            setPasswordError(error.response?.data?.message || 'Failed to change password. Please check your current password.');
        } finally {
            setIsChangingPassword(false);
        }
    };

    // Determine active section
    let content;
    if (location.pathname === '/profile/preferences') {
        content = (
            <div className="max-w-4xl mx-auto px-6 py-12">
                <h1 className="text-3xl font-bold text-white mb-8">Preferences</h1>
                <div className="bg-gray-900/50 border border-white/5 rounded-3xl p-8 backdrop-blur-sm">
                    <p className="text-gray-400">Settings to customize your Vortex experience will appear here.</p>
                </div>
            </div>
        );
    } else if (location.pathname === '/profile/security') {
        content = (
            <div className="max-w-4xl mx-auto px-6 py-12">
                <h1 className="text-3xl font-bold text-white mb-8">Security</h1>
                <div className="bg-gray-900/50 border border-white/5 rounded-3xl p-8 backdrop-blur-sm">
                    <div className="max-w-md">
                        <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                            <Lock className="text-cyan-400" size={24} />
                            Change Password
                        </h2>
                        
                        <form onSubmit={handleChangePassword} className="space-y-4">
                            <Input
                                label="Current Password"
                                type="password"
                                value={currentPassword}
                                onChange={(e) => setCurrentPassword(e.target.value)}
                                placeholder="Enter current password"
                                required
                            />
                            
                            <Input
                                label="New Password"
                                type="password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                placeholder="Enter new password"
                                required
                            />
                            
                            <Input
                                label="Confirm New Password"
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder="Confirm new password"
                                required
                            />

                            {passwordError && (
                                <p className="text-red-400 text-sm mt-2">{passwordError}</p>
                            )}

                            {passwordSuccess && (
                                <p className="text-green-400 text-sm mt-2">Password changed successfully!</p>
                            )}

                            <div className="pt-4">
                                <Button 
                                    type="submit" 
                                    disabled={!currentPassword || !newPassword || !confirmPassword || isChangingPassword}
                                    className="w-full"
                                >
                                    {isChangingPassword ? 'Updating...' : 'Update Password'}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        );
    } else {
        // Default: Overview
        content = (
            <div className="max-w-4xl mx-auto px-6 py-12">
                <h1 className="text-3xl font-bold text-white mb-8">Profile</h1>

                <div className="bg-gray-900/50 border border-white/5 rounded-3xl p-8 backdrop-blur-sm">
                    <div className="flex items-start md:items-center gap-6 flex-col md:flex-row">
                        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white shadow-lg shadow-cyan-500/20">
                            <span className="text-4xl font-bold">{user?.username.charAt(0).toUpperCase()}</span>
                        </div>

                        <div className="flex-1">
                            <h2 className="text-2xl font-bold text-white mb-2">{user?.username}</h2>
                            <div className="flex flex-wrap gap-4 text-sm text-gray-400">
                                <div className="flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-full">
                                    <Shield size={14} className="text-cyan-400" />
                                    <span className="capitalize">{user?.role || 'User'}</span>
                                </div>
                                <div className="flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-full">
                                    <UserIcon size={14} className="text-purple-400" />
                                    <span>ID: {user?.id}</span>
                                </div>
                                {user?.created_at && (
                                    <div className="flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-full">
                                        <Calendar size={14} className="text-green-400" />
                                        <span>Joined: {new Date(user.created_at).toLocaleDateString()}</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="mt-4 md:mt-0">
                            <Button
                                variant="secondary"
                                icon={LogOut}
                                onClick={logout}
                                className="bg-red-500/10 text-red-400 hover:bg-red-500/20 hover:text-red-300 border-red-500/20"
                            >
                                Sign Out
                            </Button>
                        </div>
                    </div>

                    <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="p-6 rounded-2xl bg-black/20 border border-white/5">
                            <h3 className="text-lg font-semibold text-white mb-4">Account Stats</h3>
                            <div className="space-y-3">
                                <div className="flex justify-between text-sm text-gray-400">
                                    <span>Watch Time</span>
                                    <span className="text-white">0h 0m</span>
                                </div>
                                <div className="flex justify-between text-sm text-gray-400">
                                    <span>Movies Watched</span>
                                    <span className="text-white">0</span>
                                </div>
                                <div className="flex justify-between text-sm text-gray-400">
                                    <span>Episodes Watched</span>
                                    <span className="text-white">0</span>
                                </div>
                            </div>
                        </div>

                        <div className="p-6 rounded-2xl bg-black/20 border border-white/5">
                            <h3 className="text-lg font-semibold text-white mb-4">Preferences</h3>
                            <p className="text-gray-500 text-sm">No preferences available yet.</p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <MainLayout>
            {content}
        </MainLayout>
    );
};
