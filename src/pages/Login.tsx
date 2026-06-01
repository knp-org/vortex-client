import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Lock, Cpu, Server } from 'lucide-react';
import { usePlatform } from '../hooks/usePlatform';
import { api, ApiError } from '../services';
import { Logo } from '../components/common/Logo';

export const Login: React.FC = () => {
    const { login } = useAuth();
    const { isTauri } = usePlatform();
    const [isRegistering, setIsRegistering] = useState(false);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [serverUrl, setServerUrl] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isTauri) {
            const saved = localStorage.getItem('server_url');
            if (saved) setServerUrl(saved);
        }
    }, [isTauri]);

    const handleServerUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setServerUrl(val);
        localStorage.setItem('server_url', val);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        const endpoint = isRegistering ? '/auth/register' : '/auth/login';

        try {
            if (isRegistering) {
                await api.post(endpoint, { username, password });
                setIsRegistering(false);
                setError('Registration successful! Please login.');
                setPassword('');
            } else {
                const user = await api.post<{ token?: string }>(endpoint, { username, password });
                if (user.token) {
                    localStorage.setItem('auth_token', user.token);
                }
                login(user as any);
            }
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
        <div className="min-h-screen flex items-center justify-center bg-gray-900 relative overflow-hidden font-['Outfit']">
            {/* Background Effects */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-cyan-900/20 via-gray-900 to-gray-900" />
            <div className="absolute top-0 left-0 w-full h-full bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20" />

            <div className="relative z-10 w-full max-w-md p-8 bg-black/40 backdrop-blur-xl rounded-3xl border border-white/10 shadow-2xl animate-fade-in">
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-black/40 backdrop-blur-md border border-white/10 mb-4 shadow-lg shadow-cyan-500/10">
                        <Logo size={40} />
                    </div>
                    <h1 className="text-3xl font-bold text-white mb-2">Vortex Secure</h1>
                    <div className="flex items-center justify-center gap-2 text-cyan-400 text-xs font-semibold tracking-wider uppercase">
                        <Cpu size={14} />
                        <span>Quantum Safe Encryption</span>
                    </div>
                </div>

                {isTauri && (
                    <div className="mb-6 animate-fade-in">
                        <label className="block text-sm font-medium text-gray-400 mb-2">Server URL</label>
                        <div className="relative">
                            <input
                                type="url"
                                value={serverUrl}
                                onChange={handleServerUrlChange}
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all font-mono text-sm"
                                placeholder="http://192.168.1.50:3000"
                            />
                            <Server size={18} className="absolute right-4 top-3.5 text-gray-500" />
                        </div>
                        <p className="text-xs text-gray-500 mt-2">Enter the address of your Vortex Server.</p>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2">Username</label>
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all"
                            placeholder="Enter username"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2">Password</label>
                        <div className="relative">
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all"
                                placeholder="••••••••"
                                required
                            />
                            <Lock size={18} className="absolute right-4 top-3.5 text-gray-500" />
                        </div>
                    </div>

                    {error && (
                        <div className={`p-3 rounded-lg text-sm text-center ${error.includes('successful') ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-cyan-500/20 transform transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? 'Processing...' : (isRegistering ? 'Create Account' : 'Sign In')}
                    </button>
                </form>

                <div className="mt-6 text-center">
                    <button
                        onClick={() => { setIsRegistering(!isRegistering); setError(''); }}
                        className="text-sm text-gray-400 hover:text-white transition-colors"
                    >
                        {isRegistering ? 'Already have an account? Sign In' : "Don't have an account? Register"}
                    </button>
                </div>
            </div>
        </div>
    );
};
