"use client";
import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import api from '@/lib/api';
import { Mail, Lock, ArrowRight, ArrowLeft, ShieldCheck } from 'lucide-react';
import Logo from '@/components/Logo';

type LoginStep = 'credentials' | 'otp';

export default function LoginPage() {
    const [step, setStep] = useState<LoginStep>('credentials');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [otp, setOtp] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();

    const completeLoginIfReady = (data: any) => {
        if (data?.token) {
            login(data.token, data);
            return true;
        }
        return false;
    };

    const requestOtp = async () => {
        const { data } = await api.post('/auth/login/request-otp', { email, password });
        if (!completeLoginIfReady(data)) {
            setStep('otp');
        }
        return data;
    };

    const handleCredentialSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            await requestOtp();
        } catch (err: any) {
            setError(err.response?.data?.message || 'Invalid email or password');
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const { data } = await api.post('/auth/login/verify-otp', { email, otp });
            login(data.token, data);
        } catch (err: any) {
            setError(err.response?.data?.message || 'OTP verification failed');
        } finally {
            setLoading(false);
        }
    };

    const handleResendOtp = async () => {
        setError('');
        setLoading(true);

        try {
            await requestOtp();
        } catch (err: any) {
            setError(err.response?.data?.message || 'Unable to resend OTP right now');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen px-4">
            <div className="w-full max-w-md">
                <div className="text-center mb-8">
                    <Link href="/" className="inline-flex items-center gap-2.5 mb-2">
                        <Logo size={36} />
                        <span className="text-xl font-bold text-slate-800">Syntax<span className="text-indigo-500">Error</span></span>
                    </Link>
                </div>

                <div className="glass-card rounded-2xl p-8 sm:p-10">
                    <div className="text-center mb-8">
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center mx-auto mb-5 shadow-lg shadow-indigo-500/20">
                            {step === 'credentials' ? <Lock size={24} className="text-white" /> : <ShieldCheck size={24} className="text-white" />}
                        </div>
                        <h2 className="text-2xl font-bold text-slate-800">{step === 'credentials' ? 'Welcome Back' : 'Verify Login OTP'}</h2>
                        <p className="text-slate-500 text-sm mt-2">
                            {step === 'credentials'
                                ? 'Sign in with your password, then verify with OTP'
                                : `Enter the 6-digit code sent to ${email}`}
                        </p>
                    </div>

                    <div className="flex items-center gap-2 mb-6">
                        <div className="flex-1 h-1 rounded-full bg-indigo-500" />
                        <div className={`flex-1 h-1 rounded-full transition-all ${step === 'otp' ? 'bg-indigo-500' : 'bg-slate-200'}`} />
                    </div>

                    {error && (
                        <div className="mb-6 p-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-500" />{error}
                        </div>
                    )}

                    {step === 'credentials' ? (
                        <form onSubmit={handleCredentialSubmit} className="space-y-5">
                            <div>
                                <label className="block text-sm font-medium text-slate-600 mb-2">Email Address</label>
                                <div className="relative">
                                    <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                    <input
                                        type="email"
                                        required
                                        placeholder="you@example.com"
                                        className="glass-input w-full pl-10 pr-4 py-3 rounded-xl text-sm"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                    />
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
                                    <input
                                        type="password"
                                        required
                                        placeholder="Password"
                                        className="glass-input w-full pl-10 pr-4 py-3 rounded-xl text-sm"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                    />
                                </div>
                            </div>
                            <button type="submit" disabled={loading} className="btn-primary w-full py-3 text-sm flex items-center justify-center gap-2 group">
                                {loading ? (
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <>Send OTP <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" /></>
                                )}
                            </button>
                        </form>
                    ) : (
                        <form onSubmit={handleVerifyOtp} className="space-y-5">
                            <div>
                                <label className="block text-sm font-medium text-slate-600 mb-2">Verification Code</label>
                                <input
                                    type="text"
                                    maxLength={6}
                                    required
                                    placeholder="000000"
                                    className="glass-input w-full py-4 rounded-xl text-center text-2xl font-bold tracking-[0.5em]"
                                    value={otp}
                                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                />
                                <p className="text-xs text-slate-500 mt-2 text-center">
                                    Didn&apos;t receive it?{' '}
                                    <button type="button" onClick={handleResendOtp} className="text-indigo-500 hover:text-indigo-600 font-medium transition">
                                        Resend OTP
                                    </button>
                                </p>
                            </div>
                            <div className="flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setStep('credentials');
                                        setOtp('');
                                        setError('');
                                    }}
                                    className="btn-secondary flex-1 py-3 text-sm flex items-center justify-center gap-2"
                                >
                                    <ArrowLeft size={16} />Back
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading || otp.length < 6}
                                    className="btn-primary flex-[2] py-3 text-sm flex items-center justify-center gap-2 group"
                                >
                                    {loading ? (
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    ) : (
                                        <>Verify & Sign In <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" /></>
                                    )}
                                </button>
                            </div>
                        </form>
                    )}

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
