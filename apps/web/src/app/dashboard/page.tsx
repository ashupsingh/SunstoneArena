"use client";
import { useState, useEffect } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import api, { getRealtimeStreamUrl } from '@/lib/api';
import {
    LayoutDashboard, CalendarRange, Bell, Bus, Building, Coffee, CheckCircle,
    AlertTriangle, XCircle, Clock, MapPin, Search, LogOut, ChevronRight, Menu, X, Sparkles, ExternalLink, Megaphone, Heart, ThumbsUp
} from 'lucide-react';
import FoodCourtCard from '@/components/FoodCourtCard';
import Logo from '@/components/Logo';

type Tab = 'overview' | 'schedule' | 'events' | 'notices' | 'campus' | 'transport' | 'directory';

export default function StudentDashboard() {
    const { user, logout } = useAuth();
    const [notifications, setNotifications] = useState<any[]>([]);
    const [schedules, setSchedules] = useState<any[]>([]);
    const [crowdData, setCrowdData] = useState<any[]>([]);
    const [busRoutes, setBusRoutes] = useState<any[]>([]);
    const [departments, setDepartments] = useState<any[]>([]);
    const [events, setEvents] = useState<any[]>([]);
    const [campusMeta, setCampusMeta] = useState<any | null>(null);
    const [loading, setLoading] = useState(true);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [tab, setTab] = useState<Tab>('overview');
    const [selectedBlock, setSelectedBlock] = useState<string | null>(null);
    const [selectedCrowdLevel, setSelectedCrowdLevel] = useState<'ALL' | 'LOW' | 'MEDIUM' | 'HIGH' | 'OVERCROWDED'>('ALL');
    const [posterPreview, setPosterPreview] = useState<string | null>(null);
    const [noticeAttachmentPreview, setNoticeAttachmentPreview] = useState<string | null>(null);
    const [lastUpdatedAt, setLastUpdatedAt] = useState<Date | null>(null);
    const [showNotificationPopup, setShowNotificationPopup] = useState(false);

    useEffect(() => {
        fetchAll();
    }, []);

    useEffect(() => {
        if (typeof window === 'undefined') return;
        const token = window.localStorage.getItem('token');
        if (!token) return;

        const streamUrl = getRealtimeStreamUrl(token);
        const es = new EventSource(streamUrl);

        const onSync = () => {
            fetchAll(true);
        };

        es.addEventListener('sync', onSync as EventListener);

        return () => {
            es.removeEventListener('sync', onSync as EventListener);
            es.close();
        };
    }, []);

    useEffect(() => {
        const onEsc = (event: KeyboardEvent) => {
            if (event.key === 'Escape') setShowNotificationPopup(false);
        };
        if (showNotificationPopup) window.addEventListener('keydown', onEsc);
        return () => window.removeEventListener('keydown', onEsc);
    }, [showNotificationPopup]);

    const fetchAll = async (silent = false) => {
        if (!silent) setLoading(true);
        try {
            const profileRes = await api.get('/auth/profile').catch(() => ({ data: null }));
            const deptId = profileRes.data?.department?._id || profileRes.data?.department;

            const [notif, sched, eventsRes, crowd, bus, dept, meta] = await Promise.all([
                api.get('/notifications').catch(() => ({ data: [] })),
                deptId
                    ? api.get('/schedules', { params: { departmentId: deptId } }).catch(() => ({ data: [] }))
                    : api.get('/schedules/mine').catch(() => ({ data: [] })),
                api.get('/events').catch(() => ({ data: [] })),
                api.get('/crowd/status').catch(() => ({ data: [] })),
                api.get('/bus').catch(() => ({ data: [] })),
                api.get('/departments').catch(() => ({ data: [] })),
                api.get('/campus/meta').catch(() => ({ data: null })),
            ]);
            setNotifications(Array.isArray(notif.data) ? notif.data : []);
            setSchedules(sched.data);
            setEvents(Array.isArray(eventsRes.data) ? eventsRes.data : []);
            setCrowdData(crowd.data);
            setBusRoutes(bus.data);
            setDepartments(dept.data);
            setCampusMeta(meta.data);
            setLastUpdatedAt(new Date());
        } catch (e) {
            console.error(e);
        } finally {
            if (!silent) setLoading(false);
        }
    };

    const markRead = async (id: string) => {
        try {
            await api.put(`/notifications/${id}/read`);
            fetchAll();
        } catch (e) { }
    };

    const markAllRead = async () => {
        try {
            await api.put('/notifications/read-all');
            setNotifications((prev) => prev.map((n: any) => ({ ...n, isRead: true })));
        } catch (e) {
            console.error(e);
        }
    };

    const today = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][new Date().getDay()];
    const todaySchedules = schedules.filter((s: any) => s.dayOfWeek === today);
    const campusShuttle = [
        { route: 'Main Gate -> L Block Loop', pickup: 'ADTU Main Gate', drop: 'L Block', timings: 'Every 10-20 mins' },
        { route: 'Main Gate -> Ground Shuttle', pickup: 'ADTU Main Gate', drop: 'Sports Ground', timings: 'Every 10-20 mins' },
        { route: 'L Block -> Ground Connector', pickup: 'L Block', drop: 'Sports Ground', timings: 'Every 15 mins' },
    ];
    const essentialsNearAdtu = [
        { name: 'ADTU Stationery Hub', type: 'Stationery', area: 'Near Main Gate', phone: '+91 97065 11223' },
        { name: 'Panikhaiti Medical', type: 'Pharmacy', area: 'Panikhaiti Bazar', phone: '+91 97065 44581' },
        { name: 'Campus Cut Point', type: 'Barber Shop', area: 'L Block Road', phone: '+91 91010 22334' },
        { name: 'Fresh Basket Mini Mart', type: 'Grocery', area: 'Khanapara Road', phone: '+91 78965 12098' },
    ];

    const sidebarItems: { key: Tab; icon: any; label: string }[] = [
        { key: 'overview', icon: LayoutDashboard, label: 'Overview' },
        { key: 'schedule', icon: CalendarRange, label: 'My Schedule' },
        { key: 'events', icon: Sparkles, label: 'Events' },
        { key: 'notices', icon: Megaphone, label: 'Notices' },
        { key: 'campus', icon: Coffee, label: 'Campus Live' },
        { key: 'transport', icon: Bus, label: 'Transport' },
        { key: 'directory', icon: Building, label: 'Directory' },
    ];

    const toggleRegistration = async (event: any) => {
        try {
            if (event.isRegistered) {
                await api.delete(`/events/${event._id}/register`);
            } else {
                await api.post(`/events/${event._id}/register`);
            }
            await fetchAll();
        } catch (e) {
            console.error(e);
        }
    };

    const reactNotice = async (id: string, reaction: 'heart' | 'thumbsUp') => {
        try {
            await api.post(`/notifications/${id}/react`, { reaction });
            await fetchAll(true);
        } catch (e) {
            console.error(e);
        }
    };

    const departmentNotices = notifications.filter((n: any) => n.type === 'announcement');

    if (loading) {
        return (
            <ProtectedRoute>
                <div className="flex items-center justify-center min-h-screen">
                    <div className="w-8 h-8 border-2 border-indigo-300 border-t-indigo-600 rounded-full animate-spin" />
                </div>
            </ProtectedRoute>
        );
    }

    return (
        <ProtectedRoute>
            <div className="flex min-h-screen bg-[#f8fafc]">
                {/* ─── MOBILE SIDEBAR OVERLAY ─── */}
                {sidebarOpen && (
                    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
                )}

                {/* ─── SIDEBAR ─── */}
                <aside className={`fixed lg:sticky top-0 left-0 z-50 lg:z-auto h-screen w-64 bg-white border-r border-slate-200 flex flex-col transition-transform duration-300 lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                    <div className="p-5 border-b border-slate-100">
                        <div className="flex items-center justify-between">
                            <Link href="/" className="flex items-center gap-2.5">
                                <Logo size={28} />
                                <span className="text-base font-bold text-slate-800">Syntax<span className="text-indigo-500">Error</span></span>
                            </Link>
                            <button onClick={() => setSidebarOpen(false)} className="lg:hidden p-1 text-slate-400 hover:text-slate-600 rounded-md">
                                <X size={18} />
                            </button>
                        </div>
                    </div>

                    <div className="px-5 py-4">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Student Menu</p>
                    </div>

                    <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
                        {sidebarItems.map(item => (
                            <button
                                key={item.key}
                                onClick={() => { setTab(item.key); setSidebarOpen(false); }}
                                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${tab === item.key
                                    ? 'bg-indigo-50 text-indigo-600 border border-indigo-200'
                                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700 border border-transparent'
                                    }`}
                            >
                                <item.icon size={18} className={tab === item.key ? "text-indigo-600" : "text-slate-400"} />
                                {item.label}
                                {tab === item.key && <ChevronRight size={14} className="ml-auto opacity-70" />}
                            </button>
                        ))}
                    </nav>

                    <div className="p-3 border-t border-slate-100">
                        <button onClick={logout} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-500 hover:bg-red-50 hover:text-red-600 transition-all border border-transparent">
                            <LogOut size={18} className="text-slate-400 group-hover:text-red-500" /> Logout
                        </button>
                    </div>
                </aside>

                {/* ─── MAIN CONTENT ─── */}
                <main className="flex-1 min-w-0 flex flex-col h-screen overflow-y-auto overflow-x-hidden">
                    {/* Top Topbar */}
                    <div className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-slate-200 px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 -ml-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100">
                                <Menu size={20} />
                            </button>
                            <h1 className="text-lg font-bold text-slate-800 capitalize hidden sm:block">
                                {tab === 'overview' ? 'Dashboard Overview' : tab === 'campus' ? 'Campus Live' : tab === 'transport' ? 'Transport Hub' : tab === 'directory' ? 'University Directory' : tab === 'events' ? 'Campus Events' : tab === 'notices' ? 'Department Notices' : 'My Schedule'}
                            </h1>
                        </div>

                        {/* Profile Avatar Component */}
                        <div className="flex items-center gap-4">
                            <button onClick={() => fetchAll()} className="hidden sm:inline-flex text-xs font-bold uppercase tracking-wider text-slate-400 hover:text-indigo-600">
                                {lastUpdatedAt ? `Updated ${lastUpdatedAt.toLocaleTimeString()}` : 'Refresh'}
                            </button>
                            <button
                                onClick={() => {
                                    setShowNotificationPopup(true);
                                    if (notifications.some((n: any) => !n.isRead)) {
                                        markAllRead();
                                    }
                                }}
                                className="relative p-2 text-slate-400 hover:text-indigo-500 transition-colors rounded-full hover:bg-indigo-50"
                            >
                                <Bell size={20} />
                                {notifications.filter(n => !n.isRead).length > 0 && (
                                    <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500 border-2 border-white" />
                                )}
                            </button>

                            <div className="h-6 w-px bg-slate-200 hidden sm:block" />

                            <div className="flex items-center gap-3 cursor-pointer group">
                                <div className="text-right hidden sm:block">
                                    <p className="text-sm font-bold text-slate-800 group-hover:text-indigo-600 transition-colors">{user?.name}</p>
                                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wide">{user?.role}</p>
                                </div>
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-md border-2 border-white group-hover:scale-105 transition-transform">
                                    <span className="text-white text-sm font-bold">{user?.name?.charAt(0)}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Content Area */}
                    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">

                        {/* ── OVERVIEW TAB ── */}
                        {tab === 'overview' && (
                            <div className="space-y-6">
                                <div className="mb-2">
                                    <h2 className="text-2xl font-bold text-slate-800">Welcome back, {user?.name?.split(' ')[0]}! 👋</h2>
                                    <p className="text-slate-500 text-sm mt-1">{today} — Here&apos;s a quick glance at your day.</p>
                                </div>

                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    {/* Notifications Card */}
                                    <div className="glass-card rounded-2xl p-6 border border-slate-100 shadow-sm flex flex-col h-full">
                                        <div className="flex items-center justify-between mb-5">
                                            <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                                                <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center">
                                                    <Bell size={16} className="text-indigo-600" />
                                                </div>
                                                Recent Notifications
                                            </h3>
                                        </div>
                                        <div className="flex-1">
                                            {notifications.length === 0 ? (
                                                <div className="h-full flex flex-col items-center justify-center text-center py-8">
                                                    <Bell size={32} className="text-slate-200 mb-3" />
                                                    <p className="text-sm font-medium text-slate-500">You&apos;re all caught up!</p>
                                                    <p className="text-xs text-slate-400 mt-1">No new notifications to show.</p>
                                                </div>
                                            ) : (
                                                <div className="space-y-3">
                                                    {notifications.slice(0, 5).map((n: any) => (
                                                        <div key={n._id} className={`flex items-start gap-3 p-3.5 rounded-xl border transition-all ${n.isRead ? 'bg-white border-slate-100 hover:border-slate-200' : 'bg-indigo-50/50 border-indigo-100 shadow-sm'}`}>
                                                            {!n.isRead && <div className="w-2 h-2 rounded-full bg-indigo-500 mt-1.5 flex-shrink-0" />}
                                                            <div className="flex-1 min-w-0">
                                                                <p className={`text-sm font-bold ${n.isRead ? 'text-slate-700' : 'text-slate-900'}`}>{n.title}</p>
                                                                <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">{n.message}</p>
                                                            </div>
                                                            {!n.isRead && (
                                                                <button onClick={() => markRead(n._id)} className="text-[10px] font-bold text-indigo-500 hover:text-indigo-700 hover:bg-indigo-100 px-2 py-1 rounded bg-indigo-50 transition-colors uppercase tracking-wider flex-shrink-0">
                                                                    Mark Read
                                                                </button>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Today's Schedule Mini-View */}
                                    <div className="glass-card rounded-2xl p-6 border border-slate-100 shadow-sm flex flex-col h-full">
                                        <div className="flex items-center justify-between mb-5">
                                            <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                                                <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                                                    <CalendarRange size={16} className="text-blue-600" />
                                                </div>
                                                Today&apos;s Classes
                                            </h3>
                                            <button onClick={() => setTab('schedule')} className="text-xs font-bold text-indigo-500 hover:text-indigo-600">View Full</button>
                                        </div>
                                        <div className="flex-1">
                                            {todaySchedules.length === 0 ? (
                                                <div className="h-full flex flex-col items-center justify-center text-center py-8">
                                                    <CalendarRange size={32} className="text-slate-200 mb-3" />
                                                    <p className="text-sm font-medium text-slate-500">Free day!</p>
                                                    <p className="text-xs text-slate-400 mt-1">No classes scheduled for today.</p>
                                                </div>
                                            ) : (
                                                <div className="space-y-3">
                                                    {todaySchedules.slice(0, 4).map((s: any) => (
                                                        <div key={s._id} className={`flex items-center gap-3 p-3.5 rounded-xl border ${s.isCancelled ? 'border-red-100 bg-red-50/50' : s.isRescheduled ? 'border-amber-100 bg-amber-50/50' : 'border-slate-100 bg-white hover:border-slate-200'} transition-all`}>
                                                            <div className={`w-1 h-12 rounded-full ${s.type === 'lab' ? 'bg-violet-500' : 'bg-blue-500'}`} />
                                                            <div className="flex-1 min-w-0">
                                                                <div className="flex items-center gap-2 mb-1">
                                                                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider ${s.type === 'lab' ? 'bg-violet-100 text-violet-700' : 'bg-blue-100 text-blue-700'}`}>{s.type}</span>
                                                                    <span className="text-sm font-bold text-slate-800 truncate">{s.subject}</span>
                                                                </div>
                                                                <div className="flex items-center gap-4 text-[11px] font-medium text-slate-500">
                                                                    <span className="flex items-center gap-1"><Clock size={12} className="text-slate-400" /> {s.startTime} – {s.endTime}</span>
                                                                    <span className="flex items-center gap-1"><MapPin size={12} className="text-slate-400" /> {s.room || 'TBA'}</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* ── NOTICES TAB ── */}
                        {tab === 'notices' && (
                            <div className="space-y-6">
                                <div className="mb-2">
                                    <h2 className="text-xl font-bold text-slate-800">Department Notice Board</h2>
                                    <p className="text-sm text-slate-500 mt-1">Announcements posted by teachers and admins are synced from the shared backend.</p>
                                </div>

                                {departmentNotices.length === 0 ? (
                                    <div className="glass-card rounded-2xl p-8 text-center border border-slate-100">
                                        <p className="text-sm text-slate-400">No department notices yet.</p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                        {departmentNotices.map((n: any) => (
                                            <div key={n._id} className="glass-card rounded-2xl p-4 border border-slate-100">
                                                <p className="text-base font-bold text-slate-800">{n.title}</p>
                                                <p className="text-sm text-slate-500 mt-1">{n.message}</p>
                                                <p className="text-xs text-slate-400 mt-2">{new Date(n.createdAt).toLocaleString()}</p>

                                                {n.attachmentUrl ? (
                                                    <button
                                                        onClick={() => setNoticeAttachmentPreview(n.attachmentUrl)}
                                                        className="w-full rounded-xl overflow-hidden border border-slate-200 mt-3"
                                                    >
                                                        <img src={n.attachmentUrl} alt={n.title} className="w-full h-40 object-cover" />
                                                    </button>
                                                ) : null}

                                                <div className="mt-3 flex items-center gap-3">
                                                    <button onClick={() => reactNotice(n._id, 'heart')} className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-red-500">
                                                        <Heart size={14} className={n.reactions?.myHeart ? 'text-red-500 fill-red-500' : ''} /> {n.reactions?.heartCount || 0}
                                                    </button>
                                                    <button onClick={() => reactNotice(n._id, 'thumbsUp')} className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-indigo-500">
                                                        <ThumbsUp size={14} className={n.reactions?.myThumbsUp ? 'text-indigo-500 fill-indigo-500' : ''} /> {n.reactions?.thumbsUpCount || 0}
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* ── SCHEDULE TAB ── */}
                        {tab === 'schedule' && (
                            <div className="glass-card rounded-2xl p-6 sm:p-8 border border-slate-100 shadow-sm">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                                    <div>
                                        <h2 className="text-xl font-bold text-slate-800">Weekly Schedule</h2>
                                        <p className="text-sm text-slate-500 mt-1">All your classes and labs for the week.</p>
                                    </div>
                                </div>
                                <div className="space-y-6">
                                    {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].map(day => {
                                        const dayClasses = schedules.filter((s: any) => s.dayOfWeek === day);
                                        if (dayClasses.length === 0) return null;
                                        return (
                                            <div key={day} className="bg-white rounded-xl border border-slate-100 overflow-hidden">
                                                <div className="bg-slate-50 px-4 py-2 border-b border-slate-100">
                                                    <h3 className="text-sm font-bold text-slate-700 flex items-center gap-2">
                                                        {day} {day === today && <span className="text-[9px] uppercase tracking-wider font-bold bg-indigo-100 text-indigo-600 px-2 py-0.5 rounded-full">Today</span>}
                                                    </h3>
                                                </div>
                                                <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                                    {dayClasses.map((s: any) => (
                                                        <div key={s._id} className={`p-4 rounded-xl border ${s.isCancelled ? 'border-red-200 bg-red-50' : s.isRescheduled ? 'border-amber-200 bg-amber-50' : 'border-slate-100 bg-slate-50 relative overflow-hidden group'}`}>
                                                            {s.type === 'lab' && <div className="absolute top-0 right-0 w-8 h-8 bg-violet-50 rounded-bl-xl border-b border-l border-violet-100 -mr-px -mt-px flex items-center justify-center"><CheckCircle size={12} className="text-violet-400" /></div>}
                                                            <span className="text-xs font-bold text-slate-400 mb-1 block">{s.startTime} – {s.endTime}</span>
                                                            <p className="text-sm font-bold text-slate-800 mb-2 truncate" title={s.subject}>{s.subject}</p>
                                                            <div className="flex items-center justify-between mt-auto">
                                                                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500 bg-white px-2 py-1 rounded-md border border-slate-100 shadow-sm"><MapPin size={10} className="text-indigo-400" /> {s.room}</span>
                                                                <span className={`text-[10px] font-bold px-2 py-1 rounded-md uppercase tracking-wider ${s.type === 'lab' ? 'text-violet-600 bg-violet-100' : 'text-blue-600 bg-blue-100'}`}>{s.type}</span>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* ── EVENTS TAB ── */}
                        {tab === 'events' && (
                            <div className="space-y-6">
                                <div className="mb-2">
                                    <h2 className="text-xl font-bold text-slate-800">Campus Events</h2>
                                    <p className="text-sm text-slate-500 mt-1">Register for department and approved all-campus events.</p>
                                </div>

                                {events.length === 0 ? (
                                    <div className="glass-card rounded-2xl p-8 text-center border border-slate-100">
                                        <p className="text-sm text-slate-400">No upcoming events yet.</p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                        {events.map((event: any) => (
                                            <div key={event._id} className="glass-card rounded-2xl p-4 border border-slate-100">
                                                {event.flyerUrl ? (
                                                    <button
                                                        onClick={() => setPosterPreview(event.flyerUrl)}
                                                        className="w-full rounded-xl overflow-hidden border border-slate-200 mb-3"
                                                    >
                                                        <img src={event.flyerUrl} alt={event.title} className="w-full h-44 object-cover" />
                                                    </button>
                                                ) : null}

                                                <h3 className="text-base font-bold text-slate-800">{event.title}</h3>
                                                <p className="text-sm text-slate-500 mt-1 line-clamp-2">{event.description}</p>
                                                <p className="text-xs text-slate-500 mt-3">Location: <span className="font-semibold text-slate-700">{event.locationName}</span></p>
                                                {event.startAt ? (
                                                    <p className="text-xs text-slate-500 mt-1">Starts: <span className="font-semibold text-slate-700">{new Date(event.startAt).toLocaleString()}</span></p>
                                                ) : null}

                                                <div className="mt-4 flex gap-2">
                                                    <button
                                                        onClick={() => toggleRegistration(event)}
                                                        className={`px-4 py-2 rounded-lg text-xs font-bold border transition ${event.isRegistered ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-indigo-50 text-indigo-700 border-indigo-200'}`}
                                                    >
                                                        {event.isRegistered ? 'Unregister' : 'Register'}
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            if (!event.mapUrl) return;
                                                            window.open(event.mapUrl, '_blank', 'noopener,noreferrer');
                                                        }}
                                                        disabled={!event.mapUrl}
                                                        className="px-4 py-2 rounded-lg text-xs font-bold border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-50 inline-flex items-center gap-1"
                                                    >
                                                        Open Map <ExternalLink size={12} />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* ── CAMPUS LIVE TAB ── */}
                        {tab === 'campus' && (() => {
                            const sportsData = (campusMeta?.sportsAndGroundVenues || []).map((v: any, idx: number) => ({
                                _id: `sports-${idx}`,
                                peopleCount: v.peopleCount,
                                crowdLevel: v.crowdLevel,
                                source: 'SPORTS',
                                foodCourtId: {
                                    name: v.venueName,
                                    location: v.zone,
                                    capacity: v.capacity,
                                },
                            }));

                            const campusLiveData = [...crowdData, ...sportsData];

                            // Group crowd data by Block/Building
                            const groupedCrowdData: Record<string, any[]> = {};

                            // Define the order A to L, plus HE, Hostel, Others
                            const blockOrder = ['A Block', 'B Block', 'C Block', 'D Block', 'E Block', 'F Block', 'G Block', 'H Block', 'I Block', 'J Block', 'K Block', 'L Block', 'HE Block', 'Hostel Block', 'Other'];

                            campusLiveData.forEach(d => {
                                const rawName = d.foodCourtId.name;
                                let blockKey = 'Other';

                                // Clean matching for exactly what's in blockOrder
                                for (const b of blockOrder) {
                                    if (rawName.toUpperCase().startsWith(b.toUpperCase())) {
                                        blockKey = b;
                                        break;
                                    }
                                }

                                // Fallback for things like "Academic Block HE"
                                if (blockKey === 'Other') {
                                    if (d.foodCourtId.location.includes('Hostel')) {
                                        blockKey = 'Hostel Block';
                                    } else {
                                        const match = d.foodCourtId.location.match(/Academic Block ([A-L]|HE)/i);
                                        if (match) {
                                            blockKey = `${match[1].toUpperCase()} Block`;
                                        }
                                    }
                                }

                                if (!groupedCrowdData[blockKey]) groupedCrowdData[blockKey] = [];

                                // Clean up the display name to remove the block prefix if it exists
                                const displayData = { ...d, _id: d._id };
                                if (displayData.foodCourtId.name.startsWith(blockKey) || displayData.foodCourtId.name.startsWith(blockKey.split(' ')[0])) {
                                    // e.g "A Block - Hall 1" -> "Hall 1"
                                    displayData.foodCourtId.name = displayData.foodCourtId.name.replace(/^.+?-\s*/, '').trim();
                                }

                                groupedCrowdData[blockKey].push(displayData);
                            });

                            // Sort keys based on predefined order
                            const sortedBlocks = Object.keys(groupedCrowdData).sort((a, b) => {
                                const idxA = blockOrder.indexOf(a);
                                const idxB = blockOrder.indexOf(b);
                                return (idxA === -1 ? 99 : idxA) - (idxB === -1 ? 99 : idxB);
                            });

                            const levelFilteredByBlock = (selectedBlock && groupedCrowdData[selectedBlock])
                                ? groupedCrowdData[selectedBlock].filter((d: any) => selectedCrowdLevel === 'ALL' || d.crowdLevel === selectedCrowdLevel)
                                : [];

                            if (selectedBlock && groupedCrowdData[selectedBlock]) {
                                return (
                                    <div className="space-y-6">
                                        <div className="flex items-center gap-4 mb-3">
                                            <button
                                                onClick={() => setSelectedBlock(null)}
                                                className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-slate-500 hover:bg-slate-50 hover:text-indigo-600 transition-all border border-slate-200 shadow-sm hover:shadow"
                                            >
                                                <ChevronRight size={20} className="rotate-180" />
                                            </button>
                                            <div>
                                                <h2 className="text-2xl font-bold text-slate-800 tracking-tight">{selectedBlock} Live Status</h2>
                                                <p className="text-sm text-slate-500 mt-0.5">Real-time stats for detailed areas inside {selectedBlock}.</p>
                                            </div>
                                        </div>

                                        <div className="flex flex-wrap gap-2">
                                            {(['ALL', 'LOW', 'MEDIUM', 'HIGH', 'OVERCROWDED'] as const).map((lvl) => (
                                                <button
                                                    key={lvl}
                                                    onClick={() => setSelectedCrowdLevel(lvl)}
                                                    className={`px-3 py-1.5 rounded-full text-xs font-semibold border ${selectedCrowdLevel === lvl ? 'bg-indigo-50 text-indigo-600 border-indigo-300' : 'bg-white text-slate-500 border-slate-200'}`}
                                                >
                                                    {lvl}
                                                </button>
                                            ))}
                                            {selectedCrowdLevel !== 'ALL' && (
                                                <button onClick={() => setSelectedCrowdLevel('ALL')} className="px-3 py-1.5 rounded-full text-xs font-semibold border bg-white text-slate-500 border-slate-200">Reset Level</button>
                                            )}
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                                            {levelFilteredByBlock.map((d: any) => (
                                                <FoodCourtCard key={d._id} data={d} />
                                            ))}
                                            {levelFilteredByBlock.length === 0 && <p className="text-sm text-slate-400">No areas match selected crowd level.</p>}
                                        </div>
                                    </div>
                                );
                            }

                            return (
                                <div className="space-y-6">
                                    <div className="mb-2">
                                        <h2 className="text-xl font-bold text-slate-800 tracking-tight">Campus Live - Academic Blocks</h2>
                                        <p className="text-sm text-slate-500 mt-1">Select an academic or residential block to view real-time operations and current crowds.</p>
                                    </div>

                                        {campusMeta?.blocks?.length ? (
                                            <div className="glass-card rounded-2xl p-4 border border-slate-100 mb-2">
                                                <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">Official Block Mapping</p>
                                                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
                                                    {campusMeta.blocks.slice(0, 15).map((b: any) => (
                                                        <div key={b.code} className="rounded-lg border border-slate-200 bg-white px-3 py-2">
                                                            <p className="text-xs font-bold text-slate-800">{b.code}</p>
                                                            <p className="text-[11px] text-slate-500 truncate">{b.name}</p>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        ) : null}

                                    {sortedBlocks.length === 0 ? (
                                        <div className="glass-card rounded-2xl p-8 text-center border border-slate-100">
                                            <p className="text-sm text-slate-400">No live campus data available</p>
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                                            {sortedBlocks.map(blockName => (
                                                <button
                                                    key={blockName}
                                                    onClick={() => setSelectedBlock(blockName)}
                                                    className="group relative overflow-hidden text-left p-6 rounded-3xl border border-slate-200/60 bg-white hover:border-indigo-300 hover:shadow-sm transition-all duration-300 flex flex-col justify-center min-h-[120px]"
                                                >
                                                    <div className="absolute top-0 right-0 w-32 h-32 bg-slate-50 rounded-bl-full -mr-8 -mt-8 opacity-60 group-hover:scale-110 group-hover:bg-indigo-50 transition-all duration-500"></div>

                                                    <div className="relative z-10 flex items-center gap-5">
                                                        <div className="w-14 h-14 rounded-2xl bg-slate-50 text-slate-600 flex items-center justify-center font-bold text-2xl border border-slate-100 group-hover:bg-indigo-50 group-hover:text-indigo-600 group-hover:border-indigo-100 transition-colors shrink-0">
                                                            {blockName === 'Hostel Block' ? 'HE' : blockName === 'HE Block' ? 'HE' : blockName.charAt(0)}
                                                        </div>

                                                        <div className="flex-1">
                                                            <h3 className="text-xl font-bold text-slate-800 tracking-tight group-hover:text-indigo-700 transition-colors">{blockName}</h3>
                                                        </div>

                                                        <div className="w-8 h-8 flex items-center justify-center text-slate-300 group-hover:text-indigo-500 transition-colors shrink-0">
                                                            <ChevronRight size={20} />
                                                        </div>
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            );
                        })()}

                        {/* ── TRANSPORT TAB ── */}
                        {tab === 'transport' && (
                            <div className="space-y-6">
                                <div className="mb-2">
                                    <h2 className="text-xl font-bold text-slate-800">Transport Hub</h2>
                                    <p className="text-sm text-slate-500 mt-1">Bus timings, routes, and schedules for ADTU.</p>
                                </div>

                                <div className="glass-card rounded-2xl p-6 border border-slate-100 shadow-sm">
                                    <h3 className="text-base font-bold text-slate-800 flex items-center gap-2 mb-5">
                                        <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center">
                                            <Bus size={16} className="text-indigo-600" />
                                        </div>
                                        Campus Shuttle
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        {campusShuttle.map((shuttle) => (
                                            <div key={shuttle.route} className="rounded-xl border border-slate-200 bg-white p-4">
                                                <p className="text-sm font-bold text-slate-800">{shuttle.route}</p>
                                                <p className="text-xs text-slate-500 mt-2">Pickup: {shuttle.pickup}</p>
                                                <p className="text-xs text-slate-500 mt-1">Drop: {shuttle.drop}</p>
                                                <p className="text-xs text-indigo-600 font-semibold mt-2">{shuttle.timings}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Bus Routes */}
                                <div className="glass-card rounded-2xl p-6 border border-slate-100 shadow-sm">
                                    <h3 className="text-base font-bold text-slate-800 flex items-center gap-2 mb-5">
                                        <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
                                            <Bus size={16} className="text-emerald-600" />
                                        </div>
                                        Bus Timings & Routes
                                    </h3>
                                    {busRoutes.length === 0 ? (
                                        <p className="text-sm text-slate-400 text-center py-4">No bus routes available</p>
                                    ) : (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {busRoutes.map((r: any) => (
                                                <div key={r._id} className="p-5 rounded-xl border border-slate-100 bg-white">
                                                    <div className="flex justify-between items-start mb-4">
                                                        <div>
                                                            <p className="text-sm font-bold text-slate-800">{r.routeName}</p>
                                                            <p className="text-xs text-slate-500 mt-0.5">Bus #{r.busNumber}</p>
                                                        </div>
                                                        <div className="text-right">
                                                            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md border border-emerald-100">Leaves: {r.departureTime}</span>
                                                        </div>
                                                    </div>
                                                    <div className="relative border-l-2 border-slate-100 ml-2 mt-4 space-y-4">
                                                        {r.stops?.map((s: any, i: number) => (
                                                            <div key={i} className="pl-4 relative">
                                                                <div className="absolute -left-[5px] top-1.5 w-2 h-2 rounded-full bg-slate-200 border-2 border-white ring-1 ring-slate-200" />
                                                                <p className="text-xs font-semibold text-slate-700">{s.name}</p>
                                                                <p className="text-[10px] font-medium text-slate-400">Est. {s.arrivalTime}</p>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <div className="glass-card rounded-2xl p-6 border border-slate-100 shadow-sm">
                                    <h3 className="text-base font-bold text-slate-800 mb-5">Essentials Near ADTU</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {essentialsNearAdtu.map((shop) => (
                                            <div key={shop.name} className="rounded-xl border border-slate-200 bg-white p-4">
                                                <p className="text-sm font-bold text-slate-800">{shop.name}</p>
                                                <p className="text-xs text-slate-500 mt-1">{shop.type}</p>
                                                <p className="text-xs text-slate-500 mt-1">{shop.area}</p>
                                                <p className="text-xs text-indigo-600 font-semibold mt-2">{shop.phone}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* ── DIRECTORY TAB ── */}
                        {tab === 'directory' && (
                            <div className="glass-card rounded-2xl p-6 border border-slate-100 shadow-sm">
                                <div className="mb-6">
                                    <h2 className="text-xl font-bold text-slate-800">Department Directory</h2>
                                    <p className="text-sm text-slate-500 mt-1">Check HOD availability and department details.</p>
                                </div>

                                {campusMeta ? (
                                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
                                        <div className="rounded-xl border border-slate-200 bg-white p-4">
                                            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Academic Blocks</p>
                                            <p className="text-2xl font-extrabold text-slate-800">{campusMeta.blocks?.length || 0}</p>
                                            <p className="text-xs text-slate-500 mt-1">Mapped university destinations</p>
                                        </div>
                                        <div className="rounded-xl border border-slate-200 bg-white p-4">
                                            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Lab Categories</p>
                                            <p className="text-2xl font-extrabold text-slate-800">{campusMeta.labCategories?.length || 0}</p>
                                            <p className="text-xs text-slate-500 mt-1">Core learning facilities</p>
                                        </div>
                                        <div className="rounded-xl border border-slate-200 bg-white p-4">
                                            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Program Portfolio</p>
                                            <p className="text-2xl font-extrabold text-slate-800">{campusMeta.programPortfolio?.length || 0}</p>
                                            <p className="text-xs text-slate-500 mt-1">Programs currently listed</p>
                                        </div>
                                    </div>
                                ) : null}

                                {campusMeta?.labCategories?.length ? (
                                    <div className="mb-6">
                                        <h3 className="text-sm font-bold text-slate-700 mb-2">Official Lab Categories</h3>
                                        <div className="flex flex-wrap gap-2">
                                            {campusMeta.labCategories.map((lab: string) => (
                                                <span key={lab} className="text-xs px-2 py-1 rounded-md border border-slate-200 bg-slate-50 text-slate-600">{lab}</span>
                                            ))}
                                        </div>
                                    </div>
                                ) : null}

                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {departments.map((d: any) => (
                                        <div key={d._id} className="p-5 rounded-xl border border-slate-100 bg-white hover:border-indigo-100 transition-colors group">
                                            <div className="flex items-start justify-between mb-4">
                                                <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center group-hover:bg-indigo-50 transition-colors">
                                                    <Building size={20} className="text-slate-400 group-hover:text-indigo-500 transition-colors" />
                                                </div>
                                                <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider flex items-center gap-1 min-w-[max-content] ${d.hodAvailable ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-red-50 text-red-600 border border-red-100'
                                                    }`}>
                                                    <span className={`w-1.5 h-1.5 rounded-full ${d.hodAvailable ? 'bg-emerald-500' : 'bg-red-500'}`} />
                                                    {d.hodAvailable ? 'Available' : 'Away'}
                                                </span>
                                            </div>
                                            <h3 className="text-lg font-bold text-slate-800 mb-1">{d.code}</h3>
                                            <p className="text-xs font-medium text-slate-500 mb-4 h-8 line-clamp-2">{d.name}</p>

                                            <div className="pt-4 border-t border-slate-100">
                                                <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400 mb-1">Head of Department</p>
                                                <p className="text-sm font-bold text-slate-700">{d.hodName || 'Not Assigned'}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                    </div>
                </main>

                {posterPreview ? (
                    <div className="fixed inset-0 z-[90] bg-black/90 flex items-center justify-center p-4" onClick={() => setPosterPreview(null)}>
                        <button className="absolute top-6 right-6 text-white/80 hover:text-white" onClick={() => setPosterPreview(null)}>
                            <X size={28} />
                        </button>
                        <img src={posterPreview} alt="Event poster" className="max-h-[85vh] max-w-[95vw] object-contain rounded-lg" />
                    </div>
                ) : null}

                {noticeAttachmentPreview ? (
                    <div className="fixed inset-0 z-[95] bg-black/90 flex items-center justify-center p-4" onClick={() => setNoticeAttachmentPreview(null)}>
                        <button className="absolute top-6 right-6 text-white/80 hover:text-white" onClick={() => setNoticeAttachmentPreview(null)}>
                            <X size={28} />
                        </button>
                        <img src={noticeAttachmentPreview} alt="Notice attachment" className="max-h-[85vh] max-w-[95vw] object-contain rounded-lg" />
                    </div>
                ) : null}

                {showNotificationPopup ? (
                    <div className="fixed inset-0 z-[100] bg-black/30 backdrop-blur-[1px] flex items-start justify-end p-4 sm:p-6" onClick={() => setShowNotificationPopup(false)}>
                        <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
                                <h3 className="text-sm font-bold text-slate-800">Notifications</h3>
                                <button onClick={() => setShowNotificationPopup(false)} className="text-slate-400 hover:text-slate-700">
                                    <X size={18} />
                                </button>
                            </div>

                            <div className="max-h-[60vh] overflow-auto p-3 space-y-2">
                                {notifications.length === 0 ? (
                                    <p className="text-sm text-slate-400 text-center py-6">No notifications yet.</p>
                                ) : (
                                    notifications.slice(0, 20).map((n: any) => (
                                        <button
                                            key={n._id}
                                            onClick={() => markRead(n._id)}
                                            className={`w-full text-left p-3 rounded-xl border transition ${n.isRead ? 'bg-white border-slate-200' : 'bg-indigo-50/60 border-indigo-100'}`}
                                        >
                                            <p className={`text-sm font-bold ${n.isRead ? 'text-slate-700' : 'text-slate-900'}`}>{n.title}</p>
                                            <p className="text-xs text-slate-500 mt-1 line-clamp-2">{n.message}</p>
                                            <p className="text-[10px] text-slate-400 mt-2">{n.createdAt ? new Date(n.createdAt).toLocaleString() : ''}</p>
                                        </button>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                ) : null}
            </div>
        </ProtectedRoute>
    );
}
