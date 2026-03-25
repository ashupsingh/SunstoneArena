"use client";
import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import api from '@/lib/api';
import { Mail, Lock, User, Hash, Building, BookOpen, GraduationCap, ArrowRight, ShieldCheck, ArrowLeft, Briefcase, Award } from 'lucide-react';
import Logo from '@/components/Logo';

// InputField defined OUTSIDE the component to prevent re-creation on each render
const InputField = ({ icon: Icon, label, onChange, ...props }: any) => (
    <div>
        <label className="block text-sm font-medium text-slate-600 mb-1.5">{label}</label>
        <div className="relative">
            <Icon size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input {...props} className="glass-input w-full pl-10 pr-4 py-2.5 rounded-xl text-sm" onChange={onChange} />
        </div>
    </div>
);

export default function SignupPage() {
    const [step, setStep] = useState<'form' | 'otp'>('form');
    const [role, setRole] = useState<'student' | 'teacher'>('student');
    const [formData, setFormData] = useState({
        name: '', email: '', password: '',
        rollNumber: '', departmentName: '',
        branchName: '', courseName: '',
        employeeId: '', designation: '', specialization: ''
    });
    const [otp, setOtp] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#^()_\-+=])[A-Za-z\d@$!%*?&#^()_\-+=]{8,}$/;

    const passwordChecks = [
        { label: '8+ chars', test: (p: string) => p.length >= 8 },
        { label: 'Uppercase', test: (p: string) => /[A-Z]/.test(p) },
        { label: 'Lowercase', test: (p: string) => /[a-z]/.test(p) },
        { label: 'Number', test: (p: string) => /\d/.test(p) },
        { label: 'Special char', test: (p: string) => /[@$!%*?&#^()_\-+=]/.test(p) },
    ];

    const isPasswordStrong = PASSWORD_REGEX.test(formData.password);

    const handleSendOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (!isPasswordStrong) { setError('Password does not meet strength requirements'); return; }
        setLoading(true);
        try {
            await api.post('/auth/send-otp', { ...formData, role });
            setStep('otp');
        } catch (err: any) {
            const msg = err.response?.data?.message || err.message || 'Failed to send OTP';
            setError(typeof msg === 'string' ? msg : 'An unexpected error occurred');
        } finally { setLoading(false); }
    };

    const handleVerifyOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const { data } = await api.post('/auth/signup', { email: formData.email, otp });
            login(data.token, data);
        } catch (err: any) {
            const msg = err.response?.data?.message || err.message || 'OTP verification failed';
            setError(typeof msg === 'string' ? msg : 'An unexpected error occurred');
        } finally { setLoading(false); }
    };

    return (
        <div className="flex items-center justify-center min-h-screen py-6 px-4">
            <div className="w-full max-w-lg">
                <div className="glass-card rounded-2xl p-7 sm:p-9">
                    {/* Brand inside card */}
                    <div className="flex items-center justify-center gap-2.5 mb-6">
                        <Logo size={32} />
                        <span className="text-lg font-bold text-slate-800">Syntax<span className="text-indigo-500">Error</span></span>
                    </div>

                    {/* Header */}
                    <div className="text-center mb-5">
                        <h2 className="text-xl font-bold text-slate-800">
                            {step === 'form' ? 'Create Account' : 'Verify Email'}
                        </h2>
                        <p className="text-slate-500 text-xs mt-1">
                            {step === 'form' ? 'Join ADTU Smart Campus Management System' : `Enter the 6-digit OTP sent to ${formData.email}`}
                        </p>
                    </div>

                    {/* Role Toggle — no emojis */}
                    {step === 'form' && (
                        <div className="flex gap-2 mb-5">
                            {(['student', 'teacher'] as const).map(r => (
                                <button key={r} type="button" onClick={() => setRole(r)}
                                    className={`flex-1 py-2 rounded-xl text-sm font-semibold capitalize transition-all ${role === r
                                        ? 'bg-indigo-50 text-indigo-600 border border-indigo-300'
                                        : 'text-slate-400 border border-slate-200 hover:bg-slate-50'}`}>
                                    {r}
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Step Indicator */}
                    <div className="flex items-center gap-2 mb-5">
                        <div className="flex-1 h-1 rounded-full bg-indigo-500" />
                        <div className={`flex-1 h-1 rounded-full transition-all ${step === 'otp' ? 'bg-indigo-500' : 'bg-slate-200'}`} />
                    </div>

                    {error && (
                        <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-500 flex-shrink-0" />{error}
                        </div>
                    )}

                    {step === 'form' ? (
                        <form onSubmit={handleSendOtp} className="space-y-3.5">
                            <InputField icon={User} label="Full Name" name="name" type="text" required value={formData.name} placeholder="Your full name" onChange={handleChange} />
                            <div className="grid grid-cols-2 gap-3">
                                <InputField icon={Mail} label="Email" name="email" type="email" required value={formData.email} placeholder="you@email.com" onChange={handleChange} />
                                <InputField icon={Lock} label="Password" name="password" type="password" required value={formData.password} placeholder="••••••••" onChange={handleChange} />
                            </div>
                            {formData.password.length > 0 && (
                                <div className="flex flex-wrap gap-1.5 -mt-1">
                                    {passwordChecks.map((check, i) => (
                                        <span key={i} className={`text-[10px] px-2 py-0.5 rounded-full border ${check.test(formData.password) ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-slate-50 text-slate-400 border-slate-200'}`}>
                                            {check.label}
                                        </span>
                                    ))}
                                </div>
                            )}
                            <InputField icon={Building} label="Department" name="departmentName" type="text" required value={formData.departmentName} placeholder="e.g. Computer Science & Engineering" onChange={handleChange} />

                            {role === 'student' ? (
                                <div className="grid grid-cols-3 gap-3">
                                    <InputField icon={Hash} label="Roll No." name="rollNumber" type="text" required value={formData.rollNumber} placeholder="21CSE001" onChange={handleChange} />
                                    <InputField icon={BookOpen} label="Branch" name="branchName" type="text" required value={formData.branchName} placeholder="CSE" onChange={handleChange} />
                                    <InputField icon={GraduationCap} label="Course" name="courseName" type="text" required value={formData.courseName} placeholder="B.Tech" onChange={handleChange} />
                                </div>
                            ) : (
                                <div className="grid grid-cols-3 gap-3">
                                    <InputField icon={Hash} label="Employee ID" name="employeeId" type="text" required value={formData.employeeId} placeholder="ADT-001" onChange={handleChange} />
                                    <InputField icon={Briefcase} label="Designation" name="designation" type="text" required value={formData.designation} placeholder="Professor" onChange={handleChange} />
                                    <InputField icon={Award} label="Specialization" name="specialization" type="text" required value={formData.specialization} placeholder="AI/ML" onChange={handleChange} />
                                </div>
                            )}

                            <button type="submit" disabled={loading} className="btn-primary w-full py-2.5 mt-1 text-sm flex items-center justify-center gap-2 group">
                                {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <>Send OTP <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" /></>}
                            </button>
                        </form>
                    ) : (
                        <form onSubmit={handleVerifyOtp} className="space-y-5">
                            <div>
                                <label className="block text-sm font-medium text-slate-600 mb-2">Verification Code</label>
                                <input type="text" maxLength={6} required placeholder="000000"
                                    className="glass-input w-full py-4 rounded-xl text-center text-2xl font-bold tracking-[0.5em]"
                                    value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))} />
                                <p className="text-xs text-slate-500 mt-2 text-center">
                                    Didn&apos;t receive?{' '}
                                    <button type="button" onClick={handleSendOtp as any} className="text-indigo-500 hover:text-indigo-600 font-medium">Resend</button>
                                </p>
                            </div>
                            <div className="flex gap-3">
                                <button type="button" onClick={() => { setStep('form'); setError(''); }} className="btn-secondary flex-1 py-2.5 text-sm flex items-center justify-center gap-2">
                                    <ArrowLeft size={16} />Back
                                </button>
                                <button type="submit" disabled={loading || otp.length < 6} className="btn-primary flex-[2] py-2.5 text-sm flex items-center justify-center gap-2 group">
                                    {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <>Verify & Create<ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" /></>}
                                </button>
                            </div>
                        </form>
                    )}

                    <div className="mt-6 pt-5 border-t border-slate-100 text-center">
                        <p className="text-sm text-slate-500">
                            Already have an account?{' '}
                            <Link href="/login" className="text-indigo-500 hover:text-indigo-600 font-medium transition">Sign in</Link>
                        </p>
                    </div>
                </div>

                <p className="text-center mt-4">
                    <Link href="/" className="text-sm text-slate-400 hover:text-slate-600 inline-flex items-center gap-1 transition">
                        <ArrowLeft size={14} /> Back to home
                    </Link>
                </p>
            </div>
        </div>
    );
}
