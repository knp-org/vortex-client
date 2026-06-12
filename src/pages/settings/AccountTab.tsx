import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Lock, Shield, Calendar, LogOut } from 'lucide-react';
import { Button } from '@/shared/ui/Button';
import { Input } from '@/shared/ui/Input';
import { api } from '@/services';

export const AccountTab: React.FC = () => {
    const { user, logout } = useAuth();

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

    return (
        <div className="space-y-8 animate-fade-in">
            <div>
                <h3 className="text-2xl font-bold text-primary font-heading">Account Settings</h3>
                <p className="text-outline-variant text-sm mt-1 font-body">Manage your profile and security settings.</p>
            </div>

            {/* Profile Overview */}
            <div className="bg-surface/50 backdrop-blur-surface border border-outline shadow-[0_0_20px_rgba(255,255,255,0.05)] rounded-3xl p-6">
                <div className="flex items-center gap-6">
                    <div className="w-20 h-20 rounded-full bg-white/10 border border-outline flex items-center justify-center text-primary shadow-lg">
                        <span className="text-3xl font-bold font-heading">{user?.username?.charAt(0).toUpperCase()}</span>
                    </div>

                    <div className="flex-1">
                        <h2 className="text-xl font-bold text-primary mb-2 font-heading">{user?.username}</h2>
                        <div className="flex flex-wrap gap-3 text-sm text-outline-variant font-label">
                            <div className="flex items-center gap-1.5 bg-white/5 px-3 py-1 rounded-full border border-white/10">
                                <Shield size={14} className="text-primary" />
                                <span className="capitalize">{user?.role || 'User'}</span>
                            </div>
                            {user?.created_at && (
                                <div className="flex items-center gap-1.5 bg-white/5 px-3 py-1 rounded-full border border-white/10">
                                    <Calendar size={14} className="text-primary" />
                                    <span>Joined: {new Date(user.created_at).toLocaleDateString()}</span>
                                </div>
                            )}
                        </div>
                    </div>

                    <div>
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
            </div>

            {/* Security */}
            <div className="bg-surface/50 backdrop-blur-surface border border-outline shadow-[0_0_20px_rgba(255,255,255,0.05)] rounded-3xl p-6">
                <h4 className="text-lg font-bold text-primary mb-6 flex items-center gap-2 font-heading">
                    <Lock className="text-primary" size={20} />
                    Change Password
                </h4>
                
                <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
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
                        <p className="text-error text-sm mt-2 font-body">{passwordError}</p>
                    )}

                    {passwordSuccess && (
                        <p className="text-primary text-sm mt-2 font-body">Password changed successfully!</p>
                    )}

                    <div className="pt-4">
                        <Button 
                            type="submit" 
                            disabled={!currentPassword || !newPassword || !confirmPassword || isChangingPassword}
                        >
                            {isChangingPassword ? 'Updating...' : 'Update Password'}
                        </Button>
                    </div>
                </form>
            </div>

            {/* Account Stats & Preferences */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-surface/30 border border-outline rounded-3xl p-6 shadow-[0_0_20px_rgba(255,255,255,0.02)]">
                    <h3 className="text-lg font-semibold text-primary mb-4 font-heading">Account Stats</h3>
                    <div className="space-y-3 font-body">
                        <div className="flex justify-between text-sm text-outline-variant">
                            <span>Watch Time</span>
                            <span className="text-primary font-medium">0h 0m</span>
                        </div>
                        <div className="flex justify-between text-sm text-outline-variant">
                            <span>Movies Watched</span>
                            <span className="text-primary font-medium">0</span>
                        </div>
                        <div className="flex justify-between text-sm text-outline-variant">
                            <span>Episodes Watched</span>
                            <span className="text-primary font-medium">0</span>
                        </div>
                    </div>
                </div>

                <div className="bg-surface/30 border border-outline rounded-3xl p-6 shadow-[0_0_20px_rgba(255,255,255,0.02)]">
                    <h3 className="text-lg font-semibold text-primary mb-4 font-heading">Preferences</h3>
                    <p className="text-outline-variant text-sm font-body">No preferences available yet.</p>
                </div>
            </div>
        </div>
    );
};
