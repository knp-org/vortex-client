import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Lock, Shield, Calendar, LogOut } from 'lucide-react';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { api } from '../../services';

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
                <h3 className="text-2xl font-bold text-white">Account Settings</h3>
                <p className="text-gray-400 text-sm mt-1">Manage your profile and security settings.</p>
            </div>

            {/* Profile Overview */}
            <div className="bg-white/5 border border-white/5 rounded-3xl p-6">
                <div className="flex items-center gap-6">
                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white shadow-lg">
                        <span className="text-3xl font-bold">{user?.username?.charAt(0).toUpperCase()}</span>
                    </div>

                    <div className="flex-1">
                        <h2 className="text-xl font-bold text-white mb-2">{user?.username}</h2>
                        <div className="flex flex-wrap gap-3 text-sm text-gray-400">
                            <div className="flex items-center gap-1.5 bg-white/5 px-3 py-1 rounded-full">
                                <Shield size={14} className="text-cyan-400" />
                                <span className="capitalize">{user?.role || 'User'}</span>
                            </div>
                            {user?.created_at && (
                                <div className="flex items-center gap-1.5 bg-white/5 px-3 py-1 rounded-full">
                                    <Calendar size={14} className="text-green-400" />
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
            <div className="bg-white/5 border border-white/5 rounded-3xl p-6">
                <h4 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                    <Lock className="text-cyan-400" size={20} />
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
                        <p className="text-red-400 text-sm mt-2">{passwordError}</p>
                    )}

                    {passwordSuccess && (
                        <p className="text-green-400 text-sm mt-2">Password changed successfully!</p>
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
        </div>
    );
};
