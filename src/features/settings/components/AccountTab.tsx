import React, { useState } from 'react';
import { GlassCard, GlassButton, GlassInput, GlassHeading, GlassText, GlassBadge } from '@knp-org/liquid-glass-ui';
import { useAuth } from '@/features/auth';
import { Lock, Shield, Calendar, LogOut } from 'lucide-react';
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
                <GlassHeading size="medium" className="font-heading">Account Settings</GlassHeading>
                <GlassText variant="muted" className="text-sm mt-1 font-body">Manage your profile and security settings.</GlassText>
            </div>

            {/* Profile Overview */}
            <GlassCard className="p-6">
                <div className="flex items-center gap-6">
                    <div className="w-20 h-20 rounded-full bg-white/10 border border-outline flex items-center justify-center text-primary shadow-lg">
                        <span className="text-3xl font-bold font-heading">{user?.username?.charAt(0).toUpperCase()}</span>
                    </div>

                    <div className="flex-1">
                        <GlassHeading size="small" className="mb-2 font-heading">{user?.username}</GlassHeading>
                        <div className="flex flex-wrap gap-3 text-sm">
                            <GlassBadge>
                                <Shield size={14} className="text-primary mr-1.5" />
                                <span className="capitalize">{user?.role || 'User'}</span>
                            </GlassBadge>
                            {user?.created_at && (
                                <GlassBadge>
                                    <Calendar size={14} className="text-primary mr-1.5" />
                                    <span>Joined: {new Date(user.created_at).toLocaleDateString()}</span>
                                </GlassBadge>
                            )}
                        </div>
                    </div>

                    <GlassButton variant="danger" onClick={logout}>
                        <LogOut size={16} className="mr-2" />
                        Sign Out
                    </GlassButton>
                </div>
            </GlassCard>

            {/* Security */}
            <GlassCard className="p-6">
                <GlassHeading size="small" className="mb-6 flex items-center gap-2 font-heading">
                    <Lock className="text-primary" size={20} />
                    Change Password
                </GlassHeading>

                <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
                    <GlassInput
                        label="Current Password"
                        type="password"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        placeholder="Enter current password"
                        required
                    />

                    <GlassInput
                        label="New Password"
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Enter new password"
                        required
                    />

                    <GlassInput
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
                        <GlassButton
                            variant="primary"
                            type="submit"
                            disabled={!currentPassword || !newPassword || !confirmPassword || isChangingPassword}
                        >
                            {isChangingPassword ? 'Updating...' : 'Update Password'}
                        </GlassButton>
                    </div>
                </form>
            </GlassCard>

            {/* Account Stats & Preferences */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <GlassCard className="p-6">
                    <GlassHeading size="small" className="mb-4 font-heading">Account Stats</GlassHeading>
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
                </GlassCard>

                <GlassCard className="p-6">
                    <GlassHeading size="small" className="mb-4 font-heading">Preferences</GlassHeading>
                    <GlassText variant="muted" className="text-sm font-body">No preferences available yet.</GlassText>
                </GlassCard>
            </div>
        </div>
    );
};
