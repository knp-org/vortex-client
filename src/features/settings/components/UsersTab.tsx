import React, { useEffect, useState } from 'react';
import { GlassCard, GlassButton, GlassInput, GlassModal, GlassCheckbox, GlassSpinner, GlassBadge, GlassHeading, GlassText } from '@knp-org/liquid-glass-ui';
import { useAuth } from '@/features/auth';
import { Shield, UserPlus, Trash2, User as UserIcon } from 'lucide-react';
import { ConfirmModal } from '@/shared/ui/ConfirmModal';
import { authService, type AuthUser } from '@/services';

/** Admin-only user management: list, create (modal), and delete users. */
export const UsersTab: React.FC = () => {
    const { user } = useAuth();
    const isAdmin = user?.role === 'admin';

    const [users, setUsers] = useState<AuthUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showCreate, setShowCreate] = useState(false);
    const [pendingDelete, setPendingDelete] = useState<AuthUser | null>(null);
    const [deleting, setDeleting] = useState(false);

    const load = async () => {
        setLoading(true);
        setError('');
        try {
            setUsers(await authService.listUsers());
        } catch (e: any) {
            setError(e?.message || 'Failed to load users.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isAdmin) load();
        else setLoading(false);
    }, [isAdmin]);

    const confirmDelete = async () => {
        if (!pendingDelete || pendingDelete.id === user?.id) return;
        setDeleting(true);
        try {
            await authService.deleteUser(pendingDelete.id);
            setPendingDelete(null);
            await load();
        } catch (err: any) {
            setError(err?.message || 'Failed to delete user.');
        } finally {
            setDeleting(false);
        }
    };

    if (!isAdmin) {
        return (
            <div className="text-center py-20 text-outline-variant font-body">
                You need administrator privileges to manage users.
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-fade-in">
            <div className="flex items-start justify-between gap-4">
                <div>
                    <GlassHeading size="medium" className="font-heading">User Management</GlassHeading>
                    <GlassText variant="muted" className="text-sm mt-1 font-body">Create and manage user accounts.</GlassText>
                </div>
                <GlassButton variant="primary" size="sm" onClick={() => setShowCreate(true)} className="shrink-0">
                    <UserPlus size={16} className="mr-2" />
                    Add User
                </GlassButton>
            </div>

            {/* User list */}
            <GlassCard className="p-6">
                {loading ? (
                    <div className="py-8 flex justify-center">
                        <GlassSpinner />
                    </div>
                ) : error ? (
                    <p className="text-error text-sm font-body">{error}</p>
                ) : (
                    <div className="divide-y divide-outline/50">
                        {users.map((u) => (
                            <div key={u.id} className="flex items-center gap-4 py-3">
                                <div className="w-10 h-10 rounded-full bg-white/10 border border-outline flex items-center justify-center text-primary">
                                    <UserIcon size={18} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="text-primary font-medium font-heading truncate">{u.username}</div>
                                    {u.created_at && (
                                        <div className="text-xs text-outline-variant font-label">
                                            Joined {new Date(u.created_at).toLocaleDateString()}
                                        </div>
                                    )}
                                </div>
                                <GlassBadge active={u.role === 'admin'}>
                                    <Shield size={12} className="mr-1.5" />
                                    <span className="capitalize">{u.role}</span>
                                </GlassBadge>
                                <GlassButton
                                    variant="ghost"
                                    onClick={() => setPendingDelete(u)}
                                    disabled={u.id === user?.id}
                                    title={u.id === user?.id ? "You can't delete your own account" : 'Delete user'}
                                    className="p-2 rounded-full text-outline-variant hover:text-red-400 hover:bg-red-500/10 disabled:opacity-30 disabled:cursor-not-allowed"
                                >
                                    <Trash2 size={16} />
                                </GlassButton>
                            </div>
                        ))}
                        {users.length === 0 && (
                            <p className="text-outline-variant text-sm py-4 font-body">No users found.</p>
                        )}
                    </div>
                )}
            </GlassCard>

            {showCreate && (
                <CreateUserModal
                    onClose={() => setShowCreate(false)}
                    onCreated={() => { setShowCreate(false); load(); }}
                />
            )}

            <ConfirmModal
                isOpen={pendingDelete !== null}
                onClose={() => setPendingDelete(null)}
                onConfirm={confirmDelete}
                title="Delete User"
                message={pendingDelete ? `Delete user "${pendingDelete.username}"? This cannot be undone.` : ''}
                confirmText="Delete"
                variant="danger"
                isLoading={deleting}
            />
        </div>
    );
};

const CreateUserModal: React.FC<{ onClose: () => void; onCreated: () => void }> = ({ onClose, onCreated }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [isAdmin, setIsAdmin] = useState(false);
    const [creating, setCreating] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async () => {
        setError('');
        setCreating(true);
        try {
            await authService.createUser({ username, password, role: isAdmin ? 'admin' : 'user' });
            onCreated();
        } catch (err: any) {
            setError(err?.message || 'Failed to create user.');
        } finally {
            setCreating(false);
        }
    };

    return (
        <GlassModal
            isOpen
            onClose={onClose}
            title="Create User"
            className="max-w-md"
            footer={
                <div className="flex justify-end gap-3">
                    <GlassButton onClick={onClose} disabled={creating}>Cancel</GlassButton>
                    <GlassButton variant="primary" onClick={handleSubmit} disabled={!username || !password || creating}>
                        {creating ? 'Creating...' : 'Create User'}
                    </GlassButton>
                </div>
            }
        >
            <div className="space-y-4">
                <GlassInput
                    label="Username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Enter username"
                    autoFocus
                    required
                />
                <GlassInput
                    label="Password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter password"
                    required
                />
                <GlassCheckbox
                    label="Administrator"
                    checked={isAdmin}
                    onChange={(e) => setIsAdmin(e.target.checked)}
                />
                {error && <p className="text-error text-sm font-body">{error}</p>}
            </div>
        </GlassModal>
    );
};
