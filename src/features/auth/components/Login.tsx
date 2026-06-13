import React, { useState, useEffect } from 'react';
import { useAuth } from '../AuthContext';
import { Cpu, Server, Eye, EyeOff } from 'lucide-react';
import { usePlatform } from '@/shared/hooks/usePlatform';
import { ApiError } from '@/shared/api';
import { authService } from '@/services';
import { Logo } from '@/shared/ui/Logo';

export const Login: React.FC = () => {
    const { login } = useAuth();
    const { isTauri } = usePlatform();
    // First run: no users exist yet, so this screen creates the initial admin.
    const [needsSetup, setNeedsSetup] = useState(false);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [serverUrl, setServerUrl] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isTauri) {
            const saved = localStorage.getItem('server_url');
            if (saved) setServerUrl(saved);
        }
    }, [isTauri]);

    // Ask the server whether it still needs its first (admin) user.
    useEffect(() => {
        authService.setupStatus()
            .then((s) => setNeedsSetup(s.needs_setup))
            .catch(() => setNeedsSetup(false));
    }, [serverUrl]);

    const handleServerUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setServerUrl(val);
        localStorage.setItem('server_url', val);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            // Setup creates the first admin; both setup and login return the user + token.
            const user = needsSetup
                ? await authService.setup(username, password)
                : await authService.login(username, password);
            if (user.token) {
                localStorage.setItem('auth_token', user.token);
            }
            login(user as any);
        } catch (err) {
            if (err instanceof ApiError) {
                setError(err.message || 'Authentication failed');
            } else {
                setError('Connection error');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-background relative overflow-hidden font-body">
            {/* Background Effects - Soft light orbs in an obsidian void */}
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-white/5 rounded-full blur-[120px] mix-blend-screen pointer-events-none" />
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-white/5 rounded-full blur-[120px] mix-blend-screen pointer-events-none" />

            <div className="relative z-10 w-full max-w-md p-8 bg-surface backdrop-blur-glass rounded-3xl border border-t-[rgba(255,255,255,0.3)] border-l-[rgba(255,255,255,0.3)] border-b-[rgba(255,255,255,0.05)] border-r-[rgba(255,255,255,0.05)] shadow-[0_0_40px_rgba(255,255,255,0.05)] animate-fade-in">
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white/5 backdrop-blur-surface border border-t-white/30 border-l-white/30 border-b-white/5 border-r-white/5 mb-4 shadow-lg shadow-white/5">
                        <Logo size={40} className="text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]" />
                    </div>
                    <h1 className="text-3xl font-bold font-heading text-primary mb-2">Vortex</h1>
                    <div className="flex items-center justify-center gap-2 text-outline-variant text-xs font-semibold tracking-wider uppercase font-label">
                        <Cpu size={14} />
                        <span>{needsSetup ? 'First-Run Setup' : 'Secure Streaming'}</span>
                    </div>
                </div>

                {isTauri && (
                    <div className="mb-6 animate-fade-in">
                        <label className="block text-sm font-medium text-gray-400 mb-2 font-label">Server URL</label>
                        <div className="relative">
                            <input
                                type="url"
                                value={serverUrl}
                                onChange={handleServerUrlChange}
                                className="w-full bg-black/50 border border-outline rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-white/30 transition-all font-label text-sm"
                                placeholder="http://192.168.1.50:3000"
                            />
                            <Server size={18} className="absolute right-4 top-3.5 text-gray-500" />
                        </div>
                        <p className="text-xs text-gray-500 mt-2 font-label">Enter the address of your Vortex Server.</p>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2 font-label">Username</label>
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="w-full bg-black/50 border border-outline rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-white/30 transition-all font-label"
                            placeholder="Enter username"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2 font-label">Password</label>
                        <div className="relative">
                            <input
                                type={showPassword ? 'text' : 'password'}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full bg-black/50 border border-outline rounded-xl pl-4 pr-12 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-white/30 transition-all font-label"
                                placeholder="••••••••"
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-4 top-3.5 text-gray-500 hover:text-white transition-colors focus:outline-none cursor-pointer"
                                aria-label={showPassword ? 'Hide password' : 'Show password'}
                            >
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                    </div>

                    {error && (
                        <div className={`p-3 rounded-lg text-sm text-center font-label ${error.includes('successful') ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-primary hover:bg-gray-200 text-on-primary font-bold py-3.5 rounded-xl shadow-[0_0_20px_rgba(255,255,255,0.2)] transform transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed font-heading text-lg"
                    >
                        {loading ? 'Processing...' : (needsSetup ? 'Create Admin Account' : 'Sign In')}
                    </button>
                </form>

                {needsSetup && (
                    <p className="mt-6 text-center text-xs text-outline-variant font-label">
                        No users exist yet — this creates the administrator account.
                        New users are added later from Settings.
                    </p>
                )}
            </div>
        </div>
    );
};
