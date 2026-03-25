"use client";
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { LogOut, LayoutDashboard, Settings, Menu, X, Bell, GraduationCap, BookOpen, ShieldCheck } from 'lucide-react';
import { useState, useEffect } from 'react';
import Logo from './Logo';
import api from '@/lib/api';

export default function Navbar() {
    const { user, logout } = useAuth();
    const [mobileOpen, setMobileOpen] = useState(false);
    const [unread, setUnread] = useState(0);

    useEffect(() => {
        if (user) {
            api.get('/notifications/unread-count')
                .then(({ data }) => setUnread(data.count))
                .catch(() => { });
            const interval = setInterval(() => {
                api.get('/notifications/unread-count')
                    .then(({ data }) => setUnread(data.count))
                    .catch(() => { });
            }, 30000);
            return () => clearInterval(interval);
        }
    }, [user]);

    const dashboardLink = user?.role === 'superadmin' ? '/superadmin' : '/dashboard';
    const dashboardLabel = user?.role === 'superadmin' ? 'Admin' : user?.role === 'teacher' ? 'My Panel' : 'Dashboard';
    const DashIcon = user?.role === 'superadmin' ? ShieldCheck : user?.role === 'teacher' ? BookOpen : LayoutDashboard;

    return (
        <nav className="sticky top-0 z-50 backdrop-blur-xl bg-white/70 border-b border-slate-200/80">
            <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16">
                    {/* Logo */}
                    <div className="flex items-center">
                        <Link href="/" className="flex items-center gap-2.5">
                            <Logo size={32} />
                            <span className="text-lg font-bold text-slate-800 tracking-tight">
                                Syntax<span className="text-indigo-500">Error</span>
                            </span>
                        </Link>
                    </div>

                    {/* Desktop Nav */}
                    <div className="hidden sm:flex items-center gap-2">
                        {user ? (
                            <>
                                <Link href={dashboardLink} className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-all">
                                    <DashIcon size={16} />
                                    {dashboardLabel}
                                </Link>
                                {user.role === 'superadmin' && (
                                    <Link href="/admin" className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-all">
                                        <Settings size={16} /> Crowd
                                    </Link>
                                )}
                                <Link href={dashboardLink} className="relative p-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-all">
                                    <Bell size={16} />
                                    {unread > 0 && (
                                        <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-red-500 text-[10px] font-bold text-white flex items-center justify-center">
                                            {unread > 9 ? '9+' : unread}
                                        </span>
                                    )}
                                </Link>
                                <div className="w-px h-6 bg-slate-200 mx-1" />
                                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-sm text-slate-600">
                                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center">
                                        <span className="text-white text-xs font-semibold">{user.name?.charAt(0).toUpperCase()}</span>
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-slate-700 text-xs max-w-[100px] truncate">{user.name}</span>
                                        <span className="text-[10px] text-slate-400 capitalize">{user.role}</span>
                                    </div>
                                </div>
                                <button onClick={logout} className="p-2 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all" title="Logout">
                                    <LogOut size={16} />
                                </button>
                            </>
                        ) : (
                            <>
                                <Link href="/login" className="px-4 py-2 rounded-lg text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-all">Login</Link>
                                <Link href="/signup" className="btn-primary px-5 py-2 text-sm">Sign Up</Link>
                            </>
                        )}
                    </div>

                    {/* Mobile */}
                    <div className="sm:hidden flex items-center gap-2">
                        {user && unread > 0 && (
                            <Link href={dashboardLink} className="relative p-2 text-slate-500">
                                <Bell size={18} />
                                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-red-500 text-[10px] font-bold text-white flex items-center justify-center">{unread > 9 ? '9+' : unread}</span>
                            </Link>
                        )}
                        <button onClick={() => setMobileOpen(!mobileOpen)} className="p-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100">
                            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Menu */}
            {mobileOpen && (
                <div className="sm:hidden border-t border-slate-200 bg-white/95 backdrop-blur-xl p-4 space-y-2">
                    {user ? (
                        <>
                            <div className="flex items-center gap-3 px-3 py-3 rounded-lg bg-slate-50">
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center">
                                    <span className="text-white text-sm font-semibold">{user.name?.charAt(0).toUpperCase()}</span>
                                </div>
                                <div>
                                    <span className="text-slate-700 text-sm font-medium block">{user.name}</span>
                                    <span className="text-xs text-slate-400 capitalize">{user.role}</span>
                                </div>
                            </div>
                            <Link href={dashboardLink} onClick={() => setMobileOpen(false)} className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm text-slate-600 hover:text-slate-900 hover:bg-slate-100">
                                <DashIcon size={16} /> {dashboardLabel}
                            </Link>
                            {user.role === 'superadmin' && (
                                <Link href="/admin" onClick={() => setMobileOpen(false)} className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm text-slate-600 hover:text-slate-900 hover:bg-slate-100">
                                    <Settings size={16} /> Crowd Manager
                                </Link>
                            )}
                            <button onClick={() => { logout(); setMobileOpen(false); }} className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm text-red-500 hover:bg-red-50">
                                <LogOut size={16} /> Logout
                            </button>
                        </>
                    ) : (
                        <>
                            <Link href="/login" onClick={() => setMobileOpen(false)} className="block px-3 py-2.5 rounded-lg text-sm text-slate-600 hover:text-slate-900 hover:bg-slate-100">Login</Link>
                            <Link href="/signup" onClick={() => setMobileOpen(false)} className="block btn-primary px-3 py-2.5 text-sm text-center">Sign Up</Link>
                        </>
                    )}
                </div>
            )}
        </nav>
    );
}
