import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '@/features/auth';
import { Shield, UserPlus, Trash2, User as UserIcon, X } from 'lucide-react';
import { Button } from '@/shared/ui/Button';
import { Input } from '@/shared/ui/Input';
import { authService, type AuthUser } from '@/services';

/** Admin-only user management: list, create (modal), and delete users. */
export const UsersTab: React.FC = () => {
    const { user } = useAuth();
    const isAdmin = user?.role === 'admin';

    const [users, setUsers] = useState<AuthUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showCreate, setShowCreate] = useState(false);

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

    const handleDelete = async (target: AuthUser) => {
        if (target.id === user?.id) return;
        if (!window.confirm(`Delete user "${target.username}"? This cannot be undone.`)) return;
        try {
            await authService.deleteUser(target.id);
            await load();
        } catch (err: any) {
            setError(err?.message || 'Failed to delete user.');
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
                    <h3 className="text-2xl font-bold text-primary font-heading">User Management</h3>
                    <p className="text-outline-variant text-sm mt-1 font-body">Create and manage user accounts.</p>
                </div>
                <Button size="sm" icon={UserPlus} onClick={() => setShowCreate(true)} className="shrink-0">
                    Add User
                </Button>
            </div>

            {/* User list */}
            <div className="bg-surface/50 backdrop-blur-surface border border-outline shadow-[0_0_20px_rgba(255,255,255,0.05)] rounded-3xl p-6">
                {loading ? (
                    <div className="py-8 flex justify-center">
                        <div className="w-6 h-6 border-2 border-primary rounded-full animate-spin border-t-transparent" />
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
                                <span className={`flex items-center gap-1.5 text-xs px-2 py-1 rounded-full border font-label ${
                                    u.role === 'admin'
                                        ? 'bg-primary/10 text-primary border-primary/20'
                                        : 'bg-white/5 text-outline-variant border-white/10'
                                }`}>
                                    <Shield size={12} />
                                    <span className="capitalize">{u.role}</span>
                                </span>
                                <button
                                    onClick={() => handleDelete(u)}
                                    disabled={u.id === user?.id}
                                    title={u.id === user?.id ? "You can't delete your own account" : 'Delete user'}
                                    className="p-2 rounded-full text-outline-variant hover:text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        ))}
                        {users.length === 0 && (
                            <p className="text-outline-variant text-sm py-4 font-body">No users found.</p>
                        )}
                    </div>
                )}
            </div>

            {showCreate && (
                <CreateUserModal
                    onClose={() => setShowCreate(false)}
                    onCreated={() => { setShowCreate(false); load(); }}
                />
            )}
        </div>
    );
};

const CreateUserModal: React.FC<{ onClose: () => void; onCreated: () => void }> = ({ onClose, onCreated }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [isAdmin, setIsAdmin] = useState(false);
    const [creating, setCreating] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
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

    return createPortal(
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
            <div className="bg-surface/90 backdrop-blur-glass border border-outline rounded-2xl w-full max-w-md shadow-[0_8px_30px_rgba(0,0,0,0.6)]">
                <div className="p-5 border-b border-outline flex items-center justify-between bg-white/5">
                    <h2 className="text-lg font-bold text-primary font-heading flex items-center gap-2">
                        <UserPlus size={18} className="text-primary" />
                        Create User
                    </h2>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                        <X size={18} className="text-outline-variant hover:text-primary" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <Input
                        label="Username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="Enter username"
                        autoFocus
                        required
                    />
                    <Input
                        label="Password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter password"
                        required
                    />
                    <label className="flex items-center gap-2 text-sm text-outline-variant font-label">
                        <input type="checkbox" checked={isAdmin} onChange={(e) => setIsAdmin(e.target.checked)} />
                        Administrator
                    </label>

                    {error && <p className="text-error text-sm font-body">{error}</p>}

                    <div className="flex justify-end gap-3 pt-2">
                        <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
                        <Button type="submit" disabled={!username || !password || creating}>
                            {creating ? 'Creating...' : 'Create User'}
                        </Button>
                    </div>
                </form>
            </div>
        </div>,
        document.body
    );
};
