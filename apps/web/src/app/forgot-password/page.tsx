"use client";
import { useState } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import Logo from '@/components/Logo';
import { Mail, Lock, ArrowRight, ArrowLeft, CheckCircle, ShieldCheck } from 'lucide-react';

export default function ForgotPasswordPage() {
    const [step, setStep] = useState<'email' | 'otp' | 'done'>('email');
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#^()_\-+=])[A-Za-z\d@$!%*?&#^()_\-+=]{8,}$/;

    const passwordChecks = [
        { label: '8+ chars', test: (p: string) => p.length >= 8 },
        { label: 'Uppercase', test: (p: string) => /[A-Z]/.test(p) },
        { label: 'Lowercase', test: (p: string) => /[a-z]/.test(p) },
        { label: 'Number', test: (p: string) => /\d/.test(p) },
        { label: 'Special char', test: (p: string) => /[@$!%*?&#^()_\-+=]/.test(p) },
    ];

    const handleSendOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(''); setLoading(true);
        try {
            await api.post('/auth/forgot-password', { email });
            setStep('otp');
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to send reset OTP');
        } finally { setLoading(false); }
    };

    const handleReset = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (!PASSWORD_REGEX.test(newPassword)) {
            setError('Password does not meet strength requirements');
            return;
        }
        setLoading(true);
        try {
            await api.post('/auth/reset-password', { email, otp, newPassword });
            setStep('done');
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to reset password');
        } finally { setLoading(false); }
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
                    {step === 'done' ? (
                        <div className="text-center py-4">
                            <CheckCircle size={48} className="text-emerald-500 mx-auto mb-4" />
                            <h2 className="text-xl font-bold text-slate-800 mb-2">Password Reset!</h2>
                            <p className="text-slate-500 text-sm mb-6">Your password has been changed successfully.</p>
                            <Link href="/login" className="btn-primary px-6 py-2.5 text-sm inline-flex items-center gap-2">
                                Sign In Now <ArrowRight size={14} />
                            </Link>
                        </div>
                    ) : step === 'otp' ? (
                        <>
                            <div className="text-center mb-6">
                                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center mx-auto mb-5 shadow-lg shadow-indigo-500/20">
                                    <ShieldCheck size={24} className="text-white" />
                                </div>
                                <h2 className="text-2xl font-bold text-slate-800">Reset Password</h2>
                                <p className="text-slate-500 text-sm mt-2">Enter the OTP sent to <strong className="text-slate-700">{email}</strong></p>
                            </div>

                            {error && (
                                <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-red-500" />{error}
                                </div>
                            )}

                            <form onSubmit={handleReset} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-600 mb-2">OTP Code</label>
                                    <input type="text" maxLength={6} required placeholder="000000"
                                        className="glass-input w-full py-4 rounded-xl text-center text-2xl font-bold tracking-[0.5em]"
                                        value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-600 mb-2">New Password</label>
                                    <div className="relative">
                                        <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                        <input type="password" required placeholder="••••••••"
                                            className="glass-input w-full pl-10 pr-4 py-3 rounded-xl text-sm"
                                            value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
                                    </div>
                                </div>
                                {newPassword.length > 0 && (
                                    <div className="flex flex-wrap gap-2">
                                        {passwordChecks.map((c, i) => (
                                            <span key={i} className={`text-[10px] px-2 py-0.5 rounded-full border ${c.test(newPassword) ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-slate-50 text-slate-400 border-slate-200'}`}>{c.label}</span>
                                        ))}
                                    </div>
                                )}
                                <div className="flex gap-3">
                                    <button type="button" onClick={() => { setStep('email'); setError(''); }} className="btn-secondary flex-1 py-3 text-sm flex items-center justify-center gap-2">
                                        <ArrowLeft size={16} />Back
                                    </button>
                                    <button type="submit" disabled={loading || otp.length < 6}
                                        className="btn-primary flex-[2] py-3 text-sm flex items-center justify-center gap-2 group">
                                        {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <>Reset Password <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" /></>}
                                    </button>
                                </div>
                            </form>
                        </>
                    ) : (
                        <>
                            <div className="text-center mb-8">
                                <h2 className="text-2xl font-bold text-slate-800">Forgot Password?</h2>
                                <p className="text-slate-500 text-sm mt-2">Enter your email and we&apos;ll send you a reset OTP</p>
                            </div>

                            {error && (
                                <div className="mb-6 p-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-red-500" />{error}
                                </div>
                            )}

                            <form onSubmit={handleSendOtp} className="space-y-5">
                                <div>
                                    <label className="block text-sm font-medium text-slate-600 mb-2">Email Address</label>
                                    <div className="relative">
                                        <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                        <input type="email" required placeholder="you@example.com"
                                            className="glass-input w-full pl-10 pr-4 py-3 rounded-xl text-sm"
                                            value={email} onChange={(e) => setEmail(e.target.value)} />
                                    </div>
                                </div>
                                <button type="submit" disabled={loading}
                                    className="btn-primary w-full py-3 text-sm flex items-center justify-center gap-2 group">
                                    {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <>Send Reset OTP <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" /></>}
                                </button>
                            </form>

                            <p className="mt-8 text-center text-sm text-slate-500">
                                Remember your password?{' '}
                                <Link href="/login" className="text-indigo-500 hover:text-indigo-600 font-medium transition">Sign in</Link>
                            </p>
                        </>
                    )}
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
