"use client";
import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import api from '@/lib/api';
import { Mail, Lock, ArrowRight, ArrowLeft } from 'lucide-react';
import Logo from '@/components/Logo';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const { data } = await api.post('/auth/login', { email, password });
            login(data.token, data);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Invalid email or password');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen px-4">
            <div className="w-full max-w-md">
                {/* Brand */}
                <div className="text-center mb-8">
                    <Link href="/" className="inline-flex items-center gap-2.5 mb-2">
                        <Logo size={36} />
                        <span className="text-xl font-bold text-slate-800">Syntax<span className="text-indigo-500">Error</span></span>
                    </Link>
                </div>

                {/* Card */}
                <div className="glass-card rounded-2xl p-8 sm:p-10">
                    {/* Header */}
                    <div className="text-center mb-8">
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center mx-auto mb-5 shadow-lg shadow-indigo-500/20">
                            <Lock size={24} className="text-white" />
                        </div>
                        <h2 className="text-2xl font-bold text-slate-800">Welcome Back</h2>
                        <p className="text-slate-500 text-sm mt-2">Sign in to access your dashboard</p>
                    </div>

                    {error && (
                        <div className="mb-6 p-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-500" />{error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label className="block text-sm font-medium text-slate-600 mb-2">Email Address</label>
                            <div className="relative">
                                <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input type="email" required placeholder="you@example.com"
                                    className="glass-input w-full pl-10 pr-4 py-3 rounded-xl text-sm"
                                    value={email} onChange={(e) => setEmail(e.target.value)} />
                            </div>
                        </div>
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <label className="block text-sm font-medium text-slate-600">Password</label>
                                <Link href="/forgot-password" className="text-xs text-indigo-500 hover:text-indigo-600 font-medium transition">
                                    Forgot password?
                                </Link>
                            </div>
                            <div className="relative">
                                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input type="password" required placeholder="••••••••"
                                    className="glass-input w-full pl-10 pr-4 py-3 rounded-xl text-sm"
                                    value={password} onChange={(e) => setPassword(e.target.value)} />
                            </div>
                        </div>
                        <button type="submit" disabled={loading}
                            className="btn-primary w-full py-3 text-sm flex items-center justify-center gap-2 group">
                            {loading ? (
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <>Sign In <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" /></>
                            )}
                        </button>
                    </form>

                    <p className="mt-8 text-center text-sm text-slate-500">
                        Don&apos;t have an account?{' '}
                        <Link href="/signup" className="text-indigo-500 hover:text-indigo-600 font-medium transition">Create one</Link>
                    </p>
                </div>

                <p className="text-center mt-6">
                    <Link href="/" className="text-sm text-slate-400 hover:text-slate-600 inline-flex items-center gap-1 transition">
                        <ArrowLeft size={14} /> Back to home
                    </Link>
                </p>
            </div>
        </div>
    );
}
